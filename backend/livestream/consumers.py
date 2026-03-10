import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class LiveChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for live session chat.
    Connects at: ws/live/<session_id>/chat/?token=<jwt>
    """

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        user = await self._get_user()
        if user is None:
            await self.close(code=4001)
            return
        # Verify user has access to this session (enrolled or is teacher)
        ok = await self._check_access(user, self.session_id)
        if not ok:
            await self.close(code=4003)
            return
        self.user       = user
        self.group_name = f"livechat_{self.session_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Announce join
        await self.channel_layer.group_send(self.group_name, {
            "type":    "chat_system",
            "message": f"{user.get_full_name() or user.email} joined the chat.",
        })

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_send(self.group_name, {
                "type":    "chat_system",
                "message": f"{self.user.get_full_name() or self.user.email} left the chat.",
            })
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return
        msg = (data.get("message") or "").strip()
        if msg:
            await self.channel_layer.group_send(self.group_name, {
                "type":      "chat_message",
                "sender":    self.user.get_full_name() or self.user.email,
                "sender_id": str(self.user.id),
                "message":   msg,
                "timestamp": timezone.now().isoformat(),
            })

    # ── group handlers ─────────────────────────────────────
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type":      "message",
            "sender":    event["sender"],
            "sender_id": event["sender_id"],
            "message":   event["message"],
            "timestamp": event["timestamp"],
        }))

    async def chat_system(self, event):
        await self.send(text_data=json.dumps({
            "type":    "system",
            "message": event["message"],
        }))

    # ── helpers ────────────────────────────────────────────
    async def _get_user(self):
        token = self.scope["query_string"].decode()
        for part in token.split("&"):
            if part.startswith("token="):
                return await self._authenticate(part[6:])
        return None

    @database_sync_to_async
    def _authenticate(self, token_str):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            t    = AccessToken(token_str)
            User = get_user_model()
            return User.objects.get(id=t["user_id"])
        except Exception:
            return None

    @database_sync_to_async
    def _check_access(self, user, session_id):
        try:
            from livestream.models import LiveSession
            from courses.models import Enrollment
            session = LiveSession.objects.select_related('course').get(id=session_id)
            if session.course.instructor == user:
                return True
            return Enrollment.objects.filter(course=session.course, student=user).exists()
        except Exception:
            return False

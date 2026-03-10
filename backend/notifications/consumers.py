import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Connects at: ws/notifications/?token=<jwt>
    """

    async def connect(self):
        user = await self._get_user()
        if user is None:
            await self.close(code=4001)
            return
        self.user       = user
        self.group_name = f"notifications_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send unread count on connect
        count = await self._unread_count(user)
        await self.send(text_data=json.dumps({"type": "unread_count", "count": count}))

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return
        if data.get("action") == "mark_read" and data.get("id"):
            await self._mark_read(data["id"])

    # ── group message handler ──────────────────────────────
    async def notify(self, event):
        await self.send(text_data=json.dumps({
            "type":       "notification",
            "id":         event["id"],
            "notif_type": event["notif_type"],
            "title":      event["title"],
            "message":    event["message"],
            "data":       event.get("data", {}),
            "created_at": event["created_at"],
        }))

    # ── helpers ────────────────────────────────────────────
    async def _get_user(self):
        token = self.scope["query_string"].decode()
        for part in token.split("&"):
            if part.startswith("token="):
                raw = part[6:]
                return await self._authenticate(raw)
        return None

    @database_sync_to_async
    def _authenticate(self, token_str):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            token = AccessToken(token_str)
            User  = get_user_model()
            return User.objects.get(id=token["user_id"])
        except Exception:
            return None

    @database_sync_to_async
    def _unread_count(self, user):
        from notifications.models import Notification
        return Notification.objects.filter(recipient=user, is_read=False).count()

    @database_sync_to_async
    def _mark_read(self, notif_id):
        from notifications.models import Notification
        Notification.objects.filter(id=notif_id, recipient=self.user).update(is_read=True)

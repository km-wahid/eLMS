import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Type(models.TextChoices):
        ENROLLMENT       = 'enrollment',       'New Enrollment'
        ASSIGNMENT_NEW   = 'assignment_new',   'New Assignment'
        ASSIGNMENT_GRADED= 'assignment_graded','Assignment Graded'
        SUBMISSION_NEW   = 'submission_new',   'New Submission'
        LIVE_STARTING    = 'live_starting',    'Live Class Starting'
        MATERIAL_NEW     = 'material_new',     'New Material'
        GENERAL          = 'general',          'General'

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name='notifications')
    type      = models.CharField(max_length=25, choices=Type.choices, default=Type.GENERAL)
    title     = models.CharField(max_length=255)
    message   = models.TextField()
    data      = models.JSONField(default=dict, blank=True)
    is_read   = models.BooleanField(default=False)
    created_at= models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email} – {self.title}"

    @classmethod
    def create_and_push(cls, recipient, type, title, message, data=None):
        """Create a notification and push it over WebSocket."""
        notif = cls.objects.create(
            recipient=recipient, type=type,
            title=title, message=message, data=data or {}
        )
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        layer = get_channel_layer()
        async_to_sync(layer.group_send)(
            f"notifications_{recipient.id}",
            {
                "type": "notify",
                "id":         str(notif.id),
                "notif_type": notif.type,
                "title":      notif.title,
                "message":    notif.message,
                "data":       notif.data,
                "created_at": notif.created_at.isoformat(),
            }
        )
        return notif

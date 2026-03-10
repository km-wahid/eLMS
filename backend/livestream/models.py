import uuid
from django.db import models
from django.conf import settings
from courses.models import Course


class LiveSession(models.Model):
    class Platform(models.TextChoices):
        ZOOM   = 'zoom',   'Zoom'
        JITSI  = 'jitsi',  'Jitsi'
        MEET   = 'meet',   'Google Meet'
        TEAMS  = 'teams',  'Microsoft Teams'
        OTHER  = 'other',  'Other'

    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        LIVE      = 'live',      'Live'
        ENDED     = 'ended',     'Ended'
        CANCELLED = 'cancelled', 'Cancelled'

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course           = models.ForeignKey(Course, on_delete=models.CASCADE,
                                         related_name='live_sessions')
    host             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                         related_name='hosted_sessions')
    title            = models.CharField(max_length=255)
    description      = models.TextField(blank=True)
    scheduled_at     = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    platform         = models.CharField(max_length=10, choices=Platform.choices,
                                        default=Platform.ZOOM)
    meeting_url      = models.URLField(blank=True)
    meeting_id       = models.CharField(max_length=100, blank=True)
    passcode         = models.CharField(max_length=50, blank=True)
    status           = models.CharField(max_length=15, choices=Status.choices,
                                        default=Status.SCHEDULED)
    recording_url    = models.URLField(blank=True)
    started_at       = models.DateTimeField(null=True, blank=True)
    ended_at         = models.DateTimeField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'live_sessions'
        ordering = ['scheduled_at']

    def __str__(self):
        return f"{self.title} – {self.course.title} ({self.scheduled_at:%Y-%m-%d %H:%M})"

    @property
    def is_joinable(self):
        """True when session is live or within 15 min of scheduled start."""
        from django.utils import timezone
        from datetime import timedelta
        if self.status == self.Status.LIVE:
            return True
        if self.status == self.Status.SCHEDULED:
            return timezone.now() >= self.scheduled_at - timedelta(minutes=15)
        return False

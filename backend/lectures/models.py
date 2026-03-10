import uuid
from django.db import models
from courses.models import Module


class Lecture(models.Model):
    class HLSStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='lectures'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    video_file = models.FileField(upload_to='lectures/videos/', blank=True, null=True)
    hls_playlist_url = models.URLField(blank=True)
    hls_status = models.CharField(
        max_length=20, choices=HLSStatus.choices, default=HLSStatus.PENDING
    )
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lectures'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.module.title} – {self.title}"

    @property
    def duration_display(self):
        if not self.duration_seconds:
            return None
        mins, secs = divmod(self.duration_seconds, 60)
        hours, mins = divmod(mins, 60)
        if hours:
            return f"{hours}:{mins:02d}:{secs:02d}"
        return f"{mins}:{secs:02d}"

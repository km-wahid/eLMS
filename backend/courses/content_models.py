import uuid
from django.db import models
from django.conf import settings
from courses.models import Module


class ContentItem(models.Model):
    """
    Unified content model for all types of learning materials within a module.
    Supports: Videos, PDFs, Slides, Text Notes, and External Links
    """
    
    class ContentType(models.TextChoices):
        VIDEO = 'video', 'Video'
        PDF = 'pdf', 'PDF Document'
        SLIDE = 'slide', 'Presentation Slides'
        TEXT = 'text', 'Text Notes'
        LINK = 'link', 'External Link'
    
    class HLSStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Failed'
    
    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='content_items',
        help_text='Module this content belongs to'
    )
    title = models.CharField(max_length=255)
    content_type = models.CharField(
        max_length=10,
        choices=ContentType.choices,
        help_text='Type of content'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order within module'
    )
    
    # Video-specific fields
    video_file = models.FileField(
        upload_to='content/videos/',
        blank=True,
        null=True,
        help_text='Uploaded video file'
    )
    video_url = models.URLField(
        blank=True,
        help_text='External video URL (YouTube, Vimeo, etc.)'
    )
    hls_playlist_url = models.URLField(
        blank=True,
        help_text='HLS streaming URL (for uploaded videos)'
    )
    hls_status = models.CharField(
        max_length=20,
        choices=HLSStatus.choices,
        default=HLSStatus.PENDING,
        blank=True
    )
    duration_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Video duration in seconds'
    )
    
    # File-specific fields (PDF, Slides)
    file = models.FileField(
        upload_to='content/files/',
        blank=True,
        null=True,
        help_text='PDF or Slide file'
    )
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='File size in bytes'
    )
    
    # Text content (for notes)
    content_text = models.TextField(
        blank=True,
        help_text='Rich text content for notes'
    )
    
    # External link
    external_url = models.URLField(
        blank=True,
        help_text='External resource URL'
    )
    
    # Common fields
    description = models.TextField(blank=True)
    is_downloadable = models.BooleanField(
        default=True,
        help_text='Allow students to download this content'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_content'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_items'
        ordering = ['module', 'order', 'created_at']
        indexes = [
            models.Index(fields=['module', 'order']),
            models.Index(fields=['content_type']),
        ]
        unique_together = [('module', 'order')]
    
    def __str__(self):
        return f"{self.get_content_type_display()}: {self.title}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate file size
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)
    
    @property
    def duration_display(self):
        """Format duration as HH:MM:SS or MM:SS"""
        if not self.duration_seconds:
            return None
        mins, secs = divmod(self.duration_seconds, 60)
        hours, mins = divmod(mins, 60)
        if hours:
            return f"{hours}:{mins:02d}:{secs:02d}"
        return f"{mins}:{secs:02d}"
    
    @property
    def file_size_display(self):
        """Format file size in human-readable format"""
        if not self.file_size:
            return None
        size = self.file_size
        for unit in ('B', 'KB', 'MB', 'GB'):
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    
    @property
    def file_url(self):
        """Get file URL based on content type"""
        if self.content_type == self.ContentType.VIDEO:
            # Priority: HLS > uploaded file > external URL
            if self.hls_playlist_url:
                return self.hls_playlist_url
            elif self.video_file:
                return self.video_file.url
            elif self.video_url:
                return self.video_url
        elif self.content_type in [self.ContentType.PDF, self.ContentType.SLIDE]:
            if self.file:
                return self.file.url
        elif self.content_type == self.ContentType.LINK:
            return self.external_url
        return None
    
    def clean(self):
        """Validate content based on type"""
        from django.core.exceptions import ValidationError
        
        if self.content_type == self.ContentType.VIDEO:
            if not (self.video_file or self.video_url):
                raise ValidationError({
                    'content_type': 'Video content requires either a video file or video URL'
                })
        
        elif self.content_type in [self.ContentType.PDF, self.ContentType.SLIDE]:
            if not self.file:
                raise ValidationError({
                    'file': f'{self.get_content_type_display()} requires a file upload'
                })
        
        elif self.content_type == self.ContentType.TEXT:
            if not self.content_text:
                raise ValidationError({
                    'content_text': 'Text notes require content'
                })
        
        elif self.content_type == self.ContentType.LINK:
            if not self.external_url:
                raise ValidationError({
                    'external_url': 'External link requires a URL'
                })

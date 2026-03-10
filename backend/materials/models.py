import uuid
from django.db import models
from django.conf import settings
from courses.models import Course, Module
from lectures.models import Lecture


class Material(models.Model):
    class FileType(models.TextChoices):
        PDF   = 'pdf',   'PDF'
        SLIDE = 'slide', 'Slide'
        DOC   = 'doc',   'Document'
        VIDEO = 'video', 'Video'
        OTHER = 'other', 'Other'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    module       = models.ForeignKey(Module, on_delete=models.CASCADE,
                                     related_name='materials', null=True, blank=True)
    lecture      = models.ForeignKey(Lecture, on_delete=models.CASCADE,
                                     related_name='materials', null=True, blank=True)
    uploaded_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                     related_name='uploaded_materials')
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True)
    file         = models.FileField(upload_to='materials/')
    file_type    = models.CharField(max_length=10, choices=FileType.choices, default=FileType.OTHER)
    file_size    = models.PositiveIntegerField(null=True, blank=True, help_text='Size in bytes')
    is_downloadable = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'materials'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} ({self.course.title})"

    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)

    @property
    def file_size_display(self):
        if not self.file_size:
            return None
        for unit in ('B', 'KB', 'MB', 'GB'):
            if self.file_size < 1024:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024
        return f"{self.file_size:.1f} TB"

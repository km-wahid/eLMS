import uuid
from django.db import models
from django.conf import settings
from courses.models import Module


class Note(models.Model):
    """
    Personal notes that students can create for each module.
    Each note is private to the user who created it.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='student_notes'
    )
    content = models.TextField(
        help_text='Rich text content (HTML)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'module']),
            models.Index(fields=['module']),
        ]
        # One note per user per module
        unique_together = [('user', 'module')]

    def __str__(self):
        return f"Note by {self.user.name} on {self.module.title}"

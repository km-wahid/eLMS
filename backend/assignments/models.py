import uuid
from django.db import models
from django.conf import settings
from courses.models import Course, Module


class Assignment(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    module       = models.ForeignKey(Module, on_delete=models.SET_NULL,
                                     related_name='assignments', null=True, blank=True)
    title        = models.CharField(max_length=255)
    description  = models.TextField()
    due_date     = models.DateTimeField(null=True, blank=True)
    max_score    = models.PositiveIntegerField(default=100)
    is_published = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignments'
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.title} – {self.course.title}"

    @property
    def submission_count(self):
        return self.submissions.count()


class Submission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'submitted', 'Submitted'
        LATE      = 'late',      'Late'
        GRADED    = 'graded',    'Graded'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment   = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                     related_name='submissions')
    file         = models.FileField(upload_to='submissions/', null=True, blank=True)
    text_answer  = models.TextField(blank=True)
    score        = models.PositiveIntegerField(null=True, blank=True)
    feedback     = models.TextField(blank=True)
    status       = models.CharField(max_length=15, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'submissions'
        ordering = ['-submitted_at']
        unique_together = [['assignment', 'student']]

    def __str__(self):
        return f"{self.student.email} → {self.assignment.title}"

    def save(self, *args, **kwargs):
        # Auto-detect late submission
        from django.utils import timezone
        if (self.status == self.Status.SUBMITTED and
                self.assignment.due_date and
                timezone.now() > self.assignment.due_date):
            self.status = self.Status.LATE
        super().save(*args, **kwargs)

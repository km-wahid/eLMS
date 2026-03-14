import uuid
from django.db import models
from django.conf import settings
from courses.models import Course
from lectures.models import Lecture


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='department_logos/', null=True, blank=True)
    logo_url = models.URLField(blank=True, help_text='External logo URL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def semester_count(self):
        return self.semesters.count()

    @property
    def course_count(self):
        return Course.objects.filter(department=self).count()


class Semester(models.Model):
    class Type(models.TextChoices):
        SEMESTER = 'semester', 'Semester'
        TRIMESTER = 'trimester', 'Trimester'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='semesters'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.SEMESTER
    )
    order = models.PositiveIntegerField(
        help_text='Order within department (1, 2, 3, etc.)'
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'semesters'
        ordering = ['department', 'order']
        unique_together = [('department', 'order')]
        indexes = [
            models.Index(fields=['department', 'order']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.department.code} - {self.name}"

    @property
    def course_count(self):
        return self.courses.count()


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lecture_comments'
    )
    lecture = models.ForeignKey(
        Lecture,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField()
    upvotes = models.PositiveIntegerField(default=0)
    pinned = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-pinned', '-upvotes', '-created_at']
        indexes = [
            models.Index(fields=['lecture', '-created_at']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"Comment by {self.user.name} on {self.lecture.title}"

    @property
    def reply_count(self):
        return self.replies.count()


class Bookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    lecture = models.ForeignKey(
        Lecture,
        on_delete=models.CASCADE,
        related_name='bookmarks',
        null=True,
        blank=True
    )
    material = models.ForeignKey(
        'materials.Material',
        on_delete=models.CASCADE,
        related_name='bookmarks',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = [
            ('user', 'lecture'),
            ('user', 'material'),
        ]
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        if self.lecture:
            return f"{self.user.name} bookmarked {self.lecture.title}"
        return f"{self.user.name} bookmarked {self.material.title}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.lecture and not self.material:
            raise ValidationError("Either lecture or material must be provided.")
        if self.lecture and self.material:
            raise ValidationError("Only one of lecture or material should be provided.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class ProgressTracking(models.Model):
    class Action(models.TextChoices):
        LECTURE_WATCHED = 'lecture_watched', 'Lecture Watched'
        MATERIAL_DOWNLOADED = 'material_downloaded', 'Material Downloaded'
        MATERIAL_VIEWED = 'material_viewed', 'Material Viewed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_tracking'
    )
    lecture = models.ForeignKey(
        Lecture,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='progress_records'
    )
    material = models.ForeignKey(
        'materials.Material',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='progress_records'
    )
    action = models.CharField(
        max_length=30,
        choices=Action.choices
    )
    watch_duration_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='How long user watched the lecture'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'progress_tracking'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['lecture', 'user']),
        ]

    def __str__(self):
        if self.lecture:
            return f"{self.user.name} - {self.action} - {self.lecture.title}"
        return f"{self.user.name} - {self.action} - {self.material.title}"


class CourseAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.OneToOneField(
        Course,
        on_delete=models.CASCADE,
        related_name='analytics'
    )
    total_enrollments = models.PositiveIntegerField(default=0)
    total_lectures_watched = models.PositiveIntegerField(default=0)
    total_materials_downloaded = models.PositiveIntegerField(default=0)
    engagement_score = models.FloatField(
        default=0.0,
        help_text='0-100 scale based on activity'
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_analytics'
        verbose_name_plural = 'Course Analytics'

    def __str__(self):
        return f"Analytics for {self.course.title}"

    def compute_engagement_score(self):
        """
        Compute engagement score based on:
        - Lecture views
        - Material downloads
        - Comments
        - Enrollments
        """
        if not self.total_enrollments:
            self.engagement_score = 0.0
            return

        lecture_views = self.total_lectures_watched
        downloads = self.total_materials_downloaded
        avg_engagement = (lecture_views + downloads) / max(self.total_enrollments, 1)
        self.engagement_score = min(100.0, avg_engagement * 10)
        self.save()

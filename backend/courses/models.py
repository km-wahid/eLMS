import uuid
from django.db import models
from django.conf import settings
from django.db.models import Q


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Course(models.Model):
    class Availability(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        COMING_SOON = 'coming_soon', 'Coming Soon'
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField()
    
    # Primary teacher (backward compatibility)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='taught_courses',
        limit_choices_to={'role': 'teacher'},
    )
    
    # Multiple teachers support
    teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_courses',
        limit_choices_to=Q(role='teacher') | Q(role='admin') | Q(role='superuser'),
        blank=True,
        help_text='Additional teachers assigned to this course'
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
    )
    
    # Academic structure links - NOW REQUIRED for proper hierarchy
    department = models.ForeignKey(
        'academics.Department',
        on_delete=models.PROTECT,  # Prevent deletion of department with courses
        related_name='courses',
        help_text='Department this course belongs to'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,  # Prevent deletion of semester with courses
        related_name='courses',
        help_text='Semester this course belongs to'
    )
    
    course_code = models.CharField(
        max_length=50,
        unique=True,
        help_text='e.g., CS101, ENG201, BBA301'
    )
    
    # Thumbnail handling - supports both upload and URL
    thumbnail = models.ImageField(
        upload_to='course_thumbnails/', 
        null=True, 
        blank=True,
        help_text='Course thumbnail image (uploaded file)'
    )
    thumbnail_url = models.URLField(
        blank=True,
        help_text='External thumbnail URL (fallback if no upload)'
    )
    
    level = models.CharField(max_length=15, choices=Level.choices, default=Level.BEGINNER)
    
    # Publish control - CRITICAL for visibility
    is_published = models.BooleanField(
        default=False,
        help_text='Only published courses are visible to students'
    )
    availability = models.CharField(
        max_length=20,
        choices=Availability.choices,
        default=Availability.COMING_SOON,
        db_index=True,
    )
    
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['department', 'semester']),
            models.Index(fields=['teacher']),
            models.Index(fields=['is_published']),
            models.Index(fields=['course_code']),
        ]

    def __str__(self):
        return f"{self.course_code} - {self.title}"
    
    def clean(self):
        """Validate semester belongs to department"""
        from django.core.exceptions import ValidationError
        # Only validate if both semester and department are set
        if hasattr(self, 'semester') and hasattr(self, 'department'):
            if self.semester and self.department:
                if self.semester.department_id != self.department_id:
                    raise ValidationError({
                        'semester': f'Semester must belong to the selected department ({self.department.name})'
                    })

    def save(self, *args, **kwargs):
        # Enforce the academic hierarchy for ORM, admin, and API writes alike.
        if self.semester_id and self.department_id:
            self.clean()
        super().save(*args, **kwargs)

    @property
    def thumbnail_display(self):
        """Get thumbnail with priority: uploaded file > external URL"""
        if self.thumbnail:
            return self.thumbnail.url
        elif self.thumbnail_url:
            return self.thumbnail_url
        return None

    @property
    def all_teachers(self):
        """Get all teachers (primary + additional)"""
        teachers = list(self.teachers.all())
        if self.teacher not in teachers:
            teachers.insert(0, self.teacher)
        return teachers

    def can_manage(self, user):
        if not user or not user.is_authenticated:
            return False
        if user.role in (user.Role.ADMIN, user.Role.SUPERUSER) or user.is_superuser:
            return True
        return self.teacher_id == user.id or self.teachers.filter(id=user.id).exists()

    @property
    def is_available(self):
        return self.is_published and self.availability == self.Availability.AVAILABLE

    @property
    def enrollment_count(self):
        return self.enrollments.count()

    @property
    def module_count(self):
        return self.modules.count()


class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'modules'
        ordering = ['order']
        unique_together = [('course', 'order')]

    def __str__(self):
        return f'{self.course.title} — {self.title}'


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
    external_file_url = models.URLField(
        blank=True,
        help_text='External PDF or slide URL used when no file is uploaded'
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
            return self.external_file_url or None
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
            if not (self.file or self.external_file_url):
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


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    progress = models.FloatField(default=0.0)  # 0.0 to 100.0
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = [('student', 'course')]

    def __str__(self):
        return f'{self.student.name} → {self.course.title}'


class CourseProgress(models.Model):
    """Track overall student progress in a course"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_progress'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='student_progress'
    )
    completed_modules = models.PositiveIntegerField(default=0)
    total_modules = models.PositiveIntegerField(default=0)
    completion_percentage = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'course_progress'
        unique_together = [('user', 'course')]
        indexes = [
            models.Index(fields=['user', 'course']),
            models.Index(fields=['user', 'last_accessed']),
        ]
    
    def __str__(self):
        return f'{self.user.name} - {self.course.title} ({self.completion_percentage}%)'
    
    def update_progress(self):
        """Recalculate progress based on completed modules"""
        total = self.course.modules.count()
        completed = ModuleProgress.objects.filter(
            user=self.user,
            module__course=self.course,
            is_completed=True
        ).count()
        
        self.total_modules = total
        self.completed_modules = completed
        self.completion_percentage = (completed / total * 100) if total > 0 else 0
        self.save()


class ModuleProgress(models.Model):
    """Track student progress in individual modules"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='module_progress'
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='student_progress'
    )
    is_completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'module_progress'
        unique_together = [('user', 'module')]
        indexes = [
            models.Index(fields=['user', 'module']),
            models.Index(fields=['module', 'is_completed']),
        ]
    
    def __str__(self):
        status = "✅" if self.is_completed else "⏳"
        return f'{status} {self.user.name} - {self.module.title}'
    
    def check_completion(self):
        """Mark as complete if all content items are viewed"""
        total_content = self.module.content_items.count()
        if total_content == 0:
            return
        
        viewed_content = ContentProgress.objects.filter(
            user=self.user,
            content_item__module=self.module,
            is_viewed=True
        ).count()
        
        if viewed_content >= total_content and not self.is_completed:
            from django.utils import timezone
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()
            
            # Update course progress
            course_progress, _ = CourseProgress.objects.get_or_create(
                user=self.user,
                course=self.module.course
            )
            course_progress.update_progress()


class ContentProgress(models.Model):
    """Track student viewing of content items"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='content_progress'
    )
    content_item = models.ForeignKey(
        ContentItem,
        on_delete=models.CASCADE,
        related_name='student_progress'
    )
    is_viewed = models.BooleanField(default=False)
    watch_duration_seconds = models.PositiveIntegerField(
        default=0,
        help_text='For videos: how long user watched'
    )
    first_viewed_at = models.DateTimeField(auto_now_add=True)
    last_viewed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_progress'
        unique_together = [('user', 'content_item')]
        indexes = [
            models.Index(fields=['user', 'content_item']),
            models.Index(fields=['content_item', 'is_viewed']),
        ]
    
    def __str__(self):
        status = "👁️" if self.is_viewed else "⏳"
        return f'{status} {self.user.name} - {self.content_item.title}'
    
    def mark_as_viewed(self, duration_seconds=0):
        """Mark content as viewed and update module progress"""
        if not self.is_viewed:
            self.is_viewed = True
        self.watch_duration_seconds = max(self.watch_duration_seconds, duration_seconds)
        self.save()
        
        # Check if module should be marked complete
        module_progress, _ = ModuleProgress.objects.get_or_create(
            user=self.user,
            module=self.content_item.module
        )
        module_progress.check_completion()

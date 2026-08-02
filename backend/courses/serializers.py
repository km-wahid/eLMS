from rest_framework import serializers
from .models import (
    Category, Course, Module, Enrollment,
    CourseProgress, ModuleProgress, ContentProgress, ContentItem
)
from django.utils.text import slugify
from django.core.exceptions import ValidationError as DjangoValidationError
import uuid


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class ModuleDetailSerializer(serializers.ModelSerializer):
    """Enhanced module serializer with nested lectures and materials"""
    lectures = serializers.SerializerMethodField()
    materials = serializers.SerializerMethodField()
    content_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lectures', 'materials', 'content_items', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_lectures(self, obj):
        from lectures.serializers import LectureListSerializer
        lectures = obj.lectures.filter(is_published=True).order_by('order')
        return LectureListSerializer(lectures, many=True).data
    
    def get_materials(self, obj):
        from materials.serializers import MaterialListSerializer
        materials = obj.materials.all().order_by('created_at')
        request = self.context.get('request')
        return MaterialListSerializer(materials, many=True, context={'request': request}).data

    def get_content_items(self, obj):
        return [
            {
                'id': str(item.id),
                'title': item.title,
                'description': item.description,
                'content_type': item.content_type,
                'order': item.order,
                'duration_seconds': item.duration_seconds,
                'is_downloadable': item.is_downloadable,
            }
            for item in obj.content_items.all().order_by('order')
        ]


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for listing courses (student and admin views)"""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    teacher_names = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    module_count = serializers.IntegerField(read_only=True)
    thumbnail_display = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'course_code', 'description', 
            'teacher_name', 'teacher_names',
            'department_name', 'department_code', 'semester_name',
            'category_name', 'thumbnail_display', 'level', 'is_published',
            'availability', 'is_available', 'price', 'enrollment_count', 'module_count', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']
    
    def get_teacher_names(self, obj):
        """Get all assigned teachers"""
        return [teacher.name for teacher in obj.all_teachers]
    
    def get_thumbnail_display(self, obj):
        """Get thumbnail URL with priority logic"""
        request = self.context.get('request')
        if obj.thumbnail:
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return obj.thumbnail_url or None


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed course view with all relationships"""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    teacher_id = serializers.UUIDField(source='teacher.id', read_only=True)
    teachers = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    department = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    modules = ModuleDetailSerializer(many=True, read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    thumbnail_display = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'course_code', 'description', 
            'teacher_name', 'teacher_id', 'teachers',
            'department', 'semester',
            'category', 'thumbnail', 'thumbnail_url', 'thumbnail_display',
            'level', 'is_published', 'availability', 'is_available', 'price', 
            'enrollment_count', 'modules', 'is_enrolled', 
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_teachers(self, obj):
        """Get all teachers with details"""
        return [{
            'id': str(teacher.id),
            'name': teacher.name,
            'email': teacher.email,
        } for teacher in obj.all_teachers]
    
    def get_department(self, obj):
        return {
            'id': str(obj.department.id),
            'name': obj.department.name,
            'code': obj.department.code,
        }
    
    def get_semester(self, obj):
        return {
            'id': str(obj.semester.id),
            'name': obj.semester.name,
            'order': obj.semester.order,
        }
    
    def get_thumbnail_display(self, obj):
        """Get thumbnail URL with priority logic"""
        request = self.context.get('request')
        if obj.thumbnail:
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return obj.thumbnail_url or None

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user, status='active').exists()
        return False


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating courses (Admin only)"""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        source='category', 
        required=False, 
        allow_null=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset='academics.Department'.split('.')[1],  # Will be resolved
        source='department',
        required=True,
        help_text='Select department first'
    )
    semester_id = serializers.PrimaryKeyRelatedField(
        queryset='academics.Semester'.split('.')[1],  # Will be resolved
        source='semester',
        required=True,
        help_text='Select semester (filtered by department)'
    )
    teacher_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text='Additional teacher IDs to assign'
    )

    class Meta:
        model = Course
        fields = [
            'title', 'course_code', 'description', 
            'department_id', 'semester_id',
            'category_id', 'teacher_ids',
            'thumbnail', 'thumbnail_url', 
            'level', 'is_published', 'availability', 'price'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically set querysets
        from academics.models import Department, Semester
        self.fields['department_id'].queryset = Department.objects.all()
        self.fields['semester_id'].queryset = Semester.objects.all()
    
    def validate(self, attrs):
        """Validate semester belongs to department"""
        semester = attrs.get('semester')
        department = attrs.get('department')
        
        if semester and department:
            if semester.department_id != department.id:
                raise serializers.ValidationError({
                    'semester_id': f'Semester must belong to the selected department ({department.name})'
                })
        
        # Validate course_code uniqueness on create
        course_code = attrs.get('course_code')
        if course_code:
            if self.instance:  # Update
                if Course.objects.filter(course_code=course_code).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError({
                        'course_code': 'Course code already exists'
                    })
            else:  # Create
                if Course.objects.filter(course_code=course_code).exists():
                    raise serializers.ValidationError({
                        'course_code': 'Course code already exists'
                    })
        
        return attrs

    def create(self, validated_data):
        # Extract teacher_ids before creating
        teacher_ids = validated_data.pop('teacher_ids', [])
        
        # Auto-generate slug
        title = validated_data['title']
        base_slug = slugify(title)
        slug = base_slug
        counter = 1
        while Course.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1
        validated_data['slug'] = slug
        
        # Set primary teacher as request user
        validated_data['teacher'] = self.context['request'].user
        
        # Create course
        course = super().create(validated_data)
        
        # Add additional teachers
        if teacher_ids:
            from accounts.models import User
            teachers = User.objects.filter(id__in=teacher_ids)
            course.teachers.set(teachers)
        
        return course

    def update(self, instance, validated_data):
        # Extract teacher_ids before updating
        teacher_ids = validated_data.pop('teacher_ids', None)
        
        # Auto-update slug if title changed
        if 'title' in validated_data and validated_data['title'] != instance.title:
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            validated_data['slug'] = slug
        
        # Update course
        course = super().update(instance, validated_data)
        
        # Update additional teachers if provided
        if teacher_ids is not None:
            from accounts.models import User
            teachers = User.objects.filter(id__in=teacher_ids)
            course.teachers.set(teachers)
        
        return course


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.UUIDField(source='course.id', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    teacher_name = serializers.CharField(source='course.teacher.name', read_only=True)
    thumbnail_display = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course_id', 'course_slug', 'course_code', 'course_title', 
            'teacher_name', 'thumbnail_display', 
            'status', 'progress', 'enrolled_at', 'completed_at',
        ]
        read_only_fields = ['id', 'enrolled_at', 'completed_at']
    
    def get_thumbnail_display(self, obj):
        request = self.context.get('request')
        if obj.course.thumbnail:
            if request:
                return request.build_absolute_uri(obj.course.thumbnail.url)
            return obj.course.thumbnail.url
        return obj.course.thumbnail_url or None


# ===== Progress Tracking Serializers =====

class ContentProgressSerializer(serializers.ModelSerializer):
    """Serializer for individual content item progress"""
    content_title = serializers.CharField(source='content_item.title', read_only=True)
    content_type = serializers.CharField(source='content_item.content_type', read_only=True)
    
    class Meta:
        from .models import ContentProgress
        model = ContentProgress
        fields = [
            'id', 'content_item', 'content_title', 'content_type',
            'is_viewed', 'watch_duration_seconds',
            'first_viewed_at', 'last_viewed_at'
        ]
        read_only_fields = ['id', 'first_viewed_at', 'last_viewed_at']


class ModuleProgressSerializer(serializers.ModelSerializer):
    """Serializer for module progress"""
    module_title = serializers.CharField(source='module.title', read_only=True)
    module_order = serializers.IntegerField(source='module.order', read_only=True)
    
    class Meta:
        from .models import ModuleProgress
        model = ModuleProgress
        fields = [
            'id', 'module', 'module_title', 'module_order',
            'is_completed', 'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at']


class CourseProgressSerializer(serializers.ModelSerializer):
    """Serializer for overall course progress"""
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.SlugField(source='course.slug', read_only=True)
    
    class Meta:
        from .models import CourseProgress
        model = CourseProgress
        fields = [
            'id', 'course', 'course_title', 'course_slug',
            'completed_modules', 'total_modules', 'completion_percentage',
            'last_accessed', 'created_at'
        ]
        read_only_fields = ['id', 'last_accessed', 'created_at']


class ContentItemSerializer(serializers.ModelSerializer):
    """Serializer for content items within modules"""
    is_viewed = serializers.SerializerMethodField()
    watch_duration = serializers.SerializerMethodField()
    
    class Meta:
        from .models import ContentItem
        model = ContentItem
        fields = [
            'id', 'module', 'title', 'content_type', 'order', 'description',
            'video_url', 'hls_playlist_url', 'hls_status', 'duration_seconds',
            'file', 'file_size', 'external_file_url', 'file_url', 'content_text', 'external_url',
            'is_downloadable', 'is_viewed', 'watch_duration',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_viewed(self, obj):
        """Check if current user has viewed this content"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        from .models import ContentProgress
        return ContentProgress.objects.filter(
            user=request.user,
            content_item=obj,
            is_viewed=True
        ).exists()
    
    def get_watch_duration(self, obj):
        """Get watch duration for current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        from .models import ContentProgress
        progress = ContentProgress.objects.filter(
            user=request.user,
            content_item=obj
        ).first()
        
        return progress.watch_duration_seconds if progress else 0


class ModuleWithContentSerializer(serializers.ModelSerializer):
    """Module serializer with nested content items and progress"""
    content_items = ContentItemSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()
    content_count = serializers.SerializerMethodField()
    viewed_content_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order',
            'content_items', 'is_completed', 
            'content_count', 'viewed_content_count',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_is_completed(self, obj):
        """Check if current user has completed this module"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        from .models import ModuleProgress
        return ModuleProgress.objects.filter(
            user=request.user,
            module=obj,
            is_completed=True
        ).exists()
    
    def get_content_count(self, obj):
        return obj.content_items.count()
    
    def get_viewed_content_count(self, obj):
        """Count how many content items user has viewed"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        from .models import ContentProgress
        return ContentProgress.objects.filter(
            user=request.user,
            content_item__module=obj,
            is_viewed=True
        ).count()


class CourseDetailWithProgressSerializer(serializers.ModelSerializer):
    """Enhanced course detail with modules, content, and progress"""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    modules = ModuleWithContentSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'course_code', 'description',
            'teacher_name', 'department_name', 'semester_name', 'category_name',
            'thumbnail', 'thumbnail_url', 'level', 'is_published', 'availability', 'is_available',
            'modules', 'progress', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_progress(self, obj):
        """Get progress for current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {
                'completed_modules': 0,
                'total_modules': obj.modules.count(),
                'percentage': 0.0
            }
        
        from .models import CourseProgress
        progress, _ = CourseProgress.objects.get_or_create(
            user=request.user,
            course=obj
        )
        
        # Update progress if stale
        if progress.total_modules != obj.modules.count():
            progress.update_progress()
        
        return {
            'completed_modules': progress.completed_modules,
            'total_modules': progress.total_modules,
            'percentage': progress.completion_percentage
        }

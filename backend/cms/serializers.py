from django.contrib.auth import get_user_model
from rest_framework import serializers
from courses.models import Course, Module, Enrollment, Category
from lectures.models import Lecture
from materials.models import Material

User = get_user_model()


# ─── User serializers ────────────────────────────────────────────────────────

class CMSUserSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id','email','name','role','is_active','is_staff','is_superuser','created_at','enrolled_count']
        read_only_fields = ['id','email','created_at','enrolled_count']
    def get_enrolled_count(self, obj):
        return Enrollment.objects.filter(student=obj).count()

class CMSUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name','role','is_active','is_staff']

class CMSTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','name','email']


# ─── Category ─────────────────────────────────────────────────────────────────

class CMSCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id','name','slug']


# ─── Course serializers ──────────────────────────────────────────────────────

class CMSCourseSerializer(serializers.ModelSerializer):
    """Lightweight read-only list serializer."""
    instructor_name  = serializers.CharField(source='teacher.name', read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    thumbnail_url_resolved = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id','title','slug','instructor_name','category','level',
            'price','is_published','enrollment_count','thumbnail_url_resolved','created_at',
        ]
        read_only_fields = ['id','slug','instructor_name','created_at','enrollment_count']

    def get_enrollment_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()

    def get_thumbnail_url_resolved(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail_url or None


class CMSCourseFullSerializer(serializers.ModelSerializer):
    """Full serializer used for CREATE and UPDATE from CMS."""
    instructor_name  = serializers.CharField(source='teacher.name', read_only=True)
    category_name    = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    enrollment_count = serializers.SerializerMethodField()
    thumbnail_url_resolved = serializers.SerializerMethodField()
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='teacher'),
        source='teacher', required=False, allow_null=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category',
        required=False, allow_null=True
    )

    class Meta:
        model = Course
        fields = [
            'id','title','slug','description','instructor_name','category_name',
            'teacher_id','category_id','thumbnail','thumbnail_url',
            'thumbnail_url_resolved','level','is_published','price',
            'enrollment_count','created_at','updated_at',
        ]
        read_only_fields = ['id','slug','instructor_name','category_name','created_at','updated_at','enrollment_count']
        extra_kwargs = {'thumbnail': {'required': False, 'allow_null': True}}

    def get_enrollment_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()

    def get_thumbnail_url_resolved(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail_url or None

    def _make_slug(self, title, exclude_pk=None):
        from django.utils.text import slugify
        base = slugify(title)
        slug = base
        i = 1
        qs = Course.objects.all()
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        while qs.filter(slug=slug).exists():
            slug = f'{base}-{i}'; i += 1
        return slug

    def create(self, validated_data):
        validated_data['slug'] = self._make_slug(validated_data['title'])
        if 'teacher' not in validated_data:
            validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'title' in validated_data and validated_data['title'] != instance.title:
            validated_data['slug'] = self._make_slug(validated_data['title'], exclude_pk=instance.pk)
        return super().update(instance, validated_data)


# ─── Module serializers ──────────────────────────────────────────────────────

class CMSModuleSerializer(serializers.ModelSerializer):
    lecture_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id','title','description','order','lecture_count','created_at']
        read_only_fields = ['id','created_at','lecture_count']

    def get_lecture_count(self, obj):
        return obj.lectures.count()

    def create(self, validated_data):
        validated_data['course'] = self.context['course']
        return super().create(validated_data)


# ─── Lecture serializers ─────────────────────────────────────────────────────

class CMSLectureSerializer(serializers.ModelSerializer):
    video_url      = serializers.SerializerMethodField()
    duration_display = serializers.ReadOnlyField()

    class Meta:
        model = Lecture
        fields = [
            'id','title','description','order','video_file','video_url',
            'hls_playlist_url','hls_status','duration_seconds','duration_display',
            'is_published','created_at',
        ]
        read_only_fields = ['id','hls_playlist_url','hls_status','created_at']
        extra_kwargs = {'video_file': {'required': False, 'allow_null': True}}

    def get_video_url(self, obj):
        request = self.context.get('request')
        if obj.video_file and request:
            return request.build_absolute_uri(obj.video_file.url)
        return None

    def create(self, validated_data):
        validated_data['module'] = self.context['module']
        lecture = super().create(validated_data)
        if lecture.video_file:
            try:
                from lectures.tasks import process_video_hls
                process_video_hls.delay(str(lecture.id))
            except Exception:
                pass
        return lecture

    def update(self, instance, validated_data):
        old_file = instance.video_file.name if instance.video_file else None
        lecture = super().update(instance, validated_data)
        new_file = lecture.video_file.name if lecture.video_file else None
        if new_file and new_file != old_file:
            try:
                from lectures.tasks import process_video_hls
                lecture.hls_status = Lecture.HLSStatus.PENDING
                lecture.save(update_fields=['hls_status'])
                process_video_hls.delay(str(lecture.id))
            except Exception:
                pass
        return lecture


# ─── Material serializers ────────────────────────────────────────────────────

class CMSMaterialSerializer(serializers.ModelSerializer):
    file_url         = serializers.SerializerMethodField()
    file_size_display = serializers.ReadOnlyField()
    course_title     = serializers.CharField(source='course.title', read_only=True)
    module_title     = serializers.CharField(source='module.title', read_only=True, allow_null=True)
    lecture_title    = serializers.CharField(source='lecture.title', read_only=True, allow_null=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)

    class Meta:
        model = Material
        fields = [
            'id','title','description','file','file_url','file_type',
            'file_size','file_size_display','is_downloadable',
            'course','course_title','module','module_title',
            'lecture','lecture_title','uploaded_by_name','created_at',
        ]
        read_only_fields = [
            'id','file_url','file_size','file_size_display',
            'course_title','module_title','lecture_title','uploaded_by_name','created_at',
        ]
        extra_kwargs = {'file': {'required': True}}

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

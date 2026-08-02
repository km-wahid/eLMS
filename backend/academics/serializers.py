from rest_framework import serializers
from .models import Department, Semester, Comment, Bookmark, ProgressTracking, CourseAnalytics


class DepartmentSerializer(serializers.ModelSerializer):
    semester_count = serializers.SerializerMethodField()
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'slug', 'code', 'description',
            'logo', 'logo_url', 'semester_count', 'course_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'semester_count', 'course_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Auto-generate slug from name if not provided
        from django.utils.text import slugify
        if 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Auto-generate slug from name if name is being updated
        from django.utils.text import slugify
        if 'name' in validated_data and 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
        return super().update(instance, validated_data)

    def get_semester_count(self, obj):
        return obj.semesters.count()

    def get_course_count(self, obj):
        from courses.models import Course
        return Course.objects.filter(department=obj).count()


class SemesterSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Semester
        fields = [
            'id', 'department', 'department_name', 'department_code', 'name', 'slug', 'type',
            'order', 'start_date', 'end_date', 'description',
            'course_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'department_name', 'department_code', 'course_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Auto-generate slug from name if not provided
        from django.utils.text import slugify
        if 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Auto-generate slug from name if name is being updated
        from django.utils.text import slugify
        if 'name' in validated_data and 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
        return super().update(instance, validated_data)

    def get_course_count(self, obj):
        return obj.courses.count()


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'user_name', 'user_avatar', 'lecture', 'content_item', 'parent',
            'content', 'upvotes', 'pinned', 'is_resolved',
            'replies', 'reply_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'upvotes', 'created_at', 'updated_at']

    def get_user_avatar(self, obj):
        if obj.user.avatar:
            return obj.user.avatar.url
        return None

    def get_replies(self, obj):
        replies = obj.replies.all()
        serializer = CommentSerializer(replies, many=True, read_only=True)
        return serializer.data

    def get_reply_count(self, obj):
        return obj.replies.count()


class BookmarkSerializer(serializers.ModelSerializer):
    lecture_title = serializers.CharField(source='lecture.title', read_only=True, allow_null=True)
    material_title = serializers.CharField(source='material.title', read_only=True, allow_null=True)
    content_item_title = serializers.CharField(source='content_item.title', read_only=True, allow_null=True)
    content_type = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = [
            'id', 'user', 'lecture', 'lecture_title', 'material', 'material_title',
            'content_item', 'content_item_title',
            'content_type', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def get_content_type(self, obj):
        if obj.lecture:
            return 'lecture'
        if obj.material:
            return 'material'
        if obj.content_item:
            return obj.content_item.content_type
        return None

    def validate(self, attrs):
        content_item = attrs.get('content_item')
        request = self.context.get('request')
        if content_item and request and request.user.role == 'student':
            from courses.models import Enrollment
            if not Enrollment.objects.filter(
                student=request.user,
                course=content_item.module.course,
                status=Enrollment.Status.ACTIVE,
            ).exists():
                raise serializers.ValidationError('Enroll in the course before bookmarking its content.')
        return attrs


class ProgressTrackingSerializer(serializers.ModelSerializer):
    lecture_title = serializers.CharField(source='lecture.title', read_only=True, allow_null=True)
    material_title = serializers.CharField(source='material.title', read_only=True, allow_null=True)

    class Meta:
        model = ProgressTracking
        fields = [
            'id', 'user', 'lecture', 'lecture_title', 'material', 'material_title',
            'action', 'watch_duration_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class CourseAnalyticsSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = CourseAnalytics
        fields = [
            'id', 'course', 'course_title', 'total_enrollments',
            'total_lectures_watched', 'total_materials_downloaded',
            'engagement_score', 'last_updated'
        ]
        read_only_fields = fields

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
        read_only_fields = ['id', 'semester_count', 'course_count', 'created_at', 'updated_at']

    def get_semester_count(self, obj):
        return obj.semesters.count()

    def get_course_count(self, obj):
        from courses.models import Course
        return Course.objects.filter(department=obj).count()


class SemesterSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Semester
        fields = [
            'id', 'department', 'department_name', 'name', 'slug', 'type',
            'order', 'start_date', 'end_date', 'description',
            'course_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'department_name', 'course_count', 'created_at', 'updated_at']

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
            'id', 'user', 'user_name', 'user_avatar', 'lecture', 'parent',
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
    content_type = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = [
            'id', 'user', 'lecture', 'lecture_title', 'material', 'material_title',
            'content_type', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def get_content_type(self, obj):
        if obj.lecture:
            return 'lecture'
        if obj.material:
            return 'material'
        return None


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

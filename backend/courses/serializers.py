from rest_framework import serializers
from .models import Category, Course, Module, Enrollment
from django.utils.text import slugify
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


class CourseListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    module_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'teacher_name',
            'category_name', 'thumbnail_url', 'level', 'is_published',
            'price', 'enrollment_count', 'module_count', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']


class CourseDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    teacher_id = serializers.UUIDField(source='teacher.id', read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    modules = ModuleSerializer(many=True, read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'teacher_name', 'teacher_id',
            'category', 'category_id', 'thumbnail_url', 'level', 'is_published',
            'price', 'enrollment_count', 'modules', 'is_enrolled', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user, status='active').exists()
        return False


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', required=False, allow_null=True
    )

    class Meta:
        model = Course
        fields = ['title', 'description', 'category_id', 'thumbnail_url', 'level', 'is_published', 'price']

    def create(self, validated_data):
        title = validated_data['title']
        base_slug = slugify(title)
        slug = base_slug
        counter = 1
        while Course.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1
        validated_data['slug'] = slug
        validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'title' in validated_data and validated_data['title'] != instance.title:
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            validated_data['slug'] = slug
        return super().update(instance, validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.UUIDField(source='course.id', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    teacher_name = serializers.CharField(source='course.teacher.name', read_only=True)
    thumbnail_url = serializers.CharField(source='course.thumbnail_url', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course_id', 'course_slug', 'course_title', 'teacher_name',
            'thumbnail_url', 'status', 'progress', 'enrolled_at', 'completed_at',
        ]
        read_only_fields = ['id', 'enrolled_at', 'completed_at']

from django.contrib.auth import get_user_model
from rest_framework import serializers
from courses.models import Course, Enrollment

User = get_user_model()

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

class CMSCourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='teacher.name', read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    class Meta:
        model = Course
        fields = ['id','title','slug','instructor_name','category','level','price','is_published','enrollment_count','created_at']
        read_only_fields = ['id','slug','instructor_name','created_at','enrollment_count']
    def get_enrollment_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()

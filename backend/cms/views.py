from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from courses.models import Course, Enrollment
from .serializers import CMSUserSerializer, CMSUserUpdateSerializer, CMSCourseSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_stats(request):
    total_users = User.objects.count()
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(is_published=True).count()
    total_enrollments = Enrollment.objects.count()
    recent_users = User.objects.order_by('-created_at')[:5].values('id','name','email','role','created_at')
    recent_enrollments = Enrollment.objects.select_related('student','course').order_by('-enrolled_at')[:5]
    activity = [
        {'type': 'enrollment', 'text': f'{e.student.name} enrolled in {e.course.title}', 'time': e.enrolled_at}
        for e in recent_enrollments
    ]
    return Response({
        'stats': {
            'total_users': total_users,
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_courses': total_courses,
            'published_courses': published_courses,
            'total_enrollments': total_enrollments,
        },
        'recent_users': list(recent_users),
        'activity': activity,
    })


class CMSUserListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = CMSUserSerializer
    def get_queryset(self):
        qs = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        q    = self.request.query_params.get('q')
        if role: qs = qs.filter(role=role)
        if q:    qs = qs.filter(name__icontains=q) | qs.filter(email__icontains=q)
        return qs


class CMSUserDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    def get_serializer_class(self):
        if self.request.method in ['PUT','PATCH']: return CMSUserUpdateSerializer
        return CMSUserSerializer


class CMSCourseList(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = CMSCourseSerializer
    def get_queryset(self):
        qs = Course.objects.select_related('teacher').order_by('-created_at')
        q = self.request.query_params.get('q')
        if q: qs = qs.filter(title__icontains=q)
        return qs


class CMSCourseDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Course.objects.all()
    serializer_class = CMSCourseSerializer
    lookup_field = 'slug'

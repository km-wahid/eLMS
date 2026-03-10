from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Category, Course, Module, Enrollment
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    ModuleSerializer,
    EnrollmentSerializer,
)
from accounts.permissions import IsTeacherOrAdmin


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


# ─── Course Views ────────────────────────────────────────────────────────────

class CourseListView(generics.ListAPIView):
    """Public — list all published courses."""
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).select_related('teacher', 'category')
        category = self.request.query_params.get('category')
        level = self.request.query_params.get('level')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category__slug=category)
        if level:
            qs = qs.filter(level=level)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs


class TeacherCourseListView(generics.ListAPIView):
    """Teacher — list their own courses (published or draft)."""
    serializer_class = CourseListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Course.objects.all().select_related('teacher', 'category')
        return Course.objects.filter(teacher=self.request.user).select_related('teacher', 'category')


class CourseCreateView(generics.CreateAPIView):
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.all().select_related('teacher', 'category').prefetch_related('modules')
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class CourseUpdateView(generics.UpdateAPIView):
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Course.objects.all()
        return Course.objects.filter(teacher=self.request.user)


class CourseDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Course.objects.all()
        return Course.objects.filter(teacher=self.request.user)


# ─── Module Views ─────────────────────────────────────────────────────────────

class ModuleListCreateView(generics.ListCreateAPIView):
    serializer_class = ModuleSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]

    def get_course(self):
        return get_object_or_404(Course, slug=self.kwargs['course_slug'])

    def get_queryset(self):
        return Module.objects.filter(course=self.get_course())

    def perform_create(self, serializer):
        course = self.get_course()
        if course.teacher != self.request.user and self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't own this course.")
        next_order = course.modules.count() + 1
        serializer.save(course=course, order=next_order)


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        if self.request.user.role != 'admin' and course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't own this course.")
        return Module.objects.filter(course=course)


# ─── Enrollment Views ─────────────────────────────────────────────────────────

class EnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_slug):
        course = get_object_or_404(Course, slug=course_slug, is_published=True)
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': 'Already enrolled.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = Enrollment.objects.create(student=request.user, course=course)
        # Send enrollment confirmation email asynchronously
        try:
            from courses.tasks import send_enrollment_confirmation
            name = request.user.get_full_name() or request.user.email
            send_enrollment_confirmation.delay(
                request.user.email, name, course.title, course.slug
            )
        except Exception:
            pass
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    def delete(self, request, course_slug):
        course = get_object_or_404(Course, slug=course_slug)
        enrollment = get_object_or_404(Enrollment, student=request.user, course=course)
        enrollment.delete()
        return Response({'detail': 'Unenrolled successfully.'}, status=status.HTTP_204_NO_CONTENT)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(
            student=self.request.user
        ).select_related('course', 'course__teacher')


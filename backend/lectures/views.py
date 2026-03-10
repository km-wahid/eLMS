from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from courses.models import Course, Module, Enrollment
from accounts.permissions import IsTeacherOrAdmin
from .models import Lecture
from .serializers import (
    LectureListSerializer,
    LectureDetailSerializer,
    LectureCreateUpdateSerializer,
)


def _get_course_or_404(slug):
    return get_object_or_404(Course, slug=slug)


def _get_module_or_404(course, module_id):
    return get_object_or_404(Module, id=module_id, course=course)


def _is_owner_or_admin(user, course):
    return user.role == 'admin' or course.teacher == user


def _can_view_lecture(user, lecture):
    """Enrolled students, the course teacher, and admins can view lectures."""
    course = lecture.module.course
    if _is_owner_or_admin(user, course):
        return True
    return Enrollment.objects.filter(student=user, course=course, status='active').exists()


class CourseLectureListView(generics.ListAPIView):
    """List all published lectures for a course (enrolled users / owners)."""
    serializer_class = LectureListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course = _get_course_or_404(self.kwargs['slug'])
        if not (_is_owner_or_admin(self.request.user, course) or
                Enrollment.objects.filter(
                    student=self.request.user, course=course, status='active'
                ).exists()):
            return Lecture.objects.none()

        qs = Lecture.objects.filter(
            module__course=course
        ).select_related('module').order_by('module__order', 'order')

        if not _is_owner_or_admin(self.request.user, course):
            qs = qs.filter(is_published=True)

        return qs


class ModuleLectureListCreateView(generics.ListCreateAPIView):
    """List / create lectures within a specific module (teachers/admins only for create)."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return LectureListSerializer
        return LectureCreateUpdateSerializer

    def get_queryset(self):
        course = _get_course_or_404(self.kwargs['slug'])
        module = _get_module_or_404(course, self.kwargs['module_id'])
        qs = Lecture.objects.filter(module=module).order_by('order')
        if not _is_owner_or_admin(self.request.user, course):
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        course = _get_course_or_404(self.kwargs['slug'])
        module = _get_module_or_404(course, self.kwargs['module_id'])
        if not _is_owner_or_admin(self.request.user, course):
            self.permission_denied(self.request)
        serializer.save(module=module)


class LectureDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve / update / delete a specific lecture."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return LectureDetailSerializer
        return LectureCreateUpdateSerializer

    def get_object(self):
        course = _get_course_or_404(self.kwargs['slug'])
        module = _get_module_or_404(course, self.kwargs['module_id'])
        lecture = get_object_or_404(Lecture, id=self.kwargs['lecture_id'], module=module)

        if self.request.method == 'GET' and not _can_view_lecture(self.request.user, lecture):
            self.permission_denied(self.request)

        if self.request.method in ('PATCH', 'PUT', 'DELETE'):
            if not _is_owner_or_admin(self.request.user, course):
                self.permission_denied(self.request)

        return lecture

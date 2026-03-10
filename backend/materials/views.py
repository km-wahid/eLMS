from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from courses.models import Course, Enrollment
from accounts.permissions import IsTeacherOrAdmin
from .models import Material
from .serializers import MaterialListSerializer, MaterialDetailSerializer, MaterialUploadSerializer


def _get_course(slug):
    return get_object_or_404(Course, slug=slug)


def _is_owner_or_admin(user, course):
    return user.role == 'admin' or course.teacher == user


def _has_access(user, course):
    """Teacher/admin or enrolled active student."""
    if _is_owner_or_admin(user, course):
        return True
    return Enrollment.objects.filter(student=user, course=course, status='active').exists()


class CourseMaterialListCreateView(generics.ListCreateAPIView):
    """
    GET  – list all materials for a course (enrolled users / owner)
    POST – upload a new material (teacher / admin only)
    """
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]

    def get_serializer_class(self):
        return MaterialUploadSerializer if self.request.method == 'POST' else MaterialListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = _get_course(self.kwargs['slug'])
        return ctx

    def get_queryset(self):
        course = _get_course(self.kwargs['slug'])
        if not _has_access(self.request.user, course):
            return Material.objects.none()

        qs = Material.objects.filter(course=course).select_related('uploaded_by')

        # Optional filters
        module_id  = self.request.query_params.get('module')
        lecture_id = self.request.query_params.get('lecture')
        if lecture_id:
            qs = qs.filter(lecture_id=lecture_id)
        elif module_id:
            qs = qs.filter(module_id=module_id, lecture__isnull=True)
        else:
            qs = qs.filter(module__isnull=True, lecture__isnull=True)

        return qs

    def perform_create(self, serializer):
        course = _get_course(self.kwargs['slug'])
        if not _is_owner_or_admin(self.request.user, course):
            self.permission_denied(self.request)
        serializer.save()


class MaterialDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    – retrieve single material (enrolled / owner)
    DELETE – delete material (teacher / admin only)
    """
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return MaterialDetailSerializer

    def get_object(self):
        course   = _get_course(self.kwargs['slug'])
        material = get_object_or_404(Material, id=self.kwargs['pk'], course=course)

        if not _has_access(self.request.user, course):
            self.permission_denied(self.request)

        if self.request.method == 'DELETE':
            if not _is_owner_or_admin(self.request.user, course):
                self.permission_denied(self.request)

        return material

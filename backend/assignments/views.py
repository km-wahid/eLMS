from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from courses.models import Course, Enrollment
from accounts.permissions import IsTeacherOrAdmin
from .models import Assignment, Submission
from .serializers import (
    AssignmentListSerializer, AssignmentDetailSerializer,
    AssignmentCreateUpdateSerializer,
    SubmissionSerializer, SubmissionCreateSerializer, SubmissionGradeSerializer,
)


# ── helpers ──────────────────────────────────────────────────────────────────

def _course(slug):
    return get_object_or_404(Course, slug=slug)

def _is_owner(user, course):
    return user.role == 'admin' or course.teacher == user

def _is_enrolled(user, course):
    return Enrollment.objects.filter(student=user, course=course, status='active').exists()

def _has_access(user, course):
    return _is_owner(user, course) or _is_enrolled(user, course)


# ── Assignment CRUD ───────────────────────────────────────────────────────────

class AssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET  – list assignments (enrolled students see published only; owners see all)
    POST – create assignment (teacher / admin)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated, IsTeacherOrAdmin]
        return [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return AssignmentCreateUpdateSerializer if self.request.method == 'POST' \
            else AssignmentListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = _course(self.kwargs['slug'])
        return ctx

    def get_queryset(self):
        course = _course(self.kwargs['slug'])
        if not _has_access(self.request.user, course):
            return Assignment.objects.none()
        qs = Assignment.objects.filter(course=course).select_related('module')
        if not _is_owner(self.request.user, course):
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        course = _course(self.kwargs['slug'])
        if not _is_owner(self.request.user, course):
            self.permission_denied(self.request)
        serializer.save()


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve / update / delete a single assignment."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated]
        return [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AssignmentDetailSerializer
        return AssignmentCreateUpdateSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = _course(self.kwargs['slug'])
        return ctx

    def get_object(self):
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'], course=course)
        if self.request.method == 'GET':
            if not _has_access(self.request.user, course):
                self.permission_denied(self.request)
        else:
            if not _is_owner(self.request.user, course):
                self.permission_denied(self.request)
        return assignment


# ── Submissions ───────────────────────────────────────────────────────────────

class SubmissionListView(generics.ListAPIView):
    """Teacher sees all submissions for an assignment."""
    serializer_class    = SubmissionSerializer
    permission_classes  = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'], course=course)
        if not _is_owner(self.request.user, course):
            self.permission_denied(self.request)
        return Submission.objects.filter(assignment=assignment).select_related('student')


class MySubmissionView(generics.RetrieveAPIView):
    """Student views their own submission for an assignment."""
    serializer_class   = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'], course=course)
        return get_object_or_404(Submission, assignment=assignment, student=self.request.user)


class SubmitAssignmentView(generics.CreateAPIView):
    """Student submits (or re-submits) an assignment."""
    serializer_class   = SubmissionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'],
                                       course=course, is_published=True)
        ctx['assignment'] = assignment
        return ctx

    def create(self, request, *args, **kwargs):
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'],
                                       course=course, is_published=True)
        if not _is_enrolled(request.user, course):
            return Response({'detail': 'You are not enrolled in this course.'},
                            status=status.HTTP_403_FORBIDDEN)
        # Allow re-submission: delete previous if exists
        Submission.objects.filter(assignment=assignment, student=request.user).delete()
        return super().create(request, *args, **kwargs)


class GradeSubmissionView(generics.UpdateAPIView):
    """Teacher grades a submission."""
    serializer_class   = SubmissionGradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    http_method_names  = ['patch']

    def get_object(self):
        course     = _course(self.kwargs['slug'])
        assignment = get_object_or_404(Assignment, id=self.kwargs['pk'], course=course)
        if not _is_owner(self.request.user, course):
            self.permission_denied(self.request)
        return get_object_or_404(Submission, id=self.kwargs['sub_pk'], assignment=assignment)


class MyAssignmentsView(generics.ListAPIView):
    """Student views all their submissions across a course."""
    serializer_class   = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course = _course(self.kwargs['slug'])
        return Submission.objects.filter(
            student=self.request.user,
            assignment__course=course,
        ).select_related('assignment')

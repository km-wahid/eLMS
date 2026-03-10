from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from courses.models import Course, Enrollment
from accounts.permissions import IsTeacherOrAdmin
from .models import LiveSession
from .serializers import (
    LiveSessionListSerializer,
    LiveSessionDetailSerializer,
    LiveSessionCreateUpdateSerializer,
)


def _course(slug):
    return get_object_or_404(Course, slug=slug)

def _is_owner(user, course):
    return user.role == 'admin' or course.teacher == user

def _has_access(user, course):
    return _is_owner(user, course) or \
           Enrollment.objects.filter(student=user, course=course, status='active').exists()


class LiveSessionListCreateView(generics.ListCreateAPIView):
    """
    GET  – list sessions for a course (enrolled / owner)
    POST – schedule a new session (teacher / admin)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated, IsTeacherOrAdmin]
        return [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return LiveSessionCreateUpdateSerializer if self.request.method == 'POST' \
            else LiveSessionListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = _course(self.kwargs['slug'])
        return ctx

    def get_queryset(self):
        course = _course(self.kwargs['slug'])
        if not _has_access(self.request.user, course):
            return LiveSession.objects.none()
        return LiveSession.objects.filter(course=course).select_related('host')

    def perform_create(self, serializer):
        course = _course(self.kwargs['slug'])
        if not _is_owner(self.request.user, course):
            self.permission_denied(self.request)
        serializer.save()


class LiveSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve / update / cancel a live session."""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated]
        return [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return LiveSessionDetailSerializer
        return LiveSessionCreateUpdateSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = _course(self.kwargs['slug'])
        return ctx

    def get_object(self):
        course  = _course(self.kwargs['slug'])
        session = get_object_or_404(LiveSession, id=self.kwargs['pk'], course=course)
        if self.request.method == 'GET':
            if not _has_access(self.request.user, course):
                self.permission_denied(self.request)
        else:
            if not _is_owner(self.request.user, course):
                self.permission_denied(self.request)
        return session

    def destroy(self, request, *args, **kwargs):
        session = self.get_object()
        session.status = LiveSession.Status.CANCELLED
        session.save(update_fields=['status'])
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacherOrAdmin])
def go_live(request, slug, pk):
    """Teacher marks a session as live."""
    course  = _course(slug)
    session = get_object_or_404(LiveSession, id=pk, course=course)
    if not _is_owner(request.user, course):
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
    if session.status not in (LiveSession.Status.SCHEDULED,):
        return Response({'detail': 'Session is not in scheduled state.'},
                        status=status.HTTP_400_BAD_REQUEST)
    session.status     = LiveSession.Status.LIVE
    session.started_at = timezone.now()
    session.save(update_fields=['status', 'started_at'])
    return Response(LiveSessionDetailSerializer(session, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacherOrAdmin])
def end_session(request, slug, pk):
    """Teacher ends a live session and optionally saves recording URL."""
    course  = _course(slug)
    session = get_object_or_404(LiveSession, id=pk, course=course)
    if not _is_owner(request.user, course):
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
    if session.status != LiveSession.Status.LIVE:
        return Response({'detail': 'Session is not live.'}, status=status.HTTP_400_BAD_REQUEST)
    session.status        = LiveSession.Status.ENDED
    session.ended_at      = timezone.now()
    session.recording_url = request.data.get('recording_url', '')
    session.save(update_fields=['status', 'ended_at', 'recording_url'])
    return Response(LiveSessionDetailSerializer(session, context={'request': request}).data)


class UpcomingSessionsView(generics.ListAPIView):
    """All upcoming / live sessions across the user's enrolled courses."""
    serializer_class   = LiveSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            student=self.request.user, status='active'
        ).values_list('course_id', flat=True)

        return LiveSession.objects.filter(
            course_id__in=enrolled_course_ids,
            status__in=[LiveSession.Status.SCHEDULED, LiveSession.Status.LIVE],
            scheduled_at__gte=timezone.now() - timezone.timedelta(hours=2),
        ).select_related('course', 'host').order_by('scheduled_at')

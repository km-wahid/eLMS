from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q

from .models import Department, Semester, Comment, Bookmark, ProgressTracking, CourseAnalytics
from .serializers import (
    DepartmentSerializer,
    SemesterSerializer,
    CommentSerializer,
    BookmarkSerializer,
    ProgressTrackingSerializer,
    CourseAnalyticsSerializer,
)
from accounts.permissions import IsAdmin, IsTeacherOrAdmin


class DepartmentViewSet(viewsets.ModelViewSet):
    # The legacy GEN bucket only exists for migration compatibility; it is not
    # part of the eight-department academic catalog shown to learners.
    queryset = Department.objects.exclude(code='GEN')
    serializer_class = DepartmentSerializer
    lookup_field = 'slug'  # Use slug for lookups

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticatedOrReadOnly()]


class SemesterViewSet(viewsets.ModelViewSet):
    serializer_class = SemesterSerializer
    lookup_field = 'slug'  # Use slug for lookups

    def get_queryset(self):
        queryset = Semester.objects.all()
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department__id=department_id)
        return queryset

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticatedOrReadOnly()]


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Comment.objects.all()
        user = self.request.user
        if user.role == 'student':
            queryset = queryset.filter(
                Q(content_item__module__course__enrollments__student=user) |
                Q(lecture__module__course__enrollments__student=user)
            ).distinct()
        elif user.role == 'teacher':
            queryset = queryset.filter(
                Q(content_item__module__course__teacher=user) |
                Q(content_item__module__course__teachers=user) |
                Q(lecture__module__course__teacher=user) |
                Q(lecture__module__course__teachers=user)
            ).distinct()
        content_item_id = self.request.query_params.get('content_item')
        if content_item_id:
            return queryset.filter(content_item_id=content_item_id, parent__isnull=True)
        lecture_id = self.request.query_params.get('lecture')
        if lecture_id:
            return queryset.filter(lecture__id=lecture_id, parent__isnull=True)
        return queryset.filter(parent__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        comment = self.get_object()
        comment.upvotes += 1
        comment.save()
        return Response({'upvotes': comment.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[IsTeacherOrAdmin])
    def pin(self, request, pk=None):
        comment = self.get_object()
        comment.pinned = not comment.pinned
        comment.save()
        return Response({'pinned': comment.pinned})

    @action(detail=True, methods=['post'], permission_classes=[IsTeacherOrAdmin])
    def resolve(self, request, pk=None):
        comment = self.get_object()
        comment.is_resolved = not comment.is_resolved
        comment.save()
        return Response({'is_resolved': comment.is_resolved})

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id and not self.request.user.is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only delete your own comments.')
        instance.delete()


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def lectures(self, request):
        bookmarks = self.get_queryset().filter(lecture__isnull=False)
        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def materials(self, request):
        bookmarks = self.get_queryset().filter(material__isnull=False)
        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def content(self, request):
        bookmarks = self.get_queryset().filter(content_item__isnull=False)
        return Response(self.get_serializer(bookmarks, many=True).data)


class ProgressTrackingViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressTrackingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProgressTracking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def lecture_progress(self, request):
        lecture_id = request.query_params.get('lecture')
        if lecture_id:
            progress = self.get_queryset().filter(
                lecture__id=lecture_id,
                action=ProgressTracking.Action.LECTURE_WATCHED
            )
            serializer = self.get_serializer(progress, many=True)
            return Response(serializer.data)
        return Response({'error': 'lecture parameter required'}, status=400)

    @action(detail=False, methods=['post'])
    def track_lecture_view(self, request):
        lecture_id = request.data.get('lecture_id')
        watch_duration = request.data.get('watch_duration_seconds')
        if not lecture_id:
            return Response({'error': 'lecture_id required'}, status=400)

        progress, created = ProgressTracking.objects.get_or_create(
            user=request.user,
            lecture_id=lecture_id,
            action=ProgressTracking.Action.LECTURE_WATCHED,
            defaults={'watch_duration_seconds': watch_duration or 0}
        )
        serializer = self.get_serializer(progress)
        return Response(serializer.data)


class CourseAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseAnalyticsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_superuser:
            return CourseAnalytics.objects.all()
        if user.is_teacher:
            return CourseAnalytics.objects.filter(course__teacher=user)
        return CourseAnalytics.objects.none()

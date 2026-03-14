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
from accounts.permissions import IsAdmin, IsTeacher


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticatedOrReadOnly()]


class SemesterViewSet(viewsets.ModelViewSet):
    serializer_class = SemesterSerializer
    lookup_field = 'slug'

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
        lecture_id = self.request.query_params.get('lecture')
        if lecture_id:
            return Comment.objects.filter(lecture__id=lecture_id, parent__isnull=True)
        return Comment.objects.filter(parent__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        comment = self.get_object()
        comment.upvotes += 1
        comment.save()
        return Response({'upvotes': comment.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def pin(self, request, pk=None):
        comment = self.get_object()
        comment.pinned = not comment.pinned
        comment.save()
        return Response({'pinned': comment.pinned})

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def resolve(self, request, pk=None):
        comment = self.get_object()
        comment.is_resolved = not comment.is_resolved
        comment.save()
        return Response({'is_resolved': comment.is_resolved})


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
        if user.is_admin:
            return CourseAnalytics.objects.all()
        if user.is_teacher:
            return CourseAnalytics.objects.filter(course__teacher=user)
        return CourseAnalytics.objects.none()

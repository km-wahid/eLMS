from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import (
    Category, Course, Module, Enrollment,
    CourseProgress, ModuleProgress, ContentProgress, ContentItem
)
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    ModuleSerializer,
    EnrollmentSerializer,
    CourseDetailWithProgressSerializer,
    ModuleProgressSerializer,
    ContentProgressSerializer,
    ContentItemSerializer,
    CourseProgressSerializer,
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
        qs = Course.objects.filter(is_published=True).select_related('teacher', 'category', 'department', 'semester')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        
        # Filter by department (accepts both id and slug)
        department = self.request.query_params.get('department')
        if department:
            # Try to filter by ID first, fallback to slug
            try:
                qs = qs.filter(department__id=department)
            except (ValueError, TypeError):
                qs = qs.filter(department__slug=department)
        
        # Filter by semester (accepts both id and slug)
        semester = self.request.query_params.get('semester')
        if semester:
            # Try to filter by ID first, fallback to slug
            try:
                import uuid
                uuid.UUID(semester)  # Check if it's a valid UUID
                qs = qs.filter(semester__id=semester)
            except (ValueError, TypeError):
                qs = qs.filter(semester__slug=semester)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)
        
        return qs


class TeacherCourseListView(generics.ListAPIView):
    """Teacher — list their own courses (published or draft)."""
    serializer_class = CourseListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        if self.request.user.role in ('admin', 'superuser') or self.request.user.is_superuser:
            return Course.objects.all().select_related('teacher', 'category')
        return Course.objects.filter(
            Q(teacher=self.request.user) | Q(teachers=self.request.user)
        ).distinct().select_related('teacher', 'category')


class CourseCreateView(generics.CreateAPIView):
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.all().select_related('teacher', 'category', 'department', 'semester').prefetch_related('modules__content_items', 'teachers')
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class CourseUpdateView(generics.UpdateAPIView):
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.role in ('admin', 'superuser') or self.request.user.is_superuser:
            return Course.objects.all()
        # Allow teacher to update if they are primary teacher or in additional teachers
        from django.db.models import Q
        return Course.objects.filter(
            Q(teacher=self.request.user) | Q(teachers=self.request.user)
        ).distinct()


class CourseDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.role in ('admin', 'superuser') or self.request.user.is_superuser:
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
        if not course.can_manage(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't own this course.")
        next_order = course.modules.count() + 1
        serializer.save(course=course, order=next_order)


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        if not course.can_manage(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't own this course.")
        return Module.objects.filter(course=course)


# ─── Enrollment Views ─────────────────────────────────────────────────────────

class EnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_slug):
        if request.user.role != 'student':
            return Response({'detail': 'Only students can enroll.'}, status=status.HTTP_403_FORBIDDEN)
        course = get_object_or_404(Course, slug=course_slug, is_published=True)
        if not course.is_available:
            return Response({'detail': 'This course is coming soon.'}, status=status.HTTP_403_FORBIDDEN)
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


# ===== Progress Tracking Views =====

class CourseDetailStudentView(generics.RetrieveAPIView):
    """
    Student view of course with modules, content, and personal progress.
    No enrollment required - just check if course is published.
    """
    serializer_class = CourseDetailWithProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = Course.objects.filter(
            is_published=True, availability=Course.Availability.AVAILABLE
        ).select_related(
            'teacher', 'department', 'semester', 'category'
        ).prefetch_related('modules__content_items')
        user = self.request.user
        if user.role == 'student':
            return queryset.filter(enrollments__student=user, enrollments__status=Enrollment.Status.ACTIVE)
        if user.role == 'teacher':
            return queryset.filter(Q(teacher=user) | Q(teachers=user)).distinct()
        return queryset


class TrackModuleProgressView(APIView):
    """Mark a module as started or completed"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, course_slug, module_id):
        try:
            course = Course.objects.get(slug=course_slug, is_published=True, availability=Course.Availability.AVAILABLE)
            module = Module.objects.get(id=module_id, course=course)
        except (Course.DoesNotExist, Module.DoesNotExist):
            return Response(
                {'detail': 'Course or module not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        if request.user.role == 'student' and not Enrollment.objects.filter(
            student=request.user, course=course, status=Enrollment.Status.ACTIVE
        ).exists():
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create module progress
        module_progress, created = ModuleProgress.objects.get_or_create(
            user=request.user,
            module=module
        )
        
        # Check if should be marked complete
        module_progress.check_completion()
        
        return Response(
            ModuleProgressSerializer(module_progress).data,
            status=status.HTTP_200_OK
        )


class TrackContentProgressView(APIView):
    """Mark content item as viewed"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, course_slug, content_id):
        try:
            course = Course.objects.get(slug=course_slug, is_published=True, availability=Course.Availability.AVAILABLE)
            content = ContentItem.objects.get(
                id=content_id,
                module__course=course
            )
        except (Course.DoesNotExist, ContentItem.DoesNotExist):
            return Response(
                {'detail': 'Course or content not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        if request.user.role == 'student' and not Enrollment.objects.filter(
            student=request.user, course=course, status=Enrollment.Status.ACTIVE
        ).exists():
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get watch duration from request
        duration = request.data.get('watch_duration_seconds', 0)
        
        # Get or create content progress
        content_progress, created = ContentProgress.objects.get_or_create(
            user=request.user,
            content_item=content
        )
        
        # Mark as viewed
        content_progress.mark_as_viewed(duration_seconds=duration)
        
        return Response(
            ContentProgressSerializer(content_progress).data,
            status=status.HTTP_200_OK
        )


class CourseProgressView(APIView):
    """Get student's progress in a course"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, course_slug):
        try:
            course = Course.objects.get(slug=course_slug, is_published=True, availability=Course.Availability.AVAILABLE)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        if request.user.role == 'student' and not Enrollment.objects.filter(
            student=request.user, course=course, status=Enrollment.Status.ACTIVE
        ).exists():
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create course progress
        course_progress, _ = CourseProgress.objects.get_or_create(
            user=request.user,
            course=course
        )
        
        # Update if needed
        course_progress.update_progress()
        
        # Get module progress
        module_progress = ModuleProgress.objects.filter(
            user=request.user,
            module__course=course
        ).select_related('module')
        
        return Response({
            'course_progress': CourseProgressSerializer(course_progress).data,
            'module_progress': ModuleProgressSerializer(module_progress, many=True).data
        })


class MyCoursesWithProgressView(generics.ListAPIView):
    """
    Get all published courses with student's progress.
    No enrollment needed - shows all available courses.
    """
    serializer_class = CourseListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Course.objects.filter(
            is_published=True, availability=Course.Availability.AVAILABLE
        ).select_related(
            'teacher', 'department', 'semester', 'category'
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Add progress data for each course
        courses_with_progress = []
        for course_data in serializer.data:
            course = Course.objects.get(id=course_data['id'])
            progress, _ = CourseProgress.objects.get_or_create(
                user=request.user,
                course=course
            )
            progress.update_progress()
            
            course_data['progress'] = {
                'completed_modules': progress.completed_modules,
                'total_modules': progress.total_modules,
                'percentage': progress.completion_percentage
            }
            courses_with_progress.append(course_data)
        
        return Response(courses_with_progress)


class ContentItemDetailView(generics.RetrieveAPIView):
    """Get content item details"""
    serializer_class = ContentItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'pk'
    
    def get_queryset(self):
        return ContentItem.objects.filter(
            module__course__is_published=True,
            module__course__availability=Course.Availability.AVAILABLE,
        ).select_related('module__course')


class ContentItemDownloadView(APIView):
    """Download content item file"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            content = ContentItem.objects.get(
                id=pk,
                module__course__is_published=True,
                module__course__availability=Course.Availability.AVAILABLE,
            )
        except ContentItem.DoesNotExist:
            return Response(
                {'detail': 'Content not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not content.is_downloadable:
            return Response(
                {'detail': 'This content is not downloadable'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Track download as view
        content_progress, _ = ContentProgress.objects.get_or_create(
            user=request.user,
            content_item=content
        )
        content_progress.mark_as_viewed()
        
        # Return file URL or redirect
        if content.file:
            from django.http import FileResponse
            return FileResponse(content.file.open('rb'), as_attachment=True)
        
        return Response(
            {'detail': 'No file available for download'},
            status=status.HTTP_404_NOT_FOUND
        )

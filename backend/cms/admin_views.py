"""
CMS Admin Views - Complete Integration
Merges all Django Admin functionality into CMS API
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin as IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from courses.models import (
    Course, Module, ContentItem, Enrollment, Category,
    CourseProgress, ModuleProgress, ContentProgress
)
from academics.models import Department, Semester
from lectures.models import Lecture
from materials.models import Material
from .serializers import *

User = get_user_model()


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_analytics_dashboard(request):
    """
    Complete analytics dashboard with all metrics
    """
    
    # Core Metrics
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()
    total_departments = Department.objects.count()
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(is_published=True).count()
    total_modules = Module.objects.count()
    total_content = ContentItem.objects.count()
    total_enrollments = Enrollment.objects.count()
    
    # Time-based metrics
    week_ago = timezone.now() - timedelta(days=7)
    month_ago = timezone.now() - timedelta(days=30)
    
    # Student Activity
    active_students = User.objects.filter(
        role='student',
        content_progress__last_viewed_at__gte=week_ago
    ).distinct().count()
    
    recent_activity_count = ContentProgress.objects.filter(
        last_viewed_at__gte=week_ago
    ).count()
    
    # Course Progress
    avg_completion = CourseProgress.objects.aggregate(
        avg=Avg('completion_percentage')
    )['avg'] or 0
    
    # Teacher Activity
    active_teachers = User.objects.filter(
        role='teacher',
        uploaded_content__created_at__gte=week_ago
    ).distinct().count()
    
    recent_uploads = ContentItem.objects.filter(
        created_at__gte=week_ago
    ).count()
    
    # Popular Courses
    popular_courses = Course.objects.filter(
        is_published=True
    ).annotate(
        enrollment_count=Count('enrollments')
    ).order_by('-enrollment_count')[:5].values(
        'id', 'title', 'course_code', 'slug', 'enrollment_count',
        'department__name', 'teacher__name'
    )
    
    # Recent Courses
    recent_courses = Course.objects.order_by('-created_at')[:5].values(
        'id', 'title', 'course_code', 'slug', 'is_published',
        'created_at', 'department__name'
    )
    
    # Content Distribution
    content_by_type = ContentItem.objects.values('content_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Courses by Department
    courses_by_dept = Department.objects.annotate(
        course_count=Count('courses')
    ).order_by('-course_count').values('name', 'code', 'course_count')
    
    # System Health
    courses_without_modules = Course.objects.annotate(
        module_count=Count('modules')
    ).filter(module_count=0).count()
    
    modules_without_content = Module.objects.annotate(
        content_count=Count('content_items')
    ).filter(content_count=0).count()
    
    unpublished_courses = Course.objects.filter(is_published=False).count()
    
    # Activity Timeline (last 7 days)
    activity_timeline = []
    for i in range(6, -1, -1):
        day = timezone.now() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        count = ContentProgress.objects.filter(
            last_viewed_at__range=[day_start, day_end]
        ).count()
        activity_timeline.append({
            'date': day.strftime('%Y-%m-%d'),
            'day': day.strftime('%a'),
            'views': count
        })
    
    # Teacher Upload Activity
    teacher_uploads = ContentItem.objects.filter(
        created_at__gte=week_ago
    ).values('uploaded_by__name').annotate(
        upload_count=Count('id')
    ).order_by('-upload_count')[:5]
    
    # Recent Enrollments
    recent_enrollments = Enrollment.objects.select_related(
        'student', 'course'
    ).order_by('-enrolled_at')[:10].values(
        'student__name', 'course__title', 'enrolled_at'
    )
    
    return Response({
        'core_metrics': {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_departments': total_departments,
            'total_courses': total_courses,
            'published_courses': published_courses,
            'total_modules': total_modules,
            'total_content': total_content,
            'total_enrollments': total_enrollments,
        },
        'activity_metrics': {
            'active_students': active_students,
            'active_teachers': active_teachers,
            'recent_activity_count': recent_activity_count,
            'recent_uploads': recent_uploads,
            'avg_completion': round(avg_completion, 1),
        },
        'popular_courses': list(popular_courses),
        'recent_courses': list(recent_courses),
        'content_distribution': list(content_by_type),
        'courses_by_department': list(courses_by_dept),
        'system_health': {
            'courses_without_modules': courses_without_modules,
            'modules_without_content': modules_without_content,
            'unpublished_courses': unpublished_courses,
        },
        'activity_timeline': activity_timeline,
        'teacher_uploads': list(teacher_uploads),
        'recent_enrollments': list(recent_enrollments),
    })


# ═══════════════════════════════════════════════════════════════════════════════
# DEPARTMENTS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_department_list(request):
    """List all departments with statistics"""
    departments = Department.objects.annotate(
        course_count=Count('courses'),
        student_count=Count('courses__enrollments', distinct=True)
    ).order_by('name').values(
        'id', 'name', 'code', 'description',
        'head_of_department__name', 'course_count', 'student_count',
        'created_at'
    )
    return Response(list(departments))


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_department_create(request):
    """Create a new department"""
    from .serializers import CMSDepartmentSerializer
    serializer = CMSDepartmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def cms_department_detail(request, pk):
    """Get, update, or delete a department"""
    try:
        department = Department.objects.annotate(
            course_count=Count('courses')
        ).get(pk=pk)
    except Department.DoesNotExist:
        return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        from .serializers import CMSDepartmentSerializer
        serializer = CMSDepartmentSerializer(department)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        from .serializers import CMSDepartmentSerializer
        serializer = CMSDepartmentSerializer(
            department, data=request.data, partial=(request.method == 'PATCH')
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════════
# SEMESTERS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_semester_list(request):
    """List all semesters with statistics"""
    semesters = Semester.objects.annotate(
        course_count=Count('courses')
    ).order_by('-academic_year', 'name').values(
        'id', 'name', 'academic_year', 'semester_type',
        'start_date', 'end_date', 'is_active',
        'course_count', 'created_at'
    )
    return Response(list(semesters))


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_semester_create(request):
    """Create a new semester"""
    from .serializers import CMSSemesterSerializer
    serializer = CMSSemesterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def cms_semester_detail(request, pk):
    """Get, update, or delete a semester"""
    try:
        semester = Semester.objects.annotate(
            course_count=Count('courses')
        ).get(pk=pk)
    except Semester.DoesNotExist:
        return Response({'error': 'Semester not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        from .serializers import CMSSemesterSerializer
        serializer = CMSSemesterSerializer(semester)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        from .serializers import CMSSemesterSerializer
        serializer = CMSSemesterSerializer(
            semester, data=request.data, partial=(request.method == 'PATCH')
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        semester.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT ITEMS (Complete CRUD)
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_content_list(request):
    """List all content items with filtering"""
    queryset = ContentItem.objects.select_related(
        'module', 'module__course', 'uploaded_by'
    ).order_by('-created_at')
    
    # Filters
    module_id = request.query_params.get('module')
    content_type = request.query_params.get('type')
    search = request.query_params.get('q')
    
    if module_id:
        queryset = queryset.filter(module_id=module_id)
    if content_type:
        queryset = queryset.filter(content_type=content_type)
    if search:
        queryset = queryset.filter(title__icontains=search)
    
    content_items = queryset.values(
        'id', 'title', 'content_type', 'order',
        'module__title', 'module__course__title',
        'uploaded_by__name', 'is_downloadable',
        'duration_minutes', 'created_at'
    )[:100]  # Limit to 100 items
    
    return Response(list(content_items))


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_content_create(request):
    """Create a new content item"""
    from .serializers import CMSContentItemSerializer
    serializer = CMSContentItemSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def cms_content_detail(request, pk):
    """Get, update, or delete a content item"""
    try:
        content = ContentItem.objects.select_related('module', 'uploaded_by').get(pk=pk)
    except ContentItem.DoesNotExist:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        from .serializers import CMSContentItemSerializer
        serializer = CMSContentItemSerializer(content)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        from .serializers import CMSContentItemSerializer
        serializer = CMSContentItemSerializer(
            content, data=request.data,
            partial=(request.method == 'PATCH'),
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════════
# PROGRESS TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_progress_overview(request):
    """Get overall progress statistics"""
    total_progress_records = CourseProgress.objects.count()
    avg_completion = CourseProgress.objects.aggregate(
        avg=Avg('completion_percentage')
    )['avg'] or 0
    
    completed_courses = CourseProgress.objects.filter(
        completion_percentage=100
    ).count()
    
    in_progress = CourseProgress.objects.filter(
        completion_percentage__gt=0,
        completion_percentage__lt=100
    ).count()
    
    not_started = CourseProgress.objects.filter(
        completion_percentage=0
    ).count()
    
    # Top performing students
    top_students = User.objects.filter(
        role='student',
        course_progress__isnull=False
    ).annotate(
        avg_progress=Avg('course_progress__completion_percentage'),
        courses_completed=Count(
            'course_progress',
            filter=Q(course_progress__completion_percentage=100)
        )
    ).order_by('-avg_progress')[:10].values(
        'id', 'name', 'email', 'avg_progress', 'courses_completed'
    )
    
    return Response({
        'overview': {
            'total_progress_records': total_progress_records,
            'avg_completion': round(avg_completion, 1),
            'completed_courses': completed_courses,
            'in_progress': in_progress,
            'not_started': not_started,
        },
        'top_students': list(top_students),
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_course_progress_list(request):
    """List course progress for all students"""
    queryset = CourseProgress.objects.select_related(
        'user', 'course'
    ).order_by('-last_accessed')
    
    # Filters
    course_id = request.query_params.get('course')
    student_id = request.query_params.get('student')
    
    if course_id:
        queryset = queryset.filter(course_id=course_id)
    if student_id:
        queryset = queryset.filter(user_id=student_id)
    
    progress_data = queryset.values(
        'id', 'user__name', 'user__email', 'course__title',
        'completion_percentage', 'completed_modules', 'total_modules',
        'last_accessed'
    )[:100]
    
    return Response(list(progress_data))


# ═══════════════════════════════════════════════════════════════════════════════
# ENROLLMENTS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_enrollment_list(request):
    """List all enrollments with filtering"""
    queryset = Enrollment.objects.select_related(
        'student', 'course'
    ).order_by('-enrolled_at')
    
    # Filters
    course_id = request.query_params.get('course')
    student_id = request.query_params.get('student')
    search = request.query_params.get('q')
    
    if course_id:
        queryset = queryset.filter(course_id=course_id)
    if student_id:
        queryset = queryset.filter(student_id=student_id)
    if search:
        queryset = queryset.filter(
            Q(student__name__icontains=search) |
            Q(course__title__icontains=search)
        )
    
    enrollments = queryset.values(
        'id', 'student__name', 'student__email',
        'course__title', 'course__slug', 'enrolled_at'
    )[:100]
    
    return Response(list(enrollments))


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_enrollment_create(request):
    """Manually enroll a student in a course"""
    from .serializers import CMSEnrollmentSerializer
    serializer = CMSEnrollmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def cms_enrollment_delete(request, pk):
    """Remove an enrollment"""
    try:
        enrollment = Enrollment.objects.get(pk=pk)
        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Enrollment.DoesNotExist:
        return Response({'error': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════════════════════════════════════════
# BULK ACTIONS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_bulk_publish_courses(request):
    """Publish multiple courses at once"""
    course_ids = request.data.get('course_ids', [])
    if not course_ids:
        return Response(
            {'error': 'No course IDs provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated = Course.objects.filter(id__in=course_ids).update(is_published=True)
    return Response({
        'success': True,
        'updated_count': updated,
        'message': f'{updated} courses published'
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_bulk_unpublish_courses(request):
    """Unpublish multiple courses at once"""
    course_ids = request.data.get('course_ids', [])
    if not course_ids:
        return Response(
            {'error': 'No course IDs provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated = Course.objects.filter(id__in=course_ids).update(is_published=False)
    return Response({
        'success': True,
        'updated_count': updated,
        'message': f'{updated} courses unpublished'
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cms_bulk_delete_courses(request):
    """Delete multiple courses at once"""
    course_ids = request.data.get('course_ids', [])
    if not course_ids:
        return Response(
            {'error': 'No course IDs provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    deleted, _ = Course.objects.filter(id__in=course_ids).delete()
    return Response({
        'success': True,
        'deleted_count': deleted,
        'message': f'{deleted} courses deleted'
    })

"""
Custom Admin Dashboard with Analytics
"""
from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from courses.models import (
    Course, Module, ContentItem, Enrollment,
    CourseProgress, ModuleProgress, ContentProgress
)
from academics.models import Department, Semester

User = get_user_model()


@staff_member_required
def analytics_dashboard(request):
    """
    Custom analytics dashboard for admin
    """
    
    # ========== CORE METRICS ==========
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()
    total_departments = Department.objects.count()
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(is_published=True).count()
    total_modules = Module.objects.count()
    total_content = ContentItem.objects.count()
    total_enrollments = Enrollment.objects.count()
    
    # ========== COURSE ANALYTICS ==========
    
    # Most viewed courses (by enrollment count)
    popular_courses = Course.objects.filter(
        is_published=True
    ).annotate(
        enrollment_count=Count('enrollments')
    ).order_by('-enrollment_count')[:5]
    
    # Recently created courses
    recent_courses = Course.objects.order_by('-created_at')[:5]
    
    # Courses by department
    courses_by_department = Department.objects.annotate(
        course_count=Count('courses')
    ).order_by('-course_count')
    
    # ========== CONTENT ANALYTICS ==========
    
    # Content types distribution
    content_by_type = ContentItem.objects.values('content_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Recent content uploads (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    recent_uploads = ContentItem.objects.filter(
        created_at__gte=week_ago
    ).count()
    
    # ========== STUDENT ACTIVITY ==========
    
    # Active students (with progress records)
    active_students = User.objects.filter(
        role='student',
        content_progress__isnull=False
    ).distinct().count()
    
    # Recent student activity (last 7 days)
    recent_activity = ContentProgress.objects.filter(
        last_viewed_at__gte=week_ago
    ).count()
    
    # Average course completion rate
    avg_completion = CourseProgress.objects.aggregate(
        avg_completion=Sum('completion_percentage')
    )['avg_completion'] or 0
    if CourseProgress.objects.count() > 0:
        avg_completion = avg_completion / CourseProgress.objects.count()
    
    # ========== TEACHER ACTIVITY ==========
    
    # Active teachers (who uploaded content recently)
    active_teachers = User.objects.filter(
        role='teacher',
        uploaded_content__created_at__gte=week_ago
    ).distinct().count()
    
    # Recent teacher uploads
    teacher_uploads = ContentItem.objects.filter(
        created_at__gte=week_ago
    ).values('uploaded_by__name').annotate(
        upload_count=Count('id')
    ).order_by('-upload_count')[:5]
    
    # ========== SYSTEM HEALTH ==========
    
    # Courses without modules
    courses_without_modules = Course.objects.annotate(
        module_count=Count('modules')
    ).filter(module_count=0).count()
    
    # Modules without content
    modules_without_content = Module.objects.annotate(
        content_count=Count('content_items')
    ).filter(content_count=0).count()
    
    # Unpublished courses
    unpublished_courses = Course.objects.filter(is_published=False).count()
    
    # ========== CHART DATA ==========
    
    # Prepare data for charts
    department_labels = [dept.name for dept in courses_by_department]
    department_data = [dept.course_count for dept in courses_by_department]
    
    content_type_labels = [item['content_type'].title() for item in content_by_type]
    content_type_data = [item['count'] for item in content_by_type]
    
    # Activity over last 7 days
    activity_labels = []
    activity_data = []
    for i in range(6, -1, -1):
        day = timezone.now() - timedelta(days=i)
        activity_labels.append(day.strftime('%a'))
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        count = ContentProgress.objects.filter(
            last_viewed_at__range=[day_start, day_end]
        ).count()
        activity_data.append(count)
    
    context = {
        # Core Metrics
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_departments': total_departments,
        'total_courses': total_courses,
        'published_courses': published_courses,
        'total_modules': total_modules,
        'total_content': total_content,
        'total_enrollments': total_enrollments,
        
        # Course Analytics
        'popular_courses': popular_courses,
        'recent_courses': recent_courses,
        'courses_by_department': courses_by_department,
        
        # Content Analytics
        'content_by_type': content_by_type,
        'recent_uploads': recent_uploads,
        
        # Student Activity
        'active_students': active_students,
        'recent_activity': recent_activity,
        'avg_completion': round(avg_completion, 1),
        
        # Teacher Activity
        'active_teachers': active_teachers,
        'teacher_uploads': teacher_uploads,
        
        # System Health
        'courses_without_modules': courses_without_modules,
        'modules_without_content': modules_without_content,
        'unpublished_courses': unpublished_courses,
        
        # Chart Data
        'department_labels': department_labels,
        'department_data': department_data,
        'content_type_labels': content_type_labels,
        'content_type_data': content_type_data,
        'activity_labels': activity_labels,
        'activity_data': activity_data,
        
        # Page info
        'title': 'Analytics Dashboard',
        'site_title': 'eLMS Admin',
        'site_header': 'eLMS Analytics',
    }
    
    return render(request, 'admin/analytics_dashboard.html', context)

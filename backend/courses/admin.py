from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import (
    Category, Course, Module, Enrollment, ContentItem,
    CourseProgress, ModuleProgress, ContentProgress
)


# Inline classes for better hierarchy management
class ModuleInline(admin.TabularInline):
    model = Module
    extra = 1
    fields = ['title', 'order', 'description']
    show_change_link = True
    ordering = ['order']


class ContentItemInline(admin.TabularInline):
    model = ContentItem
    extra = 1
    fields = ['title', 'content_type', 'order', 'external_url', 'is_downloadable']
    show_change_link = True
    ordering = ['order']


# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'course_count']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    
    def course_count(self, obj):
        count = obj.courses.count()
        return format_html(
            '<span style="color: #28a745; font-weight: bold;">{} courses</span>',
            count
        )
    course_count.short_description = 'Total Courses'


# Course Admin with enhanced features
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'course_code', 'department_link', 'semester_link',
        'teacher_link', 'module_count', 'publish_status', 'created_at'
    ]
    list_filter = [
        'is_published', 'level', 'category', 'department', 'semester', 'created_at'
    ]
    search_fields = ['title', 'course_code', 'description', 'teacher__name', 'teacher__email']
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ['teacher', 'department', 'semester']
    readonly_fields = ['created_at', 'updated_at', 'get_module_count', 'get_enrollment_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'course_code', 'description')
        }),
        ('Academic Assignment', {
            'fields': ('department', 'semester', 'teacher'),
            'description': 'Assign course to department, semester, and teacher'
        }),
        ('Course Settings', {
            'fields': ('category', 'level', 'price', 'is_published'),
        }),
        ('Media', {
            'fields': ('thumbnail', 'thumbnail_url'),
            'classes': ('collapse',),
        }),
        ('Statistics', {
            'fields': ('get_module_count', 'get_enrollment_count', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    inlines = [ModuleInline]
    
    actions = ['publish_courses', 'unpublish_courses']
    
    def department_link(self, obj):
        if obj.department:
            url = reverse('admin:academics_department_change', args=[obj.department.id])
            return format_html('<a href="{}">{}</a>', url, obj.department.name)
        return '-'
    department_link.short_description = 'Department'
    
    def semester_link(self, obj):
        if obj.semester:
            url = reverse('admin:academics_semester_change', args=[obj.semester.id])
            return format_html('<a href="{}">{}</a>', url, obj.semester.name)
        return '-'
    semester_link.short_description = 'Semester'
    
    def teacher_link(self, obj):
        if obj.teacher:
            url = reverse('admin:authentication_user_change', args=[obj.teacher.id])
            return format_html('<a href="{}">{}</a>', url, obj.teacher.name)
        return '-'
    teacher_link.short_description = 'Teacher'
    
    def module_count(self, obj):
        count = obj.modules.count()
        if count > 0:
            return format_html(
                '<span style="background: #007bff; color: white; padding: 3px 8px; border-radius: 3px;">{} modules</span>',
                count
            )
        return format_html('<span style="color: #999;">No modules</span>')
    module_count.short_description = 'Modules'
    
    def publish_status(self, obj):
        if obj.is_published:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">✓ Published</span>'
            )
        return format_html(
            '<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 3px;">✗ Draft</span>'
        )
    publish_status.short_description = 'Status'
    
    def get_module_count(self, obj):
        return obj.modules.count()
    get_module_count.short_description = 'Total Modules'
    
    def get_enrollment_count(self, obj):
        return obj.enrollments.count()
    get_enrollment_count.short_description = 'Total Enrollments'
    
    def publish_courses(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} course(s) published successfully.')
    publish_courses.short_description = 'Publish selected courses'
    
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} course(s) unpublished successfully.')
    unpublish_courses.short_description = 'Unpublish selected courses'


# Module Admin with enhanced features
@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'course_link', 'order_badge', 'content_count',
        'completion_status', 'created_at'
    ]
    list_filter = ['course__department', 'course__semester', 'created_at']
    search_fields = ['title', 'description', 'course__title']
    autocomplete_fields = ['course']
    readonly_fields = ['created_at', 'get_content_count']
    ordering = ['course', 'order']
    
    fieldsets = (
        ('Module Information', {
            'fields': ('course', 'title', 'description', 'order')
        }),
        ('Statistics', {
            'fields': ('get_content_count', 'created_at'),
            'classes': ('collapse',),
        }),
    )
    
    inlines = [ContentItemInline]
    
    def course_link(self, obj):
        url = reverse('admin:courses_course_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course.title)
    course_link.short_description = 'Course'
    
    def order_badge(self, obj):
        return format_html(
            '<span style="background: #17a2b8; color: white; padding: 3px 10px; border-radius: 50%; font-weight: bold;">{}</span>',
            obj.order
        )
    order_badge.short_description = 'Order'
    
    def content_count(self, obj):
        count = obj.content_items.count()
        if count > 0:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">{} items</span>',
                count
            )
        return format_html('<span style="color: #999;">No content</span>')
    content_count.short_description = 'Content'
    
    def completion_status(self, obj):
        # Get completion stats
        total_students = ModuleProgress.objects.filter(module=obj).count()
        completed = ModuleProgress.objects.filter(module=obj, is_completed=True).count()
        
        if total_students > 0:
            percentage = (completed / total_students) * 100
            return format_html(
                '<span style="color: #007bff;">{}/{} ({:.0f}%)</span>',
                completed, total_students, percentage
            )
        return format_html('<span style="color: #999;">No data</span>')
    completion_status.short_description = 'Student Completion'
    
    def get_content_count(self, obj):
        return obj.content_items.count()
    get_content_count.short_description = 'Total Content Items'


# ContentItem Admin with enhanced features
@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'module_link', 'type_badge', 'order_badge',
        'file_info', 'uploaded_by_link', 'downloadable_badge', 'created_at'
    ]
    list_filter = [
        'content_type', 'is_downloadable', 'hls_status',
        'module__course__department', 'created_at'
    ]
    search_fields = ['title', 'description', 'module__title', 'module__course__title']
    autocomplete_fields = ['module', 'uploaded_by']
    readonly_fields = ['created_at', 'updated_at', 'hls_status', 'file_size', 'duration_seconds']
    ordering = ['module', 'order']
    
    fieldsets = (
        ('Content Information', {
            'fields': ('module', 'title', 'description', 'content_type', 'order')
        }),
        ('Video Content', {
            'fields': ('video_file', 'video_url', 'hls_playlist_url', 'hls_status', 'duration_seconds'),
            'classes': ('collapse',),
        }),
        ('File Content (PDF/Slides)', {
            'fields': ('file', 'file_size'),
            'classes': ('collapse',),
        }),
        ('Text Content', {
            'fields': ('content_text',),
            'classes': ('collapse',),
        }),
        ('External Link', {
            'fields': ('external_url',),
            'classes': ('collapse',),
        }),
        ('Settings', {
            'fields': ('is_downloadable', 'uploaded_by', 'created_at', 'updated_at'),
        }),
    )
    
    def module_link(self, obj):
        url = reverse('admin:courses_module_change', args=[obj.module.id])
        return format_html(
            '<a href="{}">{} ({})</a>',
            url, obj.module.title, obj.module.course.title
        )
    module_link.short_description = 'Module'
    
    def type_badge(self, obj):
        colors = {
            'video': '#dc3545',
            'pdf': '#fd7e14',
            'slide': '#ffc107',
            'text': '#28a745',
            'link': '#17a2b8',
        }
        icons = {
            'video': '🎥',
            'pdf': '📄',
            'slide': '📊',
            'text': '📝',
            'link': '🔗',
        }
        color = colors.get(obj.content_type, '#6c757d')
        icon = icons.get(obj.content_type, '📄')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{} {}</span>',
            color, icon, obj.get_content_type_display()
        )
    type_badge.short_description = 'Type'
    
    def order_badge(self, obj):
        return format_html(
            '<span style="background: #6c757d; color: white; padding: 3px 10px; border-radius: 50%; font-weight: bold;">{}</span>',
            obj.order
        )
    order_badge.short_description = 'Order'
    
    def file_info(self, obj):
        if obj.file:
            size = obj.file_size or 0
            size_mb = size / (1024 * 1024) if size else 0
            return format_html(
                '<span style="color: #007bff;">{:.2f} MB</span>',
                size_mb
            )
        elif obj.external_url:
            return format_html('<span style="color: #28a745;">External</span>')
        return '-'
    file_info.short_description = 'File Size'
    
    def uploaded_by_link(self, obj):
        if obj.uploaded_by:
            url = reverse('admin:authentication_user_change', args=[obj.uploaded_by.id])
            return format_html('<a href="{}">{}</a>', url, obj.uploaded_by.name)
        return '-'
    uploaded_by_link.short_description = 'Uploaded By'
    
    def downloadable_badge(self, obj):
        if obj.is_downloadable:
            return format_html('<span style="color: #28a745;">✓</span>')
        return format_html('<span style="color: #dc3545;">✗</span>')
    downloadable_badge.short_description = 'Downloadable'


# Enrollment Admin
@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student_link', 'course_link', 'status_badge', 'progress_bar', 'enrolled_at']
    list_filter = ['status', 'course__department', 'enrolled_at']
    search_fields = ['student__name', 'student__email', 'course__title']
    autocomplete_fields = ['student', 'course']
    readonly_fields = ['enrolled_at']
    
    def student_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.student.id])
        return format_html('<a href="{}">{}</a>', url, obj.student.name)
    student_link.short_description = 'Student'
    
    def course_link(self, obj):
        url = reverse('admin:courses_course_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course.title)
    course_link.short_description = 'Course'
    
    def status_badge(self, obj):
        colors = {
            'active': '#28a745',
            'completed': '#007bff',
            'dropped': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def progress_bar(self, obj):
        progress = obj.progress or 0
        color = '#28a745' if progress >= 75 else '#ffc107' if progress >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 100px; background: #e9ecef; border-radius: 3px; overflow: hidden;">'
            '<div style="width: {}%; background: {}; color: white; text-align: center; padding: 2px; font-size: 11px;">{:.0f}%</div>'
            '</div>',
            progress, color, progress
        )
    progress_bar.short_description = 'Progress'


# Progress Tracking Admin
@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ['user_link', 'course_link', 'progress_bar', 'completed_modules_info', 'last_accessed']
    list_filter = ['course__department', 'last_accessed']
    search_fields = ['user__name', 'user__email', 'course__title']
    autocomplete_fields = ['user', 'course']
    readonly_fields = ['completed_modules', 'total_modules', 'completion_percentage', 'last_accessed']
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'Student'
    
    def course_link(self, obj):
        url = reverse('admin:courses_course_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course.title)
    course_link.short_description = 'Course'
    
    def progress_bar(self, obj):
        progress = obj.completion_percentage or 0
        color = '#28a745' if progress >= 75 else '#ffc107' if progress >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 150px; background: #e9ecef; border-radius: 3px; overflow: hidden;">'
            '<div style="width: {}%; background: {}; color: white; text-align: center; padding: 3px; font-size: 12px; font-weight: bold;">{:.0f}%</div>'
            '</div>',
            progress, color, progress
        )
    progress_bar.short_description = 'Progress'
    
    def completed_modules_info(self, obj):
        return format_html(
            '<span style="color: #007bff; font-weight: bold;">{}/{}</span>',
            obj.completed_modules, obj.total_modules
        )
    completed_modules_info.short_description = 'Modules Completed'


@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ['user_link', 'module_link', 'completion_badge', 'completed_at']
    list_filter = ['is_completed', 'module__course__department', 'completed_at']
    search_fields = ['user__name', 'module__title', 'module__course__title']
    autocomplete_fields = ['user', 'module']
    readonly_fields = ['completed_at']
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'Student'
    
    def module_link(self, obj):
        url = reverse('admin:courses_module_change', args=[obj.module.id])
        return format_html('<a href="{}">{}</a>', url, obj.module.title)
    module_link.short_description = 'Module'
    
    def completion_badge(self, obj):
        if obj.is_completed:
            return format_html('<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">✓ Completed</span>')
        return format_html('<span style="background: #ffc107; color: white; padding: 3px 8px; border-radius: 3px;">⏳ In Progress</span>')
    completion_badge.short_description = 'Status'


@admin.register(ContentProgress)
class ContentProgressAdmin(admin.ModelAdmin):
    list_display = ['user_link', 'content_link', 'viewed_badge', 'watch_duration_display', 'last_viewed_at']
    list_filter = ['is_viewed', 'content_item__content_type', 'last_viewed_at']
    search_fields = ['user__name', 'content_item__title']
    autocomplete_fields = ['user', 'content_item']
    readonly_fields = ['first_viewed_at', 'last_viewed_at']
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'Student'
    
    def content_link(self, obj):
        url = reverse('admin:courses_contentitem_change', args=[obj.content_item.id])
        return format_html('<a href="{}">{}</a>', url, obj.content_item.title)
    content_link.short_description = 'Content'
    
    def viewed_badge(self, obj):
        if obj.is_viewed:
            return format_html('<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">✓ Viewed</span>')
        return format_html('<span style="background: #6c757d; color: white; padding: 3px 8px; border-radius: 3px;">Not Viewed</span>')
    viewed_badge.short_description = 'Status'
    
    def watch_duration_display(self, obj):
        if obj.watch_duration_seconds:
            minutes = obj.watch_duration_seconds // 60
            seconds = obj.watch_duration_seconds % 60
            return format_html(
                '<span style="color: #007bff;">{:02d}:{:02d}</span>',
                minutes, seconds
            )
        return '-'
    watch_duration_display.short_description = 'Duration Watched'

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Department, Semester, Comment, Bookmark, ProgressTracking, CourseAnalytics


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name_with_icon', 'code_badge', 'semester_count_display', 'course_count_display', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'code', 'description')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'get_semester_list', 'get_course_list')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'code', 'description')
        }),
        ('Related Data', {
            'fields': ('get_semester_list', 'get_course_list'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def name_with_icon(self, obj):
        return format_html(
            '<strong style="color: #007bff;">🏛️ {}</strong>',
            obj.name
        )
    name_with_icon.short_description = 'Department Name'
    
    def code_badge(self, obj):
        return format_html(
            '<span style="background: #6c757d; color: white; padding: 3px 10px; border-radius: 3px; font-family: monospace;">{}</span>',
            obj.code.upper()
        )
    code_badge.short_description = 'Code'
    
    def semester_count_display(self, obj):
        count = obj.semester_count()
        url = reverse('admin:academics_semester_changelist') + f'?department__id__exact={obj.id}'
        return format_html(
            '<a href="{}" style="color: #28a745; font-weight: bold;">📅 {} semesters</a>',
            url, count
        )
    semester_count_display.short_description = 'Semesters'
    
    def course_count_display(self, obj):
        count = obj.course_count()
        url = reverse('admin:courses_course_changelist') + f'?department__id__exact={obj.id}'
        return format_html(
            '<a href="{}" style="color: #007bff; font-weight: bold;">📚 {} courses</a>',
            url, count
        )
    course_count_display.short_description = 'Courses'
    
    def get_semester_list(self, obj):
        semesters = obj.semesters.all()
        if not semesters:
            return format_html('<p style="color: #999;">No semesters yet</p>')
        
        html = '<ul style="margin: 0; padding-left: 20px;">'
        for sem in semesters:
            url = reverse('admin:academics_semester_change', args=[sem.id])
            html += f'<li><a href="{url}">{sem.name} ({sem.type})</a> - {sem.course_count()} courses</li>'
        html += '</ul>'
        return format_html(html)
    get_semester_list.short_description = 'Semesters in Department'
    
    def get_course_list(self, obj):
        courses = obj.courses.all()[:10]
        if not courses:
            return format_html('<p style="color: #999;">No courses yet</p>')
        
        html = '<ul style="margin: 0; padding-left: 20px;">'
        for course in courses:
            url = reverse('admin:courses_course_change', args=[course.id])
            status = '✅' if course.is_published else '⏸️'
            html += f'<li>{status} <a href="{url}">{course.title}</a> ({course.course_code})</li>'
        html += '</ul>'
        if obj.courses.count() > 10:
            html += f'<p style="color: #999; font-style: italic;">...and {obj.courses.count() - 10} more</p>'
        return format_html(html)
    get_course_list.short_description = 'Courses in Department'


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name_with_icon', 'department_link', 'type_badge', 'order_badge', 'date_range', 'course_count_display')
    list_filter = ('type', 'department', 'created_at')
    search_fields = ('name', 'department__name', 'description')
    autocomplete_fields = ['department']
    readonly_fields = ('id', 'created_at', 'updated_at', 'get_course_list')
    ordering = ('department', 'order')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'department', 'type', 'order')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date'),
            'description': 'Set the start and end dates for this semester'
        }),
        ('Details', {
            'fields': ('description',),
            'classes': ('collapse',),
        }),
        ('Related Courses', {
            'fields': ('get_course_list',),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def name_with_icon(self, obj):
        icon = '📅' if obj.type == 'semester' else '⏱️'
        return format_html(
            '<strong style="color: #007bff;">{} {}</strong>',
            icon, obj.name
        )
    name_with_icon.short_description = 'Semester Name'
    
    def department_link(self, obj):
        url = reverse('admin:academics_department_change', args=[obj.department.id])
        return format_html('<a href="{}">{}</a>', url, obj.department.name)
    department_link.short_description = 'Department'
    
    def type_badge(self, obj):
        color = '#17a2b8' if obj.type == 'semester' else '#fd7e14'
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_type_display()
        )
    type_badge.short_description = 'Type'
    
    def order_badge(self, obj):
        return format_html(
            '<span style="background: #6c757d; color: white; padding: 3px 10px; border-radius: 50%; font-weight: bold;">{}</span>',
            obj.order
        )
    order_badge.short_description = 'Order'
    
    def date_range(self, obj):
        if obj.start_date and obj.end_date:
            return format_html(
                '<span style="color: #28a745;">{} → {}</span>',
                obj.start_date.strftime('%b %d, %Y'),
                obj.end_date.strftime('%b %d, %Y')
            )
        return format_html('<span style="color: #999;">Not set</span>')
    date_range.short_description = 'Duration'
    
    def course_count_display(self, obj):
        count = obj.course_count()
        if count > 0:
            url = reverse('admin:courses_course_changelist') + f'?semester__id__exact={obj.id}'
            return format_html(
                '<a href="{}" style="color: #007bff; font-weight: bold;">📚 {} courses</a>',
                url, count
            )
        return format_html('<span style="color: #999;">No courses</span>')
    course_count_display.short_description = 'Courses'
    
    def get_course_list(self, obj):
        courses = obj.courses.all()
        if not courses:
            return format_html('<p style="color: #999;">No courses in this semester yet</p>')
        
        html = '<ul style="margin: 0; padding-left: 20px;">'
        for course in courses:
            url = reverse('admin:courses_course_change', args=[course.id])
            status = '✅' if course.is_published else '⏸️'
            modules = course.modules.count()
            html += f'<li>{status} <a href="{url}">{course.title}</a> ({course.course_code}) - {modules} modules</li>'
        html += '</ul>'
        return format_html(html)
    get_course_list.short_description = 'Courses in Semester'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'lecture_link', 'content_preview', 'upvotes_badge', 'status_badges', 'created_at')
    list_filter = ('pinned', 'is_resolved', 'created_at')
    search_fields = ('user__name', 'lecture__title', 'content')
    autocomplete_fields = ['user', 'lecture', 'parent']
    readonly_fields = ('id', 'created_at', 'updated_at', 'upvotes')
    
    fieldsets = (
        ('Content', {
            'fields': ('user', 'lecture', 'parent', 'content')
        }),
        ('Moderation', {
            'fields': ('upvotes', 'pinned', 'is_resolved')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'User'
    
    def lecture_link(self, obj):
        if obj.lecture:
            return format_html('<a href="#">{}</a>', obj.lecture.title)
        return '-'
    lecture_link.short_description = 'Lecture'
    
    def content_preview(self, obj):
        preview = obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
        return format_html('<span style="color: #495057;">{}</span>', preview)
    content_preview.short_description = 'Comment'
    
    def upvotes_badge(self, obj):
        color = '#28a745' if obj.upvotes > 10 else '#007bff' if obj.upvotes > 0 else '#6c757d'
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">👍 {}</span>',
            color, obj.upvotes
        )
    upvotes_badge.short_description = 'Upvotes'
    
    def status_badges(self, obj):
        badges = []
        if obj.pinned:
            badges.append('<span style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 11px;">📌 Pinned</span>')
        if obj.is_resolved:
            badges.append('<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✓ Resolved</span>')
        return format_html(' '.join(badges)) if badges else '-'
    status_badges.short_description = 'Status'


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'lecture_link', 'material_link', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'lecture__title', 'material__title')
    autocomplete_fields = ['user', 'lecture', 'material']
    readonly_fields = ('id', 'created_at')
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'User'
    
    def lecture_link(self, obj):
        if obj.lecture:
            return format_html('🎥 {}', obj.lecture.title)
        return '-'
    lecture_link.short_description = 'Lecture'
    
    def material_link(self, obj):
        if obj.material:
            return format_html('📄 {}', obj.material.title)
        return '-'
    material_link.short_description = 'Material'


@admin.register(ProgressTracking)
class ProgressTrackingAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'lecture_link', 'material_link', 'action_badge', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__name', 'lecture__title', 'material__title')
    autocomplete_fields = ['user', 'lecture', 'material']
    readonly_fields = ('id', 'created_at')
    
    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'User'
    
    def lecture_link(self, obj):
        if obj.lecture:
            return format_html('{}', obj.lecture.title)
        return '-'
    lecture_link.short_description = 'Lecture'
    
    def material_link(self, obj):
        if obj.material:
            return format_html('{}', obj.material.title)
        return '-'
    material_link.short_description = 'Material'
    
    def action_badge(self, obj):
        colors = {
            'started': '#17a2b8',
            'completed': '#28a745',
            'downloaded': '#007bff',
        }
        color = colors.get(obj.action, '#6c757d')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = 'Action'


@admin.register(CourseAnalytics)
class CourseAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('course_link', 'enrollments_badge', 'lectures_watched_badge', 'engagement_badge', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('course__title',)
    autocomplete_fields = ['course']
    readonly_fields = ('id', 'last_updated', 'engagement_score')
    
    def course_link(self, obj):
        url = reverse('admin:courses_course_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course.title)
    course_link.short_description = 'Course'
    
    def enrollments_badge(self, obj):
        return format_html(
            '<span style="background: #007bff; color: white; padding: 3px 8px; border-radius: 3px;">{} students</span>',
            obj.total_enrollments
        )
    enrollments_badge.short_description = 'Enrollments'
    
    def lectures_watched_badge(self, obj):
        return format_html(
            '<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">👁️ {}</span>',
            obj.total_lectures_watched
        )
    lectures_watched_badge.short_description = 'Views'
    
    def engagement_badge(self, obj):
        score = obj.engagement_score or 0
        color = '#28a745' if score >= 75 else '#ffc107' if score >= 50 else '#dc3545'
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{:.0f}%</span>',
            color, score
        )
    engagement_badge.short_description = 'Engagement'

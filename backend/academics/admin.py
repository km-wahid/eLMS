from django.contrib import admin
from .models import Department, Semester, Comment, Bookmark, ProgressTracking, CourseAnalytics


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'semester_count', 'course_count', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'code')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'type', 'order', 'course_count', 'created_at')
    list_filter = ('type', 'department', 'created_at')
    search_fields = ('name', 'department__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('department', 'order')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'lecture', 'upvotes', 'pinned', 'is_resolved', 'created_at')
    list_filter = ('pinned', 'is_resolved', 'created_at')
    search_fields = ('user__name', 'lecture__title', 'content')
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


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'lecture', 'material', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'lecture__title', 'material__title')
    readonly_fields = ('id', 'created_at')


@admin.register(ProgressTracking)
class ProgressTrackingAdmin(admin.ModelAdmin):
    list_display = ('user', 'lecture', 'material', 'action', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__name', 'lecture__title', 'material__title')
    readonly_fields = ('id', 'created_at')


@admin.register(CourseAnalytics)
class CourseAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('course', 'total_enrollments', 'total_lectures_watched', 'engagement_score', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('course__title',)
    readonly_fields = ('id', 'last_updated', 'engagement_score')

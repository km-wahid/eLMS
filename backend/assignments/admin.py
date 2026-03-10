from django.contrib import admin
from .models import Assignment, Submission


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display   = ['title', 'course', 'module', 'due_date', 'max_score',
                      'is_published', 'submission_count', 'created_at']
    list_filter    = ['is_published', 'course']
    search_fields  = ['title', 'course__title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields  = ['course', 'module']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display   = ['student', 'assignment', 'status', 'score', 'submitted_at', 'graded_at']
    list_filter    = ['status', 'assignment__course']
    search_fields  = ['student__email', 'assignment__title']
    readonly_fields = ['id', 'submitted_at', 'graded_at']
    raw_id_fields  = ['assignment', 'student']

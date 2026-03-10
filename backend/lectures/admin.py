from django.contrib import admin
from .models import Lecture


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'order', 'hls_status', 'is_published', 'duration_display', 'created_at']
    list_filter = ['hls_status', 'is_published', 'module__course']
    search_fields = ['title', 'module__title', 'module__course__title']
    readonly_fields = ['id', 'hls_status', 'hls_playlist_url', 'duration_seconds', 'created_at', 'updated_at']
    raw_id_fields = ['module']
    ordering = ['module__course', 'module__order', 'order']

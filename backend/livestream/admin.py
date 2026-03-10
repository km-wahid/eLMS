from django.contrib import admin
from .models import LiveSession


@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display  = ['title', 'course', 'host', 'platform', 'scheduled_at',
                     'duration_minutes', 'status', 'created_at']
    list_filter   = ['status', 'platform', 'course']
    search_fields = ['title', 'course__title', 'host__email']
    readonly_fields = ['id', 'started_at', 'ended_at', 'created_at', 'updated_at']
    raw_id_fields = ['course', 'host']
    ordering      = ['-scheduled_at']

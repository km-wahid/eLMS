from django.contrib import admin
from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display  = ['title', 'course', 'file_type', 'file_size_display', 'is_downloadable', 'uploaded_by', 'created_at']
    list_filter   = ['file_type', 'is_downloadable', 'course']
    search_fields = ['title', 'course__title', 'uploaded_by__email']
    readonly_fields = ['id', 'file_size', 'created_at']
    raw_id_fields = ['course', 'module', 'lecture', 'uploaded_by']

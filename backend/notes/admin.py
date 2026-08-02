from django.contrib import admin
from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__name', 'user__email', 'module__title', 'content']
    readonly_fields = ['id', 'created_at', 'updated_at']

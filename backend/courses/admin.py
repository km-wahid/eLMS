from django.contrib import admin
from .models import Category, Course, Module, Enrollment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'category', 'level', 'is_published', 'created_at']
    list_filter = ['is_published', 'level', 'category']
    search_fields = ['title', 'teacher__name']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['teacher']


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_filter = ['course']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'progress', 'enrolled_at']
    list_filter = ['status']
    raw_id_fields = ['student', 'course']

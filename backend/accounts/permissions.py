from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ('admin', 'superuser') or request.user.is_superuser
        )


class IsSuperuser(BasePermission):
    """Only superusers can access - highest level permission"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'superuser' or request.user.is_superuser
        )


class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ('teacher', 'admin', 'superuser') or request.user.is_superuser
        )


class IsStudentOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('student', 'teacher')

from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    # ══════════════════════════════════════════════════════════════════════════
    # ANALYTICS & DASHBOARD
    # ══════════════════════════════════════════════════════════════════════════
    path('analytics/', admin_views.cms_analytics_dashboard, name='cms-analytics'),
    path('stats/', views.cms_stats, name='cms-stats'),  # Legacy endpoint

    # ══════════════════════════════════════════════════════════════════════════
    # DEPARTMENTS
    # ══════════════════════════════════════════════════════════════════════════
    path('departments/', admin_views.cms_department_list, name='cms-departments'),
    path('departments/create/', admin_views.cms_department_create, name='cms-department-create'),
    path('departments/<uuid:pk>/', admin_views.cms_department_detail, name='cms-department-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # SEMESTERS
    # ══════════════════════════════════════════════════════════════════════════
    path('semesters/', admin_views.cms_semester_list, name='cms-semesters'),
    path('semesters/create/', admin_views.cms_semester_create, name='cms-semester-create'),
    path('semesters/<uuid:pk>/', admin_views.cms_semester_detail, name='cms-semester-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # USERS
    # ══════════════════════════════════════════════════════════════════════════
    path('users/', views.CMSUserListCreate.as_view(), name='cms-users'),
    path('users/<int:pk>/', views.CMSUserDetail.as_view(), name='cms-user-detail'),
    path('teachers/', views.CMSTeacherList.as_view(), name='cms-teachers'),

    # ══════════════════════════════════════════════════════════════════════════
    # CATEGORIES
    # ══════════════════════════════════════════════════════════════════════════
    path('categories/', views.CMSCategoryListCreate.as_view(), name='cms-categories'),
    path('categories/<int:pk>/', views.CMSCategoryDetail.as_view(), name='cms-category-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # COURSES
    # ══════════════════════════════════════════════════════════════════════════
    path('courses/', views.CMSCourseList.as_view(), name='cms-courses'),
    path('courses/create/', views.CMSCourseCreate.as_view(), name='cms-course-create'),
    path('courses/<slug:slug>/', views.CMSCourseDetail.as_view(), name='cms-course-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # MODULES (nested under course)
    # ══════════════════════════════════════════════════════════════════════════
    path('courses/<slug:slug>/modules/', views.CMSModuleListCreate.as_view(), name='cms-modules'),
    path('courses/<slug:slug>/modules/<uuid:module_pk>/', views.CMSModuleDetail.as_view(), name='cms-module-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # LECTURES (nested under module)
    # ══════════════════════════════════════════════════════════════════════════
    path('modules/<uuid:module_pk>/lectures/', views.CMSLectureListCreate.as_view(), name='cms-lectures'),
    path('modules/<uuid:module_pk>/lectures/<uuid:lecture_pk>/', views.CMSLectureDetail.as_view(), name='cms-lecture-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # CONTENT ITEMS
    # ══════════════════════════════════════════════════════════════════════════
    path('content/', admin_views.cms_content_list, name='cms-content-list'),
    path('content/create/', admin_views.cms_content_create, name='cms-content-create'),
    path('content/<uuid:pk>/', admin_views.cms_content_detail, name='cms-content-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # MATERIALS / RESOURCES
    # ══════════════════════════════════════════════════════════════════════════
    path('materials/', views.CMSMaterialListCreate.as_view(), name='cms-materials'),
    path('materials/<uuid:pk>/', views.CMSMaterialDetail.as_view(), name='cms-material-detail'),

    # ══════════════════════════════════════════════════════════════════════════
    # ENROLLMENTS
    # ══════════════════════════════════════════════════════════════════════════
    path('enrollments/', admin_views.cms_enrollment_list, name='cms-enrollments'),
    path('enrollments/create/', admin_views.cms_enrollment_create, name='cms-enrollment-create'),
    path('enrollments/<uuid:pk>/', admin_views.cms_enrollment_delete, name='cms-enrollment-delete'),

    # ══════════════════════════════════════════════════════════════════════════
    # PROGRESS TRACKING
    # ══════════════════════════════════════════════════════════════════════════
    path('progress/overview/', admin_views.cms_progress_overview, name='cms-progress-overview'),
    path('progress/courses/', admin_views.cms_course_progress_list, name='cms-course-progress'),

    # ══════════════════════════════════════════════════════════════════════════
    # BULK ACTIONS
    # ══════════════════════════════════════════════════════════════════════════
    path('bulk/publish/', admin_views.cms_bulk_publish_courses, name='cms-bulk-publish'),
    path('bulk/unpublish/', admin_views.cms_bulk_unpublish_courses, name='cms-bulk-unpublish'),
    path('bulk/delete/', admin_views.cms_bulk_delete_courses, name='cms-bulk-delete'),
]

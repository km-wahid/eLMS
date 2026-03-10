from django.urls import path
from . import views

urlpatterns = [
    # Stats
    path('stats/',   views.cms_stats, name='cms-stats'),

    # Users
    path('users/',           views.CMSUserListCreate.as_view(), name='cms-users'),
    path('users/<int:pk>/',  views.CMSUserDetail.as_view(),     name='cms-user-detail'),

    # Teachers dropdown
    path('teachers/', views.CMSTeacherList.as_view(), name='cms-teachers'),

    # Categories
    path('categories/',        views.CMSCategoryListCreate.as_view(), name='cms-categories'),
    path('categories/<int:pk>/', views.CMSCategoryDetail.as_view(),   name='cms-category-detail'),

    # Courses
    path('courses/',              views.CMSCourseList.as_view(),   name='cms-courses'),
    path('courses/create/',       views.CMSCourseCreate.as_view(), name='cms-course-create'),
    path('courses/<slug:slug>/',  views.CMSCourseDetail.as_view(), name='cms-course-detail'),

    # Modules (nested under course)
    path('courses/<slug:slug>/modules/',              views.CMSModuleListCreate.as_view(), name='cms-modules'),
    path('courses/<slug:slug>/modules/<uuid:module_pk>/', views.CMSModuleDetail.as_view(), name='cms-module-detail'),

    # Lectures (nested under module)
    path('modules/<uuid:module_pk>/lectures/',                    views.CMSLectureListCreate.as_view(), name='cms-lectures'),
    path('modules/<uuid:module_pk>/lectures/<uuid:lecture_pk>/',  views.CMSLectureDetail.as_view(),     name='cms-lecture-detail'),

    # Materials / Resources
    path('materials/',        views.CMSMaterialListCreate.as_view(), name='cms-materials'),
    path('materials/<uuid:pk>/', views.CMSMaterialDetail.as_view(),  name='cms-material-detail'),
]

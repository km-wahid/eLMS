from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .content_views import ContentItemViewSet

# Router for content items
router = DefaultRouter()
router.register(r'content', ContentItemViewSet, basename='content-item')

urlpatterns = [
    # Content Items (new unified model)
    path('', include(router.urls)),
    
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Courses — public
    path('courses/', views.CourseListView.as_view(), name='course-list'),
    path('courses/mine/', views.TeacherCourseListView.as_view(), name='teacher-course-list'),
    path('courses/create/', views.CourseCreateView.as_view(), name='course-create'),
    path('courses/<slug:slug>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<slug:slug>/update/', views.CourseUpdateView.as_view(), name='course-update'),
    path('courses/<slug:slug>/delete/', views.CourseDeleteView.as_view(), name='course-delete'),

    # Modules
    path('courses/<slug:course_slug>/modules/', views.ModuleListCreateView.as_view(), name='module-list-create'),
    path('courses/<slug:course_slug>/modules/<uuid:pk>/', views.ModuleDetailView.as_view(), name='module-detail'),

    # Enrollment
    path('courses/<slug:course_slug>/enroll/', views.EnrollView.as_view(), name='enroll'),
    path('enrollments/mine/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
    
    # Progress Tracking (Student Learning Flow)
    path('courses/<slug:slug>/student/', views.CourseDetailStudentView.as_view(), name='course-student-view'),
    path('courses/<slug:course_slug>/progress/', views.CourseProgressView.as_view(), name='course-progress'),
    path('courses/<slug:course_slug>/progress/module/<uuid:module_id>/', views.TrackModuleProgressView.as_view(), name='track-module'),
    path('courses/<slug:course_slug>/progress/content/<uuid:content_id>/', views.TrackContentProgressView.as_view(), name='track-content'),
    path('progress/my-courses/', views.MyCoursesWithProgressView.as_view(), name='my-courses-progress'),
    
    # Content Items
    path('content/<uuid:pk>/', views.ContentItemDetailView.as_view(), name='content-detail'),
    path('content/<uuid:pk>/download/', views.ContentItemDownloadView.as_view(), name='content-download'),
]

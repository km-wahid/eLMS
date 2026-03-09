from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Courses — public
    path('', views.CourseListView.as_view(), name='course-list'),
    path('mine/', views.TeacherCourseListView.as_view(), name='teacher-course-list'),
    path('create/', views.CourseCreateView.as_view(), name='course-create'),
    path('<slug:slug>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('<slug:slug>/update/', views.CourseUpdateView.as_view(), name='course-update'),
    path('<slug:slug>/delete/', views.CourseDeleteView.as_view(), name='course-delete'),

    # Modules
    path('<slug:course_slug>/modules/', views.ModuleListCreateView.as_view(), name='module-list-create'),
    path('<slug:course_slug>/modules/<uuid:pk>/', views.ModuleDetailView.as_view(), name='module-detail'),

    # Enrollment
    path('<slug:course_slug>/enroll/', views.EnrollView.as_view(), name='enroll'),
    path('enrollments/mine/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
]

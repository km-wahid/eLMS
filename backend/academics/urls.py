from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    SemesterViewSet,
    CommentViewSet,
    BookmarkViewSet,
    ProgressTrackingViewSet,
    CourseAnalyticsViewSet,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'semesters', SemesterViewSet, basename='semester')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'progress', ProgressTrackingViewSet, basename='progress')
router.register(r'analytics', CourseAnalyticsViewSet, basename='analytics')

app_name = 'academics'

urlpatterns = [
    path('', include(router.urls)),
]

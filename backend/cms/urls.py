from django.urls import path
from . import views

urlpatterns = [
    path('stats/',            views.cms_stats,              name='cms-stats'),
    path('users/',            views.CMSUserListCreate.as_view(), name='cms-users'),
    path('users/<int:pk>/',   views.CMSUserDetail.as_view(),    name='cms-user-detail'),
    path('courses/',          views.CMSCourseList.as_view(),     name='cms-courses'),
    path('courses/<slug:slug>/', views.CMSCourseDetail.as_view(), name='cms-course-detail'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('<slug:slug>/materials/',       views.CourseMaterialListCreateView.as_view(), name='course-materials'),
    path('<slug:slug>/materials/<uuid:pk>/', views.MaterialDetailView.as_view(),       name='material-detail'),
]

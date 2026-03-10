from django.urls import path
from . import views

urlpatterns = [
    # All lectures across course (for the learning view)
    path(
        '<slug:slug>/lectures/',
        views.CourseLectureListView.as_view(),
        name='course-lectures',
    ),
    # Module-scoped CRUD
    path(
        '<slug:slug>/modules/<uuid:module_id>/lectures/',
        views.ModuleLectureListCreateView.as_view(),
        name='module-lectures',
    ),
    path(
        '<slug:slug>/modules/<uuid:module_id>/lectures/<uuid:lecture_id>/',
        views.LectureDetailView.as_view(),
        name='lecture-detail',
    ),
]

from django.urls import path
from . import views

urlpatterns = [
    # Assignment CRUD
    path('<slug:slug>/assignments/',
         views.AssignmentListCreateView.as_view(), name='assignment-list-create'),
    path('<slug:slug>/assignments/<uuid:pk>/',
         views.AssignmentDetailView.as_view(), name='assignment-detail'),

    # Submissions
    path('<slug:slug>/assignments/<uuid:pk>/submissions/',
         views.SubmissionListView.as_view(), name='submission-list'),        # teacher
    path('<slug:slug>/assignments/<uuid:pk>/submit/',
         views.SubmitAssignmentView.as_view(), name='submit-assignment'),    # student
    path('<slug:slug>/assignments/<uuid:pk>/my-submission/',
         views.MySubmissionView.as_view(), name='my-submission'),            # student
    path('<slug:slug>/assignments/<uuid:pk>/submissions/<uuid:sub_pk>/grade/',
         views.GradeSubmissionView.as_view(), name='grade-submission'),      # teacher

    # Student: all my submissions for this course
    path('<slug:slug>/my-submissions/',
         views.MyAssignmentsView.as_view(), name='my-assignments'),
]

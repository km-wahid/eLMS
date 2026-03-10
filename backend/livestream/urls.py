from django.urls import path
from . import views

urlpatterns = [
    # Per-course sessions
    path('<slug:slug>/sessions/',
         views.LiveSessionListCreateView.as_view(), name='session-list-create'),
    path('<slug:slug>/sessions/<uuid:pk>/',
         views.LiveSessionDetailView.as_view(), name='session-detail'),

    # Status transitions
    path('<slug:slug>/sessions/<uuid:pk>/go-live/',
         views.go_live, name='go-live'),
    path('<slug:slug>/sessions/<uuid:pk>/end/',
         views.end_session, name='end-session'),

    # Cross-course upcoming sessions (student dashboard)
    path('upcoming/',
         views.UpcomingSessionsView.as_view(), name='upcoming-sessions'),
]

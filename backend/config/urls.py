from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── API apps ──────────────────────────────────────────
    path('api/auth/',          include('accounts.urls')),
    path('api/courses/',       include('courses.urls')),
    path('api/lectures/',      include('lectures.urls')),
    path('api/materials/',     include('materials.urls')),
    path('api/assignments/',   include('assignments.urls')),
    path('api/livestream/',    include('livestream.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/cms/',           include('cms.urls')),

    # ── API Schema & Docs ─────────────────────────────────
    path('api/schema/',        SpectacularAPIView.as_view(),        name='schema'),
    path('api/docs/',          SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/',         SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

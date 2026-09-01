from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

# Use local filesystem storage in development (no DO Spaces needed)
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Allow all CORS origins in dev
CORS_ALLOW_ALL_ORIGINS = True

# Print emails to console in dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# SQLite for zero-dependency local development
if config('USE_SQLITE', default=True, cast=bool):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# InMemoryChannelLayer if Redis is not running
if config('USE_IN_MEMORY_CHANNEL_LAYER', default=True, cast=bool):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }


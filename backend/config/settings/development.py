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

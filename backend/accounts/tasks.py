from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_welcome_email(user_email, user_name):
    """Send a welcome email after registration."""
    send_mail(
        subject="Welcome to eLMS!",
        message=f"""Hi {user_name},

Welcome to eLMS! We're excited to have you on board.

Start exploring courses at {settings.FRONTEND_URL}/courses

Happy learning!
The eLMS Team
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=True,
    )

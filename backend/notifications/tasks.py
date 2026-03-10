from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_notification_email(self, recipient_email, subject, message):
    """Send an email notification asynchronously."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def send_bulk_notification_emails(notifications_data):
    """
    Send multiple notification emails in one task.
    notifications_data: list of {email, subject, message}
    """
    for item in notifications_data:
        send_notification_email.delay(item['email'], item['subject'], item['message'])

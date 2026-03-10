from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_enrollment_confirmation(student_email, student_name, course_title, course_slug):
    """Send enrollment confirmation email."""
    send_mail(
        subject=f"Enrolled: {course_title}",
        message=f"""Hi {student_name},

You have successfully enrolled in "{course_title}".

Start learning at {settings.FRONTEND_URL}/courses/{course_slug}

Good luck!
The eLMS Team
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student_email],
        fail_silently=True,
    )


@shared_task
def send_assignment_due_reminder(student_email, student_name, assignment_title, course_title, due_date):
    """Send reminder email for upcoming assignment due dates."""
    send_mail(
        subject=f"Reminder: {assignment_title} due soon",
        message=f"""Hi {student_name},

This is a reminder that the assignment "{assignment_title}" in "{course_title}" is due on {due_date}.

Don't forget to submit your work!
The eLMS Team
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student_email],
        fail_silently=True,
    )

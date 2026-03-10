"""
Auto-create notifications when key events happen.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from notifications.models import Notification


# ── Enrollment ─────────────────────────────────────────────
def _handle_enrollment(sender, instance, created, **kwargs):
    if not created:
        return
    # Notify the student
    Notification.create_and_push(
        recipient=instance.student,
        type=Notification.Type.ENROLLMENT,
        title=f"Enrolled: {instance.course.title}",
        message=f"You have successfully enrolled in '{instance.course.title}'.",
        data={"course_slug": instance.course.slug},
    )
    # Notify the course teacher
    Notification.create_and_push(
        recipient=instance.course.instructor,
        type=Notification.Type.ENROLLMENT,
        title="New Enrollment",
        message=f"{instance.student.get_full_name() or instance.student.email} enrolled in '{instance.course.title}'.",
        data={"course_slug": instance.course.slug},
    )


# ── Assignment Submission ──────────────────────────────────
def _handle_submission(sender, instance, created, **kwargs):
    if not created:
        return
    teacher = instance.assignment.course.instructor
    Notification.create_and_push(
        recipient=teacher,
        type=Notification.Type.SUBMISSION_NEW,
        title="New Submission",
        message=f"{instance.student.get_full_name() or instance.student.email} submitted '{instance.assignment.title}'.",
        data={"assignment_id": str(instance.assignment.id)},
    )


# ── Assignment Graded ──────────────────────────────────────
def _handle_graded(sender, instance, created, **kwargs):
    if instance.status == 'graded' and instance.score is not None:
        Notification.create_and_push(
            recipient=instance.student,
            type=Notification.Type.ASSIGNMENT_GRADED,
            title="Assignment Graded",
            message=f"Your submission for '{instance.assignment.title}' has been graded: {instance.score}/{instance.assignment.max_score}.",
            data={"assignment_id": str(instance.assignment.id), "score": str(instance.score)},
        )


# ── Live Session Scheduled ─────────────────────────────────
def _handle_live_session(sender, instance, created, **kwargs):
    if not created:
        return
    from courses.models import Enrollment
    enrollments = Enrollment.objects.filter(course=instance.course).select_related('student')
    for enrollment in enrollments:
        Notification.create_and_push(
            recipient=enrollment.student,
            type=Notification.Type.LIVE_STARTING,
            title="New Live Class Scheduled",
            message=f"'{instance.title}' is scheduled for {instance.scheduled_at.strftime('%b %d, %Y %H:%M')} UTC.",
            data={"course_slug": instance.course.slug, "session_id": str(instance.id)},
        )


def connect_signals():
    """Call from AppConfig.ready() to wire up all signals."""
    try:
        from courses.models import Enrollment
        post_save.connect(_handle_enrollment, sender=Enrollment)
    except Exception:
        pass
    try:
        from assignments.models import Submission
        post_save.connect(_handle_submission, sender=Submission)
        post_save.connect(_handle_graded,     sender=Submission)
    except Exception:
        pass
    try:
        from livestream.models import LiveSession
        post_save.connect(_handle_live_session, sender=LiveSession)
    except Exception:
        pass

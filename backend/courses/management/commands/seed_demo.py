"""Create the deterministic eLMS demonstration curriculum and activity."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify

from academics.models import Bookmark, Comment, CourseAnalytics, Department, Semester
from accounts.models import User
from assignments.models import Assignment, Submission
from courses.models import (
    Category, ContentItem, ContentProgress, Course, CourseProgress,
    Enrollment, Module, ModuleProgress,
)
from livestream.models import LiveSession
from notes.models import Note
from notifications.models import Notification


DEPARTMENTS = [
    ('CSE', 'Computer Science and Engineering', ['Programming', 'Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks', 'Artificial Intelligence']),
    ('EEE', 'Electrical and Electronic Engineering', ['Circuit Analysis', 'Electronic Devices', 'Digital Logic', 'Signals and Systems', 'Power Systems', 'Control Engineering']),
    ('CE', 'Civil Engineering', ['Engineering Mechanics', 'Surveying', 'Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 'Environmental Engineering']),
    ('ME', 'Mechanical Engineering', ['Engineering Drawing', 'Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Processes', 'Heat Transfer']),
    ('BBA', 'Business Administration', ['Management', 'Accounting', 'Marketing', 'Business Finance', 'Human Resources', 'Operations Management']),
    ('ENG', 'English', ['Academic Reading', 'Composition', 'Linguistics', 'Poetry', 'Drama', 'Literary Criticism']),
    ('ECO', 'Economics', ['Microeconomics', 'Macroeconomics', 'Statistics', 'Econometrics', 'Development Economics', 'International Trade']),
    ('LAW', 'Law', ['Legal Methods', 'Constitutional Law', 'Contract Law', 'Criminal Law', 'Property Law', 'International Law']),
]

DEPARTMENT_CODE_ALIASES = {
    'CSE': ('cs',),
    'CE': ('civil',),
}

VIDEO_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
REFERENCE_URL = 'https://en.wikipedia.org/wiki/Main_Page'


class Command(BaseCommand):
    help = 'Idempotently seed 8 departments, 512 catalog courses, and 100 detailed demo courses.'

    def add_arguments(self, parser):
        parser.add_argument('--password', default='Demo@1234', help='Password assigned to demo accounts')
        parser.add_argument('--verify', action='store_true', help='Verify exact demo counts without changing data')

    def handle(self, *args, **options):
        password = options['password']
        if options['verify']:
            counts = self.demo_counts()
            expected = {'departments': 8, 'semesters': 64, 'courses': 512, 'detailed': 100, 'users': 131, 'content': 1600}
            mismatches = {key: (counts[key], value) for key, value in expected.items() if counts[key] != value}
            if mismatches:
                raise CommandError(f'Demo verification failed: {mismatches}')
            self.stdout.write(self.style.SUCCESS(f'Demo verification passed: {counts}'))
            return
        if not settings.DEBUG and password == 'Demo@1234':
            raise CommandError('Pass a non-default --password outside DEBUG mode.')
        with transaction.atomic():
            counts = self.seed(password)
        self.stdout.write(self.style.SUCCESS(
            'Demo ready: {departments} departments, {semesters} semesters, '
            '{courses} courses ({detailed} detailed), {users} users, '
            '{content} content items.'.format(**counts)
        ))
        self.stdout.write('Demo login password: ' + password)

    def seed(self, password):
        category, _ = Category.objects.update_or_create(
            slug='university-curriculum', defaults={'name': 'University Curriculum'}
        )
        superuser = self.user('superuser@elms.demo', 'Demo Superuser', User.Role.SUPERUSER, password, staff=True, superuser=True)
        admins = [
            self.user(f'admin{i}@elms.demo', f'Demo Admin {i}', User.Role.ADMIN, password, staff=True)
            for i in range(1, 3)
        ]
        all_students, detailed_courses = [], []

        for dept_index, (code, name, topics) in enumerate(DEPARTMENTS):
            aliases = (code, *DEPARTMENT_CODE_ALIASES.get(code, ()))
            lookup = Q(name__iexact=name)
            for alias in aliases:
                lookup |= Q(code__iexact=alias)
            dept = Department.objects.filter(lookup).first()
            if dept is None:
                dept = Department(code=code)
            dept.name = name
            dept.code = code
            dept.slug = slugify(name)
            dept.description = f'{name} offers an eight-semester undergraduate curriculum.'
            dept.logo_url = f'https://placehold.co/400x240/1e40af/ffffff?text={code}'
            dept.save()
            teachers = [
                self.user(f'{code.lower()}.teacher{i}@elms.demo', f'{code} Teacher {i}', User.Role.TEACHER, password)
                for i in range(1, 5)
            ]
            students = [
                self.user(f'{code.lower()}.student{i:02d}@elms.demo', f'{code} Student {i:02d}', User.Role.STUDENT, password, department=dept)
                for i in range(1, 13)
            ]
            all_students.extend(students)
            quota = 13 if dept_index < 4 else 12
            detailed_positions = {(semester_no, 0) for semester_no in range(1, 9)}
            detailed_positions.add((1, 6))  # every department includes a lab
            for semester_no in range(1, quota - 8):
                detailed_positions.add((semester_no, 1))

            for semester_no in range(1, 9):
                semester, _ = Semester.objects.update_or_create(
                    department=dept, order=semester_no,
                    defaults={
                        'name': f'Semester {semester_no}',
                        'slug': f'{code.lower()}-semester-{semester_no}',
                        'type': Semester.Type.SEMESTER,
                        'description': f'Semester {semester_no} curriculum for {name}.',
                    },
                )
                phase = ('Foundations of', 'Intermediate', 'Advanced', 'Applied')[(semester_no - 1) // 2]
                theory_titles = [f'{phase} {topic}' for topic in topics]
                titles = theory_titles + [f'{topics[0]} Laboratory', f'{topics[2]} Laboratory']
                for position, title in enumerate(titles):
                    is_detailed = (semester_no, position) in detailed_positions
                    course_code = f'{code}-{semester_no}{position + 1:02d}'
                    primary = teachers[(semester_no + position - 1) % len(teachers)]
                    course, _ = Course.objects.update_or_create(
                        course_code=course_code,
                        defaults={
                            'title': title,
                            'slug': f'{code.lower()}-{semester_no}-{position + 1}-{slugify(title)}',
                            'description': f'{title} for semester {semester_no} students in {name}.',
                            'teacher': primary,
                            'category': category,
                            'department': dept,
                            'semester': semester,
                            'thumbnail_url': f'https://placehold.co/640x360/0f766e/ffffff?text={course_code}',
                            'level': Course.Level.BEGINNER if semester_no <= 2 else Course.Level.INTERMEDIATE if semester_no <= 5 else Course.Level.ADVANCED,
                            'is_published': True,
                            'availability': Course.Availability.AVAILABLE if is_detailed else Course.Availability.COMING_SOON,
                            'price': 0,
                        },
                    )
                    course.teachers.set([teachers[(teachers.index(primary) + 1) % len(teachers)]])
                    if is_detailed:
                        detailed_courses.append(course)
                        self.seed_course(course, primary, semester_no)

            # Each student gets four available courses from their own department.
            dept_detailed = [c for c in detailed_courses if c.department_id == dept.id]
            for student_index, student in enumerate(students):
                for offset in range(4):
                    course = dept_detailed[(student_index + offset) % len(dept_detailed)]
                    enrollment, _ = Enrollment.objects.update_or_create(
                        student=student, course=course,
                        defaults={'status': Enrollment.Status.ACTIVE},
                    )
                    # A representative activity sample keeps the fixture useful and fast.
                    if student_index < 3 and offset < 2:
                        self.seed_activity(student, course, enrollment, student_index + offset)

        # Keep global administrators associated with the demo through notifications.
        for user in [superuser, *admins]:
            Notification.objects.update_or_create(
                recipient=user, title='Demo curriculum ready',
                defaults={'type': Notification.Type.GENERAL, 'message': 'The 512-course demonstration catalog is available.', 'is_read': False},
            )

        return self.demo_counts()

    def demo_counts(self):
        return {
            'departments': Department.objects.filter(code__in=[d[0] for d in DEPARTMENTS]).count(),
            'semesters': Semester.objects.filter(department__code__in=[d[0] for d in DEPARTMENTS]).count(),
            'courses': Course.objects.filter(course_code__regex=r'^(CSE|EEE|CE|ME|BBA|ENG|ECO|LAW)-').count(),
            'detailed': Course.objects.filter(course_code__regex=r'^(CSE|EEE|CE|ME|BBA|ENG|ECO|LAW)-', availability=Course.Availability.AVAILABLE).count(),
            'users': User.objects.filter(email__endswith='@elms.demo').count(),
            'content': ContentItem.objects.filter(module__course__course_code__regex=r'^(CSE|EEE|CE|ME|BBA|ENG|ECO|LAW)-').count(),
        }

    def user(self, email, name, role, password, department=None, staff=False, superuser=False):
        user, created = User.objects.update_or_create(
            email=email,
            defaults={'name': name, 'role': role, 'department': department, 'is_active': True, 'is_staff': staff, 'is_superuser': superuser},
        )
        if created or not user.check_password(password):
            user.set_password(password)
            user.save(update_fields=['password'])
        return user

    def seed_course(self, course, teacher, semester_no):
        module_names = ('Core Concepts', 'Methods and Techniques', 'Applied Practice', 'Review and Assessment')
        for module_order, module_name in enumerate(module_names, 1):
            module, _ = Module.objects.update_or_create(
                course=course, order=module_order,
                defaults={'title': module_name, 'description': f'{module_name} for {course.title}.'},
            )
            items = [
                (ContentItem.ContentType.VIDEO, 'Video lesson'),
                (ContentItem.ContentType.PDF, 'Reading handout'),
                (ContentItem.ContentType.TEXT, 'Lesson notes'),
                (ContentItem.ContentType.LINK, 'Further reference'),
            ]
            for item_order, (content_type, label) in enumerate(items, 1):
                defaults = {
                    'title': f'{label}: {module_name}', 'content_type': content_type,
                    'description': f'Demonstration {label.lower()} for {course.title}.',
                    'uploaded_by': teacher, 'is_downloadable': content_type != ContentItem.ContentType.VIDEO,
                    'video_url': VIDEO_URL if content_type == ContentItem.ContentType.VIDEO else '',
                    'external_file_url': PDF_URL if content_type == ContentItem.ContentType.PDF else '',
                    'content_text': f'<h2>{module_name}</h2><p>Key concepts and guided examples for {course.title}.</p>' if content_type == ContentItem.ContentType.TEXT else '',
                    'external_url': REFERENCE_URL if content_type == ContentItem.ContentType.LINK else '',
                    'duration_seconds': 720 if content_type == ContentItem.ContentType.VIDEO else None,
                }
                ContentItem.objects.update_or_create(module=module, order=item_order, defaults=defaults)

        for number in range(1, 3):
            Assignment.objects.update_or_create(
                course=course, title=f'{course.course_code} Assignment {number}',
                defaults={
                    'module': course.modules.order_by('order')[number - 1],
                    'description': f'Complete the guided assessment for {course.title}.',
                    'due_date': timezone.now() + timedelta(days=14 * number),
                    'max_score': 100, 'is_published': True,
                },
            )
        LiveSession.objects.update_or_create(
            course=course, title=f'{course.course_code} Live Review',
            defaults={
                'host': teacher, 'description': f'Interactive review for {course.title}.',
                'scheduled_at': timezone.now() + timedelta(days=(semester_no % 7) + 1),
                'duration_minutes': 60, 'platform': LiveSession.Platform.JITSI,
                'meeting_url': 'https://meet.jit.si/elms-demo-class',
                'status': LiveSession.Status.SCHEDULED,
            },
        )

    def seed_activity(self, student, course, enrollment, variant):
        modules = list(course.modules.prefetch_related('content_items').order_by('order'))
        completed_count = variant % (len(modules) + 1)
        for module_index, module in enumerate(modules):
            completed = module_index < completed_count
            ModuleProgress.objects.update_or_create(
                user=student, module=module,
                defaults={'is_completed': completed, 'completed_at': timezone.now() if completed else None},
            )
            for item in module.content_items.all():
                ContentProgress.objects.update_or_create(
                    user=student, content_item=item,
                    defaults={'is_viewed': completed, 'watch_duration_seconds': item.duration_seconds or 0 if completed else 0},
                )
        progress, _ = CourseProgress.objects.get_or_create(user=student, course=course)
        progress.update_progress()
        enrollment.progress = progress.completion_percentage
        enrollment.save(update_fields=['progress'])
        first_module = modules[0]
        first_item = first_module.content_items.order_by('order').first()
        Note.objects.update_or_create(user=student, module=first_module, defaults={'content': f'Personal study notes for {course.title}.'})
        Bookmark.objects.get_or_create(user=student, content_item=first_item)
        Comment.objects.update_or_create(
            user=student, content_item=first_item, parent=None,
            defaults={'content': f'What is the best way to review {first_module.title}?', 'upvotes': variant % 5},
        )
        assignment = course.assignments.order_by('created_at').first()
        Submission.objects.update_or_create(
            assignment=assignment, student=student,
            defaults={
                'text_answer': f'Demonstration answer from {student.name}.',
                'score': 70 + variant % 26, 'feedback': 'Good work; review the examples.',
                'status': Submission.Status.GRADED, 'graded_at': timezone.now(),
            },
        )
        CourseAnalytics.objects.update_or_create(
            course=course,
            defaults={
                'total_enrollments': course.enrollments.count(),
                'total_lectures_watched': ContentProgress.objects.filter(content_item__module__course=course, is_viewed=True).count(),
                'total_materials_downloaded': 0,
            },
        )
        Notification.objects.update_or_create(
            recipient=student, title=f'Welcome to {course.course_code}',
            defaults={'type': Notification.Type.ENROLLMENT, 'message': f'You are enrolled in {course.title}.', 'data': {'course_slug': course.slug}, 'is_read': variant % 2 == 0},
        )

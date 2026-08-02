from django.test import TestCase
from rest_framework.test import APIClient

from academics.models import Department, Semester
from accounts.models import User
from courses.models import ContentItem, Course, Enrollment, Module


class CourseRoleAndAvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name='Test Engineering', slug='test-engineering', code='TST')
        self.semester = Semester.objects.create(
            department=self.department, name='Semester 1', slug='tst-semester-1', order=1
        )
        self.teacher = User.objects.create_user('teacher@test.demo', 'Teacher', 'TestPass123!', role='teacher')
        self.additional_teacher = User.objects.create_user('teacher2@test.demo', 'Teacher Two', 'TestPass123!', role='teacher')
        self.student = User.objects.create_user('student@test.demo', 'Student', 'TestPass123!', role='student')
        self.course = Course.objects.create(
            title='Test Course', slug='test-course', description='Test', teacher=self.teacher,
            department=self.department, semester=self.semester, course_code='TST-101',
            is_published=True, availability=Course.Availability.AVAILABLE,
        )
        self.course.teachers.add(self.additional_teacher)

    def test_public_registration_cannot_choose_privileged_role(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'new@test.demo', 'name': 'New User', 'role': 'superuser',
            'password': 'StrongPass123!', 'password2': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.get(email='new@test.demo').role, User.Role.STUDENT)

    def test_coming_soon_course_rejects_enrollment(self):
        self.course.availability = Course.Availability.COMING_SOON
        self.course.save(update_fields=['availability'])
        self.client.force_authenticate(self.student)
        response = self.client.post('/api/courses/courses/test-course/enroll/')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Enrollment.objects.filter(student=self.student, course=self.course).exists())

    def test_only_students_can_enroll(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/courses/courses/test-course/enroll/')
        self.assertEqual(response.status_code, 403)

    def test_additional_teacher_can_manage_course(self):
        self.assertTrue(self.course.can_manage(self.additional_teacher))
        self.assertFalse(self.course.can_manage(self.student))

    def test_external_pdf_has_normalized_resource_url(self):
        module = Module.objects.create(course=self.course, title='Module', order=1)
        item = ContentItem.objects.create(
            module=module, title='Handout', content_type=ContentItem.ContentType.PDF,
            order=1, external_file_url='https://example.com/handout.pdf', uploaded_by=self.teacher,
        )
        self.assertEqual(item.file_url, 'https://example.com/handout.pdf')

    def test_unenrolled_student_cannot_open_learning_view(self):
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/courses/courses/test-course/student/')
        self.assertEqual(response.status_code, 404)
        Enrollment.objects.create(student=self.student, course=self.course)
        response = self.client.get('/api/courses/courses/test-course/student/')
        self.assertEqual(response.status_code, 200)

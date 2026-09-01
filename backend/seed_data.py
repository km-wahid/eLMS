import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from accounts.models import User
from academics.models import Department, Semester
from courses.models import Course, Category

def create_seed_data():
    print("Seeding demo users...")
    admin, _ = User.objects.get_or_create(
        email='admin@elms.com',
        defaults={'name': 'System Admin', 'role': User.Role.SUPERUSER, 'is_staff': True, 'is_superuser': True}
    )
    admin.set_password('Admin@1234')
    admin.save()

    teacher1, _ = User.objects.get_or_create(
        email='sarah@elms.com',
        defaults={'name': 'Dr. Sarah Connor', 'role': User.Role.TEACHER, 'is_staff': True}
    )
    teacher1.set_password('Teacher@1234')
    teacher1.save()

    teacher2, _ = User.objects.get_or_create(
        email='ali@elms.com',
        defaults={'name': 'Prof. Ali Khan', 'role': User.Role.TEACHER, 'is_staff': True}
    )
    teacher2.set_password('Teacher@1234')
    teacher2.save()

    student, _ = User.objects.get_or_create(
        email='student@elms.com',
        defaults={'name': 'John Doe', 'role': User.Role.STUDENT}
    )
    student.set_password('Student@1234')
    student.save()

    print("Seeding categories...")
    cat, _ = Category.objects.get_or_create(name='Computer Science', defaults={'slug': 'computer-science'})

    print("Seeding departments...")
    cse, _ = Department.objects.get_or_create(
        code='CSE',
        defaults={
            'name': 'Computer Science & Engineering',
            'slug': 'computer-science-engineering',
            'description': 'Department of Computer Science and Engineering'
        }
    )

    eee, _ = Department.objects.get_or_create(
        code='EEE',
        defaults={
            'name': 'Electrical & Electronic Engineering',
            'slug': 'electrical-electronic-engineering',
            'description': 'Department of Electrical and Electronic Engineering'
        }
    )

    bba, _ = Department.objects.get_or_create(
        code='BBA',
        defaults={
            'name': 'Business Administration',
            'slug': 'business-administration',
            'description': 'School of Business Administration'
        }
    )

    print("Seeding semesters...")
    sem1, _ = Semester.objects.get_or_create(
        department=cse,
        order=1,
        defaults={
            'name': 'Semester 1 (Fall 2026)',
            'slug': 'cse-sem-1',
            'type': Semester.Type.SEMESTER,
            'description': 'First Semester Core Courses'
        }
    )

    sem2, _ = Semester.objects.get_or_create(
        department=cse,
        order=2,
        defaults={
            'name': 'Semester 2 (Spring 2027)',
            'slug': 'cse-sem-2',
            'type': Semester.Type.SEMESTER,
            'description': 'Second Semester Advanced Courses'
        }
    )

    print("Seeding courses...")
    c1, _ = Course.objects.get_or_create(
        slug='data-structures-algorithms',
        defaults={
            'title': 'Data Structures & Algorithms',
            'course_code': 'CSE101',
            'description': 'Learn fundamental data structures and algorithmic efficiency.',
            'department': cse,
            'semester': sem1,
            'category': cat,
            'teacher': teacher1,
            'is_published': True,
        }
    )

    c2, _ = Course.objects.get_or_create(
        slug='web-engineering-react-django',
        defaults={
            'title': 'Full-Stack Web Engineering',
            'course_code': 'CSE301',
            'description': 'Build modern web applications with React and Django DRF.',
            'department': cse,
            'semester': sem2,
            'category': cat,
            'teacher': teacher2,
            'is_published': True,
        }
    )

    print("Seed data created successfully!")

if __name__ == '__main__':
    create_seed_data()

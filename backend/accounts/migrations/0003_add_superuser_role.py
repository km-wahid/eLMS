# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_department_alter_user_groups'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('student', 'Student'), 
                    ('teacher', 'Teacher'), 
                    ('admin', 'Admin'),
                    ('superuser', 'Superuser')
                ],
                default='student',
                max_length=15
            ),
        ),
    ]

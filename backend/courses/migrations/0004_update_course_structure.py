# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('courses', '0003_rename_courses_dept_semester_idx_courses_departm_ffc7ef_idx_and_more'),
    ]

    operations = [
        # Add teachers many-to-many field
        migrations.AddField(
            model_name='course',
            name='teachers',
            field=models.ManyToManyField(
                blank=True,
                help_text='Additional teachers assigned to this course',
                limit_choices_to=models.Q(('role', 'teacher'), ('role', 'admin'), ('role', 'superuser'), _connector='OR'),
                related_name='assigned_courses',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Update department to be required (non-null)
        migrations.AlterField(
            model_name='course',
            name='department',
            field=models.ForeignKey(
                help_text='Department this course belongs to',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='courses',
                to='academics.department'
            ),
        ),
        
        # Update semester to be required (non-null)
        migrations.AlterField(
            model_name='course',
            name='semester',
            field=models.ForeignKey(
                help_text='Semester this course belongs to',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='courses',
                to='academics.semester'
            ),
        ),
        
        # Make course_code unique and required
        migrations.AlterField(
            model_name='course',
            name='course_code',
            field=models.CharField(
                help_text='e.g., CS101, ENG201, BBA301',
                max_length=50,
                unique=True
            ),
        ),
        
        # Update thumbnail field help text
        migrations.AlterField(
            model_name='course',
            name='thumbnail',
            field=models.ImageField(
                blank=True,
                help_text='Course thumbnail image (uploaded file)',
                null=True,
                upload_to='course_thumbnails/'
            ),
        ),
        
        # Update thumbnail_url help text
        migrations.AlterField(
            model_name='course',
            name='thumbnail_url',
            field=models.URLField(
                blank=True,
                help_text='External thumbnail URL (fallback if no upload)'
            ),
        ),
        
        # Update is_published help text
        migrations.AlterField(
            model_name='course',
            name='is_published',
            field=models.BooleanField(
                default=False,
                help_text='Only published courses are visible to students'
            ),
        ),
        
        # Add index for is_published
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['is_published'], name='courses_is_publ_idx'),
        ),
        
        # Add index for course_code
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['course_code'], name='courses_course_c_idx'),
        ),
    ]

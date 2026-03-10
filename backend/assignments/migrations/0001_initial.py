import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('courses', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Assignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='assignments', to='courses.course')),
                ('module', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='assignments', to='courses.module')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('max_score', models.PositiveIntegerField(default=100)),
                ('is_published', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'assignments', 'ordering': ['due_date', 'created_at']},
        ),
        migrations.CreateModel(
            name='Submission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('assignment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='submissions', to='assignments.assignment')),
                ('student', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='submissions', to=settings.AUTH_USER_MODEL)),
                ('file', models.FileField(blank=True, null=True, upload_to='submissions/')),
                ('text_answer', models.TextField(blank=True)),
                ('score', models.PositiveIntegerField(blank=True, null=True)),
                ('feedback', models.TextField(blank=True)),
                ('status', models.CharField(
                    choices=[('submitted','Submitted'),('late','Late'),('graded','Graded')],
                    default='submitted', max_length=15)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('graded_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={'db_table': 'submissions', 'ordering': ['-submitted_at']},
        ),
        migrations.AlterUniqueTogether(
            name='submission',
            unique_together={('assignment', 'student')},
        ),
    ]

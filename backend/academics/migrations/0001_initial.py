import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('courses', '0001_initial'),
        ('lectures', '0001_initial'),
        ('materials', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, unique=True)),
                ('slug', models.SlugField(max_length=255, unique=True)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='department_logos/')),
                ('logo_url', models.URLField(blank=True, help_text='External logo URL')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'departments', 'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Semester',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=255)),
                ('type', models.CharField(choices=[('semester', 'Semester'), ('trimester', 'Trimester')], default='semester', max_length=20)),
                ('order', models.PositiveIntegerField(help_text='Order within department (1, 2, 3, etc.)')),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='semesters', to='academics.department')),
            ],
            options={'db_table': 'semesters', 'ordering': ['department', 'order']},
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('upvotes', models.PositiveIntegerField(default=0)),
                ('pinned', models.BooleanField(default=False)),
                ('is_resolved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lecture', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='lectures.lecture')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='academics.comment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lecture_comments', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'comments', 'ordering': ['-pinned', '-upvotes', '-created_at']},
        ),
        migrations.CreateModel(
            name='Bookmark',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lecture', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='lectures.lecture')),
                ('material', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='materials.material')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'bookmarks'},
        ),
        migrations.CreateModel(
            name='ProgressTracking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('lecture_watched', 'Lecture Watched'), ('material_downloaded', 'Material Downloaded'), ('material_viewed', 'Material Viewed')], max_length=30)),
                ('watch_duration_seconds', models.PositiveIntegerField(blank=True, help_text='How long user watched the lecture', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lecture', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='progress_records', to='lectures.lecture')),
                ('material', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='progress_records', to='materials.material')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progress_tracking', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'progress_tracking'},
        ),
        migrations.CreateModel(
            name='CourseAnalytics',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('total_enrollments', models.PositiveIntegerField(default=0)),
                ('total_lectures_watched', models.PositiveIntegerField(default=0)),
                ('total_materials_downloaded', models.PositiveIntegerField(default=0)),
                ('engagement_score', models.FloatField(default=0.0, help_text='0-100 scale based on activity')),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('course', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='analytics', to='courses.course')),
            ],
            options={'db_table': 'course_analytics', 'verbose_name_plural': 'Course Analytics'},
        ),
        migrations.AlterUniqueTogether(
            name='semester',
            unique_together={('department', 'order')},
        ),
        migrations.AlterUniqueTogether(
            name='bookmark',
            unique_together={('user', 'lecture'), ('user', 'material')},
        ),
        migrations.AddIndex(
            model_name='semester',
            index=models.Index(fields=['department', 'order'], name='semesters_department_order_idx'),
        ),
        migrations.AddIndex(
            model_name='semester',
            index=models.Index(fields=['slug'], name='semesters_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='department',
            index=models.Index(fields=['slug'], name='departments_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='department',
            index=models.Index(fields=['code'], name='departments_code_idx'),
        ),
        migrations.AddIndex(
            model_name='comment',
            index=models.Index(fields=['lecture', '-created_at'], name='comments_lecture_created_idx'),
        ),
        migrations.AddIndex(
            model_name='comment',
            index=models.Index(fields=['user'], name='comments_user_idx'),
        ),
        migrations.AddIndex(
            model_name='bookmark',
            index=models.Index(fields=['user', 'created_at'], name='bookmarks_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='progresstracking',
            index=models.Index(fields=['user', 'created_at'], name='progress_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='progresstracking',
            index=models.Index(fields=['lecture', 'user'], name='progress_lecture_user_idx'),
        ),
    ]

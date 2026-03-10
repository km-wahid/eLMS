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
            name='LiveSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False,
                                        primary_key=True, serialize=False)),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='live_sessions', to='courses.course')),
                ('host', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='hosted_sessions', to=settings.AUTH_USER_MODEL)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('scheduled_at', models.DateTimeField()),
                ('duration_minutes', models.PositiveIntegerField(default=60)),
                ('platform', models.CharField(
                    choices=[('zoom','Zoom'),('jitsi','Jitsi'),('meet','Google Meet'),
                             ('teams','Microsoft Teams'),('other','Other')],
                    default='zoom', max_length=10)),
                ('meeting_url', models.URLField(blank=True)),
                ('meeting_id',  models.CharField(blank=True, max_length=100)),
                ('passcode',    models.CharField(blank=True, max_length=50)),
                ('status', models.CharField(
                    choices=[('scheduled','Scheduled'),('live','Live'),
                             ('ended','Ended'),('cancelled','Cancelled')],
                    default='scheduled', max_length=15)),
                ('recording_url', models.URLField(blank=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('ended_at',   models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'live_sessions', 'ordering': ['scheduled_at']},
        ),
    ]

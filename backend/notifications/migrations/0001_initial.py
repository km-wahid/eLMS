import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('recipient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications', to=settings.AUTH_USER_MODEL)),
                ('type', models.CharField(
                    choices=[
                        ('enrollment','New Enrollment'),('assignment_new','New Assignment'),
                        ('assignment_graded','Assignment Graded'),('submission_new','New Submission'),
                        ('live_starting','Live Class Starting'),('material_new','New Material'),
                        ('general','General'),
                    ],
                    default='general', max_length=25)),
                ('title',    models.CharField(max_length=255)),
                ('message',  models.TextField()),
                ('data',     models.JSONField(blank=True, default=dict)),
                ('is_read',  models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'notifications', 'ordering': ['-created_at']},
        ),
    ]

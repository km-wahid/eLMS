import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('courses', '0001_initial'),
        ('lectures', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='materials',
                    to='courses.course',
                )),
                ('module', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='materials',
                    to='courses.module',
                )),
                ('lecture', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='materials',
                    to='lectures.lecture',
                )),
                ('uploaded_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='uploaded_materials',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('file', models.FileField(upload_to='materials/')),
                ('file_type', models.CharField(
                    choices=[
                        ('pdf', 'PDF'), ('slide', 'Slide'), ('doc', 'Document'),
                        ('video', 'Video'), ('other', 'Other'),
                    ],
                    default='other',
                    max_length=10,
                )),
                ('file_size', models.PositiveIntegerField(
                    blank=True, help_text='Size in bytes', null=True
                )),
                ('is_downloadable', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'materials', 'ordering': ['created_at']},
        ),
    ]

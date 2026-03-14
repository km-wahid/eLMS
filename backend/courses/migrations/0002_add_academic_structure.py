import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='courses', to='academics.department'),
        ),
        migrations.AddField(
            model_name='course',
            name='semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='courses', to='academics.semester'),
        ),
        migrations.AddField(
            model_name='course',
            name='course_code',
            field=models.CharField(blank=True, help_text='e.g., CS101, ENG201', max_length=50),
        ),
        migrations.AlterField(
            model_name='course',
            name='id',
            field=models.UUIDField(default='uuid.uuid4', editable=False, primary_key=True, serialize=False),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['department', 'semester'], name='courses_dept_semester_idx'),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['teacher'], name='courses_teacher_idx'),
        ),
    ]

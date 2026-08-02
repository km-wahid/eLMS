from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('courses', '0007_add_progress_tracking')]

    operations = [
        migrations.AddField(
            model_name='course',
            name='availability',
            field=models.CharField(
                choices=[('available', 'Available'), ('coming_soon', 'Coming Soon')],
                db_index=True,
                default='coming_soon',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='contentitem',
            name='external_file_url',
            field=models.URLField(blank=True, help_text='External PDF or slide URL used when no file is uploaded'),
        ),
    ]

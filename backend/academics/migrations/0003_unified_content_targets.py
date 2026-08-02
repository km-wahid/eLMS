from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('academics', '0002_rename_bookmarks_user_created_idx_bookmarks_user_id_2ce2db_idx_and_more'),
        ('courses', '0008_course_availability_content_external_file_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comment', name='lecture',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='lectures.lecture'),
        ),
        migrations.AddField(
            model_name='comment', name='content_item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='courses.contentitem'),
        ),
        migrations.AddField(
            model_name='bookmark', name='content_item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='courses.contentitem'),
        ),
        migrations.AlterUniqueTogether(
            name='bookmark',
            unique_together={('user', 'lecture'), ('user', 'material'), ('user', 'content_item')},
        ),
    ]

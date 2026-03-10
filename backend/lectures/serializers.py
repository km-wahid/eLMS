from rest_framework import serializers
from .models import Lecture


class LectureListSerializer(serializers.ModelSerializer):
    duration_display = serializers.ReadOnlyField()

    class Meta:
        model = Lecture
        fields = [
            'id', 'title', 'order', 'hls_status',
            'duration_seconds', 'duration_display', 'is_published',
        ]


class LectureDetailSerializer(serializers.ModelSerializer):
    duration_display = serializers.ReadOnlyField()
    module_title = serializers.CharField(source='module.title', read_only=True)
    course_slug = serializers.CharField(source='module.course.slug', read_only=True)

    class Meta:
        model = Lecture
        fields = [
            'id', 'module', 'module_title', 'course_slug',
            'title', 'description', 'order',
            'hls_playlist_url', 'hls_status',
            'duration_seconds', 'duration_display',
            'is_published', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'hls_playlist_url', 'hls_status', 'created_at', 'updated_at']


class LectureCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecture
        fields = [
            'id', 'module', 'title', 'description',
            'order', 'video_file', 'is_published',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        lecture = super().create(validated_data)
        if lecture.video_file:
            from .tasks import process_video_hls
            process_video_hls.delay(str(lecture.id))
        return lecture

    def update(self, instance, validated_data):
        old_file = instance.video_file.name if instance.video_file else None
        lecture = super().update(instance, validated_data)
        new_file = lecture.video_file.name if lecture.video_file else None
        if new_file and new_file != old_file:
            from .tasks import process_video_hls
            lecture.hls_status = Lecture.HLSStatus.PENDING
            lecture.save(update_fields=['hls_status'])
            process_video_hls.delay(str(lecture.id))
        return lecture

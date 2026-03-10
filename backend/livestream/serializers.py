from django.utils import timezone
from rest_framework import serializers
from .models import LiveSession


class LiveSessionListSerializer(serializers.ModelSerializer):
    host_name  = serializers.CharField(source='host.get_full_name', read_only=True)
    is_joinable = serializers.ReadOnlyField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug  = serializers.CharField(source='course.slug',  read_only=True)

    class Meta:
        model  = LiveSession
        fields = [
            'id', 'title', 'course_title', 'course_slug', 'host_name',
            'scheduled_at', 'duration_minutes', 'platform',
            'status', 'is_joinable', 'created_at',
        ]


class LiveSessionDetailSerializer(LiveSessionListSerializer):
    class Meta(LiveSessionListSerializer.Meta):
        fields = LiveSessionListSerializer.Meta.fields + [
            'description', 'meeting_url', 'meeting_id', 'passcode',
            'recording_url', 'started_at', 'ended_at', 'updated_at',
        ]


class LiveSessionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LiveSession
        fields = [
            'id', 'title', 'description', 'scheduled_at', 'duration_minutes',
            'platform', 'meeting_url', 'meeting_id', 'passcode',
        ]
        read_only_fields = ['id']

    def validate_scheduled_at(self, value):
        if self.instance is None and value <= timezone.now():
            raise serializers.ValidationError('Scheduled time must be in the future.')
        return value

    def create(self, validated_data):
        validated_data['course'] = self.context['course']
        validated_data['host']   = self.context['request'].user
        return super().create(validated_data)

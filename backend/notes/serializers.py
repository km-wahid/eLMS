from rest_framework import serializers
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    course_title = serializers.CharField(source='module.course.title', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id',
            'user',
            'user_name',
            'module',
            'module_title',
            'course_title',
            'content',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'user_name', 'module_title', 'course_title', 'created_at', 'updated_at']

    def create(self, validated_data):
        # User is automatically set from request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NoteCreateUpdateSerializer(serializers.ModelSerializer):
    """Simplified serializer for create/update operations"""
    
    class Meta:
        model = Note
        fields = ['module', 'content']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

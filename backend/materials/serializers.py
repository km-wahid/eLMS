from rest_framework import serializers
from .models import Material


class MaterialListSerializer(serializers.ModelSerializer):
    file_size_display = serializers.ReadOnlyField()
    uploaded_by_name  = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url          = serializers.SerializerMethodField()

    class Meta:
        model  = Material
        fields = [
            'id', 'title', 'file_type', 'file_size', 'file_size_display',
            'is_downloadable', 'uploaded_by_name', 'file_url', 'created_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MaterialDetailSerializer(MaterialListSerializer):
    class Meta(MaterialListSerializer.Meta):
        fields = MaterialListSerializer.Meta.fields + ['description', 'course', 'module', 'lecture']


class MaterialUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Material
        fields = ['id', 'title', 'description', 'file', 'file_type', 'is_downloadable',
                  'module', 'lecture']
        read_only_fields = ['id']

    def validate(self, attrs):
        module  = attrs.get('module')
        lecture = attrs.get('lecture')
        course  = self.context['course']

        if module and module.course != course:
            raise serializers.ValidationError('Module does not belong to this course.')
        if lecture and lecture.module.course != course:
            raise serializers.ValidationError('Lecture does not belong to this course.')
        return attrs

    def create(self, validated_data):
        validated_data['course']      = self.context['course']
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

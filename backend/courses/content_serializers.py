from rest_framework import serializers
from .models import ContentItem


class ContentItemSerializer(serializers.ModelSerializer):
    """
    Serializer for ContentItem with validation based on content type
    """
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    duration_display = serializers.CharField(read_only=True)
    file_size_display = serializers.CharField(read_only=True)
    resource_url = serializers.CharField(source='file_url', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = ContentItem
        fields = [
            'id',
            'module',
            'title',
            'content_type',
            'content_type_display',
            'order',
            # Video fields
            'video_file',
            'video_url',
            'hls_playlist_url',
            'hls_status',
            'duration_seconds',
            'duration_display',
            # File fields
            'file',
            'file_size',
            'file_size_display',
            'external_file_url',
            # Text/Link fields
            'content_text',
            'external_url',
            # Common fields
            'description',
            'is_downloadable',
            'resource_url',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'hls_playlist_url', 'hls_status', 'uploaded_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate based on content type"""
        content_type = data.get('content_type')
        
        if content_type == ContentItem.ContentType.VIDEO:
            if not data.get('video_file') and not data.get('video_url'):
                raise serializers.ValidationError({
                    'content_type': 'Video content requires either a video file or video URL'
                })
        
        elif content_type in [ContentItem.ContentType.PDF, ContentItem.ContentType.SLIDE]:
            if not data.get('file') and not data.get('external_file_url'):
                raise serializers.ValidationError({
                    'file': f'{ContentItem.ContentType(content_type).label} requires a file upload'
                })
        
        elif content_type == ContentItem.ContentType.TEXT:
            if not data.get('content_text'):
                raise serializers.ValidationError({
                    'content_text': 'Text notes require content'
                })
        
        elif content_type == ContentItem.ContentType.LINK:
            if not data.get('external_url'):
                raise serializers.ValidationError({
                    'external_url': 'External link requires a URL'
                })
        
        return data


class ContentItemListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing content items
    """
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    duration_display = serializers.CharField(read_only=True)
    file_size_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = ContentItem
        fields = [
            'id',
            'title',
            'content_type',
            'content_type_display',
            'order',
            'duration_display',
            'file_size_display',
            'is_downloadable',
            'created_at',
        ]


class ContentItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating content items
    """
    
    class Meta:
        model = ContentItem
        fields = [
            'module',
            'title',
            'content_type',
            'order',
            'video_file',
            'video_url',
            'file',
            'external_file_url',
            'content_text',
            'external_url',
            'description',
            'is_downloadable',
            'duration_seconds',
        ]
    
    def validate(self, data):
        """Validate based on content type"""
        content_type = data.get('content_type')
        
        if content_type == ContentItem.ContentType.VIDEO:
            if not data.get('video_file') and not data.get('video_url'):
                raise serializers.ValidationError({
                    'content_type': 'Video content requires either a video file or video URL'
                })
        
        elif content_type in [ContentItem.ContentType.PDF, ContentItem.ContentType.SLIDE]:
            if not data.get('file') and not data.get('external_file_url'):
                raise serializers.ValidationError({
                    'file': f'{ContentItem.ContentType(content_type).label} requires a file upload'
                })
        
        elif content_type == ContentItem.ContentType.TEXT:
            if not data.get('content_text'):
                raise serializers.ValidationError({
                    'content_text': 'Text notes require content'
                })
        
        elif content_type == ContentItem.ContentType.LINK:
            if not data.get('external_url'):
                raise serializers.ValidationError({
                    'external_url': 'External link requires a URL'
                })
        
        return data
    
    def create(self, validated_data):
        # Set the uploader to current user
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

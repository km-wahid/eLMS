from django.utils import timezone
from rest_framework import serializers
from .models import Assignment, Submission


class AssignmentListSerializer(serializers.ModelSerializer):
    submission_count = serializers.ReadOnlyField()
    module_title     = serializers.CharField(source='module.title', read_only=True, default=None)
    is_overdue       = serializers.SerializerMethodField()

    class Meta:
        model  = Assignment
        fields = [
            'id', 'title', 'due_date', 'max_score', 'is_published',
            'module_title', 'submission_count', 'is_overdue', 'created_at',
        ]

    def get_is_overdue(self, obj):
        return bool(obj.due_date and timezone.now() > obj.due_date)


class AssignmentDetailSerializer(AssignmentListSerializer):
    class Meta(AssignmentListSerializer.Meta):
        fields = AssignmentListSerializer.Meta.fields + ['description', 'updated_at']


class AssignmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Assignment
        fields = ['id', 'title', 'description', 'module', 'due_date', 'max_score', 'is_published']
        read_only_fields = ['id']

    def validate_module(self, module):
        course = self.context.get('course')
        if module and course and module.course != course:
            raise serializers.ValidationError('Module does not belong to this course.')
        return module

    def create(self, validated_data):
        validated_data['course'] = self.context['course']
        return super().create(validated_data)


class SubmissionSerializer(serializers.ModelSerializer):
    student_name  = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    file_url      = serializers.SerializerMethodField()

    class Meta:
        model  = Submission
        fields = [
            'id', 'assignment', 'student_name', 'student_email',
            'text_answer', 'file_url', 'score', 'feedback',
            'status', 'submitted_at', 'graded_at',
        ]
        read_only_fields = ['id', 'assignment', 'score', 'feedback', 'status', 'submitted_at', 'graded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Submission
        fields = ['id', 'text_answer', 'file']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['assignment'] = self.context['assignment']
        validated_data['student']    = self.context['request'].user
        return super().create(validated_data)


class SubmissionGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Submission
        fields = ['score', 'feedback']

    def validate_score(self, value):
        max_score = self.instance.assignment.max_score
        if value is not None and value > max_score:
            raise serializers.ValidationError(f'Score cannot exceed max score ({max_score}).')
        return value

    def update(self, instance, validated_data):
        instance.score     = validated_data.get('score', instance.score)
        instance.feedback  = validated_data.get('feedback', instance.feedback)
        instance.status    = Submission.Status.GRADED
        instance.graded_at = timezone.now()
        instance.save()
        return instance

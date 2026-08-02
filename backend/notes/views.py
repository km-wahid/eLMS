from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Note
from .serializers import NoteSerializer, NoteCreateUpdateSerializer
from courses.models import Module


class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint for student notes.
    
    Students can:
    - List their own notes (optionally filtered by module)
    - Create a note for a module
    - Retrieve a specific note
    - Update their own note
    - Delete their own note
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NoteSerializer

    def get_queryset(self):
        # Students can only see their own notes
        queryset = Note.objects.filter(user=self.request.user).select_related(
            'module', 'module__course', 'user'
        )
        
        # Filter by module if provided
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(module__course_id=course_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NoteCreateUpdateSerializer
        return NoteSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_module(self, request, pk=None):
        """
        Get note for a specific module.
        Usage: /api/notes/by_module/?module=<module_id>
        """
        module_id = request.query_params.get('module')
        if not module_id:
            return Response(
                {'error': 'module parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            note = Note.objects.get(user=request.user, module_id=module_id)
            serializer = self.get_serializer(note)
            return Response(serializer.data)
        except Note.DoesNotExist:
            return Response(
                {'detail': 'No note found for this module'},
                status=status.HTTP_404_NOT_FOUND
            )

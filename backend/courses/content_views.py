from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from .models import ContentItem, Module
from .content_serializers import (
    ContentItemSerializer,
    ContentItemListSerializer,
    ContentItemCreateSerializer
)
from accounts.permissions import IsTeacherOrAdmin


class ContentItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing content items within modules.
    
    Permissions:
    - Teachers/Admins: Full CRUD for their courses
    - Students: Read-only access to content
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'reorder'):
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ContentItem.objects.select_related('module', 'uploaded_by')
        
        # Filter by module if provided
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        # Teachers/Admins see all content
        # Students see only content from enrolled courses
        if user.role == 'student':
            queryset = queryset.filter(
                module__course__enrollments__student=user,
                module__course__is_published=True,
                module__course__availability='available',
            )
        elif user.role == 'teacher':
            from django.db.models import Q
            queryset = queryset.filter(
                Q(module__course__teacher=user) | Q(module__course__teachers=user)
            ).distinct()
        
        return queryset.order_by('module', 'order')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContentItemCreateSerializer
        elif self.action == 'list':
            return ContentItemListSerializer
        return ContentItemSerializer
    
    def perform_create(self, serializer):
        """Only teachers/admins can create content"""
        user = self.request.user
        if user.role not in ['teacher', 'admin', 'superuser']:
            raise PermissionDenied('Only teachers and admins can create content')
        
        # Verify teacher owns the course
        module_id = self.request.data.get('module')
        module = get_object_or_404(Module, id=module_id)
        
        if user.role == 'teacher':
            # Check if user is assigned to this course
            is_assigned = (
                module.course.teacher == user or
                module.course.teachers.filter(id=user.id).exists()
            )
            if not is_assigned:
                raise PermissionDenied('You are not assigned to this course')
        
        serializer.save(uploaded_by=user)
    
    def perform_update(self, serializer):
        """Only teachers/admins can update content"""
        user = self.request.user
        content_item = self.get_object()
        
        if user.role == 'teacher':
            # Check if user is assigned to this course
            is_assigned = (
                content_item.module.course.teacher == user or
                content_item.module.course.teachers.filter(id=user.id).exists()
            )
            if not is_assigned:
                raise PermissionDenied('You are not assigned to this course')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only teachers/admins can delete content"""
        user = self.request.user
        
        if user.role == 'teacher':
            # Check if user is assigned to this course
            is_assigned = (
                instance.module.course.teacher == user or
                instance.module.course.teachers.filter(id=user.id).exists()
            )
            if not is_assigned:
                raise PermissionDenied('You are not assigned to this course')
        
        instance.delete()
    
    @action(detail=False, methods=['post'], permission_classes=[IsTeacherOrAdmin])
    def reorder(self, request):
        """
        Reorder content items within a module.
        Expected payload: {"items": [{"id": "uuid", "order": 1}, ...]}
        """
        items_data = request.data.get('items', [])
        
        if not items_data:
            return Response(
                {'error': 'Items array is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_items = []
        for item_data in items_data:
            item_id = item_data.get('id')
            new_order = item_data.get('order')
            
            if not item_id or new_order is None:
                continue
            
            try:
                item = self.get_queryset().get(id=item_id)
                if not item.module.course.can_manage(request.user):
                    raise PermissionDenied('You are not assigned to this course')
                item.order = new_order
                item.save(update_fields=['order'])
                updated_items.append(item)
            except ContentItem.DoesNotExist:
                continue
        
        serializer = self.get_serializer(updated_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Get download URL for content item.
        """
        content_item = self.get_object()
        
        if not content_item.is_downloadable:
            return Response(
                {'error': 'This content is not downloadable'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file_url = content_item.file_url
        if not file_url:
            return Response(
                {'error': 'No file available for download'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({'download_url': file_url})


class ModuleContentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for viewing module content.
    Used by students to browse content.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ContentItemListSerializer
    
    def get_queryset(self):
        module_id = self.kwargs.get('module_id')
        user = self.request.user
        
        queryset = ContentItem.objects.filter(module_id=module_id)
        
        # Students can only see content from published courses they're enrolled in
        if user.role == 'student':
            queryset = queryset.filter(
                module__course__is_published=True,
                module__course__enrollments__student=user
            )
        
        return queryset.order_by('order')

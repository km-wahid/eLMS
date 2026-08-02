from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperuser
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserManagementSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        # Fire welcome email asynchronously
        try:
            from accounts.tasks import send_welcome_email
            name = user.get_full_name() or user.email
            send_welcome_email.delay(user.email, name)
        except Exception:
            pass
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully.'})


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for superusers to manage all users (students, teachers, admins)
    Only accessible by superusers
    """
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = User.objects.all().select_related('department').order_by('-created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(email__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'detail': f'User {"activated" if user.is_active else "deactivated"} successfully.',
            'is_active': user.is_active
        })

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['student', 'teacher', 'admin', 'superuser']:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        return Response({
            'detail': f'User role changed to {new_role} successfully.',
            'role': user.role
        })

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password to a temporary one"""
        user = self.get_object()
        temp_password = User.objects.make_random_password(length=12)
        user.set_password(temp_password)
        user.save()
        
        # In production, send this via email
        return Response({
            'detail': 'Password reset successfully.',
            'temporary_password': temp_password  # Remove in production
        })


class TeachersListView(generics.ListAPIView):
    """Get list of all teachers for course assignment"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        teachers = User.objects.filter(
            models.Q(role='teacher') | models.Q(role='admin') | models.Q(role='superuser')
        ).values('id', 'name', 'email', 'role')
        return Response(list(teachers))

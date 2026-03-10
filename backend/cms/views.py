from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from courses.models import Course, Module, Enrollment, Category
from lectures.models import Lecture
from materials.models import Material
from .serializers import (
    CMSUserSerializer, CMSUserUpdateSerializer,
    CMSCourseSerializer, CMSCourseFullSerializer,
    CMSModuleSerializer, CMSLectureSerializer,
    CMSMaterialSerializer, CMSCategorySerializer, CMSTeacherSerializer,
)

User = get_user_model()


# ─── Stats ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def cms_stats(request):
    recent_users = list(User.objects.order_by('-created_at')[:5].values(
        'id','name','email','role','created_at'))
    from lectures.models import Lecture as L
    from materials.models import Material as M
    recent_enrollments = Enrollment.objects.select_related('student','course').order_by('-enrolled_at')[:5]
    activity = [
        {'type':'enrollment','text':f'{e.student.name} enrolled in {e.course.title}','time':e.enrolled_at}
        for e in recent_enrollments
    ]
    return Response({
        'stats': {
            'total_users':       User.objects.count(),
            'total_students':    User.objects.filter(role='student').count(),
            'total_teachers':    User.objects.filter(role='teacher').count(),
            'total_courses':     Course.objects.count(),
            'published_courses': Course.objects.filter(is_published=True).count(),
            'total_enrollments': Enrollment.objects.count(),
            'total_lectures':    L.objects.count(),
            'total_materials':   M.objects.count(),
        },
        'recent_users':  recent_users,
        'activity':      activity,
    })


# ─── Users ────────────────────────────────────────────────────────────────────

class CMSUserListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSUserSerializer
    def get_queryset(self):
        qs   = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        q    = self.request.query_params.get('q')
        if role: qs = qs.filter(role=role)
        if q:    qs = qs.filter(name__icontains=q) | qs.filter(email__icontains=q)
        return qs


class CMSUserDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    def get_serializer_class(self):
        if self.request.method in ['PUT','PATCH']: return CMSUserUpdateSerializer
        return CMSUserSerializer


# ─── Teachers (dropdown list) ─────────────────────────────────────────────────

class CMSTeacherList(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSTeacherSerializer
    queryset = User.objects.filter(role='teacher').order_by('name')


# ─── Categories ───────────────────────────────────────────────────────────────

class CMSCategoryListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSCategorySerializer
    def get_queryset(self):
        return Category.objects.all().order_by('name')


class CMSCategoryDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSCategorySerializer
    queryset = Category.objects.all()


# ─── Courses ──────────────────────────────────────────────────────────────────

class CMSCourseList(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSCourseSerializer
    def get_queryset(self):
        qs = Course.objects.select_related('teacher').order_by('-created_at')
        q  = self.request.query_params.get('q')
        if q: qs = qs.filter(title__icontains=q)
        return qs


class CMSCourseCreate(generics.CreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSCourseFullSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]


class CMSCourseDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSCourseFullSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset = Course.objects.select_related('teacher','category').prefetch_related('modules')
    lookup_field = 'slug'


# ─── Modules ──────────────────────────────────────────────────────────────────

class CMSModuleListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSModuleSerializer

    def _course(self):
        return Course.objects.get(slug=self.kwargs['slug'])

    def get_queryset(self):
        return Module.objects.filter(course__slug=self.kwargs['slug']).order_by('order')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = self._course()
        return ctx


class CMSModuleDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSModuleSerializer
    queryset = Module.objects.all()
    lookup_url_kwarg = 'module_pk'


# ─── Lectures ─────────────────────────────────────────────────────────────────

class CMSLectureListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSLectureSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _module(self):
        return Module.objects.get(pk=self.kwargs['module_pk'])

    def get_queryset(self):
        return Lecture.objects.filter(module__pk=self.kwargs['module_pk']).order_by('order')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['module'] = self._module()
        return ctx


class CMSLectureDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSLectureSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset = Lecture.objects.all()
    lookup_url_kwarg = 'lecture_pk'


# ─── Materials ────────────────────────────────────────────────────────────────

class CMSMaterialListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSMaterialSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Material.objects.select_related('course','module','lecture','uploaded_by').order_by('-created_at')
        course = self.request.query_params.get('course')
        ftype  = self.request.query_params.get('file_type')
        q      = self.request.query_params.get('q')
        if course: qs = qs.filter(course__slug=course)
        if ftype:  qs = qs.filter(file_type=ftype)
        if q:      qs = qs.filter(title__icontains=q)
        return qs


class CMSMaterialDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = CMSMaterialSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset = Material.objects.select_related('course','module','lecture')

# Course Visibility Fix

## Problem
Students and teachers could not see courses:
- Teachers couldn't see their created courses in "My Courses" page
- Students couldn't see courses under Department → Semester → Courses navigation
- Frontend was using incorrect API endpoints

## Root Causes

### 1. Incorrect API Endpoints
The frontend was using old, incorrect endpoint paths that didn't match the backend URLs:
- ❌ `/courses/mine/` → ✅ `/courses/courses/mine/`
- ❌ `/courses/create/` → ✅ `/courses/courses/create/`
- ❌ `/courses/{slug}/update/` → ✅ `/courses/courses/{slug}/update/`
- ❌ `/courses/{slug}/delete/` → ✅ `/courses/courses/{slug}/delete/`

### 2. Missing Course Fetching Logic
The `useCourseStore` had a `courses` array but no function to actually fetch courses from the API. The SemesterCoursesPage was trying to filter from an empty array.

## Files Fixed

### 1. `frontend/src/services/courseService.js`
Updated all course-related endpoints to include `/courses/` prefix:
- `getCourses()` → `/courses/courses/`
- `getCourseBySlug()` → `/courses/courses/{slug}/`
- `getTeacherCourses()` → `/courses/courses/mine/`
- `createCourse()` → `/courses/courses/create/`
- `updateCourse()` → `/courses/courses/{slug}/update/`
- `deleteCourse()` → `/courses/courses/{slug}/delete/`
- `enrollInCourse()` → `/courses/courses/{slug}/enroll/`
- `unenrollFromCourse()` → `/courses/courses/{slug}/enroll/`
- Module endpoints → `/courses/courses/{slug}/modules/`

Also added support for `department` and `semester` query parameters.

### 2. `frontend/src/pages/MyCoursesPage.jsx`
Fixed three endpoints:
- Line 16: `api.get('/courses/courses/mine/')` (was `/courses/mine/`)
- Line 48: `api.patch(\`/courses/courses/${course.slug}/update/\`)` (was `/courses/${slug}/update/`)
- Line 60: `api.delete(\`/courses/courses/${slug}/delete/\`)` (was `/courses/${slug}/delete/`)

### 3. `frontend/src/store/courseStore.js`
Added missing API fetch functions:
- `fetchCourses(params)` - Fetch all published courses with optional filters
- `fetchCourseBySlug(slug)` - Fetch single course details
- `fetchTeacherCourses()` - Fetch teacher's own courses
- `fetchMyEnrollments()` - Fetch student's enrolled courses

### 4. `frontend/src/pages/SemesterCoursesPage.jsx`
Added course fetching when semester page loads:
```javascript
useEffect(() => {
  fetchCourses({ semester: slug });
}, [slug, fetchCourses]);
```

## Backend URL Structure (for reference)

```
/api/courses/courses/               - List all published courses (GET)
/api/courses/courses/mine/          - Teacher's courses (GET)
/api/courses/courses/create/        - Create course (POST)
/api/courses/courses/{slug}/        - Course detail (GET)
/api/courses/courses/{slug}/update/ - Update course (PATCH)
/api/courses/courses/{slug}/delete/ - Delete course (DELETE)
/api/courses/courses/{slug}/enroll/ - Enroll/unenroll (POST/DELETE)
/api/courses/courses/{slug}/modules/ - Course modules (GET/POST)
```

## Expected Behavior After Fix

### For Teachers:
1. Can create courses at `/courses/new`
2. Course is automatically assigned to the teacher who created it
3. Can see all their courses at `/my-courses`
4. Can edit, delete, publish/unpublish their courses
5. Can toggle course visibility with "Publish" button

### For Students:
1. Navigate: Department → Semester → Courses
2. See all **published** courses for that semester
3. Can enroll in courses
4. See enrolled courses in "My Enrollments"

### For Admin:
1. Can create courses via CMS panel
2. Can control which courses are published (visible to students)
3. Can assign teachers to courses

## Testing Checklist

- [x] Teacher creates a course → appears in "My Courses"
- [x] Teacher publishes a course → appears for students
- [x] Student navigates to semester → sees published courses
- [x] Course detail page loads correctly
- [x] Module creation works in course editor
- [ ] Enrollment works (POST to enroll endpoint)
- [ ] Student can see enrolled courses

## Related Files (Previously Fixed)

- `backend/cms/serializers.py` - Added department_id and semester_id fields
- `frontend/src/pages/CourseFormPage.jsx` - Fixed course creation endpoint
- `frontend/src/cms/CMSCourses.jsx` - Removed level/price fields

## Notes

- Courses have `is_published` flag (default: `false`)
- Only **published** courses appear for students
- Teachers can see all their courses (published or draft)
- Teacher assignment is automatic during course creation (line 230 in CourseCreateUpdateSerializer)
- Frontend container must be rebuilt after code changes: `docker-compose up -d --build frontend`

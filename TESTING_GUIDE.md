# eLMS Academic Structure - Testing & QA Guide

## 🧪 Testing Overview

The academic structure extension includes:
- **Backend**: 7 Django models, 6 ViewSets, 16 API endpoints
- **Frontend**: 40+ React components, 10 Zustand stores, 6 services
- **Total**: 8000+ lines of production code

---

## 📋 Pre-Launch Verification Checklist

### Database & Migrations
- [ ] Run migrations: `python manage.py migrate academics`
- [ ] Run migrations: `python manage.py migrate courses` (for Course model updates)
- [ ] Verify Django admin: http://localhost:8000/admin (can see Department, Semester, Comment models)
- [ ] Create test data via admin (2 departments, 3 semesters, 5 courses)

### Backend API Verification
```bash
# Test endpoints without authentication
curl http://localhost:8000/api/academics/departments/
curl http://localhost:8000/api/academics/departments/{id}/
curl http://localhost:8000/api/academics/semesters/

# Test with authentication (after login, copy JWT token)
curl -H "Authorization: Bearer {TOKEN}" \
     http://localhost:8000/api/academics/comments/

# Test POST (create department - admin only)
curl -X POST http://localhost:8000/api/academics/departments/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {ADMIN_TOKEN}" \
     -d '{"name":"CS","code":"CS","description":"Computer Science"}'
```

### Frontend Page Verification

#### Public Pages (No Login Required)
- [ ] `/` - Home page loads
- [ ] `/departments` - Shows list of departments
- [ ] `/departments/{slug}` - Shows semesters in department
- [ ] `/semesters/{slug}` - Shows courses in semester
- [ ] `/academic-courses/{slug}` - Shows course details

#### Protected Pages (Login Required)
- [ ] `/bookmarks` - Redirect to login
- [ ] After login: `/bookmarks` - Show user's bookmarks
- [ ] `/progress` - Show learning progress
- [ ] `/teacher/academic` - Teachers only (check permission)

#### Teacher Pages (Teacher Role Required)
- [ ] `/teacher/academic` - Academic management dashboard
- [ ] `/teacher/courses/{courseId}/edit` - Course editor
- [ ] `/teacher/courses/{courseId}/analytics` - Analytics dashboard

### Component Testing

#### DepartmentsPage
```
✓ Renders department grid
✓ Search filter works
✓ Responsive grid (1 col mobile, 2 col tablet, 3+ col desktop)
✓ Click department navigates to detail page
✓ Loading state shows while fetching
✓ Error state shows if fetch fails
✓ Empty state if no departments
```

#### DepartmentDetailPage
```
✓ Displays department name and description
✓ Lists all semesters in department
✓ Click semester navigates to semester courses
✓ Shows semester type (semester/trimester)
✓ Mobile: semesters in single column
```

#### SemesterCoursesPage
```
✓ Displays semester name and courses
✓ Pagination works (9 courses per page)
✓ Course cards show stats
✓ Enroll button visible if not enrolled
✓ Click course goes to course detail
✓ Loading/error states
```

#### CourseDetailAcademicPage
```
✓ Shows course info (name, code, teacher, semester, department)
✓ Lists course modules/lectures
✓ Lists materials (PDF, slides, videos, etc.)
✓ Enroll button for non-enrolled users
✓ Bookmark button on lectures
✓ Comments section with nested replies
✓ Download/preview for materials
```

#### TeacherAcademicDashboard
```
✓ Only teachers can access (403 if not)
✓ Departments tab: list all departments
✓ Admin can create departments
✓ Semesters tab: show semesters for selected department
✓ Courses tab: link to CMS course management
✓ Responsive on mobile
```

#### TeacherCourseEditor
```
✓ Show course info with edit button
✓ Can edit course title/code/description
✓ Can add lectures (title, description, video URL)
✓ Can add materials (title, file URL, type)
✓ Lists existing lectures and materials
✓ Delete functionality (if implemented)
```

#### TeacherAnalyticsPage
```
✓ Shows enrollment count
✓ Shows engagement score
✓ Shows completion rate
✓ Time range selector (week/month/semester)
✓ Most viewed lectures
✓ Most downloaded materials
✓ Engagement timeline chart
✓ Student performance breakdown
```

---

## 🧬 API Integration Tests

### Department Endpoints
```javascript
// Test: Create department (admin only)
POST /api/academics/departments/
Headers: Authorization: Bearer {ADMIN_TOKEN}
Body: {
  "name": "Computer Science",
  "code": "CS",
  "description": "CS Department"
}
Expected: 201 Created, returns department object

// Test: List departments (public)
GET /api/academics/departments/
Expected: 200 OK, returns array of departments

// Test: Get department detail
GET /api/academics/departments/{id}/
Expected: 200 OK, returns department with nested semesters

// Test: Non-admin cannot create
POST /api/academics/departments/ (as student)
Expected: 403 Forbidden
```

### Semester Endpoints
```javascript
// Test: Create semester (admin only)
POST /api/academics/semesters/
Body: {
  "department": "{dept_id}",
  "name": "Semester 1",
  "type": "semester",
  "order": 1
}
Expected: 201 Created

// Test: Filter by department
GET /api/academics/semesters/?department={dept_id}
Expected: 200 OK, only semesters for that department

// Test: Non-admin cannot create
POST /api/academics/semesters/ (as teacher)
Expected: 403 Forbidden
```

### Comment Endpoints
```javascript
// Test: Create comment (authenticated)
POST /api/academics/comments/
Headers: Authorization: Bearer {USER_TOKEN}
Body: {
  "lecture": "{lecture_id}",
  "content": "Great explanation!",
  "parent": null
}
Expected: 201 Created

// Test: Reply to comment
POST /api/academics/comments/
Body: {
  "lecture": "{lecture_id}",
  "content": "Thanks for the feedback!",
  "parent": "{comment_id}"
}
Expected: 201 Created, parent references correct comment

// Test: Upvote comment
POST /api/academics/comments/{id}/upvote/
Headers: Authorization: Bearer {USER_TOKEN}
Expected: 200 OK, upvotes_count incremented

// Test: Pin comment (teacher/admin only)
POST /api/academics/comments/{id}/pin/
Headers: Authorization: Bearer {TEACHER_TOKEN}
Expected: 200 OK, is_pinned = true

// Test: Resolve comment
POST /api/academics/comments/{id}/resolve/
Headers: Authorization: Bearer {TEACHER_TOKEN}
Expected: 200 OK, is_resolved = true

// Test: Non-teacher cannot pin
POST /api/academics/comments/{id}/pin/ (as student)
Expected: 403 Forbidden
```

### Bookmark Endpoints
```javascript
// Test: Create bookmark
POST /api/academics/bookmarks/
Body: { "lecture": "{lecture_id}" }
Expected: 201 Created

// Test: Or bookmark material
POST /api/academics/bookmarks/
Body: { "material": "{material_id}" }
Expected: 201 Created

// Test: List user's bookmarks
GET /api/academics/bookmarks/
Expected: 200 OK, only user's bookmarks

// Test: Delete bookmark
DELETE /api/academics/bookmarks/{id}/
Expected: 204 No Content

// Test: Cannot see other user's bookmarks
GET /api/academics/bookmarks/?user={other_user_id}
Expected: 403 Forbidden (not in response, filtered)
```

### Progress Endpoints
```javascript
// Test: Record lecture view
POST /api/academics/progress/
Body: {
  "lecture": "{lecture_id}",
  "action": "watched"
}
Expected: 201 Created

// Test: Record material download
POST /api/academics/progress/
Body: {
  "material": "{material_id}",
  "action": "downloaded"
}
Expected: 201 Created

// Test: Get user progress
GET /api/academics/progress/
Expected: 200 OK, all user's progress records

// Test: Get course progress
GET /api/academics/progress/?course={course_id}
Expected: 200 OK, filtered progress for course
```

### Analytics Endpoints
```javascript
// Test: Get course analytics (teacher of that course)
GET /api/academics/courses/{course_id}/analytics/
Headers: Authorization: Bearer {TEACHER_TOKEN}
Expected: 200 OK, returns analytics object

// Test: Teacher cannot see other course analytics
GET /api/academics/courses/{other_teacher_course_id}/analytics/
Expected: 403 Forbidden

// Test: Admin can see all analytics
GET /api/academics/courses/{any_course_id}/analytics/
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200 OK
```

---

## 🎨 Frontend State Management Tests

### Department Store
```javascript
import { useDepartmentStore } from '@/store/departmentStore'

// Test: Fetch departments
const store = useDepartmentStore()
store.fetchDepartments()
// Expected: departments array populated, loading = false

// Test: Select department
store.selectDepartment(deptId)
// Expected: selectedDepartment updated

// Test: Create department
store.createDepartment({name: 'Test', code: 'TST'})
// Expected: new department in array, error = null

// Test: Error handling
store.fetchDepartments() // Network error
// Expected: error message set, loading = false
```

### Bookmark Store
```javascript
import { useBookmarkStore } from '@/store/bookmarkStore'

const store = useBookmarkStore()

// Test: Fetch user's bookmarks
store.fetchUserBookmarks()
// Expected: bookmarks array populated

// Test: Check if bookmarked
const isBookmarked = store.isBookmarked(lectureId)
// Expected: boolean true/false

// Test: Toggle bookmark (add)
store.toggleBookmark(lectureId)
// Expected: bookmark added to array

// Test: Toggle bookmark (remove)
store.toggleBookmark(lectureId)
// Expected: bookmark removed from array
```

### Comment Store
```javascript
import { useCommentStore } from '@/store/commentStore'

const store = useCommentStore()

// Test: Fetch comments for lecture
store.fetchCommentsByLecture(lectureId)
// Expected: comments array with nested replies

// Test: Create comment
store.createComment({
  lecture: lectureId,
  content: 'Test comment'
})
// Expected: comment added, error = null

// Test: Reply to comment
store.createComment({
  lecture: lectureId,
  parent: commentId,
  content: 'Reply'
})
// Expected: reply nested under parent

// Test: Upvote
store.upvoteComment(commentId)
// Expected: upvotes_count incremented

// Test: Pin (teacher only)
store.pinComment(commentId)
// Expected: is_pinned = true (if teacher)
```

### Progress Store
```javascript
import { useProgressStore } from '@/store/progressStore'

const store = useProgressStore()

// Test: Track lecture view
store.trackLectureView(lectureId)
// Expected: progress record created

// Test: Get course progress
const progress = store.getCourseProgress(courseId)
// Expected: object with completion_percentage, watched_lectures, etc.
```

---

## 📱 Responsive Design Tests

### Mobile (< 768px)
```
✓ Sidebar collapses to hamburger menu
✓ Department grid: 1 column
✓ Course cards stack vertically
✓ Comments section: full width
✓ Video player: responsive height
✓ Navigation: mobile-friendly touch targets
✓ Pagination buttons: large enough to tap
```

### Tablet (768px - 1024px)
```
✓ Sidebar visible at top
✓ Department grid: 2 columns
✓ Course cards: 2 columns
✓ Comments section: readable width
✓ Video controls: accessible
```

### Desktop (> 1024px)
```
✓ Full layout as designed
✓ Department grid: 3-4 columns
✓ Sidebar navigation
✓ Two-column course details
✓ All controls visible
```

---

## ⚡ Performance Tests

### Load Testing
```bash
# Simulate 100 concurrent users
ab -n 1000 -c 100 http://localhost:8000/api/academics/departments/

# Expected:
# - Response time < 200ms
# - Error rate < 1%
# - Throughput > 500 req/sec
```

### Frontend Performance
```javascript
// Lighthouse audit
// Target scores:
// - Performance: > 90
// - Accessibility: > 95
// - Best Practices: > 90
// - SEO: > 90

// Metrics to check:
// - First Contentful Paint (FCP): < 1.5s
// - Largest Contentful Paint (LCP): < 2.5s
// - Cumulative Layout Shift (CLS): < 0.1
// - Time to Interactive (TTI): < 3.8s
```

### Database Performance
```sql
-- Check indexes are being used
EXPLAIN ANALYZE SELECT * FROM academics_bookmark 
WHERE user_id = '...' AND created_at > NOW() - INTERVAL '30 days';
-- Expected: uses index on (user_id, created_at)

-- Check query performance
SELECT * FROM academics_comment 
WHERE lecture_id = '...'
ORDER BY created_at DESC;
-- Expected: < 100ms for typical course (500+ comments)
```

---

## 🔒 Security Tests

### Authentication
- [ ] Unauthenticated users cannot POST to /api/academics/comments/
- [ ] Unauthenticated users cannot see /bookmarks page
- [ ] JWT token expiration works (cannot use expired token)
- [ ] Token refresh works (/api/token/refresh/)

### Authorization
- [ ] Students cannot create departments
- [ ] Students cannot pin comments
- [ ] Teachers can only see their own course analytics
- [ ] Teachers cannot edit another teacher's course

### Input Validation
- [ ] Department name required (400 Bad Request if missing)
- [ ] Comment content required
- [ ] File URLs validated (must be valid URL format)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts in comments are escaped

### CORS
- [ ] Frontend (http://localhost:3000) can call backend API
- [ ] Other origins are blocked
- [ ] Preflight requests (OPTIONS) succeed

---

## 🐛 Known Limitations & Workarounds

### Current Limitations
1. **Lecture editor**: Currently limited to admin. Teachers need course owner check.
2. **Material deletion**: Not implemented. Can be added.
3. **Batch operations**: Cannot bulk delete comments or materials.
4. **Search**: Full-text search not implemented. Can add PostgreSQL FTS.
5. **Notifications**: Async notifications not integrated yet.

### Workarounds
```javascript
// If course editor not showing
// Check: user.is_teacher && (user.id == course.teacher_id || user.is_admin)

// If bookmarks not saving
// Check: bookmark store has fetchUserBookmarks() called on mount

// If comments not loading
// Check: lecture ID is valid UUID format
```

---

## 📊 Test Data Creation Script

```bash
# Create test departments
python manage.py shell << EOF
from backend.academics.models import Department, Semester
from django.utils.text import slugify

depts = [
    {'name': 'Computer Science', 'code': 'CS'},
    {'name': 'Civil Engineering', 'code': 'CE'},
    {'name': 'Mechanical Engineering', 'code': 'ME'},
]

for dept_data in depts:
    dept = Department.objects.create(
        name=dept_data['name'],
        code=dept_data['code'],
        slug=slugify(dept_data['name']),
        description=f"{dept_data['name']} Department"
    )
    
    # Create 8 semesters for each department
    for i in range(1, 9):
        Semester.objects.create(
            department=dept,
            name=f"Semester {i}",
            slug=f"sem-{i}",
            type="semester",
            order=i,
            description=f"Academic Semester {i}"
        )

print("Test data created successfully!")
EOF
```

---

## ✅ Sign-Off Checklist

Before declaring the feature complete:

- [ ] All 6 API ViewSets working
- [ ] All 10 frontend pages rendering
- [ ] Authentication/authorization working
- [ ] Bookmarks save and load
- [ ] Comments post and nest correctly
- [ ] Progress tracking active
- [ ] Teacher dashboard accessible
- [ ] Responsive design passes on mobile/tablet/desktop
- [ ] No console errors in browser
- [ ] API response times < 200ms
- [ ] Database migrations completed
- [ ] Django admin interface working
- [ ] Backward compatibility with legacy courses
- [ ] All existing features still working (assignments, live classes, etc.)

---

## 📞 Troubleshooting

### Backend Issues

**Migration fails**
```bash
# Solution: Check migration dependencies
python manage.py showmigrations
python manage.py migrate --fake academics 0001
python manage.py migrate academics
```

**API returns 500**
```bash
# Solution: Check logs
docker-compose logs web
# Look for: Python exceptions, database errors

# Check database
python manage.py dbshell
SELECT * FROM academics_department;  # Should return rows
```

**Permission denied on API**
```bash
# Solution: Check authentication
# Send token: curl -H "Authorization: Bearer {TOKEN}" ...
# Or use: useCourseStore().isAuthenticated
```

### Frontend Issues

**Page not loading**
```javascript
// Check:
1. Is the route registered in App.jsx?
2. Is the component imported?
3. Are dependencies installed? (npm install)
4. Check browser console for errors (F12)
```

**Data not showing**
```javascript
// Check:
1. API endpoint returning data? (curl /api/academics/departments/)
2. Store.fetchX() called on mount?
3. Is loading spinner showing? (might be loading)
4. Check Redux/Zustand devtools for store state
```

**Styles not applying**
```javascript
// Check:
1. Tailwind CSS compiled? (npm run build)
2. Classes spelled correctly?
3. Parent has overflow hidden? (clips children)
4. Media query responsive? (test on mobile browser)
```

---

## 📈 Next Steps

After launch:
1. Monitor API response times (set alert if > 500ms)
2. Track user engagement with analytics
3. Gather feedback on UI/UX
4. Implement full-text search
5. Add notification integrations
6. Implement bulk operations
7. Add course reviews/ratings
8. Implement advanced analytics

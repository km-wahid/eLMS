# E-Learning Management System - Academic Structure Extension

## 📚 Overview

This extension adds a complete university-style academic hierarchy to the existing eLMS platform, enabling comprehensive course organization and management while maintaining 100% backward compatibility with existing features.

### New Features

✅ **Academic Hierarchy** - Department → Semester → Course structure  
✅ **Public Content Browsing** - Students can explore courses without enrollment  
✅ **Discussion System** - Nested comments with upvotes and teacher controls  
✅ **Progress Tracking** - Monitor lecture views and material downloads  
✅ **Bookmarking System** - Save important lectures and materials  
✅ **Teacher Dashboard** - Manage academic structure and view analytics  
✅ **Responsive Design** - Full mobile, tablet, and desktop support  
✅ **Performance Optimized** - API caching, pagination, lazy loading  

---

## 🏗️ Database Models

### Academic Structure Models

#### Department
```python
- id (UUID)
- name (string, required)
- slug (slug, unique)
- code (string, optional)
- description (text)
- logo_url (URL, optional)
- created_at / updated_at
```

#### Semester
```python
- id (UUID)
- department (ForeignKey → Department)
- name (string)
- slug (slug)
- type (choice: semester/trimester)
- start_date / end_date (date, optional)
- order (integer, for sorting)
- description (text, optional)
- created_at / updated_at
```

**Course Model Updates**
```python
# Added to existing Course model:
- department (ForeignKey → Department, nullable)
- semester (ForeignKey → Semester, nullable)
- course_code (string, optional)
```

### Engagement Models

#### Comment
```python
- id (UUID)
- user (ForeignKey → User)
- lecture (ForeignKey → Lecture)
- parent (ForeignKey → Comment, self-referential, nullable)
- content (text)
- is_pinned (boolean)
- is_resolved (boolean)
- upvotes_count (integer)
- created_at / updated_at
```

#### Bookmark
```python
- id (UUID)
- user (ForeignKey → User)
- lecture (ForeignKey → Lecture, nullable)
- material (ForeignKey → CourseMaterial, nullable)
- created_at

# Constraints:
- unique_together: (user, lecture)
- unique_together: (user, material)
- At least one of lecture or material must be set
```

#### ProgressTracking
```python
- id (UUID)
- user (ForeignKey → User)
- lecture (ForeignKey → Lecture, nullable)
- material (ForeignKey → CourseMaterial, nullable)
- action (choice: watched/downloaded)
- created_at

# Useful for tracking:
- Total lecture views per user
- Material downloads
- Course completion percentage
```

#### CourseAnalytics
```python
- id (UUID)
- course (ForeignKey → Course, unique)
- total_enrollments (integer)
- engagement_score (float, 0-100)
- completion_rate (float, 0-100)
- last_updated (datetime)

# Caches frequently accessed metrics
```

---

## 🔌 API Endpoints

All academic endpoints are prefixed with `/api/academics/`

### Departments
```
GET    /api/academics/departments/          # List all departments
GET    /api/academics/departments/{id}/     # Get department details
POST   /api/academics/departments/          # Create (admin only)
PATCH  /api/academics/departments/{id}/     # Update (admin only)
DELETE /api/academics/departments/{id}/     # Delete (admin only)
```

### Semesters
```
GET    /api/academics/semesters/            # List semesters (filterable by department)
GET    /api/academics/semesters/{id}/       # Get semester details
POST   /api/academics/semesters/            # Create (admin only)
PATCH  /api/academics/semesters/{id}/       # Update (admin only)
DELETE /api/academics/semesters/{id}/       # Delete (admin only)
```

### Comments
```
GET    /api/academics/comments/             # List comments (filterable by lecture)
POST   /api/academics/comments/             # Create comment (authenticated)
PATCH  /api/academics/comments/{id}/        # Update own comment
DELETE /api/academics/comments/{id}/        # Delete own comment (or admin)

POST   /api/academics/comments/{id}/upvote/ # Upvote comment (authenticated)
POST   /api/academics/comments/{id}/pin/    # Pin comment (teacher/admin only)
POST   /api/academics/comments/{id}/resolve/# Mark as resolved (teacher/admin)
```

### Bookmarks
```
GET    /api/academics/bookmarks/            # List user's bookmarks (authenticated)
POST   /api/academics/bookmarks/            # Create bookmark (authenticated)
DELETE /api/academics/bookmarks/{id}/       # Delete bookmark (owner only)
```

### Progress Tracking
```
GET    /api/academics/progress/             # Get user's progress (authenticated)
POST   /api/academics/progress/             # Record action (auto-tracked)
```

### Course Analytics
```
GET    /api/academics/courses/{id}/analytics/ # Get course analytics (teacher/admin)
```

---

## 🎨 Frontend Pages & Routes

### Student Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/departments` | DepartmentsPage | Browse all departments with search |
| `/departments/:slug` | DepartmentDetailPage | View department with semesters |
| `/semesters/:slug` | SemesterCoursesPage | View courses in a semester |
| `/academic-courses/:slug` | CourseDetailAcademicPage | Full course details with enrollment |
| `/bookmarks` | BookmarksPage | Manage saved lectures/materials |
| `/progress` | ProgressPage | Track learning progress |

### Teacher Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/teacher/academic` | TeacherAcademicDashboard | Manage departments/semesters/courses |
| `/teacher/courses/:courseId/edit` | TeacherCourseEditor | Add lectures and materials |
| `/teacher/courses/:courseId/analytics` | TeacherAnalyticsPage | View engagement metrics |

### Components

```
LectureViewer.jsx           - HLS video player with progress tracking
HLSVideoPlayer.jsx          - HTML5 video player for HLS streams
ResponsiveSidebar.jsx       - Mobile navigation menu
CommentSection.jsx          - Nested comments with moderation
BookmarkButton.jsx          - Quick bookmark toggle
ProgressBar.jsx             - Visual progress indicator
DepartmentCard.jsx          - Department info card
CourseCard.jsx              - Course preview card
```

---

## 🔐 Permissions & Access Control

| Action | Public | Student | Teacher | Admin |
|--------|--------|---------|---------|-------|
| Browse departments/courses | ✅ | ✅ | ✅ | ✅ |
| View course materials | ❌ | ✅ | ✅ | ✅ |
| Comment on lectures | ❌ | ✅ | ✅ | ✅ |
| Pin/resolve comments | ❌ | ❌ | ✅* | ✅ |
| Create bookmarks | ❌ | ✅ | ✅ | ✅ |
| Create departments | ❌ | ❌ | ❌ | ✅ |
| Create semesters | ❌ | ❌ | ❌ | ✅ |
| Add course materials | ❌ | ❌ | ✅* | ✅ |
| View own analytics | ❌ | ✅ | ✅* | ✅ |
| View all analytics | ❌ | ❌ | ❌ | ✅ |

*Teacher can only manage their own courses

---

## 📊 State Management (Zustand)

Each domain has its own store with consistent patterns:

### Department Store
```javascript
// State
- departments[]
- selectedDepartment
- loading, error

// Actions
- fetchDepartments()
- getDepartmentById(id)
- createDepartment(data)
- updateDepartment(id, data)
- deleteDepartment(id)
```

### Semester Store
```javascript
// State
- semesters[]
- selectedSemester
- loading, error

// Actions
- fetchSemestersByDepartment(deptId)
- getSemesterById(id)
- createSemester(data)
- updateSemester(id, data)
- deleteSemester(id)
```

### Comment Store
```javascript
// State
- comments[]
- loading, error

// Actions
- fetchCommentsByLecture(lectureId)
- createComment(data)
- updateComment(id, data)
- deleteComment(id)
- upvoteComment(id)
- pinComment(id)
- resolveComment(id)
```

### Bookmark Store
```javascript
// State
- bookmarks[]
- loading, error

// Actions
- fetchUserBookmarks()
- isBookmarked(lectureId|materialId)
- createBookmark(lectureId|materialId)
- deleteBookmark(id)
```

### Progress Store
```javascript
// State
- progress[]
- loading, error

// Actions
- trackLectureView(lectureId)
- trackMaterialDownload(materialId)
- getUserProgress()
- getCourseProgress(courseId)
```

### Analytics Store
```javascript
// State
- courseAnalytics{}
- loading, error

// Actions
- fetchCourseAnalytics(courseId)
- getCourseStats(courseId)
```

---

## 🔧 Service Layer

All services follow a consistent pattern:

```javascript
// departmentService.js
export const departmentService = {
  getDepartments(filters) { /* ... */ },
  getDepartmentById(id) { /* ... */ },
  createDepartment(data) { /* ... */ },
  updateDepartment(id, data) { /* ... */ },
  deleteDepartment(id) { /* ... */ },
  searchDepartments(query) { /* ... */ },
}

// Similar patterns for:
// - semesterService
// - commentService
// - bookmarkService
// - progressService
// - analyticsService
```

---

## 🎯 Usage Examples

### Browse Departments as Guest
```javascript
// No login required
GET /api/academics/departments/
// Returns: [{id, name, slug, code, description, logo_url, ...}]
```

### Student Bookmarks a Lecture
```javascript
// After login
POST /api/academics/bookmarks/
Body: { lecture: "lecture-uuid" }
// Returns: {id, user, lecture, created_at}

// Check if bookmarked
const { bookmarks } = useBookmarkStore()
const isBookmarked = bookmarks.some(b => b.lecture === lectureId)
```

### Student Comments on Lecture
```javascript
// Create root comment
POST /api/academics/comments/
Body: { lecture: "lecture-uuid", content: "Great explanation!" }

// Reply to comment
POST /api/academics/comments/
Body: { 
  lecture: "lecture-uuid",
  parent: "comment-uuid",
  content: "Thanks for the feedback!"
}

// Upvote
POST /api/academics/comments/comment-uuid/upvote/
```

### Teacher Manages Course
```javascript
// Create lecture
POST /api/courses/{courseId}/lectures/
Body: { title, description, video_url, order }

// Add material
POST /api/courses/{courseId}/materials/
Body: { title, file_url, file_type, description }

// Get analytics
GET /api/academics/courses/{courseId}/analytics/
// Returns: {total_enrollments, engagement_score, completion_rate}
```

---

## 📱 Responsive Design

All components use TailwindCSS utilities for responsive layouts:

- **Mobile** (< 768px)
  - Single column layouts
  - Collapsible sidebar navigation
  - Touch-friendly buttons (min 44x44px)
  - Optimized video player
  - Full-width cards

- **Tablet** (768px - 1024px)
  - Two column grid layouts
  - Adjusted sidebar width
  - Medium text sizes

- **Desktop** (> 1024px)
  - Multi-column grids
  - Full sidebar
  - Maximum content width (1280px)

### Responsive Utilities Used
```css
/* Grid layouts */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

/* Text sizes */
text-xs md:text-sm lg:text-base

/* Padding/Margin */
p-4 md:p-6 lg:p-8

/* Display */
hidden md:block md:hidden lg:block
```

---

## ⚡ Performance Optimizations

### API Caching
- Department list: cached for 1 hour
- Semester list: cached for 30 minutes
- User progress: cached for 5 minutes

### Pagination
- 9 courses per page on semester view
- 10 comments per page with lazy loading
- Configurable via store parameters

### Lazy Loading
- Images loaded with `loading="lazy"`
- Comments loaded on scroll
- Video thumbnails preloaded

### Database Indexes
```python
# academics/models.py
class Semester:
    indexes = [
        models.Index(fields=['department', 'order']),
    ]

class Bookmark:
    indexes = [
        models.Index(fields=['user', 'created_at']),
    ]

class ProgressTracking:
    indexes = [
        models.Index(fields=['user', 'created_at']),
    ]
```

---

## 🚀 Deployment

### Docker Setup
The system is fully dockerized and uses:
- Python 3.11 + Django backend
- Node.js + React frontend
- PostgreSQL database
- Redis for caching
- NGINX reverse proxy

### Running Migrations
```bash
# In container
python manage.py migrate academics
python manage.py migrate courses

# Or in docker-compose
docker-compose exec web python manage.py migrate
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost/elms_db
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=localhost,example.com

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test academics

# Test specific model
python manage.py test academics.tests.DepartmentTestCase

# With coverage
coverage run --source='academics' manage.py test
coverage report
```

### Frontend Tests
```bash
# Run tests
npm test -- --watchAll=false

# With coverage
npm test -- --coverage --watchAll=false
```

---

## 📖 Integration with Existing Features

### Courses
- Existing `Course` model extended with `department` and `semester` FKs
- Backward compatible: existing courses without these fields continue to work
- New academic courses link to the hierarchy

### Enrollments
- Enrollment model unchanged
- Students can enroll in any course (academic or legacy)
- Academic courses require browsing departments first

### Assignments
- Can be linked to lectures within a course
- Deadline tracking per semester

### Live Classes
- Scheduled within a semester context
- Can be part of a course structure

### Notifications
- Notify when new lectures added
- Notify on discussion replies
- Notify on assignment deadlines

### Materials
- Existing `CourseMaterial` model linked to lectures
- Can be bookmarked and downloaded
- Usage tracked via `ProgressTracking`

---

## 🔍 Key Architectural Decisions

### 1. Backward Compatibility
- Academic fields (department, semester) are nullable on Course
- Existing courses work without academic structure
- Two parallel course browsing flows

### 2. Open Comments
- Comments visible to all logged-in users
- Encourages student discussion
- Teachers can moderate with pin/resolve

### 3. Flexible Semester Types
- Support both semester (1-8) and trimester (1-3) systems
- Configurable via `type` field
- Can be extended for quarters, etc.

### 4. Permissions Design
- Minimal permissions per action
- Clear role hierarchy: Student < Teacher < Admin
- Teachers manage only their own courses

### 5. Engagement Tracking
- Automatic view tracking after 5 seconds
- Manual download tracking on material access
- Non-intrusive analytics

---

## 🎓 What's New vs. What Existed

### Existing Features (Unchanged)
- ✅ JWT authentication
- ✅ Live streaming with HLS
- ✅ Assignment management
- ✅ Grading system
- ✅ Video lectures
- ✅ Course enrollment
- ✅ CMS dashboard
- ✅ Notifications
- ✅ Celery background jobs
- ✅ CDN integration

### New Features (Added)
- ✨ Academic hierarchy (Dept → Semester → Course)
- ✨ Department browsing
- ✨ Discussion system (comments with nesting)
- ✨ Bookmarking system
- ✨ Progress tracking
- ✨ Teacher analytics dashboard
- ✨ Course editor for teachers
- ✨ Public content browsing
- ✨ Semester-based organization

---

## 📞 Support

For issues or questions:
1. Check existing error logs: `docker-compose logs -f web`
2. Verify database migrations: `python manage.py showmigrations`
3. Check API endpoints: `GET /api/academics/departments/`
4. Review frontend console for JS errors

---

## 📝 License

Same as the main eLMS project

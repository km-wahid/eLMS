# Course Management System - Complete Implementation

## Overview
Complete course creation and management system following the academic hierarchy:
**Department → Semester → Course**

## Academic Hierarchy

### Structure
```
Department (e.g., CSE, BBA, EEE)
  └── Semester (e.g., Semester 1, Semester 2)
      └── Course (e.g., CS101 - Intro to Programming)
```

### Business Rules
1. **Course MUST belong to:**
   - A Department (required)
   - A Semester (required)
   - Semester must belong to the selected Department

2. **Teacher Assignment:**
   - Primary teacher (required)
   - Multiple additional teachers (optional)

3. **Publish Control (Critical):**
   - `is_published = false` → Hidden from students
   - `is_published = true` → Visible to students

4. **Thumbnail Handling:**
   - Supports both file upload and external URL
   - Priority: uploaded file → external URL

## Course Model Structure

```python
Course:
  - id (UUID)
  - title (string)
  - slug (auto-generated)
  - course_code (unique, e.g., CS101)
  - description (text)
  - department (FK - required)
  - semester (FK - required)
  - teacher (FK - primary teacher)
  - teachers (M2M - additional teachers)
  - category (FK - optional)
  - thumbnail (ImageField)
  - thumbnail_url (URLField)
  - level (beginner/intermediate/advanced)
  - is_published (boolean)
  - price (decimal)
  - created_at
  - updated_at
```

## API Endpoints

### 1. Course Management

#### List Published Courses (Public)
```http
GET /api/courses/
Query Parameters:
  - department={uuid}    # Filter by department
  - semester={uuid}      # Filter by semester
  - category={slug}      # Filter by category
  - level={level}        # Filter by level
  - search={query}       # Search in title
```

#### List Teacher's Courses
```http
GET /api/courses/mine/
Authorization: Bearer {token}
```

#### Create Course (Admin/Teacher)
```http
POST /api/courses/create/
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Introduction to Programming",
  "course_code": "CS101",
  "description": "Learn programming basics",
  "department_id": "uuid",
  "semester_id": "uuid",
  "teacher_ids": ["uuid1", "uuid2"],  // optional additional teachers
  "category_id": "uuid",               // optional
  "thumbnail": file,                   // optional upload
  "thumbnail_url": "https://...",      // optional external
  "level": "beginner",
  "is_published": true,
  "price": 0.00
}
```

#### Update Course
```http
PATCH /api/courses/{slug}/update/
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "is_published": true,
  ...
}
```

#### Delete Course
```http
DELETE /api/courses/{slug}/delete/
Authorization: Bearer {token}
```

#### Get Course Details
```http
GET /api/courses/{slug}/
```

### 2. Helper Endpoints

#### Get All Teachers (for dropdown)
```http
GET /api/accounts/teachers/
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
]
```

#### Get Departments
```http
GET /api/academics/departments/

Response:
[
  {
    "id": "uuid",
    "name": "Computer Science",
    "code": "CS",
    "slug": "computer-science"
  }
]
```

#### Get Semesters (filtered by department)
```http
GET /api/academics/semesters/?department={department_uuid}

Response:
[
  {
    "id": "uuid",
    "name": "Semester 1",
    "order": 1,
    "department": "uuid",
    "department_name": "Computer Science"
  }
]
```

### 3. Categories
```http
GET /api/courses/categories/
```

## Course Creation Flow (Frontend)

### Step 1: Select Department
```javascript
// Fetch departments
GET /api/academics/departments/

// User selects: CSE
```

### Step 2: Select Semester (Filtered)
```javascript
// Fetch semesters for selected department
GET /api/academics/semesters/?department={selected_department_id}

// User selects: Semester 1
```

### Step 3: Fill Course Details
```javascript
// Fetch teachers for dropdown
GET /api/accounts/teachers/

// User fills form:
{
  title: "Intro to Programming",
  course_code: "CS101",
  department_id: "{selected_from_step1}",
  semester_id: "{selected_from_step2}",
  teacher_ids: ["{selected_teachers}"],
  is_published: true,
  thumbnail: file
}
```

### Step 4: Submit
```javascript
POST /api/courses/create/
```

## Validation Rules

### Backend Validation
1. ✅ Course code must be unique
2. ✅ Semester must belong to selected department
3. ✅ Department and semester are required
4. ✅ Title and course_code are required
5. ✅ Auto-generates slug from title
6. ✅ At least primary teacher required

### Example Validation Error
```json
{
  "semester_id": ["Semester must belong to the selected department (Computer Science)"]
}
```

## Thumbnail Display Logic

```python
# Priority logic in model
@property
def thumbnail_display(self):
    if self.thumbnail:          # Uploaded file
        return self.thumbnail.url
    elif self.thumbnail_url:    # External URL
        return self.thumbnail_url
    return None
```

## Course Visibility Rules

### For Students
```python
# Only see published courses
GET /api/courses/  # Returns is_published=True only
```

### For Teachers/Admins
```python
# See all their courses (published and unpublished)
GET /api/courses/mine/  # Returns all courses they teach
```

## Multiple Teachers Support

### Primary Teacher
- Set automatically to the creating user
- Required field
- Backward compatible

### Additional Teachers
```javascript
// Assign multiple teachers
{
  "teacher_ids": ["uuid1", "uuid2", "uuid3"]
}

// Response includes all teachers
{
  "teacher_name": "Primary Teacher",
  "teachers": [
    {"id": "uuid1", "name": "Primary Teacher"},
    {"id": "uuid2", "name": "Additional Teacher 1"},
    {"id": "uuid3", "name": "Additional Teacher 2"}
  ]
}
```

## Database Indexes

For optimal performance:
- `department + semester` (composite)
- `teacher`
- `is_published`
- `course_code`

## Migration Applied

```bash
backend/courses/migrations/0004_update_course_structure.py
```

Changes:
- Added `teachers` M2M field
- Made `department` and `semester` required (PROTECT on delete)
- Made `course_code` unique
- Updated help texts
- Added indexes for performance

## Example Use Cases

### Use Case 1: Admin Creates Course
```javascript
// Admin logged in
POST /api/courses/create/
{
  "title": "Database Systems",
  "course_code": "CS301",
  "department_id": "cs-dept-uuid",
  "semester_id": "semester-3-uuid",
  "teacher_ids": ["teacher1-uuid", "teacher2-uuid"],
  "is_published": true,
  "thumbnail_url": "https://cdn.example.com/db-systems.jpg"
}

// Auto-generated:
// - slug: "database-systems"
// - primary teacher: admin (request.user)
```

### Use Case 2: Student Views Courses
```javascript
// Student browses courses
GET /api/courses/?department=cs-dept-uuid&semester=semester-1-uuid

// Returns only is_published=true courses
// Shows thumbnail_display with priority logic
```

### Use Case 3: Teacher Updates Course
```javascript
// Teacher updates their course
PATCH /api/courses/database-systems/update/
{
  "is_published": false,  // Unpublish temporarily
  "description": "Updated description"
}

// Validation ensures teacher owns this course
```

## Testing Checklist

- [ ] Create department
- [ ] Create semester under department
- [ ] Get teachers list
- [ ] Create course with all fields
- [ ] Verify semester validation (wrong department)
- [ ] Verify course_code uniqueness
- [ ] Test thumbnail upload
- [ ] Test thumbnail URL fallback
- [ ] Publish/unpublish course
- [ ] Verify student can only see published
- [ ] Assign multiple teachers
- [ ] Update course details
- [ ] Delete course

## Frontend Components Needed

### Admin Course Form
```jsx
<CourseForm>
  <DepartmentDropdown />      // Step 1
  <SemesterDropdown />        // Step 2 (filtered)
  <TextInput name="title" />
  <TextInput name="course_code" />
  <TeacherMultiSelect />      // Multiple selection
  <ImageUpload name="thumbnail" />
  <TextInput name="thumbnail_url" />
  <Toggle name="is_published" />
  <Submit />
</CourseForm>
```

### Student Course Card
```jsx
<CourseCard>
  <Thumbnail src={thumbnail_display} />
  <Title>{title}</Title>
  <CourseCode>{course_code}</CourseCode>
  <Department>{department_name}</Department>
  <Teachers>{teacher_names.join(', ')}</Teachers>
  <EnrollButton />
</CourseCard>
```

## Status

✅ Course model updated with hierarchy
✅ Multiple teachers support added
✅ Serializers created with validation
✅ API endpoints implemented
✅ Helper endpoints added (teachers, semesters filter)
✅ Migration created
✅ Thumbnail priority logic implemented
✅ Publish control enforced
✅ Auto-slug generation
✅ Department-Semester validation

## Next Steps

1. Apply migration: `python manage.py migrate courses`
2. Restart backend
3. Test API endpoints
4. Update frontend forms
5. Test complete flow

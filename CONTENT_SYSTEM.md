# eLMS Content Management System

## 📚 Overview

The eLMS uses a unified content system where courses are organized into modules, and each module contains multiple content items of different types.

---

## 🏗️ System Architecture

```
Course
  ├── Basic Info (name, code, department, semester, teacher, thumbnail, publish status)
  └── Modules (ordered topics/chapters)
      └── Content Items (videos, PDFs, slides, notes, links)
```

---

## 🎯 Core Features

### 1. Basic Course Information

Each course must have:

- **Course Name** - Full title of the course
- **Course Code** - Unique identifier (e.g., CS101, BBA201)
- **Department** - Academic department
- **Semester** - Academic semester (filtered by department)
- **Assigned Teacher(s)** - Primary teacher + additional teachers
- **Course Description** - Detailed description
- **Thumbnail** - Course image (upload or URL)
- **Publish Status** - Controls student visibility

**Model:** `Course`
**Fields:**
```python
title = CharField
course_code = CharField (unique)
department = ForeignKey (Department)
semester = ForeignKey (Semester)
teacher = ForeignKey (User) # primary teacher
teachers = ManyToManyField (User) # additional teachers
description = TextField
thumbnail = ImageField
thumbnail_url = URLField
is_published = BooleanField
```

---

### 2. Publish Control

**Admin/Teacher Control:**
- `is_published = False` → Hidden from students
- `is_published = True` → Visible to students

**Permissions:**
- Only Admin/Superuser can publish/unpublish courses
- Teachers can only edit course content

---

### 3. Course Structure

**Hierarchy:**
```
Course → Module → Content Items
```

**Module Features:**
- **title** - Module name (e.g., "Introduction", "Arrays", "Linked Lists")
- **description** - Module description
- **order** - Display order (sortable)
- **collapsible UI** - Expand/collapse in frontend

**Model:** `Module`
```python
course = ForeignKey(Course)
title = CharField
description = TextField
order = PositiveIntegerField
```

---

### 4. Content Types

Each module can contain **5 types of content**:

#### 📹 1. Video Content
- Upload video file OR provide external URL (YouTube, Vimeo)
- HLS streaming support for uploaded videos
- Duration tracking
- Downloadable (optional)

**Fields:**
```python
content_type = 'video'
video_file = FileField (optional)
video_url = URLField (optional)
hls_playlist_url = URLField (auto-generated)
duration_seconds = PositiveIntegerField
```

#### 📄 2. PDF Documents
- Upload PDF file
- File size tracking
- Downloadable

**Fields:**
```python
content_type = 'pdf'
file = FileField (required)
file_size = PositiveIntegerField (auto-calculated)
is_downloadable = BooleanField
```

#### 📊 3. Presentation Slides
- Upload PowerPoint, Google Slides export, PDF slides
- File size tracking
- Downloadable

**Fields:**
```python
content_type = 'slide'
file = FileField (required)
file_size = PositiveIntegerField (auto-calculated)
is_downloadable = BooleanField
```

#### 📝 4. Text Notes
- Rich text content (HTML supported)
- Embedded in page (no file download)

**Fields:**
```python
content_type = 'text'
content_text = TextField (required)
```

#### 🔗 5. External Links
- Link to external resources
- Opens in new tab

**Fields:**
```python
content_type = 'link'
external_url = URLField (required)
```

---

### 5. Unified Content Model

**Model:** `ContentItem`

```python
class ContentItem(models.Model):
    # Core
    module = ForeignKey(Module)
    title = CharField
    content_type = CharField (choices: video, pdf, slide, text, link)
    order = PositiveIntegerField
    description = TextField
    
    # Video fields
    video_file = FileField
    video_url = URLField
    hls_playlist_url = URLField
    hls_status = CharField
    duration_seconds = PositiveIntegerField
    
    # File fields (PDF, Slides)
    file = FileField
    file_size = PositiveIntegerField
    
    # Text content
    content_text = TextField
    
    # External link
    external_url = URLField
    
    # Common
    is_downloadable = BooleanField
    uploaded_by = ForeignKey(User)
    created_at = DateTimeField
    updated_at = DateTimeField
```

**Properties:**
- `duration_display` - Format duration as HH:MM:SS or MM:SS
- `file_size_display` - Format file size (KB, MB, GB)
- `file_url` - Get appropriate URL based on content type

---

## 👨‍🏫 Teacher Features

Teachers can:

### Module Management
- ✅ Create modules
- ✅ Edit module titles and descriptions
- ✅ Delete modules
- ✅ Reorder modules (drag & drop)

### Content Management
- ✅ Upload videos (file or URL)
- ✅ Upload PDFs
- ✅ Upload slides
- ✅ Create text notes
- ✅ Add external links
- ✅ Edit content items
- ✅ Delete content items
- ✅ Reorder content within modules
- ✅ Toggle downloadable status

---

## 👨‍🎓 Student Features

Students can:

### View Content
- ✅ Watch videos (streaming or external)
- ✅ Read text notes
- ✅ View slides
- ✅ Access external links

### Download Materials
- ✅ Download PDFs
- ✅ Download slides
- ✅ Download videos (if allowed)

### Navigation
- ✅ Browse modules
- ✅ Expand/collapse modules
- ✅ Navigate between content items
- ✅ Track progress

### Personal Notes
- ✅ Write notes per module
- ✅ Edit notes
- ✅ Notes are private (per student)
- ✅ Rich text editor support

**Model:** `Note` (separate app)
```python
user = ForeignKey(User)
module = ForeignKey(Module)
content = TextField (HTML)
unique_together = [('user', 'module')]
```

---

## 🖼️ Thumbnail Feature

Each course supports thumbnails with priority:

1. **Uploaded Image** - `thumbnail` field (ImageField)
2. **External URL** - `thumbnail_url` field (URLField)
3. **None** - Default placeholder

**Display Logic:**
```python
@property
def thumbnail_display(self):
    if self.thumbnail:
        return self.thumbnail.url
    elif self.thumbnail_url:
        return self.thumbnail_url
    return None
```

---

## 🔌 API Endpoints

### Content Items

**List content in a module:**
```
GET /api/courses/content/?module={module_id}
```

**Create content item:**
```
POST /api/courses/content/
{
  "module": "uuid",
  "title": "Introduction Video",
  "content_type": "video",
  "video_url": "https://youtube.com/watch?v=...",
  "order": 1,
  "description": "Introduction to the course"
}
```

**Update content item:**
```
PATCH /api/courses/content/{id}/
{
  "title": "Updated Title",
  "order": 2
}
```

**Delete content item:**
```
DELETE /api/courses/content/{id}/
```

**Reorder content items:**
```
POST /api/courses/content/reorder/
{
  "items": [
    {"id": "uuid1", "order": 1},
    {"id": "uuid2", "order": 2},
    {"id": "uuid3", "order": 3}
  ]
}
```

**Get download URL:**
```
GET /api/courses/content/{id}/download/
```

### Student Notes

**List notes for a module:**
```
GET /api/notes/?module={module_id}
```

**Create/Update note:**
```
POST /api/notes/
{
  "module": "uuid",
  "content": "<p>My notes here...</p>"
}
```

---

## 🔒 Permissions

| Action | Student | Teacher | Admin | Superuser |
|--------|---------|---------|-------|-----------|
| View published courses | ✅ | ✅ | ✅ | ✅ |
| View unpublished courses | ❌ | ✅ | ✅ | ✅ |
| Create modules | ❌ | ✅* | ✅ | ✅ |
| Edit modules | ❌ | ✅* | ✅ | ✅ |
| Create content | ❌ | ✅* | ✅ | ✅ |
| Edit content | ❌ | ✅* | ✅ | ✅ |
| Delete content | ❌ | ✅* | ✅ | ✅ |
| Publish/Unpublish courses | ❌ | ❌ | ✅ | ✅ |
| Create personal notes | ✅ | ✅ | ✅ | ✅ |

*Teacher can only manage content for courses they're assigned to

---

## 📝 Validation Rules

### Video Content
- Must have either `video_file` OR `video_url`
- Both can be provided (upload takes priority)

### PDF/Slide Content
- Must have `file` uploaded
- File size auto-calculated on save

### Text Notes
- Must have `content_text` (non-empty)
- HTML supported for rich formatting

### External Links
- Must have `external_url` (valid URL)

### Content Order
- Unique per module
- Teachers can reorder via drag-and-drop

---

## 🎨 Frontend Implementation

### Module Display
```jsx
{modules.map(module => (
  <div key={module.id} className="module">
    <h3 onClick={() => toggle(module.id)}>
      {module.title}
      <Icon name={expanded ? 'chevron-up' : 'chevron-down'} />
    </h3>
    
    {expanded && (
      <div className="content-list">
        {module.content_items.map(content => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    )}
  </div>
))}
```

### Content Card Display
```jsx
function ContentCard({ content }) {
  const icon = {
    video: <VideoIcon />,
    pdf: <FileIcon />,
    slide: <PresentationIcon />,
    text: <DocumentIcon />,
    link: <LinkIcon />
  }[content.content_type];
  
  return (
    <div className="content-card">
      {icon}
      <h4>{content.title}</h4>
      <p>{content.description}</p>
      {content.duration_display && <span>{content.duration_display}</span>}
      {content.file_size_display && <span>{content.file_size_display}</span>}
      {content.is_downloadable && <button>Download</button>}
    </div>
  );
}
```

### Video Player
```jsx
{content.content_type === 'video' && (
  <video controls src={content.file_url}>
    Your browser doesn't support video playback.
  </video>
)}
```

### PDF Viewer
```jsx
{content.content_type === 'pdf' && (
  <iframe src={content.file_url} width="100%" height="600px" />
)}
```

### Student Notes
```jsx
<div className="student-notes">
  <h4>My Notes for {module.title}</h4>
  <RichTextEditor
    value={note.content}
    onChange={(value) => saveNote(module.id, value)}
    placeholder="Write your notes here..."
  />
</div>
```

---

## 🗄️ Database Schema

```sql
-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    course_code VARCHAR(50) UNIQUE,
    department_id UUID REFERENCES departments(id),
    semester_id UUID REFERENCES semesters(id),
    teacher_id UUID REFERENCES users(id),
    description TEXT,
    thumbnail VARCHAR(255),
    thumbnail_url VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Modules
CREATE TABLE modules (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    order INT,
    created_at TIMESTAMP,
    UNIQUE(course_id, order)
);

-- Content Items
CREATE TABLE content_items (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content_type VARCHAR(10), -- video, pdf, slide, text, link
    order INT,
    video_file VARCHAR(255),
    video_url VARCHAR(255),
    hls_playlist_url VARCHAR(255),
    hls_status VARCHAR(20),
    duration_seconds INT,
    file VARCHAR(255),
    file_size INT,
    content_text TEXT,
    external_url VARCHAR(255),
    description TEXT,
    is_downloadable BOOLEAN DEFAULT TRUE,
    uploaded_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(module_id, order)
);

-- Student Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, module_id)
);
```

---

## ✅ Implementation Checklist

### Backend ✅
- [x] ContentItem model created
- [x] Data migration from Lecture and Material models
- [x] API serializers with validation
- [x] API views with permissions
- [x] URL routing configured
- [x] Admin panel registered

### Frontend 🔄 (To be implemented)
- [ ] Module list component
- [ ] Content item cards
- [ ] Video player component
- [ ] PDF viewer component
- [ ] Text notes editor (rich text)
- [ ] Student notes component
- [ ] Drag-and-drop reordering
- [ ] Upload progress indicators

---

## 🔧 Migration from Old System

### Completed Migrations
✅ **Lectures → Content Items (video)**
- Migrated 4 lectures
- Preserved video files and HLS URLs
- Maintained order

✅ **Materials → Content Items (pdf/slide)**
- Migrated 3 materials
- Preserved file attachments
- Maintained metadata

### Data Integrity
- ✅ All existing content preserved
- ✅ No data loss
- ✅ Relationships maintained
- ✅ Old models still exist (can be removed after verification)

---

## 📊 System Statistics

**Current Data:**
- 11 Courses
- 7 Content Items (migrated)
  - 4 Videos
  - 3 PDFs
- Multiple Modules across courses

**Content Types Supported:**
- ✅ Video (upload + URL)
- ✅ PDF
- ✅ Slides
- ✅ Text Notes
- ✅ External Links

---

## 🚀 Next Steps

1. **Remove Old Apps** (assignments, livestream, old lectures, old materials)
2. **Update Frontend** to use new ContentItem API
3. **Add Rich Text Editor** for student notes
4. **Implement Drag-and-Drop** for reordering
5. **Add Progress Tracking** for content completion
6. **Video Processing** for HLS conversion (Celery task)

---

**Status:** ✅ Backend Complete | 🔄 Frontend Pending
**Version:** 2.0.0
**Last Updated:** Current Session

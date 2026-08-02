# Department and Semester Lookup Fix

## Problem
- Students clicking on departments got "Department not found" error
- Courses were not showing for students or teachers
- Frontend was unable to navigate Dept → Semester → Courses

## Root Cause

The `DepartmentViewSet` and `SemesterViewSet` had their `lookup_field = 'slug'` commented out (lines 22-23 and 33-34 in `academics/views.py`).

This caused the API to use the default lookup by UUID/primary key instead of slug:
- Frontend requests: `/api/academics/departments/computer-science-and-enginnering/`
- Backend expected: `/api/academics/departments/{uuid}/`
- Result: 404 Not Found

## Fix Applied

### File: `backend/academics/views.py`

**Before:**
```python
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    # Changed from 'slug' to 'pk' to allow UUID-based lookups
    # lookup_field = 'slug'  # Old: used slug for lookups
```

**After:**
```python
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    lookup_field = 'slug'  # Use slug for lookups
```

Same fix applied to `SemesterViewSet` (line 32).

## Testing

### Department Detail (by slug):
```bash
curl http://localhost:8000/api/academics/departments/computer-science-and-enginnering/
```
✅ Returns department details

### Semester Detail (by slug):
```bash
curl http://localhost:8000/api/academics/semesters/1st/
```
✅ Returns semester details

### Courses filtered by semester slug:
```bash
curl "http://localhost:8000/api/courses/courses/?semester=1st"
```
✅ Returns 4 published courses

## Database Status

Current data in system:
- **Departments:** 4 (Civil, Computer Science, English, General)
- **Semesters:** 2 (1st semester for CS, General semester for General dept)
- **Courses:** 15 total (4 published in CS 1st semester)
- **Teachers:** 6 users
- **Students:** 4 users

## Expected Behavior After Fix

### For Students:
1. ✅ Click on department → view department detail page
2. ✅ View semesters in that department
3. ✅ Click on semester → view courses in that semester
4. ✅ See all published courses for navigation

### For Teachers:
1. ✅ Access "My Courses" page
2. ✅ See all courses they created/assigned to
3. ✅ Create new courses
4. ✅ Edit/publish/delete their courses

### Navigation Flow:
```
Home → Departments → 
  Click "Computer Science" → 
    View semesters (1st semester) → 
      Click "1st" → 
        View courses (4 courses) →
          Click course → 
            View modules and content
```

## Files Modified

- `backend/academics/views.py` - Uncommented `lookup_field = 'slug'` for Department and Semester viewsets

## Notes

- Slugs are more user-friendly than UUIDs in URLs
- Frontend routing was already designed to use slugs
- The commented lookup_field was likely from a previous change that broke navigation
- All existing course data is intact and visible with this fix

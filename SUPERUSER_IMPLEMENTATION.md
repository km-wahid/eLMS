# Superuser Role Implementation

## Overview
Added a hierarchical role system with a SUPERUSER role that can control admins, teachers, and students.

## Role Hierarchy
1. **Superuser** (highest) - Can manage all users including admins
2. **Admin** - Can manage courses, departments, semesters
3. **Teacher** - Can create and manage courses
4. **Student** - Can enroll and view courses

## Changes Made

### 1. User Model (`backend/accounts/models.py`)
- Added `SUPERUSER` to Role choices
- Updated `role` field max_length from 10 to 15
- Modified `create_superuser()` to set role as 'superuser' instead of 'admin'
- Updated `is_admin` property to include superusers
- Added `is_system_superuser` property to check for superuser role

### 2. Permissions (`backend/accounts/permissions.py`)
- **IsAdmin**: Now accepts users with role='admin', role='superuser', or is_superuser=True
- **IsSuperuser**: NEW - Only allows users with role='superuser' or is_superuser=True
- **IsTeacherOrAdmin**: Updated to include superusers

### 3. Views Updated
Updated permission checks in the following files to respect superuser role:
- `backend/lectures/views.py` - `_is_owner_or_admin()`
- `backend/assignments/views.py` - `_is_owner()`
- `backend/livestream/views.py` - `_is_owner()`
- `backend/materials/views.py` - `_is_owner_or_admin()`
- `backend/courses/views.py` - Course list, update, delete querysets
- `backend/academics/views.py` - CourseAnalytics queryset

### 4. User Management API (`backend/accounts/views.py`)
Added `UserManagementViewSet` with the following features:

**Endpoints:**
- `GET /api/accounts/users/` - List all users (with filtering)
- `POST /api/accounts/users/` - Create new user
- `GET /api/accounts/users/{id}/` - Get user details
- `PUT/PATCH /api/accounts/users/{id}/` - Update user
- `DELETE /api/accounts/users/{id}/` - Delete user
- `POST /api/accounts/users/{id}/toggle_active/` - Activate/deactivate user
- `POST /api/accounts/users/{id}/change_role/` - Change user role
- `POST /api/accounts/users/{id}/reset_password/` - Reset user password

**Query Parameters:**
- `?role=student|teacher|admin|superuser` - Filter by role
- `?search=query` - Search by name or email

### 5. Serializers (`backend/accounts/serializers.py`)
- Added `UserManagementSerializer` for full user management
- Includes password field for creation/update
- Generates random password if not provided

### 6. URLs (`backend/accounts/urls.py`)
- Added router for UserManagementViewSet
- New endpoints available at `/api/accounts/users/`

### 7. Migration
- Created `0003_add_superuser_role.py` to update role field

## Usage

### Create a Superuser
```bash
python3 manage.py createsuperuser
# This will create a user with role='superuser'
```

### API Examples

**1. List all users (Superuser only)**
```bash
GET /api/accounts/users/
Authorization: Bearer <token>
```

**2. Create an admin user**
```bash
POST /api/accounts/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "password": "SecurePass123!"
}
```

**3. Change user role**
```bash
POST /api/accounts/users/{user_id}/change_role/
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

**4. Toggle user active status**
```bash
POST /api/accounts/users/{user_id}/toggle_active/
Authorization: Bearer <token>
```

**5. Reset user password**
```bash
POST /api/accounts/users/{user_id}/reset_password/
Authorization: Bearer <token>
```

## Permission Matrix

| Action | Student | Teacher | Admin | Superuser |
|--------|---------|---------|-------|-----------|
| View courses | ✓ | ✓ | ✓ | ✓ |
| Create courses | ✗ | ✓ | ✓ | ✓ |
| Manage own courses | ✗ | ✓ | All courses | All courses |
| Manage departments | ✗ | ✗ | ✓ | ✓ |
| Manage semesters | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ |
| Manage admins | ✗ | ✗ | ✗ | ✓ |
| Change user roles | ✗ | ✗ | ✗ | ✓ |

## Security Notes

1. Only superusers can access user management endpoints
2. Password changes generate secure random passwords if not provided
3. All user management actions require authentication + superuser permission
4. Password reset returns temporary password (should be sent via email in production)

## Next Steps (Optional Enhancements)

1. Add email notifications for:
   - User creation
   - Password reset
   - Role changes
   
2. Add audit logging for:
   - User role changes
   - Account activations/deactivations
   - Password resets

3. Add bulk operations:
   - Bulk user import
   - Bulk role changes
   - Bulk activations/deactivations

4. Add user statistics dashboard for superusers

## Testing

To test the implementation:

1. Create a superuser:
   ```bash
   python3 manage.py createsuperuser
   ```

2. Login and get access token

3. Test user management endpoints with superuser token

4. Verify that admin users cannot access user management endpoints

5. Test department/semester creation with both admin and superuser roles

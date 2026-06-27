# Admin & Notifications API Documentation

## Overview
This document outlines the enhanced backend API for Admin and Notification segments in the MPBS system.

---

## Admin Endpoints

### 1. Get Dashboard Statistics
**GET** `/admin/stats`
- **Authentication**: Required (Admin role only)
- **Description**: Get overall dashboard statistics including user counts, notifications count, and breakdown by role
- **Response**:
```json
{
  "data": {
    "totalUsers": 45,
    "approvedUsers": 30,
    "rejectedUsers": 5,
    "pendingUsers": 10,
    "totalNotifications": 120,
    "usersByRole": {
      "Society": 20,
      "BMC": 15,
      "EO": 5,
      "Dairy": 3,
      "Other": 2
    }
  }
}
```

### 2. List Users with Search & Filter
**GET** `/admin/users`
- **Authentication**: Required (Admin role only)
- **Query Parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Items per page
  - `search` (optional): Search by username
  - `role` (optional): Filter by role (Admin, Society, BMC, EO, Dairy, Other)
  - `authStatus` (optional): Filter by status (Approved, Pending, Rejected)

**Example**: `GET /admin/users?search=ABC&role=Society&authStatus=Pending&page=1&limit=10`

### 3. Create User
**POST** `/admin/users`
- **Authentication**: Required (Admin role only)
- **Request Body**:
```json
{
  "username": "new_user",
  "password": "securePassword123",
  "role": "Society",
  "profile": {
    "societyName": "ABC Dairy Society",
    "location": "Mumbai"
  }
}
```

### 4. Update User Authorization Status
**PATCH** `/admin/users/:id/auth`
- **Authentication**: Required (Admin role only)
- **Request Body**:
```json
{
  "authStatus": "Approved"
}
```
- **Valid Values**: "Approved", "Pending", "Rejected"

### 5. Update User Details
**PATCH** `/admin/users/:id`
- **Authentication**: Required (Admin role only)
- **Request Body** (all fields optional):
```json
{
  "username": "updated_username",
  "role": "BMC",
  "authStatus": "Approved",
  "profile": {
    "societyName": "Updated Name"
  }
}
```

### 6. Delete User
**DELETE** `/admin/users/:id`
- **Authentication**: Required (Admin role only)
- **Restrictions**: Cannot delete the last admin user
- **Response**: 
```json
{
  "message": "User deleted successfully"
}
```

### 7. Reset User Password
**POST** `/admin/users/:id/reset-password`
- **Authentication**: Required (Admin role only)
- **Request Body**:
```json
{
  "newPassword": "newSecurePassword123"
}
```
- **Validation**: Password must be at least 6 characters

---

## Notification Endpoints

### 1. List Notifications
**GET** `/notifications`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Items per page
  - `role` (optional): Filter by recipient role (Admin only)
  - `status` (optional): Filter by status (active/archived, default: active)

**Behavior**:
- **Admin users**: See all notifications, optionally filtered by role
- **Other users**: See notifications sent to:
  - "All" roles
  - Their specific role (to all or specific users)
  - Directly to them

**Response**:
```json
{
  "data": [
    {
      "_id": "notification_id",
      "sentToRole": "Society",
      "sentToScope": "all",
      "message": "Important update",
      "fileUrl": "https://...",
      "sentBy": {
        "_id": "user_id",
        "username": "admin_user",
        "role": "Admin"
      },
      "isRead": false,
      "createdAt": "2024-03-17T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Create Notification
**POST** `/notifications`
- **Authentication**: Required (Admin role only)
- **Request Body**:
```json
{
  "sentToRole": "Society",
  "sentToScope": "all",
  "message": "Important maintenance notice",
  "fileUrl": "https://..."
}
```

**For Specific User Target**:
```json
{
  "sentToRole": "Society",
  "sentToScope": "specific",
  "sentToUserId": "specific_user_id",
  "sentToName": "User Display Name",
  "message": "Personal notification"
}
```

### 3. Mark Notification as Read
**PATCH** `/notifications/:notificationId/read`
- **Authentication**: Required
- **Purpose**: Track when a user reads a notification
- **Response**:
```json
{
  "data": {
    "_id": "notification_id",
    "message": "...",
    "isRead": true,
    "readBy": [
      {
        "userId": "user_id",
        "readAt": "2024-03-17T10:05:00Z"
      }
    ]
  }
}
```

### 4. Delete/Archive Notification
**DELETE** `/notifications/:notificationId`
- **Authentication**: Required (Admin role only)
- **Purpose**: Archive a notification (changes status to "archived")
- **Response**:
```json
{
  "data": {
    "_id": "notification_id",
    "status": "archived"
  }
}
```

### 5. Get Unread Notification Count
**GET** `/notifications/unread-count`
- **Authentication**: Required
- **Purpose**: Get count of unread notifications for current user
- **Response**:
```json
{
  "unreadCount": 5
}
```

---

## Data Models

### User Model
```javascript
{
  username: String (unique, required),
  passwordHash: String (required),
  role: String (enum: Admin, Society, BMC, EO, Dairy, Other),
  authStatus: String (enum: Approved, Pending, Rejected, default: Pending),
  profile: Object (flexible structure),
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  sentToRole: String (required),
  sentToScope: String (enum: all, specific, default: all),
  sentToUserId: ObjectId (optional, for specific targeting),
  sentToName: String (optional),
  message: String (required),
  fileUrl: String (optional),
  readBy: [
    {
      userId: ObjectId,
      readAt: Date
    }
  ],
  sentBy: ObjectId (Admin who sent it),
  status: String (enum: active, archived, default: active),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Features

### Notification Broadcasting
When you send a notification to a chosen role (e.g., "Society"):
- All users with that role will receive it
- Scope can be "all" (all in that role) or "specific" (to individual users)

### Read Tracking
- Each user's read status is tracked separately
- The `isRead` flag is computed for each user based on `readBy` array
- Useful for unread notification badges on the UI

### Admin Dashboard
- Quick overview of user statistics by role
- Total active notifications count
- Approval status distribution

---

## Authentication
All endpoints require:
1. **Authorization Header**: Valid JWT token in `Authorization: Bearer <token>`
2. **Admin Role**: Indicated for endpoints marked with "Admin role only"

---

## Error Handling
Common HTTP Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Server Error

Error Response Format:
```json
{
  "message": "Error description"
}
```

---

## Usage Examples

### Send notification to all Society users:
```bash
curl -X POST http://localhost:4000/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sentToRole": "Society",
    "sentToScope": "all",
    "message": "Maintenance scheduled for tomorrow"
  }'
```

### Get pending approvals:
```bash
curl "http://localhost:4000/admin/users?authStatus=Pending&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Check unread notifications:
```bash
curl http://localhost:4000/notifications/unread-count \
  -H "Authorization: Bearer <token>"
```

### Mark notification as read:
```bash
curl -X PATCH http://localhost:4000/notifications/notification_id/read \
  -H "Authorization: Bearer <token>"
```

---

## Last Updated
March 17, 2026

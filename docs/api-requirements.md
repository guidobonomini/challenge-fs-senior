# API Requirements

## Base Requirements

### API Design Standards
- **RESTful architecture** with proper HTTP methods
- **Consistent naming conventions** (snake_case for JSON fields)
- **Proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500)
- **Request/Response format**: JSON
- **API versioning**: `/api/v1/` prefix
- **CORS configuration** for frontend integration

### Authentication & Authorization

#### Authentication Endpoints
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

#### Authorization Levels
- **Public**: Registration, login, password reset
- **Authenticated**: All user operations
- **Manager**: Team and project management
- **Admin**: User management, system settings

### Required API Endpoints

#### User Management
```
GET    /api/v1/users                    # List users (Admin only)
GET    /api/v1/users/me                 # Current user profile
PUT    /api/v1/users/me                 # Update current user
GET    /api/v1/users/{id}               # Get user by ID
PUT    /api/v1/users/{id}               # Update user (Admin/Manager)
DELETE /api/v1/users/{id}               # Delete user (Admin only)
POST   /api/v1/users/{id}/avatar        # Upload user avatar
```

#### Team Management
```
GET    /api/v1/teams                    # List user's teams
POST   /api/v1/teams                    # Create team (Manager+)
GET    /api/v1/teams/{id}               # Get team details
PUT    /api/v1/teams/{id}               # Update team (Manager+)
DELETE /api/v1/teams/{id}               # Delete team (Admin only)
POST   /api/v1/teams/{id}/members       # Add team member
DELETE /api/v1/teams/{id}/members/{user_id} # Remove team member
GET    /api/v1/teams/{id}/analytics     # Team performance metrics
```

#### Project Management
```
GET    /api/v1/projects                 # List user's projects
POST   /api/v1/projects                 # Create project (Manager+)
GET    /api/v1/projects/{id}            # Get project details
PUT    /api/v1/projects/{id}            # Update project (Manager+)
DELETE /api/v1/projects/{id}            # Delete project (Manager+)
GET    /api/v1/projects/{id}/tasks      # Get project tasks
GET    /api/v1/projects/{id}/analytics  # Project analytics
POST   /api/v1/projects/{id}/archive    # Archive project
```

#### Task Management
```
GET    /api/v1/tasks                    # List tasks with filters
POST   /api/v1/tasks                    # Create task
GET    /api/v1/tasks/{id}               # Get task details
PUT    /api/v1/tasks/{id}               # Update task
DELETE /api/v1/tasks/{id}               # Delete task
POST   /api/v1/tasks/{id}/assign        # Assign task to user
POST   /api/v1/tasks/{id}/attachments   # Upload task attachment
GET    /api/v1/tasks/{id}/attachments   # List task attachments
DELETE /api/v1/tasks/{id}/attachments/{attachment_id} # Delete attachment
POST   /api/v1/tasks/{id}/time          # Log time entry
GET    /api/v1/tasks/{id}/time          # Get time entries
POST   /api/v1/tasks/bulk-update        # Bulk update tasks
```

#### Comments
```
GET    /api/v1/tasks/{task_id}/comments     # Get task comments
POST   /api/v1/tasks/{task_id}/comments     # Add comment
PUT    /api/v1/comments/{id}                # Update comment
DELETE /api/v1/comments/{id}                # Delete comment
```

#### Dashboard & Analytics
```
GET    /api/v1/dashboard                    # User dashboard data
GET    /api/v1/analytics/tasks             # Task analytics
GET    /api/v1/analytics/teams             # Team performance
GET    /api/v1/analytics/projects          # Project metrics
GET    /api/v1/analytics/time-tracking     # Time tracking reports
```

#### Search & Filtering
```
GET    /api/v1/search                      # Global search
GET    /api/v1/tasks?filters               # Advanced task filtering
```

## Request/Response Specifications

### Authentication

#### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  }
}
```

#### POST /api/v1/auth/register
**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Task Operations

#### GET /api/v1/tasks
**Query Parameters:**
- `page` (int): Page number for pagination
- `limit` (int): Items per page (max 100)
- `status` (string): Filter by status (todo, in_progress, completed)
- `priority` (string): Filter by priority (low, medium, high)
- `assignee_id` (int): Filter by assigned user
- `project_id` (int): Filter by project
- `due_date_from` (date): Filter tasks due after date
- `due_date_to` (date): Filter tasks due before date
- `search` (string): Search in title and description

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Implement user authentication",
      "description": "Build JWT-based auth system",
      "status": "in_progress",
      "priority": "high",
      "project": {
        "id": 1,
        "name": "E-commerce Platform"
      },
      "assignee": {
        "id": 2,
        "name": "John Developer",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "created_by": {
        "id": 1,
        "name": "Project Manager"
      },
      "due_date": "2025-01-20T00:00:00Z",
      "estimated_hours": 16,
      "actual_hours": 8,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-18T14:30:00Z",
      "attachments_count": 2,
      "comments_count": 5
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### POST /api/v1/tasks
**Request:**
```json
{
  "title": "Design user interface",
  "description": "Create wireframes for the new dashboard",
  "project_id": 1,
  "assignee_id": 3,
  "priority": "medium",
  "due_date": "2025-01-25",
  "estimated_hours": 12,
  "tags": ["design", "ui", "dashboard"]
}
```

**Response (201):**
```json
{
  "id": 2,
  "title": "Design user interface",
  "description": "Create wireframes for the new dashboard",
  "status": "todo",
  "priority": "medium",
  "project_id": 1,
  "assignee_id": 3,
  "created_by_id": 1,
  "due_date": "2025-01-25T00:00:00Z",
  "estimated_hours": 12,
  "actual_hours": 0,
  "created_at": "2025-01-18T15:30:00Z",
  "updated_at": "2025-01-18T15:30:00Z"
}
```

### Real-time Features

#### WebSocket Events
Connect to: `ws://localhost:8000/ws?token={jwt_token}`

**Events to emit:**
- `task_updated`: When task status/details change
- `task_assigned`: When task is assigned to user
- `comment_added`: New comment on task
- `user_online`: User comes online
- `user_viewing_task`: User is viewing specific task

**Event Format:**
```json
{
  "type": "task_updated",
  "data": {
    "task_id": 1,
    "changes": {
      "status": "completed",
      "actual_hours": 16
    },
    "updated_by": {
      "id": 2,
      "name": "John Developer"
    },
    "timestamp": "2025-01-18T16:00:00Z"
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "email": ["The email field is required"],
      "password": ["The password must be at least 8 characters"]
    }
  },
  "timestamp": "2025-01-18T16:00:00Z",
  "path": "/api/v1/auth/login"
}
```

### Error Codes
- `VALIDATION_ERROR` (400): Invalid input data
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Validation Rules

### User Registration
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters, contains uppercase, lowercase, number

### Task Creation
- `title`: Required, 3-200 characters
- `description`: Optional, max 2000 characters
- `project_id`: Required, must exist and user must have access
- `assignee_id`: Optional, must be team member
- `priority`: Required, one of: low, medium, high
- `due_date`: Optional, must be future date
- `estimated_hours`: Optional, positive number

### File Uploads
- **Max file size**: 10MB
- **Allowed types**: jpg, jpeg, png, gif, pdf, doc, docx, txt
- **Naming**: Original filename preserved with UUID prefix

## Performance Requirements

### Response Times
- Authentication: < 200ms
- Task listing: < 300ms
- Task creation: < 500ms
- File upload: < 2s (10MB)

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Include pagination metadata in all list responses

### Caching Strategy
- User sessions: Redis cache
- Frequently accessed data: Application-level cache
- Static assets: CDN caching
- API responses: Cache headers for appropriate endpoints

## Security Requirements

### Input Validation
- Sanitize all input data
- Validate data types and ranges
- Prevent SQL injection
- Prevent XSS attacks

### Authentication Security
- JWT tokens with expiration
- Refresh token rotation
- Password hashing (bcrypt, minimum 12 rounds)
- Rate limiting on auth endpoints (5 attempts per minute)

### Authorization Checks
- Verify user permissions on every protected endpoint
- Validate resource ownership
- Implement role-based access control

### File Upload Security
- Validate file types by content, not just extension
- Scan for malware (if possible)
- Store files outside web root
- Generate unique filenames

## Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 5 requests per minute per IP
- **File uploads**: 10 requests per hour per user
- **API calls**: 1000 requests per hour per user
- **WebSocket connections**: 5 concurrent per user

### Rate Limit Headers
Include in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## Documentation Requirements

Your API must include:
1. **OpenAPI/Swagger specification** (preferred)
2. **Postman collection** with example requests
3. **Authentication flow documentation**
4. **Error handling examples**
5. **Rate limiting information**
6. **WebSocket event documentation**

Example swagger endpoint: `GET /api/v1/docs`
# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <token>
```

## Response Format
All responses are in JSON format:
```json
{
  "message": "Success message",
  "data": { /* Response data */ }
}
```

Errors:
```json
{
  "error": "Error message"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Send verification code to email.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (200):**
```json
{
  "message": "Verification code sent to your email",
  "email": "john@example.com"
}
```

### Verify Email
**POST** `/auth/verify`

Complete registration with verification code.

**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response (201):**
```json
{
  "message": "Email verified successfully. You can now login.",
  "success": true,
  "user": {
    "id": "mongo-object-id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt-token-here"
}
```

### Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "mongo-object-id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null,
    "isAdmin": false
  },
  "token": "jwt-token-here"
}
```

### Resend Verification Code
**POST** `/auth/resend-code`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "New verification code sent to your email"
}
```

### Get User Profile
**GET** `/auth/profile`

Requires authentication.

**Response (200):**
```json
{
  "user": {
    "id": "mongo-object-id",
    "name": "John Doe",
    "email": "john@example.com",
    "verified": true,
    "avatar": "url-to-avatar",
    "bio": "My bio",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "emailNotifications": true,
      "language": "en"
    },
    "stats": {
      "totalJournals": 5,
      "totalChats": 3,
      "lastActive": "2024-01-20T10:30:00Z"
    },
    "isAdmin": false,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}
```

### Update User Profile
**PUT** `/auth/profile`

Requires authentication.

**Request:**
```json
{
  "name": "John Doe",
  "bio": "Updated bio",
  "avatar": "new-avatar-url",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

## Journal Endpoints

### Create Journal
**POST** `/journals`

Requires authentication.

**Request:**
```json
{
  "title": "My Journal Entry",
  "content": "Today was a great day...",
  "mood": "good",
  "moodScore": 8,
  "tags": ["happiness", "gratitude"],
  "isPrivate": true
}
```

**Response (201):**
```json
{
  "message": "Journal created successfully",
  "journal": {
    "id": "mongo-object-id",
    "userId": "user-id",
    "title": "My Journal Entry",
    "content": "Today was a great day...",
    "mood": "good",
    "moodScore": 8,
    "tags": ["happiness", "gratitude"],
    "isPrivate": true,
    "isFavorite": false,
    "isArchived": false,
    "editHistory": [],
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

### Get All Journals
**GET** `/journals?page=1&limit=10&mood=good&tag=happiness&search=keyword`

Requires authentication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `mood` (optional): Filter by mood
- `tag` (optional): Filter by tag
- `search` (optional): Search in title and content

**Response (200):**
```json
{
  "journals": [ /* array of journals */ ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Get Single Journal
**GET** `/journals/:id`

Requires authentication.

**Response (200):**
```json
{
  "journal": { /* journal object */ }
}
```

### Update Journal
**PUT** `/journals/:id`

Requires authentication.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "mood": "excellent",
  "moodScore": 9,
  "tags": ["updated"],
  "isFavorite": true
}
```

**Response (200):**
```json
{
  "message": "Journal updated successfully",
  "journal": { /* updated journal */ }
}
```

### Delete Journal
**DELETE** `/journals/:id`

Requires authentication.

**Response (200):**
```json
{
  "message": "Journal deleted successfully"
}
```

### Archive Journal
**PATCH** `/journals/:id/archive`

Requires authentication.

**Response (200):**
```json
{
  "message": "Journal archived successfully",
  "journal": { /* archived journal */ }
}
```

---

## Chat Endpoints

### Create Chat
**POST** `/chats`

Requires authentication.

**Request:**
```json
{
  "conversationTitle": "Discussing Anxiety",
  "initialMessage": "I've been feeling anxious lately..."
}
```

**Response (201):**
```json
{
  "message": "Chat created successfully",
  "chat": {
    "id": "mongo-object-id",
    "userId": "user-id",
    "conversationTitle": "Discussing Anxiety",
    "messages": [
      {
        "role": "user",
        "content": "I've been feeling anxious lately...",
        "timestamp": "2024-01-20T10:00:00Z",
        "isEdited": false
      }
    ],
    "sentiment": "neutral",
    "riskLevel": "low",
    "tags": [],
    "isFavorite": false,
    "isArchived": false,
    "aiModel": "gpt-4o-mini",
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

### Get All Chats
**GET** `/chats?page=1&limit=10&sentiment=positive&riskLevel=high`

Requires authentication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sentiment` (optional): Filter by sentiment
- `riskLevel` (optional): Filter by risk level

**Response (200):**
```json
{
  "chats": [ /* array of chats (without messages) */ ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Get Single Chat
**GET** `/chats/:id`

Requires authentication.

**Response (200):**
```json
{
  "chat": { /* full chat with all messages */ }
}
```

### Add Message to Chat
**POST** `/chats/:id/messages`

Requires authentication.

**Request:**
```json
{
  "content": "I think I should seek professional help...",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "Message added successfully",
  "chat": { /* updated chat */ }
}
```

### Update Chat Metadata
**PUT** `/chats/:id`

Requires authentication.

**Request:**
```json
{
  "conversationTitle": "Updated Title",
  "sentiment": "positive",
  "riskLevel": "critical",
  "tags": ["anxiety", "important"],
  "isFavorite": true,
  "summary": "This conversation was about..."
}
```

**Response (200):**
```json
{
  "message": "Chat updated successfully",
  "chat": { /* updated chat */ }
}
```

### Delete Chat
**DELETE** `/chats/:id`

Requires authentication.

**Response (200):**
```json
{
  "message": "Chat deleted successfully"
}
```

### Archive Chat
**PATCH** `/chats/:id/archive`

Requires authentication.

**Response (200):**
```json
{
  "message": "Chat archived successfully",
  "chat": { /* archived chat */ }
}
```

---

## Statistics Endpoints

### Get User Overview
**GET** `/stats/overview`

Requires authentication.

**Response (200):**
```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "verified": true,
    "createdAt": "2024-01-20T10:00:00Z"
  },
  "stats": {
    "totalJournals": 5,
    "totalChats": 3,
    "lastActive": "2024-01-20T10:30:00Z"
  },
  "moodStats": [
    {
      "_id": "good",
      "count": 3
    },
    {
      "_id": "neutral",
      "count": 2
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "error": "Email not verified. Please check your email."
}
```

### 404 Not Found
```json
{
  "error": "Journal not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting. Recommended to implement in production.

## CORS

CORS is enabled for `http://localhost:5173` (frontend URL).

Change in backend `.env`:
```
FRONTEND_URL=https://yourdomain.com
```

## Pagination

Default pagination:
- Page: 1
- Limit: 10

Maximum limit: 100

Example with pagination:
```
GET /journals?page=2&limit=20
```

Returns items 21-40.

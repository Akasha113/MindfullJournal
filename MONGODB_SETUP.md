# MongoDB Integration Setup Guide

## Overview
Your Zenify application now integrates MongoDB to persistently store:
- **User Information** - Account details, preferences, statistics
- **Journals** - All journal entries with mood tracking
- **Chats** - Conversation history with AI

## Database Structure

### Collections

#### 1. **Users**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  verified: Boolean,
  verifiedAt: Date,
  avatar: String,
  bio: String,
  preferences: {
    theme: 'light|dark|auto',
    notifications: Boolean,
    emailNotifications: Boolean,
    language: String
  },
  stats: {
    totalJournals: Number,
    totalChats: Number,
    lastActive: Date
  },
  isAdmin: Boolean,
  isDeleted: Boolean,
  timestamps: true
}
```

#### 2. **Journals**
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  mood: 'excellent|good|neutral|sad|anxious|angry',
  moodScore: Number (1-10),
  tags: [String],
  isPrivate: Boolean,
  images: [{url, uploadedAt}],
  isFavorite: Boolean,
  isArchived: Boolean,
  editHistory: [{content, editedAt}],
  timestamps: true
}
```

#### 3. **Chats**
```javascript
{
  userId: ObjectId (ref: User),
  conversationTitle: String,
  messages: [{
    role: 'user|assistant',
    content: String,
    timestamp: Date,
    isEdited: Boolean
  }],
  summary: String,
  sentiment: 'positive|neutral|negative',
  riskLevel: 'low|medium|high|critical',
  tags: [String],
  isFavorite: Boolean,
  isArchived: Boolean,
  aiModel: String,
  timestamps: true
}
```

#### 4. **VerificationCodes**
```javascript
{
  email: String,
  code: String,
  userData: {name, password},
  expiresAt: Date (auto-delete),
  attempts: Number,
  maxAttempts: Number,
  timestamps: true
}
```

## Setup Instructions

### Step 1: MongoDB Connection

**Option A: Local MongoDB**
```bash
# Windows - Install MongoDB Community
# Download from https://www.mongodb.com/try/download/community

# Start MongoDB service
net start MongoDB

# Backend .env
MONGODB_URI=mongodb://localhost:27017/zenify
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Add to `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zenify?retryWrites=true&w=majority
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Environment Configuration

Create `.env` in backend directory:
```
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zenify?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRE=7d

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start Backend Server

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user (sends verification)
- `POST /api/auth/verify` - Verify email code
- `POST /api/auth/login` - Login with verified account
- `POST /api/auth/resend-code` - Resend verification code
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Journals
- `POST /api/journals` - Create journal
- `GET /api/journals` - Get all journals (paginated)
- `GET /api/journals/:id` - Get single journal
- `PUT /api/journals/:id` - Update journal
- `DELETE /api/journals/:id` - Delete journal
- `PATCH /api/journals/:id/archive` - Archive journal

### Chats
- `POST /api/chats` - Create chat conversation
- `GET /api/chats` - Get all chats (paginated)
- `GET /api/chats/:id` - Get single chat
- `POST /api/chats/:id/messages` - Add message to chat
- `PUT /api/chats/:id` - Update chat metadata
- `DELETE /api/chats/:id` - Delete chat
- `PATCH /api/chats/:id/archive` - Archive chat

### Statistics
- `GET /api/stats/overview` - Get user statistics

## Authentication (JWT Tokens)

All protected endpoints require Authorization header:
```
Authorization: Bearer <token>
```

Token is returned on:
- Successful verification: `/api/auth/verify`
- Login: `/api/auth/login`

## Features Implemented

### ✅ User Management
- Email verification system
- Secure password hashing
- JWT token authentication
- Profile management
- User statistics tracking

### ✅ Journal Management
- Create/Read/Update/Delete journals
- Mood tracking with scores
- Tag system for organization
- Edit history preservation
- Archive functionality
- Favorite marking
- Search capability

### ✅ Chat Management
- Multi-message conversations
- Sentiment analysis tracking
- Risk level monitoring
- Conversation titles
- Archive functionality
- Favorite marking
- Tags for organization

### ✅ Data Security
- Password hashing (PBKDF2)
- Email verification before access
- JWT tokens with expiration
- User data isolation
- MongoDB indexing for performance

## Frontend Integration

### Update API Calls

Replace local storage with API calls. Example for journal creation:

```typescript
// Before (Local Storage)
const journal = storage.addJournal({...});

// After (MongoDB)
const response = await fetch('http://localhost:3001/api/journals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title,
    content,
    mood,
    moodScore,
    tags
  })
});
const { journal } = await response.json();
```

## Query Examples

### Get user's journals by mood
```
GET /api/journals?mood=good&page=1&limit=10
```

### Search journals
```
GET /api/journals?search=anxiety&page=1&limit=10
```

### Get chats with high risk level
```
GET /api/chats?riskLevel=high&page=1&limit=10
```

## Performance Optimization

### Indexes Created
- `userId + createdAt` on journals
- `userId + tags` on journals
- `userId + mood` on journals
- `userId + createdAt` on chats
- `userId + sentiment` on chats
- `userId + riskLevel` on chats

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Verify MONGODB_URI in .env |
| Email verification not working | Check GMAIL credentials |
| JWT errors | Ensure token is included in Authorization header |
| CORS errors | Verify FRONTEND_URL matches your frontend |
| Slow queries | Check MongoDB indexes |

## Database Backup

### MongoDB Atlas
1. Go to Backup in your cluster
2. Configure automatic daily backups
3. Can restore snapshots as needed

### Local MongoDB
```bash
# Backup
mongodump --db zenify --out backup/

# Restore
mongorestore --db zenify backup/zenify/
```

## Monitoring & Logs

### MongoDB Atlas
- Built-in monitoring dashboard
- Performance Advisor
- Query profiler
- Real-time alerts

### Local MongoDB
```bash
# Check MongoDB service status
Get-Service MongoDB

# View logs
# Windows: C:\Program Files\MongoDB\Server\<version>\log
```

## Next Steps

1. **Test the API** - Use Postman or similar tool
2. **Update Frontend** - Replace local storage with API calls
3. **Handle Errors** - Add proper error handling in frontend
4. **Add Rate Limiting** - Prevent abuse
5. **Implement Pagination** - For large datasets
6. **Add Validation** - Server-side input validation
7. **Set up Monitoring** - Track API performance

## Production Checklist

- [ ] Use MongoDB Atlas for production
- [ ] Enable SSL/TLS for connections
- [ ] Set up automated backups
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Enable database indexing optimization
- [ ] Configure CORS properly
- [ ] Use strong JWT secrets
- [ ] Hash passwords with bcrypt (not PBKDF2)
- [ ] Implement request validation
- [ ] Add API documentation (Swagger)
- [ ] Set up CI/CD pipeline
- [ ] Monitor database performance

## API Documentation

For detailed API documentation, see `API_DOCUMENTATION.md`

## Support

For MongoDB help:
- MongoDB Docs: https://docs.mongodb.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Community: https://community.mongodb.com/

For issues with this implementation, check:
- Backend logs for errors
- MongoDB Atlas dashboard
- Browser console for frontend errors

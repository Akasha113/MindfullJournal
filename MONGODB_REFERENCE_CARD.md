# MongoDB Integration - Reference Card

## Quick Commands

### Start Backend
```bash
cd backend
npm install          # First time only
npm start           # Run server on port 3001
```

### Start Frontend
```bash
npm run dev         # Run on http://localhost:5173
```

### MongoDB Connection
```bash
# Local MongoDB
mongodb://localhost:27017/zenify

# MongoDB Atlas (Cloud)
mongodb+srv://user:password@cluster.mongodb.net/zenify?retryWrites=true&w=majority
```

## Environment Variables

### Backend .env
```
MONGODB_URI=mongodb://localhost:27017/zenify
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

### Frontend .env
```
VITE_API_URL=http://localhost:3001
```

## API Usage Examples

### Create Journal
```typescript
import { journalAPI } from '@/utils/api';

const newJournal = await journalAPI.create({
  title: "Today's Entry",
  content: "I felt great today...",
  mood: "good",
  moodScore: 8,
  tags: ["happiness", "friends"],
  isPrivate: true
});
```

### Get Journals
```typescript
const { journals, pagination } = await journalAPI.getAll(
  1,    // page
  10,   // limit
  {     // filters
    mood: "good",
    tag: "happiness",
    search: "friends"
  }
);
```

### Create Chat
```typescript
const chat = await chatAPI.create({
  conversationTitle: "Daily Check-in",
  initialMessage: "How have you been?"
});
```

### Add Message
```typescript
const updated = await chatAPI.addMessage(
  chatId,
  "I've been feeling better lately",
  "user"
);
```

### Get User Stats
```typescript
const stats = await userAPI.getStats();
// Returns: { user, stats, moodStats }
```

## Database Collections

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  verified: Boolean,
  avatar: String,
  preferences: {
    theme: String,
    notifications: Boolean,
    language: String
  },
  stats: {
    totalJournals: Number,
    totalChats: Number,
    lastActive: Date
  }
}
```

### Journal Schema
```javascript
{
  userId: ObjectId,
  title: String,
  content: String,
  mood: String, // excellent|good|neutral|sad|anxious|angry
  moodScore: Number, // 1-10
  tags: [String],
  isFavorite: Boolean,
  isArchived: Boolean,
  editHistory: [{content, editedAt}]
}
```

### Chat Schema
```javascript
{
  userId: ObjectId,
  conversationTitle: String,
  messages: [{
    role: String, // user|assistant
    content: String,
    timestamp: Date
  }],
  sentiment: String, // positive|neutral|negative
  riskLevel: String, // low|medium|high|critical
  isFavorite: Boolean,
  isArchived: Boolean
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| MongoDB connection failed | Check MONGODB_URI in .env |
| Token expired | User needs to log in again |
| CORS error | Verify FRONTEND_URL matches |
| Email not sent | Check Gmail credentials |
| 401 Unauthorized | Include Authorization header |
| Email already registered | Use different email |

## Auth Headers
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <your-jwt-token>'
}
```

## Authentication Flow

```
1. User registers → Creates account
2. Email sent → With 6-digit code
3. User verifies → Enters code
4. Account created → In MongoDB
5. User logs in → Gets JWT token
6. Token stored → In localStorage
7. Token used → In API requests
8. Token expires → After 7 days
9. User logs in again → Gets new token
```

## API Endpoint Categories

### Auth (6 endpoints)
```
POST   /auth/register
POST   /auth/verify
POST   /auth/login
POST   /auth/resend-code
GET    /auth/profile
PUT    /auth/profile
```

### Journals (6 endpoints)
```
POST   /journals
GET    /journals
GET    /journals/:id
PUT    /journals/:id
DELETE /journals/:id
PATCH  /journals/:id/archive
```

### Chats (7 endpoints)
```
POST   /chats
GET    /chats
GET    /chats/:id
POST   /chats/:id/messages
PUT    /chats/:id
DELETE /chats/:id
PATCH  /chats/:id/archive
```

### Stats (1 endpoint)
```
GET    /stats/overview
```

## Query Parameters

### Pagination
```
?page=1&limit=10
```

### Journal Filters
```
?mood=good
?tag=happiness
?search=keyword
```

### Chat Filters
```
?sentiment=positive
?riskLevel=high
```

## Useful MongoDB Queries

### Connect to Database
```bash
mongosh
use zenify
```

### View Data
```javascript
// All users
db.users.find()

// Find user by email
db.users.findOne({email: "user@example.com"})

// All journals
db.journals.find()

// Journals by mood
db.journals.find({mood: "good"})

// All chats
db.chats.find()
```

### Count Data
```javascript
db.users.countDocuments()
db.journals.countDocuments()
db.chats.countDocuments()
```

### Delete Collections
```javascript
db.users.deleteMany({})    // Delete all users
db.journals.deleteMany({}) // Delete all journals
db.chats.deleteMany({})    // Delete all chats
```

## File Locations

| File | Purpose |
|------|---------|
| backend/server.js | Main server |
| backend/models/*.js | Database schemas |
| backend/middleware/auth.js | JWT middleware |
| backend/utils/crypto.js | Password hashing |
| backend/utils/email.js | Email sending |
| src/utils/api.ts | API wrapper |
| src/context/AuthContext.tsx | Auth state |
| .env | Configuration (backend) |
| VITE_API_URL | Configuration (frontend) |

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed (Railway, Heroku, AWS)
- [ ] Frontend deployed (Vercel, Netlify)
- [ ] Environment variables configured
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for production URL
- [ ] Database backups enabled
- [ ] Error tracking setup
- [ ] Monitoring enabled
- [ ] Domain configured

## Performance Tips

1. **Pagination** - Always use pagination for large datasets
2. **Caching** - Cache frequently accessed data
3. **Indexes** - Database has indexes on userId, createdAt
4. **Queries** - Use filtering to reduce data transfer
5. **Compression** - Enable gzip compression

## Security Reminders

- ✅ Never commit .env file
- ✅ Use strong JWT_SECRET
- ✅ Hash passwords (done automatically)
- ✅ Verify email before access
- ✅ Use HTTPS in production
- ✅ Store tokens in localStorage only (browser)
- ✅ Never log sensitive data
- ✅ Validate all inputs (backend)

## Useful Links

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- JWT.io: https://jwt.io/
- Express Docs: https://expressjs.com/
- Mongoose Docs: https://mongoosejs.com/
- Nodemailer: https://nodemailer.com/

## File Structure at a Glance

```
Zenify/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── models/
│   ├── middleware/
│   └── utils/
├── src/
│   ├── utils/api.ts
│   ├── context/AuthContext.tsx
│   └── pages/
├── vite.config.ts
├── package.json
├── .env
└── Documentation/
    ├── MONGODB_SETUP.md
    ├── MONGODB_QUICK_START.md
    ├── API_DOCUMENTATION.md
    ├── MIGRATION_GUIDE.md
    └── MONGODB_IMPLEMENTATION_SUMMARY.md
```

## Getting Help

1. Check relevant .md file in project root
2. Review error message carefully
3. Check backend console logs
4. Check browser console for frontend errors
5. Verify .env configuration
6. Ensure MongoDB is running
7. Check API endpoint URL

---

**Last Updated:** January 20, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅

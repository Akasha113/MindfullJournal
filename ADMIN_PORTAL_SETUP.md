# Admin Portal Setup Guide

## Overview
The admin portal is a **separate, secure interface** accessible only to administrators. It is completely independent from the main website and can be accessed at a different URL.

## Quick Start

### 1. Create Admin Account
First, create your admin account by running the setup script:

```bash
# Navigate to backend directory
cd backend

# Run the setup script
node scripts/setupAdmin.js
```

This will create an admin account with:
- **Email:** `admin@mindfuljournal.com`
- **Password:** `AdminPassword123`

⚠️ **Important:** Change this password after your first login!

### 2. Access Admin Portal
Once both frontend and backend are running:

1. **Frontend:** http://localhost:5173/admin
2. **Backend:** http://localhost:3001 (must be running)

### 3. Login
Enter your admin credentials on the login page.

## Admin Portal Features

### 📊 Dashboard Overview
- **Total Users:** Display of all registered users
- **Verified Users:** Count of email-verified users
- **Unverified Users:** Pending verification queue
- **New Users Today:** Real-time tracking
- **Verification Rate:** Visual progress bar
- **Admin Count:** Number of admin accounts

### 👥 User Management
- **User List:** View all users with details
- **User Status:** See verification status
- **User Roles:** Identify admin accounts
- **Join Date:** Track user registration timeline
- **Email Access:** Contact users if needed

## Architecture

```
Admin Portal (Separate System)
├── Frontend: /admin, /admin/dashboard
├── Authentication: /api/admin/login
└── Backend Routes:
    ├── GET  /api/admin/stats      (Dashboard statistics)
    ├── GET  /api/admin/users      (All users list)
    └── GET  /api/admin/users/:id  (User details)
```

## Security Features

✅ **Separate Authentication**
- Admin login doesn't affect user login
- Admin token stored separately
- Session isolation

✅ **Authorization Middleware**
- All admin routes check `isAdmin` flag
- Unauthorized access returns 403 Forbidden
- Token validation on every request

✅ **Data Protection**
- Passwords never returned from API
- Sensitive data filtered
- Audit-ready structure

## API Endpoints

### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@mindfuljournal.com",
  "password": "AdminPassword123"
}

Response:
{
  "message": "Admin logged in successfully",
  "token": "jwt_token_here",
  "admin": {
    "id": "...",
    "name": "Administrator",
    "email": "admin@mindfuljournal.com",
    "isAdmin": true
  }
}
```

### Get Dashboard Stats
```
GET /api/admin/stats
Authorization: Bearer {token}

Response:
{
  "message": "Dashboard stats fetched",
  "stats": {
    "totalUsers": 42,
    "verifiedUsers": 38,
    "unverifiedUsers": 4,
    "newUsersToday": 2,
    "adminCount": 1
  }
}
```

### Get All Users
```
GET /api/admin/users
Authorization: Bearer {token}

Response:
{
  "message": "Users fetched successfully",
  "count": 42,
  "users": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "verified": true,
      "createdAt": "2024-01-20T10:30:00Z",
      "isAdmin": false
    },
    ...
  ]
}
```

## Database Model

### User Schema (Admin Fields)
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  isAdmin: Boolean (default: false),
  verified: Boolean,
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

No special admin-only variables needed. The system uses existing:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Token signing (in .env)
- `PORT` - Backend port (default 3001)

## Future Enhancements

The admin portal is built to be extensible. Planned features:

- [ ] Crisis Alert Monitoring
- [ ] Journal Entry Review
- [ ] Content Moderation Dashboard
- [ ] User Activity Logs
- [ ] Support Ticket System
- [ ] Admin Action Audit Trail
- [ ] Batch User Management
- [ ] System Analytics

## Troubleshooting

### Login not working
- ❌ Verify backend is running: `npm start` in backend/
- ❌ Check MongoDB connection
- ❌ Verify admin account exists (run setup script again)

### Data not loading
- ❌ Check admin token in localStorage
- ❌ Verify CORS is configured for admin requests
- ❌ Check network requests in browser DevTools

### Cannot access admin page
- ❌ Ensure frontend running on port 5173
- ❌ Backend must run on port 3001
- ❌ Verify token hasn't expired

## Important Notes

1. **Admin Portal is Separate:** It's not integrated into the main website
2. **Different Authentication:** Admin accounts are different from user accounts
3. **Direct Access:** Admins access `/admin` directly, not through main navigation
4. **Security:** Only share admin credentials with trusted people
5. **Audit Trail:** All admin actions can be logged (future feature)

## Support

For issues or questions about the admin portal:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check backend server logs
4. Verify all services are running

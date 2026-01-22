# How to Start Backend, Frontend & Admin

## 🚀 Quick Start (All 3 in Separate Terminals)

### Terminal 1: Backend Server
```bash
cd backend
npm install
npm start
```
✅ Backend runs on: **http://localhost:3001**

### Terminal 2: Frontend & Admin
```bash
npm install
npm run dev
```
✅ Frontend runs on: **http://localhost:5173**
✅ Admin Dashboard: **http://localhost:5173/admin**

---

## 📋 Step-by-Step Instructions

### Step 1: Start Backend

**Open Terminal 1 (PowerShell):**
```powershell
cd c:\Users\User\Desktop\7th smester\nida\Mindful Journal\backend
npm install
npm start
```

**Expected Output:**
```
✓ MongoDB connected successfully
✓ Server running on port 3001
✓ Email service initialized
```

### Step 2: Start Frontend

**Open Terminal 2 (PowerShell):**
```powershell
cd c:\Users\User\Desktop\7th smester\nida\Mindful Journal
npm install
npm run dev
```

**Expected Output:**
```
✓ VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Press h + enter to show help
```

### Step 3: Access the App

**Frontend (User App):**
```
http://localhost:5173/
```

**Admin Dashboard:**
```
http://localhost:5173/admin
```

---

## 🛠️ Environment Setup

### Backend Requirements (.env file)

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/zenify
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend Requirements (.env.local file)

Create `.env.local` in root:
```env
VITE_API_URL=http://localhost:3001
VITE_GITHUB_API_TOKEN=your_github_models_token
```

---

## 🌍 Complete URL Guide

### Frontend URLs
| Page | URL | Purpose |
|------|-----|---------|
| Home | `http://localhost:5173/` | Main page |
| Login | `http://localhost:5173/login` | User login |
| Register | `http://localhost:5173/register` | User signup |
| Journal | `http://localhost:5173/journal` | Journal entries |
| Chat | `http://localhost:5173/chat` | AI chat |
| Mood | `http://localhost:5173/mood` | Mood tracking |
| Profile | `http://localhost:5173/profile` | User profile |
| Settings | `http://localhost:5173/settings` | User settings |

### Admin URLs
| Page | URL | Purpose |
|------|-----|---------|
| Admin Login | `http://localhost:5173/admin` | Admin authentication |
| Dashboard | `http://localhost:5173/admin/dashboard` | Overview & stats |
| Users | `http://localhost:5173/admin/dashboard?tab=users` | User management |
| Crisis Alerts | `http://localhost:5173/admin/dashboard?tab=crisis` | Crisis monitoring |

### Backend APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/profile` | GET | Get user profile |
| `/api/journals` | GET/POST | Journal operations |
| `/api/admin/login` | POST | Admin login |
| `/api/admin/users` | GET | Get all users |
| `/api/admin/crisis-alerts` | GET | Get crisis alerts |

---

## 🔧 Troubleshooting

### Backend Won't Start
```
❌ Error: Cannot find module 'express'

✅ Solution:
cd backend
npm install
npm start
```

### MongoDB Connection Failed
```
❌ Error: MongooseError: Cannot connect to MongoDB

✅ Solution 1: Install MongoDB locally
✅ Solution 2: Use MongoDB Atlas (cloud)
✅ Solution 3: Update MONGODB_URI in .env
```

### Frontend Won't Connect to Backend
```
❌ Error: Failed to fetch from API

✅ Check:
1. Backend is running (port 3001)
2. VITE_API_URL=http://localhost:3001 in .env.local
3. CORS enabled in backend/server.js
```

### Port Already in Use
```
❌ Error: Port 3001/5173 already in use

✅ Kill process:
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force
```

---

## 📊 Architecture Overview

```
Your Local Machine
│
├─ Terminal 1: Backend Server
│  ├─ Port: 3001
│  ├─ Tech: Node.js + Express + MongoDB
│  ├─ Handles: Auth, Data, APIs
│  └─ Files: backend/server.js
│
├─ Terminal 2: Frontend Dev Server
│  ├─ Port: 5173
│  ├─ Tech: React + Vite + TailwindCSS
│  ├─ Handles: UI, User interactions
│  └─ Files: src/**/*
│
└─ Browser
   ├─ http://localhost:5173 → User App
   └─ http://localhost:5173/admin → Admin Dashboard
      └─ Both communicate with Backend (port 3001)
```

---

## 🎯 Testing the Setup

### Test 1: Backend Running
```bash
curl http://localhost:3001/api/auth/profile
# Should return: {"error": "Unauthorized"} or similar
```

### Test 2: Frontend Running
Open browser and visit: `http://localhost:5173`
✅ Should see login page

### Test 3: Admin Access
Visit: `http://localhost:5173/admin`
✅ Should see admin login page

---

## 📝 Common Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Check code quality
```

### Backend
```bash
npm start        # Start server
npm run dev      # Start development server
```

### Database
```bash
# If using local MongoDB
mongod           # Start MongoDB service

# Check connection
mongo
> use zenify
> db.users.find()
```

---

## 🔐 Admin Login Credentials

**Create admin user first:**

1. Register as normal user
2. Then update database to make admin:
```javascript
// MongoDB command
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { isAdmin: true } }
)
```

Or use setup script:
```bash
cd backend
node scripts/setupAdmin.js
```

---

## ✅ Full Startup Checklist

- [ ] MongoDB is running (if local)
- [ ] `.env` file created in `backend/`
- [ ] `.env.local` file created in root
- [ ] Terminal 1: Backend started (`npm start`)
- [ ] Terminal 2: Frontend started (`npm run dev`)
- [ ] Backend accessible: `http://localhost:3001`
- [ ] Frontend accessible: `http://localhost:5173`
- [ ] Can access admin: `http://localhost:5173/admin`
- [ ] Can login to user account
- [ ] Can login to admin account
- [ ] Data persists on refresh
- [ ] All pages load correctly

---

## 🎉 You're Ready!

Once both terminals show no errors and URLs are accessible:

✅ Backend running on port 3001
✅ Frontend running on port 5173
✅ Admin dashboard available
✅ All features working

Start using the app! 🚀

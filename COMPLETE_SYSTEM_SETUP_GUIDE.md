# 🧠 MindFul Journal - Complete System Setup & Operation Guide

**Complete documentation for setup, deployment, and operation of the MindFul Journal crisis management system.**

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [System Overview](#system-overview)
3. [Prerequisites & Installation](#prerequisites--installation)
4. [Environment Configuration](#environment-configuration)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Starting the System](#starting-the-system)
8. [Admin Portal](#admin-portal)
9. [Crisis Detection System](#crisis-detection-system)
10. [Email Configuration](#email-configuration)
11. [Testing the System](#testing-the-system)
12. [Deployment Guide](#deployment-guide)
13. [Troubleshooting](#troubleshooting)

---

## Quick Start

### ⚡ 5-Minute Setup (Development)

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm start

# Terminal 2: Start Frontend
cd ..
npm install
npm run dev
```

**Access Points:**
- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
- Backend API: `http://localhost:3001`

---

## System Overview

### 🎯 What is MindFul Journal?

MindFul Journal is a **comprehensive mental health support system** featuring:

✅ **Crisis Detection System**
- Automatic detection of 60+ critical keywords (English & Roman Urdu)
- Real-time alerts sent to admin
- Emergency resources displayed to users
- Immediate email notifications

✅ **AI Chat Support**
- GitHub Models API integration (GPT-4, Claude)
- Empathetic, context-aware responses
- Conversation history tracking
- Local storage fallback

✅ **Admin Crisis Management**
- Real-time dashboard of crisis alerts
- Contact user functionality with email
- Risk assessment and intervention tracking
- Alert status management

✅ **User Authentication**
- Email verification system
- Secure JWT authentication
- Password reset functionality
- User profiles and settings

✅ **Mood & Journal Tracking**
- Daily mood tracking with visual charts
- Journal entries with private/public settings
- Sentiment analysis
- Personal progress tracking

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)         │
│  User Chat | Journal | Mood | Admin Dashboard  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP Requests
                  ↓
┌─────────────────────────────────────────────────┐
│        Backend API (Express + Node.js)          │
│  Authentication | Crisis Alerts | Email Service│
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ↓                    ↓
    MongoDB             Gmail SMTP
    (Database)          (Email)
```

### 🧮 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 18.3.1 + 5.0 |
| **Build Tool** | Vite | 5.x |
| **Styling** | TailwindCSS | 3.x |
| **Backend** | Express.js | 4.x |
| **Runtime** | Node.js | 18+ |
| **Database** | MongoDB | Cloud Atlas |
| **Authentication** | JWT | Standard |
| **Email** | Nodemailer + Gmail | SMTP |
| **AI Models** | GitHub Models API | GPT-4o-mini |

---

## Prerequisites & Installation

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MongoDB**: Cloud Atlas account (free tier available)
- **Gmail Account**: For email notifications
- **GitHub Account**: For Models API access
- **Git**: For version control

### Step 1: Install Node.js

**Windows:**
1. Visit [nodejs.org](https://nodejs.org)
2. Download LTS version
3. Run installer and follow prompts
4. Verify installation:
```bash
node --version
npm --version
```

### Step 2: Clone/Prepare Project

```bash
# Navigate to project directory
cd "c:\Users\User\Desktop\7th smester\nida\Mindful Journal"

# Verify structure
ls
```

### Step 3: Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

---

## Environment Configuration

### Frontend Environment (.env.local)

**Create file:** `.env.local` in project root

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# GitHub Models API (Get from https://github.com/settings/tokens)
VITE_GITHUB_API_TOKEN=ghp_your_actual_token_here
```

### Backend Environment (backend/.env)

**Create file:** `backend/.env`

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Cloud Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindful_journal

# Email Configuration (Gmail)
GMAIL_USER=mindfuljounralofficial@gmail.com
GMAIL_APP_PASSWORD=ygbe yxpd tyhb solr

# Admin Configuration
ADMIN_EMAIL=mindfuljounralofficial@gmail.com

# JWT Security
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Setting Up Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. Click "Security" in left menu
3. Enable "2-Step Verification" if not already enabled
4. Go to "App passwords"
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password
7. Paste into `GMAIL_APP_PASSWORD` in `.env`

### Setting Up GitHub API Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: `MindFul Journal`
4. Select scopes: `repo`, `read:models`
5. Click "Generate token"
6. Copy and paste into `VITE_GITHUB_API_TOKEN` in `.env.local`

### Getting MongoDB Connection String

1. Go to [MongoDB Cloud](https://cloud.mongodb.com)
2. Sign up (free tier available)
3. Create a cluster
4. Click "Connect"
5. Choose "Drivers"
6. Copy the connection string
7. Replace `<password>` and `<username>` with your credentials
8. Paste into `MONGODB_URI` in `backend/.env`

---

## Backend Setup

### Project Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── models/
│   ├── User.js           # User schema
│   ├── CrisisAlert.js    # Crisis alert schema
│   └── VerificationCode.js # Email verification codes
├── utils/
│   ├── email.js          # Email templates & sending
│   └── crypto.js         # Password hashing utilities
└── scripts/
    └── setupAdmin.js     # Create admin account
```

### API Endpoints

#### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/verify            # Verify email code
POST   /api/auth/login             # Login user
POST   /api/auth/reset-password    # Request password reset
POST   /api/auth/confirm-reset     # Confirm password reset
POST   /api/auth/resend-code       # Resend verification code
```

#### Admin
```
POST   /api/admin/login                    # Admin login
GET    /api/admin/crisis-alerts            # List all crisis alerts
GET    /api/admin/crisis-alerts/:id        # Get specific alert
POST   /api/admin/crisis-alerts            # Create new alert (from client)
PUT    /api/admin/crisis-alerts/:id        # Update alert status
POST   /api/admin/crisis-alerts/:id/contact-user # Send support email to user
GET    /api/admin/stats                    # Dashboard statistics
GET    /api/admin/users                    # List all users
```

#### User
```
GET    /api/user/profile           # Get user profile
PUT    /api/user/profile           # Update user profile
POST   /api/user/logout            # Logout user
```

### Email Templates

The system sends 4 types of emails:

1. **Verification Email**
   - Sent when user registers
   - Contains 6-digit verification code
   - Code valid for 10 minutes
   - Plain professional style

2. **Password Reset Email**
   - Sent on password reset request
   - Contains reset link with token
   - Valid for 1 hour
   - Plain professional style

3. **Crisis Alert Email** (Admin)
   - Sent to admin when crisis detected
   - Contains user info, message, risk details
   - Red alert styling
   - Immediate notification

4. **Support Message Email** (User)
   - Sent when admin contacts user
   - Includes crisis resources
   - Professional compassionate tone
   - Plain professional style

---

## Frontend Setup

### Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx      # User message input
│   │   └── ChatMessage.tsx    # Message display
│   ├── journal/
│   │   ├── JournalCard.tsx    # Journal entry card
│   │   └── JournalForm.tsx    # Journal creation form
│   ├── layout/
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Navbar.tsx         # Top navigation
│   │   ├── PublicHeader.tsx   # Public page header
│   │   └── Sidebar.tsx        # Side navigation
│   ├── mood/
│   │   ├── MoodChart.tsx      # Mood visualization
│   │   └── MoodSelector.tsx   # Mood selection UI
│   └── ui/
│       ├── Button.tsx         # Reusable button
│       ├── Input.tsx          # Text input component
│       └── TextArea.tsx       # Text area component
├── pages/
│   ├── HomePage.tsx           # Landing page
│   ├── LoginPage.tsx          # User login
│   ├── RegisterPage.tsx       # User registration
│   ├── VerificationPage.tsx   # Email verification
│   ├── ChatPage.tsx           # AI chat interface
│   ├── JournalPage.tsx        # Journal entries
│   ├── MoodPage.tsx           # Mood tracking
│   ├── ProfilePage.tsx        # User profile
│   ├── SettingsPage.tsx       # User settings
│   ├── AdminLoginPage.tsx     # Admin login
│   ├── AdminPage.tsx          # Admin dashboard
│   ├── AdminDashboardPage.tsx # Crisis alerts dashboard
│   └── CrisisAlertDetailPage.tsx # Alert details
├── context/
│   ├── AuthContext.tsx        # Authentication state
│   └── SettingsContext.tsx    # Settings state
├── utils/
│   ├── api.ts                 # API client
│   ├── chat.ts                # Chat logic
│   ├── localChat.ts           # Local chat + crisis detection
│   ├── contentMonitor.ts      # Content monitoring
│   ├── enhancedSuicideDetection.ts # Risk detection
│   ├── notificationService.ts # Notifications
│   ├── quotes.ts              # Inspirational quotes
│   └── storage.ts             # Local storage
├── types/
│   └── index.ts               # TypeScript definitions
├── App.tsx                    # Main app component
└── main.tsx                   # Entry point
```

### Routes

```
Public Routes:
  /                    # Home/Landing page
  /login               # User login
  /register            # User registration
  /verify              # Email verification

Protected Routes (Logged-in Users):
  /chat                # AI chat support
  /journal             # Journal entries
  /mood                # Mood tracking
  /profile             # User profile
  /settings            # User settings

Admin Routes:
  /admin               # Admin login
  /admin/dashboard     # Crisis alerts dashboard
  /admin/alert/:id     # Alert details & management
```

---

## Starting the System

### Method 1: Separate Terminals (Recommended for Development)

**Terminal 1: Backend Server**

```bash
cd backend
npm start
```

Expected output:
```
✅ MongoDB connected successfully
✅ Email service initialized
✅ Server running on port 3001
```

**Terminal 2: Frontend Server**

```bash
npm run dev
```

Expected output:
```
✓ VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

### Method 2: Using Start Scripts

**Windows PowerShell:**

```bash
# Open Terminal 1
.\start_apis.sh

# Open Terminal 2
npm run dev
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend App | http://localhost:5173 | User interface |
| Admin Panel | http://localhost:5173/admin | Crisis management |
| Backend API | http://localhost:3001 | API endpoints |
| MongoDB | Cloud Atlas | Database (cloud) |

---

## Admin Portal

### Creating Admin Account

```bash
cd backend
node scripts/setupAdmin.js
```

This creates:
- **Email**: `mindfuljounralofficial@gmail.com`
- **Password**: `Akasha@114`

⚠️ **Change password after first login!**

### Admin Login

1. Go to `http://localhost:5173/admin`
2. Enter credentials:
   - Email: `mindfuljounralofficial@gmail.com`
   - Password: `Akasha@114`
3. Click "Login"

### Admin Dashboard Features

**Crisis Alerts Management:**
- View all crisis alerts in real-time
- Filter by risk level, status, user
- Click alert for detailed view
- Update alert status (pending → reviewed → addressed)
- Set intervention type (message_sent, emergency_contact, escalated)
- Add admin notes
- Contact user via email
- View flagged content

**Alert Detail Page:**
- User information
- Crisis message and keywords detected
- Risk assessment
- Intervention options
- Admin notes section
- Three buttons:
  - 📧 **Contact User** - Send support email
  - **Save & Update Alert** - Save changes
  - **Cancel** - Go back

**Contact User Feature:**
- Opens modal to compose message
- Sends via official Mindful Journal email
- Includes crisis resources
- Professional template
- Immediate delivery

---

## Crisis Detection System

### How It Works

1. **User sends message** in chat
2. **System checks for keywords** (60+ triggers)
3. **If crisis detected:**
   - Alert sent to admin immediately
   - Email to `mindfuljounralofficial@gmail.com`
   - Resources shown to user
   - Admin dashboard updated in real-time
4. **If normal message:**
   - GitHub Models API generates response
   - Conversation continues normally

### Crisis Keywords (60+ Detected)

**English (25+ keywords):**
```
suicide, suicidal, kill myself, hurt myself, harm myself,
end my life, end it, don't want to live, want to die,
self harm, self-harm, cutting myself, overdose, hang myself,
jump, i can't take it anymore, can't go on, give up,
no reason to live, worthless, nobody cares, everyone would be better off,
life is meaningless, tired of living, end everything, take my life,
step in front, slash my wrists, poison myself, drown myself,
i want to disappear, nobody needs me, better off dead, fatal dose,
final goodbye, last goodbye, saying goodbye, permanent solution,
can't handle this, too much pain, unbearable pain, rope, noose,
sleeping pills, razors, cut myself, break bones, bleed out
```

**Roman Urdu (30+ keywords):**
```
khud ko marna hai, apne aap ko marna, mujhe mar jana,
jeevan khatam krna, apne aap ko nuksan, apne aap ko kaatna,
apne aap se hate, zyada bardasht nahi, kuch nahi raha,
sab khatam, jeevan se thaka, maut, mar ja, mun mar ja,
khud ko zehreela, khud ko zyada, apne se pyar nahi,
insaan se befeeda, sab bekar, jeevan bekaar, koi matlab nahi,
koi fayda nahi, zehreela khana, gla kaatna, pehlhan kaatna,
zyada dard, zyada kasak, zyada takleef, khud ko hurt,
apne aap ko chot, apne aap ko nayak, khud ko tabah,
khud tabahi, apne aap ko nist, apne aap ko khatam, khud ko khatm
```

### Risk Levels

| Level | Trigger | Response |
|-------|---------|----------|
| **Critical** | Direct suicide keywords | Immediate admin alert + resources |
| **High** | Self-harm mentions | Alert + monitoring |
| **Medium** | Distress signals | Log for review |
| **Low** | Normal conversation | Regular AI response |

### Crisis Response to User

When crisis detected, user sees:

```
🚨 **I'M CONCERNED ABOUT YOUR SAFETY** 🚨

If you're having thoughts of suicide, please reach out for help right now:

**IMMEDIATE CRISIS SUPPORT:**
• **Call 988** - National Suicide Prevention Lifeline (24/7 - FREE)
• **Text "HELLO" to 741741** - Crisis Text Line (24/7 - FREE)
• **Call 911** - Emergency Services (for immediate danger)
• **Go to nearest ER** - If you're in immediate danger

**International:**
• UK: 116 123 (Samaritans) 24/7
• Canada: 1-833-456-4566 (24/7)
• Australia: 13 11 14 (Lifeline) 24/7
• Germany: 0800-111 0 111 or 0800-111 0 222

**You matter. Your life has value. Help is available right now.**
```

---

## Email Configuration

### Email Service Setup

**Provider**: Gmail SMTP  
**Account**: `mindfuljounralofficial@gmail.com`  
**App Password**: `ygbe yxpd tyhb solr`

### How Emails Work

1. **User registers** → Verification email sent (contains 6-digit code)
2. **Crisis detected** → Admin alert email sent (with details)
3. **Admin contacts user** → Support email sent (with resources)
4. **User resets password** → Reset email sent (with link)

### Email Types & Templates

#### 1. Verification Email
- **Subject**: "Verify Your Email - Mindful Journal"
- **Contains**: 6-digit code, 10-minute expiration
- **Style**: Plain professional, Arial font
- **Sent to**: User email address

#### 2. Crisis Alert Email (Admin)
- **Subject**: "CRISIS ALERT - [RISK] - [USERNAME]"
- **Contains**: User details, crisis message, risk factors
- **Style**: Plain professional, red alerts (#cc0000)
- **Sent to**: `mindfuljounralofficial@gmail.com`

#### 3. Support Message Email (User)
- **Subject**: "Support Message - Mindful Journal"
- **Contains**: Admin message, crisis resources, support info
- **Style**: Plain professional, compassionate tone
- **Sent to**: User email address
- **Includes**:
  - National Suicide Prevention Lifeline: 988
  - Crisis Text Line: Text HOME to 741741
  - International Association for Suicide Prevention

#### 4. Password Reset Email
- **Subject**: "Reset Your Password - Mindful Journal"
- **Contains**: Reset link, 1-hour expiration
- **Style**: Plain professional
- **Sent to**: User email address

### Email Styling

All emails use **official professional style**:
- ✅ Plain text (Arial font)
- ✅ No purple colors
- ✅ Gray borders (#cccccc)
- ✅ Minimal styling
- ✅ Professional appearance
- ❌ No themes or gradients
- ❌ No extra decorations

---

## Testing the System

### 1. Test User Registration

1. Go to http://localhost:5173/register
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: Test@1234
3. Click "Register"
4. Check terminal for email (in development, logs to console)
5. Enter verification code from console
6. Click "Verify"
7. Login with credentials

### 2. Test Crisis Detection

1. Login to http://localhost:5173
2. Go to Chat page
3. Type message: **"I want to die"**
4. Observe:
   - ✅ Crisis resources displayed
   - ✅ Terminal shows "🚨 CRISIS DETECTED"
   - ✅ Alert sent to admin

### 3. Test Admin Alerts

1. Trigger crisis message (Step 2)
2. Login as admin:
   - URL: http://localhost:5173/admin
   - Email: `mindfuljounralofficial@gmail.com`
   - Password: `Akasha@114`
3. Observe:
   - ✅ Alert appears in dashboard
   - ✅ User details visible
   - ✅ Crisis keywords highlighted
   - ✅ Risk level displayed

### 4. Test Contact User

1. On crisis alert detail page
2. Click "📧 Contact User" button
3. Enter support message
4. Click "📧 Send Email"
5. Observe:
   - ✅ Modal closes
   - ✅ Success message shown
   - ✅ Email sent to user (check console in dev)

### 5. Test Email Styling

In development, emails are logged to terminal. Check:
- ✅ Professional plain text
- ✅ No purple colors
- ✅ Mindful Journal branding
- ✅ Proper resource information

### Test Data

**Test Crisis Keywords:**
- English: "I want to die", "kill myself", "hurt myself"
- Roman Urdu: "khud ko marna hai", "apne aap ko nuksan"

**Test Admin Login:**
- Email: `mindfuljounralofficial@gmail.com`
- Password: `Akasha@114`

---

## Deployment Guide

### Pre-Deployment Checklist

Before deploying, ensure you have:

```
✅ GitHub account with repository pushed
✅ MongoDB Atlas account (free tier available)
✅ Gmail account with app password generated
✅ GitHub API token created
✅ All environment variables documented
✅ Production build tested locally (npm run build)
✅ All code committed and pushed to GitHub
✅ Database migrations completed
✅ Email configuration verified
```

### Step 1: Prepare Your Code for Production

```bash
# 1. Update environment variables for production
# Edit backend/.env:
NODE_ENV=production
PORT=3001

# Edit .env.local:
VITE_API_URL=https://your-backend-domain.com  # Will update after deployment

# 2. Test production build locally
npm run build
npm run preview

# 3. Verify no sensitive data in code
grep -r "PASSWORD" src/
grep -r "API_KEY" src/

# 4. Commit and push to GitHub
git add .
git commit -m "Production deployment ready"
git push origin main
```

### Step 2: Choose Deployment Platform

#### **Option 1: Vercel + Railway ⭐ RECOMMENDED** (EASIEST)

**Why?**
- ✅ Fastest setup (10 minutes)
- ✅ Free tier generous
- ✅ Automatic deployments from GitHub
- ✅ Good performance
- ✅ Built-in CI/CD

**Cost:**
- Vercel: Free tier (up to 100GB bandwidth/month)
- Railway: Free tier ($5 credits/month, then pay-as-you-go)
- **Total: FREE for small projects**

##### **2A. Deploy Frontend on Vercel**

**Step 1: Create Vercel Account**
```bash
# Visit https://vercel.com
# Sign up with GitHub
# Authorize Vercel to access your GitHub
```

**Step 2: Create New Project**
1. Click "New Project"
2. Select your Mindful Journal repository
3. Vercel auto-detects it's a Vite project

**Step 3: Configure Build Settings**
```
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Step 4: Add Environment Variables**

In Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-name.railway.app
VITE_GITHUB_API_TOKEN=ghp_your_actual_token_here
```

**Step 5: Deploy**
```
Click "Deploy" button
Wait 2-3 minutes
Your site is now live at: https://yourproject.vercel.app ✅
```

**Step 6: Verify Frontend**
- Visit your Vercel URL
- Register a test account
- Check if it loads without errors

##### **2B. Deploy Backend on Railway**

**Step 1: Create Railway Account**
```bash
# Visit https://railway.app
# Sign up with GitHub
```

**Step 2: Create New Project from GitHub**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your Mindful Journal repository
4. Railway auto-detects it's a Node.js project

**Step 3: Configure Environment**

Click on your project → Settings → Environment Variables

Add all variables:
```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindful_journal
GMAIL_USER=mindfuljounralofficial@gmail.com
GMAIL_APP_PASSWORD=ygbe yxpd tyhb solr
JWT_SECRET=your_super_secret_key_change_this
ADMIN_EMAIL=mindfuljounralofficial@gmail.com
FRONTEND_URL=https://yourproject.vercel.app
```

**Step 4: Configure Root Directory**
1. Go to "Deployment" settings
2. Set Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`

**Step 5: Deploy**
```
Railway automatically deploys
Wait 2-3 minutes for deployment
Your backend is now live at: https://your-backend-railway.app ✅
```

**Step 6: Get Your Backend URL**
1. In Railway dashboard, click your project
2. Click "Network" tab
3. Copy the public URL (something like: `https://mindful-journal-backend-prod.railway.app`)

**Step 7: Update Frontend with Backend URL**

Now that you have the backend URL, update Vercel:

1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Update `VITE_API_URL` with your Railway URL
4. Redeploy: Click "Deployments" → "Redeploy" on latest

**Step 8: Verify Everything**
```
✅ Frontend accessible at Vercel URL
✅ Can register new user
✅ Can send crisis message
✅ Admin receives email at mindfuljounralofficial@gmail.com
✅ Can login as admin
✅ Can see crisis alerts in dashboard
```

---

#### **Option 2: Render (All-in-One)**

**Why?**
- Single platform for everything
- Easy setup
- Good free tier

**Cost:**
- Free tier with limitations (15GB storage, auto-sleep after 15 min inactivity)
- Paid tier from $7/month

**Setup:**

**Step 1: Create render.yaml in Root**

```yaml
services:
  - type: web
    name: mindful-journal-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://mindful-journal-api.onrender.com
      - key: VITE_GITHUB_API_TOKEN
        value: ghp_your_token_here

  - type: web
    name: mindful-journal-backend
    env: node
    region: oregon
    plan: free
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        value: mongodb+srv://user:pass@cluster.mongodb.net/mindful_journal
      - key: GMAIL_USER
        value: mindfuljounralofficial@gmail.com
      - key: GMAIL_APP_PASSWORD
        value: ygbe yxpd tyhb solr
      - key: JWT_SECRET
        value: your_secret_here
      - key: NODE_ENV
        value: production
```

**Step 2: Deploy on Render**

1. Visit [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Blueprint"
4. Select your repository
5. Render reads `render.yaml` and deploys both services automatically

**Step 3: Verify**
- Frontend: https://mindful-journal-frontend.onrender.com
- Backend: https://mindful-journal-backend.onrender.com

---

#### **Option 3: Fly.io**

**Why?**
- Good performance
- Affordable ($5/month minimum)
- Global deployment

**Setup:**

```bash
# 1. Install Fly CLI
# Windows: Download from https://fly.io/docs/hands-on/install-flyctl/
# Mac: brew install flyctl
# Linux: curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Create app
flyctl launch

# 4. Set environment variables
flyctl secrets set MONGODB_URI=your_connection_string
flyctl secrets set GMAIL_USER=mindfuljounralofficial@gmail.com
flyctl secrets set GMAIL_APP_PASSWORD=ygbe yxpd tyhb solr
flyctl secrets set JWT_SECRET=your_secret
flyctl secrets set NODE_ENV=production
flyctl secrets set VITE_API_URL=your-backend-url
flyctl secrets set FRONTEND_URL=your-frontend-url

# 5. Deploy
flyctl deploy

# 6. View logs
flyctl logs

# 7. Get URL
flyctl info
```

---

### Step 3: Post-Deployment Setup

#### **Update Frontend with Backend URL**

After backend is deployed, update Vercel/Render frontend:

**For Vercel:**
1. Settings → Environment Variables
2. Update `VITE_API_URL` with production backend URL
3. Redeploy

**For Render:**
1. Update `VITE_API_URL` in `render.yaml`
2. Push to GitHub
3. Render auto-redeploys

#### **Test Production System**

```bash
# 1. Test User Registration
- Go to production frontend URL
- Register new account
- Check email for verification code
- Verify account

# 2. Test Crisis Detection
- Login to account
- Go to Chat page
- Type: "I want to die"
- Should show crisis resources immediately

# 3. Test Admin Dashboard
- Go to frontend/admin
- Login with: mindfuljounralofficial@gmail.com / Akasha@114
- Should see crisis alert in dashboard
- Check email inbox for alert

# 4. Test Contact User Feature
- Click on crisis alert
- Click "Contact User" button
- Send test message
- Verify user received email

# 5. Test Email Configuration
- Register new user
- Should receive verification email
- Admin should receive crisis alerts when triggered
- Support messages should deliver
```

#### **Enable HTTPS**

**Vercel:** ✅ Automatic (included with custom domain)

**Railway:** ✅ Automatic (https://your-app.railway.app)

**Render:** ✅ Automatic (https://your-app.onrender.com)

**Fly.io:** ✅ Automatic (https://your-app.fly.dev)

#### **Setup Custom Domain (Optional)**

**For Vercel:**
1. Domains → Add Domain
2. Add your domain (e.g., mindfuljournal.com)
3. Update DNS records
4. Configure SSL

**For Railway/Render/Fly.io:**
1. Settings → Custom Domain
2. Point your domain's DNS to platform's nameservers
3. SSL automatically provisioned

---

### Step 4: Monitoring & Maintenance

#### **Monitor Application Health**

**Vercel:**
```
Dashboard → Analytics
- Page load time
- Edge Function execution time
- Static file performance
```

**Railway:**
```
Railway Dashboard → Metrics
- CPU usage
- Memory usage
- Network throughput
- Error rates
```

**Render:**
```
Render Dashboard → Metrics
- CPU usage
- Memory usage
- Restart count
- Error logs
```

#### **View Logs**

**Vercel:**
```
Deployments → Click deployment → Logs
```

**Railway:**
```
Click project → Logs tab
Real-time streaming logs
```

**Fly.io:**
```bash
flyctl logs
```

#### **Set Up Alerts**

**For Database (MongoDB):**
1. MongoDB Atlas Dashboard
2. Alerts → Create Alert
3. Set thresholds for:
   - High CPU usage
   - High memory usage
   - Connection errors
   - Replication lag

**For Email Issues:**
1. Test email service regularly
2. Monitor SMTP connection
3. Check Gmail app password expiry

#### **Automatic Backups**

**MongoDB Atlas:**
- ✅ Automatic daily backups (included free tier)
- Go to Backups tab
- Can restore to any point in time

**Application Code:**
- ✅ GitHub is your backup
- Always push to GitHub before deploying
- Use git tags for releases: `git tag v1.0.0`

---

### Step 5: Deployment Checklist

```
PRE-DEPLOYMENT:
✅ All code committed to GitHub
✅ No secrets in code (check .gitignore)
✅ .env files NOT committed
✅ Database migrations completed
✅ Local testing passed

DURING DEPLOYMENT:
✅ Frontend deployed and accessible
✅ Backend deployed and accessible
✅ Environment variables set correctly
✅ Database connection working
✅ Email service configured

POST-DEPLOYMENT:
✅ Frontend loads without errors
✅ User registration works
✅ Email verification works
✅ Crisis detection triggers alerts
✅ Admin dashboard accessible
✅ Admin receives alerts
✅ Contact user feature works
✅ Performance acceptable
✅ Logs being recorded
✅ Backups configured
✅ Monitoring enabled
✅ Custom domain working (if used)
✅ HTTPS/SSL enabled
✅ Rate limiting enabled
```

---

### Common Deployment Issues & Solutions

#### ❌ "Backend URL not working after deployment"

**Solution:**
1. Get actual backend URL from deployment platform
2. Update `VITE_API_URL` in frontend
3. Redeploy frontend
4. Clear browser cache (Ctrl+Shift+Delete)
5. Test in private/incognito window

#### ❌ "Emails not sending in production"

**Solution:**
1. Verify Gmail app password in production .env
2. Check that 2FA is enabled on Gmail account
3. Check email service logs in backend
4. Test email endpoint: `curl -X POST http://localhost:3001/test-email`

#### ❌ "Database connection timeout in production"

**Solution:**
1. Check MongoDB Atlas IP whitelist
2. For production: Allow 0.0.0.0/0 (all IPs)
3. Verify connection string is correct
4. Test connection: `mongosh "your_connection_string"`

#### ❌ "Crisis alerts not sending"

**Solution:**
1. Verify backend is running
2. Check crisis keywords are detected (F12 → Console)
3. Verify MongoDB connection
4. Check email service is initialized
5. Look at backend logs for errors

#### ❌ "Admin login not working"

**Solution:**
1. Recreate admin account:
   ```bash
   cd backend
   node scripts/setupAdmin.js
   ```
2. Clear browser localStorage
3. Try private/incognito window
4. Verify JWT_SECRET is set in production

#### ❌ "Slow performance in production"

**Solution:**
1. Enable database indexes:
   ```javascript
   // In MongoDB Atlas, create indexes for:
   db.users.createIndex({ email: 1 })
   db.crisiscerts.createIndex({ userId: 1, createdAt: -1 })
   db.verificationcodes.createIndex({ email: 1 })
   ```
2. Implement caching
3. Optimize API responses
4. Use CDN for static files (Vercel does this automatically)

---

### Rollback Procedure

If something goes wrong in production:

**Vercel Rollback:**
```
1. Deployments tab
2. Find previous successful deployment
3. Click three dots → Promote to Production
4. Site rolls back automatically
```

**Railway Rollback:**
```
1. Deployments tab
2. Click previous deployment
3. Click "Redeploy"
```

**Render Rollback:**
```
1. Deployments tab
2. Click "Redeploy" on previous successful deployment
```

**Manual Rollback:**
```bash
git revert HEAD
git push origin main
# Deployment platform auto-redeploys
```

---

### Cost Comparison

| Platform | Frontend | Backend | Database | **Total/Month** |
|----------|----------|---------|----------|-----------------|
| **Vercel + Railway** | FREE | $5 | $0 | **$5** |
| **Render** | FREE | FREE* | $0 | **FREE*** |
| **Fly.io** | - | $5-10 | $0 | **$5-10** |
| **Heroku** (legacy) | - | $7-50 | $9+ | **$16+** |

*Render free tier has limitations (auto-sleep after 15min inactivity, 512MB RAM)

**Recommended:** Vercel + Railway ($5/month is very affordable)

---

### Production Best Practices

1. **Always use HTTPS** - ✅ Automatic on all platforms
2. **Keep dependencies updated** - Run `npm update` regularly
3. **Monitor error logs** - Check daily for issues
4. **Regular backups** - MongoDB Atlas auto-backs up daily
5. **Password rotation** - Change JWT_SECRET every 3 months
6. **Rate limiting** - Prevent API abuse
7. **CORS configuration** - Only allow frontend domain
8. **Database indexing** - Optimize queries
9. **Environment variables** - Never hardcode secrets
10. **Testing** - Test in staging before production

---

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ "net::ERR_CONNECTION_REFUSED" (Backend not running)
**Solution:**
```bash
# Make sure backend is running on port 3001
cd backend
npm start

# Check if port 3001 is available
netstat -ano | findstr :3001
```

#### ❌ MongoDB Connection Error
**Solution:**
1. Check connection string in `backend/.env`
2. Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
3. Check username and password
4. Verify cluster name matches

#### ❌ "GMAIL_APP_PASSWORD not found"
**Solution:**
1. Create `.env` in backend folder
2. Add GMAIL_APP_PASSWORD from Gmail account
3. Make sure 2FA is enabled on Gmail
4. Generate new app password

#### ❌ Emails not sending
**Solution:**
1. Check GMAIL_USER and GMAIL_APP_PASSWORD in `.env`
2. Verify Gmail 2FA is enabled
3. Check email logs in backend terminal
4. Verify ADMIN_EMAIL is correct

#### ❌ Crisis alerts not triggering
**Solution:**
1. Message must contain exact keyword from list
2. Keywords are case-insensitive
3. Check browser console for logs
4. Verify backend is running
5. Check MongoDB connection

#### ❌ Admin can't login
**Solution:**
```bash
# Recreate admin account
cd backend
node scripts/setupAdmin.js

# Default credentials:
# Email: mindfuljounralofficial@gmail.com
# Password: Akasha@114
```

#### ❌ GitHub API token expired
**Solution:**
1. Generate new token from GitHub Settings
2. Update VITE_GITHUB_API_TOKEN in `.env.local`
3. Rebuild frontend: `npm run build`

#### ❌ Port 3001 already in use
**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in backend/.env
# Then update VITE_API_URL in frontend
```

#### ❌ CSS/Styling issues
**Solution:**
```bash
# Clear cache and reinstall dependencies
npm install
npm run build

# In frontend directory
npm run dev
```

### Debug Mode

**Enable comprehensive logging:**

In `src/utils/localChat.ts`:
```typescript
// All console.log statements are enabled
// Check browser console (F12) for detailed logs
```

In `backend/server.js`:
```javascript
// All console.log statements are enabled
// Check terminal for detailed logs
```

---

## Security Best Practices

### 🔒 Development

- ✅ Use strong JWT_SECRET
- ✅ Enable HTTPS in production
- ✅ Keep API tokens private
- ✅ Never commit .env files
- ✅ Use email verification
- ✅ Hash passwords properly

### 🔐 Production

- ✅ Set `NODE_ENV=production`
- ✅ Enable CORS restrictions
- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS/TLS
- ✅ Configure firewall rules
- ✅ Regular security audits
- ✅ Monitor error logs
- ✅ Implement rate limiting

### 📝 Admin Access

- ✅ Change default admin password
- ✅ Use strong, unique passwords
- ✅ Enable 2FA on email account
- ✅ Limit admin user access
- ✅ Monitor admin activities
- ✅ Regular password rotation

---

## Performance Optimization

### Frontend Optimization

```bash
# Build optimized production bundle
npm run build

# Check bundle size
npm run preview
```

### Backend Optimization

- Use MongoDB indexes for frequent queries
- Implement caching for API responses
- Rate limiting for API endpoints
- Database connection pooling
- Email queue system for bulk sends

### Database Optimization

- Index frequently queried fields
- Regular database backups
- Archive old data
- Optimize query performance
- Monitor collection sizes

---

## Support & Documentation

### Additional Resources

- **GitHub Models API**: https://github.com/marketplace/models
- **MongoDB Documentation**: https://docs.mongodb.com
- **Express.js Docs**: https://expressjs.com
- **React Documentation**: https://react.dev
- **TailwindCSS Docs**: https://tailwindcss.com

### Contact & Reporting

For issues or questions:
1. Check this documentation first
2. Review terminal/console logs
3. Search GitHub issues
4. Create detailed bug reports with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Screenshots/logs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release with crisis detection |
| | | Email verification system |
| | | Admin dashboard |
| | | AI chat support |
| | | Mood & journal tracking |
| | | 60+ crisis keywords (English + Roman Urdu) |

---

## License

This project is proprietary and confidential.

---

## Disclaimer

🚨 **Mental Health Crisis Support:**

This system is designed to supplement professional mental health services, not replace them.

**If you or someone you know is in crisis:**
- **Call 988** (US Suicide Prevention Lifeline)
- **Text HOME to 741741** (Crisis Text Line)
- **Call 911** for immediate emergencies
- **Go to nearest emergency room**

Professional help is always recommended for serious mental health concerns.

---

**Last Updated:** January 23, 2026  
**System Status:** ✅ Production Ready  
**Maintained By:** Development Team

---


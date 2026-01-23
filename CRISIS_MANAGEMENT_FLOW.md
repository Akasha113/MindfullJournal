# Crisis Management System - Complete Flow

## Overview
Your app has a **complete crisis detection and management system** that works like this:

```
User Types Risky Message 
    ↓
AI Detects Crisis Keywords
    ↓
Risk Level Assessed (Low/Medium/High/Critical)
    ↓
Message Saved + Crisis Alert Created
    ↓
Admin Can See Alert in Dashboard
    ↓
Admin Can Review & Take Action
```

---

## Step-by-Step Flow

### 1️⃣ User Writes Message in Chat
**Location**: Chat Page (`/dashboard/chat`)

```
User: "I want to die"
         ↓
      SEND
```

### 2️⃣ Frontend Detects Crisis Content
**File**: `src/utils/chat.ts`

When user sends a message:
```typescript
// Frontend analyzes the message for risky keywords
const riskAnalysis = analyzeMessageForSuicide(message);
// Returns: { riskLevel: 'critical', riskScore: 95, detectedKeywords: [...] }
```

**Risk Levels**:
- 🟢 **LOW**: Generic mental health questions
- 🟡 **MEDIUM**: Mentions sadness, depression
- 🔴 **HIGH**: Direct self-harm language, suicide methods
- ⚫ **CRITICAL**: "I want to die", "I'm going to kill myself", etc.

### 3️⃣ Show User Support Message
**What User Sees**:
- User gets compassionate response from AI
- No scary messages, only support
- Crisis hotline numbers provided
- Message saved to their chat history

Example response for "I want to die":
```
I understand you're going through something difficult. 💜
Please reach out for immediate support:
🆘 National Suicide Prevention Lifeline: 988
🆘 Crisis Text Line: Text HOME to 741741
```

### 4️⃣ Create Admin Alert (Backend)
**File**: `backend/server.js` → `/api/admin/crisis-alerts` (POST)

The frontend sends this data to backend:
```javascript
{
  userId: "user123",                           // Who said it
  content: "I want to die",                    // The message
  contentType: "chat_message",                 // From chat
  riskLevel: "critical",                       // How serious
  riskScore: 95,                               // 0-100 score
  detectedKeywords: ["die", "kill myself"],    // What triggered alert
  riskFactors: ["direct_self_harm_statement"], // Category
  conversationId: "conv456",                   // Which conversation
  urgencyLevel: "emergency"                    // How urgent
}
```

### 5️⃣ Alert Saved to Database
**Database Model**: `backend/models/CrisisAlert.js`

```javascript
{
  _id: ObjectId,
  userId: { name, email },           // Link to user
  content: String,                   // The risky message
  contentType: String,               // "chat_message" | "journal"
  riskLevel: String,                 // "critical" | "high" | "medium" | "low"
  riskScore: Number,                 // 0-100
  detectedKeywords: [String],        // Keywords that triggered alert
  riskFactors: [String],             // Why it was flagged
  status: "pending",                 // pending | reviewed | resolved | false_alarm
  urgencyLevel: String,              // emergency | urgent | routine
  createdAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId,              // Admin who reviewed
  notes: String                      // Admin notes
}
```

### 6️⃣ Admin Sees Alert in Dashboard
**Location**: Admin Dashboard → Crisis Alerts Tab (`/admin/dashboard`)

Admin sees:
```
┌─────────────────────────────────────────┐
│ Crisis Alerts (3 pending)               │
├─────────────────────────────────────────┤
│ ⚫ CRITICAL - John Doe - 2 mins ago      │
│   "I want to die"                       │
│   Risk Score: 95                        │
│   [Review] button                       │
├─────────────────────────────────────────┤
│ 🔴 HIGH - Jane Smith - 15 mins ago      │
│   "thinking about hurting myself"       │
│   Risk Score: 78                        │
│   [Review] button                       │
└─────────────────────────────────────────┘
```

### 7️⃣ Admin Reviews Alert
**Location**: Crisis Alert Detail Page

Admin can:
1. ✅ Read full message context
2. ✅ See user's email & info
3. ✅ View detection keywords & risk factors
4. ✅ Read the full conversation
5. ✅ Mark as "Reviewed", "False Alarm", or "Resolved"
6. ✅ Add notes for records
7. ✅ Contact user via email if needed

---

## File Structure - Crisis System

```
Frontend:
├── src/utils/chat.ts                      # Risk detection
│   ├── analyzeMessageForSuicide()
│   ├── detectCrisisKeywords()
│   └── getCrisisResourcesResponse()
│
├── src/pages/ChatPage.tsx                 # Where user types
│   └── handleSendMessage()                # Sends to backend
│
└── src/pages/AdminDashboardPage.tsx       # Admin sees alerts
    └── Crisis Alerts Tab

Backend:
├── backend/models/CrisisAlert.js          # Database schema
├── backend/server.js
│   ├── POST /api/admin/crisis-alerts      # Create alert
│   ├── GET /api/admin/crisis-alerts       # List all alerts
│   ├── GET /api/admin/crisis-alerts/:id   # Get one alert
│   ├── PATCH /api/admin/crisis-alerts/:id # Update status
│   └── GET /api/admin/crisis-stats        # Stats for dashboard
│
└── backend/middleware/auth.js             # Admin authorization
```

---

## How It Works - Detailed

### When User Types "I want to die":

**Frontend (Chat.ts)**:
```typescript
1. User clicks send
2. analyzeMessageForSuicide("I want to die") called
3. Returns: { riskLevel: 'critical', score: 95 }
4. Show crisis response to user immediately
5. POST /api/admin/crisis-alerts with all data
```

**Backend**:
```javascript
1. Receive POST request with message data
2. Create CrisisAlert document
3. Save to MongoDB
4. Return confirmation
5. Alert now appears in Admin Dashboard
```

**Admin Dashboard**:
```javascript
1. Admin logs in at /admin
2. Sees "Crisis Alerts" tab with badge (3)
3. Clicks tab, sees list of all pending alerts
4. Sees CRITICAL alert: "I want to die - John Doe"
5. Clicks [Review] button
6. Sees full conversation context
7. Can add notes and mark as handled
```

---

## Risk Detection Algorithm

**Keywords that trigger alerts**:
```javascript
// CRITICAL (95+ score)
"I want to die", "I'm going to kill myself", 
"I'm planning to end it", "suicide method"

// HIGH (70-90 score)
"I can't take this anymore", "hurt myself",
"better off dead", "no point living"

// MEDIUM (50-70 score)
"I'm depressed", "sad all the time",
"life is pointless", "everything sucks"

// LOW (0-50 score)
"feeling down today", "bit sad",
"tough day", "struggling a bit"
```

---

## Admin Actions on Crisis Alerts

### What Admin Can Do:

1. **Review**: Mark as reviewed, add notes
2. **Contact User**: Use email from dashboard
3. **Escalate**: If critical, contact emergency services
4. **Mark Resolved**: After intervention
5. **False Alarm**: Mark if misdetection

### API Endpoints Admin Uses:

```bash
# Get all crisis alerts
GET /api/admin/crisis-alerts
Authorization: Bearer {admin_token}

# Get one alert details
GET /api/admin/crisis-alerts/{alertId}

# Update alert status
PATCH /api/admin/crisis-alerts/{alertId}
{
  "status": "reviewed",
  "notes": "Called user, confirmed safe",
  "actionTaken": "contacted_emergency"
}

# Get crisis statistics
GET /api/admin/crisis-stats
# Returns: total, pending, critical count, etc.
```

---

## Complete User Journey Example

```
Time    Event                           Where                Result
────────────────────────────────────────────────────────────────
14:00   User writes "I want to die"    Chat Page           ✓ Message sent
14:00   Risk detected (critical)        Frontend             ✓ User sees support message
14:00   Alert created                   Backend              ✓ Saved to database
14:01   Admin refreshes dashboard       Admin Dashboard      ✓ Sees new alert badge (1)
14:02   Admin clicks "Crisis Alerts"    Dashboard Tab        ✓ Sees "CRITICAL" alert
14:03   Admin clicks "Review"           Alert Detail Page    ✓ Sees full conversation
14:05   Admin adds notes: "Tried to     Alert Form           ✓ Notes saved
        contact via email, will follow
        up in 1 hour"
14:05   Admin marks "Reviewed"          Alert Status         ✓ Status updated to "reviewed"
14:10   Admin calls user (if serious)   External             ✓ User gets support
```

---

## Security & Privacy

✅ **User Data Protected**:
- Passwords never stored in alerts
- Only message content and metadata saved
- Admin can only access if logged in
- Audit trail of all reviews

✅ **Alert Accuracy**:
- Multiple keyword detection
- Risk scoring (0-100)
- Context-aware analysis
- Can mark false alarms

✅ **Admin Authorization**:
- Only `isAdmin: true` users can see alerts
- All requests require valid JWT token
- Middleware checks authorization
- Failed attempts logged

---

## What Gets Sent to Backend

When crisis message detected, frontend sends:

```json
{
  "userId": "user_id_123",
  "content": "I want to die",
  "contentType": "chat_message",
  "riskLevel": "critical",
  "riskScore": 95,
  "detectedKeywords": ["die"],
  "riskFactors": ["direct_self_harm_statement"],
  "conversationId": "conv_456",
  "urgencyLevel": "emergency"
}
```

Backend creates alert and stores in MongoDB.

---

## How Admin Manages

**Admin Dashboard Shows**:
- 📊 Total crisis alerts received
- 🔴 Pending alerts (need review)
- ⚫ Critical alerts (highest priority)
- 🟡 High risk alerts
- ✅ Reviewed alerts

**Admin Can**:
- 📖 Read full message & context
- 👤 See user's email & profile
- ✍️ Add notes & observations
- 📞 Contact user directly
- ⚠️ Mark status (reviewed/resolved)
- 📋 Export data for records

---

## Testing the System

### To test crisis detection:

1. Go to chat page: http://localhost:5173/dashboard/chat
2. Type: "I want to die"
3. You should see:
   - ✓ Support message with hotline numbers
   - ✓ Message saved in chat history

### To see admin alert:

1. Login as admin: http://localhost:5173/admin
2. Email: `admin@mindfuljournal.com`
3. Password: `AdminPassword123`
4. Go to "Crisis Alerts" tab
5. You should see the alert you just created

---

## Summary

Your crisis management system:
1. ✅ Detects risky messages in real-time
2. ✅ Shows user compassionate support
3. ✅ Alerts admin immediately
4. ✅ Stores data in database
5. ✅ Allows admin to review & take action
6. ✅ Maintains audit trail
7. ✅ Protects user privacy

**It's a complete, functional crisis management system! 💙**

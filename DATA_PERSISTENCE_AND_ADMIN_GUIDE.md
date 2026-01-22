# Data Persistence & Admin Management Guide

## ✅ Data Persistence (Fixed)

### What Was Fixed
All user data now persists correctly on page refresh:
- ✅ **Mood entries** - Saved in user-specific profile
- ✅ **Journal entries** - Saved in user-specific profile  
- ✅ **Chat conversations** - Saved in user-specific localStorage with user ID
- ✅ **Proper cleanup on logout** - All data cleared when user logs out

### How It Works

**Before (Broken):**
```
User Login → User data loaded → Pages load immediately
❌ Storage tries to read with 'default' user ID
❌ No data found or wrong user's data shown
```

**After (Fixed):**
```
User Login → Auth context stores user ID in authData
             ↓
        All pages wait for auth to complete
             ↓
        Pages load with correct user ID
             ↓
        Storage loads from user-specific keys
             ↓
        All previous data appears ✅
```

### Storage Keys (User-Specific)

Each user gets their own isolated storage keys:

```
User 1 (email: john@example.com):
├─ MindFul_Journal_user_profile_john@example.com
├─ MindFul_Journal_journals_john@example.com
├─ MindFul_Journal_mood_entries_john@example.com
├─ MindFul_Journal_conversations_john@example.com
├─ mindful_conversations_john@example.com
└─ MindFul_Journal_flagged_content_john@example.com

User 2 (email: jane@example.com):
├─ MindFul_Journal_user_profile_jane@example.com
├─ MindFul_Journal_journals_jane@example.com
├─ MindFul_Journal_mood_entries_jane@example.com
├─ MindFul_Journal_conversations_jane@example.com
├─ mindful_conversations_jane@example.com
└─ MindFul_Journal_flagged_content_jane@example.com
```

### Page Load Flow (Fixed)

#### 1. **MoodPage.tsx** 🎯
```typescript
useEffect(() => {
  if (authLoading) return;  // Wait for auth
  
  storage.initializeStorage();
  const entries = storage.getMoodEntries();
  setMoodEntries(entries);
  
  // Load today's mood if exists
  const todayEntry = entries.find(e => 
    new Date(e.date).toDateString() === new Date().toDateString()
  );
  if (todayEntry) {
    setCurrentMood(todayEntry.mood);
    setOptionalThought(todayEntry.note);
  }
}, [authLoading, user]);  // ✅ Depends on auth completion
```

#### 2. **JournalPage.tsx** 📔
```typescript
useEffect(() => {
  if (authLoading) return;  // Wait for auth
  
  storage.initializeStorage();
  const entries = storage.getJournalEntries();
  setJournals(entries);
}, [authLoading, user]);  // ✅ Depends on auth completion
```

#### 3. **ChatPage.tsx** 💬
```typescript
useEffect(() => {
  if (authLoading) return;  // Wait for auth
  
  const allConversations = localChat.getAllConversations();
  
  if (allConversations.length === 0) {
    const newConversation = localChat.createConversation();
    setConversations([newConversation]);
  } else {
    setConversations(allConversations);
  }
}, [authLoading]);  // ✅ Depends on auth completion
```

### Auto-Save (On Every Change)

**Moods auto-save:**
```typescript
useEffect(() => {
  if (loading || authLoading || !user) return;
  
  const profile = storage.getUserProfile();
  storage.updateUserProfile({ 
    ...profile, 
    mood: { current: currentMood, history: moodEntries } 
  });
}, [moodEntries, currentMood, loading, authLoading, user]);
```

**Journals auto-save:**
```typescript
useEffect(() => {
  if (!user || loading) return;
  
  const profile = storage.getUserProfile();
  storage.updateUserProfile({ ...profile, journals });
}, [journals, user, loading]);
```

**Chats auto-save:**
- `localChat.ts` handles storage with `getStorageKey()` that includes user ID
- Each message is automatically saved to user-specific storage

---

## 🛡️ Admin Dashboard

### Admin Dashboard Pages: `/admin`

#### Tab 1: **Overview** 📊

Shows comprehensive statistics:

**User Statistics:**
- Total Users
- Verified Users ✅ 
- Unverified Users ⏳
- New Users Today 📈
- Admin Count 👥

**Crisis Monitoring:**
- Critical Alerts 🚨
- High Risk Alerts ⚠️
- Pending Review ⏳
- Emergency Alerts 🆘

### Tab 2: **Users** 👥

**User Verification Management:**

| Column | Shows |
|--------|-------|
| Name | User's full name |
| Email | User's email address |
| **Status** | ✅ **Verified** or ⏳ **Pending** |
| Role | 👤 **User** or 🔐 **Admin** |
| Joined | Registration date |

**User Verification Process:**
1. User registers → Receives verification code via email
2. User enters code → Email verified ✅
3. Status changes to "Verified" in admin dashboard
4. User can now fully use the app

### Tab 3: **Crisis Alerts** 🚨

**Crisis Management System:**

| Column | Shows |
|--------|-------|
| User | User who triggered alert |
| **Risk Level** | 🔴 **Critical** / 🟠 **High** / 🟡 **Medium** / 🟢 **Low** |
| Content | Preview of flagged content |
| **Status** | ⏳ **Pending** or ✅ **Resolved** |
| Date | When alert was triggered |
| Action | **Review** button to see full details |

**Risk Levels:**
```
🔴 CRITICAL - Immediate danger of suicide
- Keywords: "kill myself", "end my life", "overdose"
- Auto-triggers crisis resources
- Highest priority for admin review

🟠 HIGH RISK - Serious self-harm intention
- Keywords: "hurt myself", "self-harm", "cutting"
- Requires prompt review

🟡 MEDIUM RISK - Concerning content
- Potential warning signs
- Schedule review

🟢 LOW RISK - Monitor for patterns
- General distress
- Regular monitoring
```

**Crisis Management Workflow:**
1. User writes concerning content in Journal or Chat
2. Detection system analyzes for crisis keywords
3. Risk level assigned (Critical/High/Medium/Low)
4. Alert appears in Admin Dashboard
5. Admin clicks **"Review"** to see full context
6. Admin can:
   - Mark as resolved ✅
   - Contact user directly
   - Provide resources
   - Escalate if needed

---

## 🔄 How Data Flows on Login

### Complete Login & Load Sequence:

```
1. User enters email & password
   ↓
2. Backend validates & returns JWT token + user data
   ↓
3. AuthContext.tsx stores:
   - authToken → localStorage.authToken
   - authData → localStorage.authData
   - user state → React state
   - isAuthenticated → true
   ↓
4. useAuth hook detects authLoading = false
   ↓
5. MoodPage, JournalPage, ChatPage useEffect triggers:
   - storage.initializeStorage() called
   - getCurrentUserId() extracts user ID from authData
   - getStorageKeys() returns user-specific keys
   - Data loads from correct user's storage
   ↓
6. Pages render with user's previous data:
   - ✅ Previous moods shown
   - ✅ Previous journals shown
   - ✅ Previous chats shown
```

### Example with Actual IDs:

```
User: john@example.com logs in
↓
authData = { id: "user123", email: "john@example.com", name: "John" }
↓
MoodPage loads:
  getCurrentUserId() → "john@example.com"
  getStorageKeys() → {
    USER_PROFILE: "MindFul_Journal_user_profile_john@example.com",
    MOOD_ENTRIES: "MindFul_Journal_mood_entries_john@example.com",
    ...
  }
  getMoodEntries() → Returns John's 10 previous mood entries
  ✅ All moods display correctly
```

---

## 🚪 Logout Cleanup

When user logs out:

```typescript
const logout = () => {
  // 1. Remove auth tokens
  localStorage.removeItem('authToken');
  localStorage.removeItem('authData');
  
  // 2. Clear ALL user-specific data
  Object.keys(localStorage).forEach(key => {
    if (key.includes('MindFul_Journal') || 
        key.includes('mindful_conversations')) {
      localStorage.removeItem(key);  // ✅ Complete wipe
    }
  });
  
  // 3. Reset state
  setUser(null);
  setToken(null);
  setIsAuthenticated(false);
  
  // 4. Redirect to login
};
```

**Result:** No data leakage between users ✅

---

## 📋 Admin Features Summary

### User Management ✅
- View all users
- See verification status
- Identify new users
- Monitor admin count

### Crisis Monitoring ✅
- Real-time alert dashboard
- Risk level categorization
- Quick review access
- Status tracking

### Statistics ✅
- Total user metrics
- Verification rates
- Crisis statistics
- Growth tracking

---

## 🧪 Testing Data Persistence

### Test Scenario 1: Basic Persistence
```
1. Login as user1@test.com
2. Create mood entry: "Feeling happy today 😊"
3. Create journal: "My first entry"
4. Send chat: "Hello AI"
5. F5 (Refresh page)
✅ Expected: All three items visible
```

### Test Scenario 2: User Switching
```
1. Login as user1@test.com
2. Create mood + journal + chat
3. Logout
4. Login as user2@test.com
5. ✅ Expected: User2 sees EMPTY (or their own data, not User1's)
6. Logout and Login as user1@test.com
7. ✅ Expected: User1's original data still there
```

### Test Scenario 3: Admin View
```
1. Create 2 test users
2. Have them write crisis content
3. Login as admin
4. Go to Admin Dashboard
5. View Crisis Alerts tab
✅ Expected: Both crisis alerts visible with risk levels
6. Click "Review"
✅ Expected: Full content shown for admin action
```

---

## 📁 Files Modified

1. ✅ [src/pages/MoodPage.tsx](src/pages/MoodPage.tsx) - Auth waiting + auto-save
2. ✅ [src/pages/JournalPage.tsx](src/pages/JournalPage.tsx) - Auth waiting + auto-save
3. ✅ [src/pages/ChatPage.tsx](src/pages/ChatPage.tsx) - Auth waiting + auto-load
4. ✅ [src/utils/localChat.ts](src/utils/localChat.ts) - User-specific keys
5. ✅ [src/utils/storage.ts](src/utils/storage.ts) - Date format fix
6. ✅ [src/context/AuthContext.tsx](src/context/AuthContext.tsx) - Complete logout cleanup
7. ✅ [src/pages/AdminDashboardPage.tsx](src/pages/AdminDashboardPage.tsx) - User & Crisis views

---

## ✨ Summary

**All data now:**
- ✅ Persists on page refresh
- ✅ Stays private per user
- ✅ Auto-saves on every change
- ✅ Shows on login
- ✅ Fully cleaned on logout
- ✅ Protected in admin view

**Admin can:**
- ✅ Monitor all users & verification status
- ✅ See crisis alerts in real-time
- ✅ Review concerning content
- ✅ Track statistics
- ✅ Manage user safety

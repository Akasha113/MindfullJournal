# 🔒 Privacy Model - Mindful Journal

## Data Privacy Guarantee

This document outlines how personal data is handled in Mindful Journal to ensure your privacy and safety.

---

## 📱 Client-Side Only Storage

The following sensitive user data is **ONLY** stored in the browser's localStorage and **NEVER** sent to any database or server:

### 1. **Chat Conversations** 💬
- **Storage**: Browser localStorage (indexed with `mindful_conversations_${userId}`)
- **Access**: Only the logged-in user can see their chats
- **Admin Access**: ❌ **BLOCKED** - Admins cannot view user conversations
- **Persistence**: Chats are preserved across browser sessions
- **Data Location**: Client-side only (user's browser)

### 2. **Journal Entries** 📔
- **Storage**: Browser localStorage (indexed with `MindFul_Journal_journals_${userId}`)
- **Access**: Only the logged-in user can see their journals
- **Admin Access**: ❌ **BLOCKED** - Admins cannot view user journals
- **Persistence**: Journal entries are preserved across browser sessions
- **Data Location**: Client-side only (user's browser)

### 3. **Mood Tracking** 😊
- **Storage**: Browser localStorage (indexed with `MindFul_Journal_mood_entries_${userId}`)
- **Access**: Only the logged-in user can see their mood history
- **Admin Access**: ❌ **BLOCKED** - Admins cannot view mood entries
- **Persistence**: Mood history is preserved across browser sessions
- **Data Location**: Client-side only (user's browser)

---

## 🔐 What IS Stored in Database

For system functionality, only the following information is stored in MongoDB:

- User account credentials (name, email, hashed password)
- Email verification status
- User preferences (theme, notifications, language)
- Admin status
- Profile information (bio, avatar, creation date)

---

## 📊 What IS NOT Stored in Database

The following data is **intentionally NOT** stored in any database:

- ❌ Chat conversations and messages
- ❌ Journal entries
- ❌ Mood tracking history
- ❌ Conversation content
- ❌ Personal notes and thoughts

---

## 🛡️ Security Benefits

1. **Complete Privacy**: Your personal conversations, journals, and mood data never leave your device
2. **Admin Transparency**: Admins cannot spy on user conversations or journals
3. **User Control**: You have full control over your data - deleting it from your browser removes it permanently
4. **No Server Backup Risk**: No cloud storage means no risk of data breaches at the database level

---

## ⚠️ Important Notes

- **Browser Cache Clear**: If you clear your browser's localStorage or use incognito/private mode, your data will be lost
- **Multi-Device**: Your data is device-specific. Logging in on another device will show empty chat/journal history
- **Backup Recommendation**: Consider exporting your data periodically if you want to keep it long-term
- **Single Browser Required**: For continuity, use the same browser and device

---

## 🚨 Crisis Detection Exception

**ONLY** when a crisis is detected (suicidal/self-harm keywords):
- The crisis message content is logged to the database for safety
- This is sent to admins for emergency intervention
- This is done to protect your life, even if it means breaking privacy temporarily

**Crisis Alert Contains:**
- User name and email (for contact)
- The specific message that triggered the alert
- Risk level assessment
- Keywords detected

**Crisis Alert Does NOT Contain:**
- Full conversation history
- Personal journal entries
- Other private messages

---

## 💾 Data Export & Deletion

Users can:
- ✅ Export their data (chats, journals, mood history) as JSON from their browser
- ✅ Delete all data by clearing localStorage
- ✅ Delete specific entries individually

**Note**: Data is NOT stored on our servers, so deletion from browser = permanent deletion.

---

## 📞 Privacy Questions?

If you have questions about data privacy, contact: `mindfuljounralofficial@gmail.com`

---

**Last Updated**: February 28, 2026  
**Status**: ✅ Privacy Model Implemented and Verified

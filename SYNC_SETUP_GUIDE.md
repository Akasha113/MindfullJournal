# 🚀 SETUP GUIDE: Multi-Device Chat & Journal Sync

## ✅ What's Been Implemented

Your Mindful Journal PWA now has **encrypted multi-device sync**! Users can now:
- ✅ Create chats and journals on any device
- ✅ See all their data on any other device
- ✅ Have their data encrypted so admins can't access it
- ✅ Work offline with automatic sync when online

## 📋 Quick Setup Steps

### Step 1: Backend Setup (Required)

The backend has been updated with new endpoints and models. Make sure you're using the latest code.

#### New Files Created:
- `backend/models/EncryptedChat.js` - Database model for encrypted chats
- `backend/models/EncryptedJournal.js` - Database model for encrypted journals

#### New API Endpoints Added to `backend/server.js`:
```javascript
// Chats
POST   /api/chats/sync
GET    /api/chats/all
GET    /api/chats/:conversationId
DELETE /api/chats/:conversationId

// Journals
POST   /api/journals/sync
GET    /api/journals/all
GET    /api/journals/:entryId
DELETE /api/journals/:entryId
```

**Action:** Make sure your backend is using the updated `server.js` file that imports the new models:
```javascript
import EncryptedChat from './models/EncryptedChat.js';
import EncryptedJournal from './models/EncryptedJournal.js';
```

### Step 2: Frontend Setup (Required)

New utility files handle encryption and syncing:

#### New Files Created:
- `src/utils/encryption.ts` - Client-side AES-256-GCM encryption
- `src/utils/cloudSync.ts` - Sync encrypted data with backend

#### Updated Files:
- `src/utils/localChat.ts` - Now syncs chats to backend
- `src/utils/storage.ts` - Now syncs journals to backend
- `src/context/AuthContext.tsx` - Triggers sync on login
- `src/pages/LoginPage.tsx` - Updated to use async login
- `src/pages/ChatPage.tsx` - Updated for async operations
- `src/pages/JournalPage.tsx` - Updated for async operations

**Action:** Make sure all files are in the latest state (they should be auto-updated).

### Step 3: Database Schema

MongoDB collections will be created automatically when needed:

```javascript
// EncryptedChats collection
{
  userId: ObjectId,
  conversationId: String,
  encryptedData: String (base64),
  iv: String (base64),
  authTag: String (base64),
  dataHash: String,
  clientUpdatedAt: Date,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// EncryptedJournals collection
{
  userId: ObjectId,
  entryId: String,
  encryptedData: String (base64),
  iv: String (base64),
  authTag: String (base64),
  dataHash: String,
  clientUpdatedAt: Date,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Action:** No action needed - MongoDB will create these automatically.

### Step 4: Environment Configuration

Ensure your `.env` files have the correct API URL:

**Frontend (`.env.local` or `.env`):**
```env
VITE_API_URL=http://localhost:3001
VITE_GITHUB_API_TOKEN=your_github_token
VITE_GITHUB_MODEL=gpt-4o-mini
```

**Backend (`.env`):**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/mindful-journal
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Step 5: Testing

Test the multi-device sync:

1. **Test 1: Same Device, Different Login**
   - Create a chat or journal entry
   - Logout
   - Login again
   - ✅ Should see all previous data

2. **Test 2: Different Browser/Incognito**
   - Open private/incognito window
   - Login with same account
   - ✅ Should see all chats and journals from main browser
   - Create something new in incognito
   - Go back to main browser
   - Refresh page
   - ✅ Should see the new entry

3. **Test 3: Offline Sync**
   - Go offline (DevTools → Network → Offline)
   - Create a chat/journal
   - ✅ Should work and save locally
   - Go back online
   - ✅ Data should sync to backend in background

4. **Test 4: Verify Encryption**
   - Check MongoDB directly:
   ```javascript
   db.encryptedchats.findOne()
   db.encryptedjournals.findOne()
   ```
   - ✅ `encryptedData` should be unreadable gibberish
   - ✅ Cannot decrypt without the password

## 🔐 Security Verification

To verify the system is working correctly:

### Check 1: Encryption
```bash
# Connect to MongoDB and run:
db.encryptedchats.findOne()
# Result should show encrypted gibberish in encryptedData field
```

### Check 2: No Admin Access
- Login as admin
- Try to access user chats via API
- ✅ Should get encrypted data
- ✅ Cannot decrypt it

### Check 3: Data Persistence
- Login from Browser A, create data
- Login from Browser B with same account
- ✅ Should see all data from Browser A
- ✅ Should be able to create new data
- Login back to Browser A, refresh
- ✅ Should see new data from Browser B

## ⚠️ Important Notes

### Data Migration
- Old chats in localStorage are still accessible
- They will be synced to backend on first login
- No data loss during migration

### Password Changes
- If user changes password, old encrypted data becomes inaccessible (by design)
- This is a security feature - only the user can decrypt their data

### Offline Behavior
- Chats/journals created offline are stored locally
- They sync to backend once back online
- No manual action needed by user

### Error Handling
- If backend is unavailable, app still works with local data
- Sync retries automatically when backend is back
- No manual re-sync needed

## 🔧 Troubleshooting

### Issue: "Chats not syncing to new device"

**Solution:**
1. Check browser console for errors
2. Verify `authToken` is being stored
3. Check backend logs: `npm logs` or check terminal
4. Verify MongoDB connection
5. Make sure user is authenticated

### Issue: "Cannot decrypt data"

**Solution:**
1. Check that `authData` contains password hash
2. Verify encryption key derivation is working
3. Check browser console for crypto errors
4. Try logout/login cycle

### Issue: "Data showing different on two devices"

**Solution:**
1. Refresh the page on one device
2. Clear browser cache if stuck
3. Logout and login again
4. Check MongoDB for data consistency

### Issue: Backend not saving encrypted data

**Solution:**
1. Check MongoDB connection in backend
2. Verify `EncryptedChat` and `EncryptedJournal` models are imported
3. Check backend logs for errors
4. Verify auth middleware is working

## 📊 Monitoring

### Check Sync Status
```bash
# Backend logs should show:
✅ Chat synced to backend: [conversationId]
✅ Journal synced to backend: [entryId]
```

### Check Database
```javascript
// MongoDB:
db.encryptedchats.count() // Should increase as user creates chats
db.encryptedjournals.count() // Should increase as user creates journals
```

### Check Performance
- Syncing should happen in background (doesn't block UI)
- Initial sync on login should complete in <2 seconds
- Subsequent syncs should be <500ms

## 🎯 Next Steps

1. **Test thoroughly** with multiple browsers and devices
2. **Verify encryption** by checking MongoDB directly
3. **Monitor logs** during testing
4. **Update user documentation** to explain cross-device sync
5. **Backup database** before going to production
6. **Set up monitoring** for sync errors

## 📚 Documentation Files

- `MULTI_DEVICE_SYNC_GUIDE.md` - Technical details
- This file - Setup and testing guide
- `PRIVACY_MODEL.md` - Privacy guarantees (update if needed)

## ✨ Features Now Available

Users can now:
- ✅ Start a chat on their phone, continue on laptop
- ✅ Write journal entry on tablet, see it on desktop
- ✅ All data encrypted and private
- ✅ Works offline with automatic sync
- ✅ No more data loss when switching devices
- ✅ Admin cannot access their conversations

## 🚀 You're All Set!

Your Mindful Journal now has enterprise-grade encrypted multi-device sync. Users can access their chats and journals from any device while maintaining complete privacy.

Need help? Check the technical guide in `MULTI_DEVICE_SYNC_GUIDE.md` or review the code comments in the implementation files.

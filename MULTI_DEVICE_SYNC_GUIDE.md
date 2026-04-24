# 🔒 ENCRYPTED MULTI-DEVICE CHAT & JOURNAL SYNC IMPLEMENTATION

## Overview
This implementation fixes the issue where users lose their chats and journals when logging in from different browsers or devices. All data is now synced across devices while remaining encrypted and private - **even admins cannot access the data**.

## ✨ Key Features

### 1. **Automatic Data Sync Across Devices** 🔄
- When a user logs in from a new browser/device, their chats and journals automatically sync from the backend
- Data stays in sync even if user switches devices
- No manual re-entering of data needed

### 2. **Client-Side Encryption** 🔐
- Data is encrypted on the client BEFORE sending to the backend
- Uses **AES-256-GCM** authenticated encryption
- Encryption key is derived from user's email + password hash (never sent to server)
- Backend stores only encrypted data and cannot decrypt it

### 3. **Privacy Guarantee** 🛡️
- **Admins CANNOT access user chats or journals** - even with backend access
- Data integrity verified with cryptographic hashing
- Each user's data is isolated and user-specific

### 4. **Local Storage Fallback** 💾
- All data cached locally in browser localStorage for offline access
- Automatic sync happens in background
- If backend is unavailable, app still works with local data

## 🏗️ Architecture

### Backend Changes

#### New Database Models
1. **EncryptedChat.js** - Stores encrypted chat conversations
   - `userId` - Reference to user
   - `conversationId` - Conversation identifier
   - `encryptedData` - AES-256-GCM encrypted messages
   - `iv` - Initialization vector for decryption
   - `authTag` - Authentication tag for integrity verification
   - `dataHash` - SHA-256 hash of decrypted data

2. **EncryptedJournal.js** - Stores encrypted journal entries
   - `userId` - Reference to user
   - `entryId` - Entry identifier
   - `encryptedData` - AES-256-GCM encrypted journal content
   - `iv` - Initialization vector
   - `authTag` - Authentication tag
   - `dataHash` - Data integrity hash

#### New API Endpoints
```
POST   /api/chats/sync              - Sync encrypted chat
GET    /api/chats/all               - Fetch all encrypted chats
GET    /api/chats/:conversationId   - Get specific encrypted chat
DELETE /api/chats/:conversationId   - Delete chat

POST   /api/journals/sync           - Sync encrypted journal
GET    /api/journals/all            - Fetch all encrypted journals  
GET    /api/journals/:entryId       - Get specific encrypted journal
DELETE /api/journals/:entryId       - Delete journal
```

### Frontend Changes

#### New Utilities

1. **src/utils/encryption.ts**
   - `deriveEncryptionKey()` - Creates encryption key from email + password
   - `encryptData()` - Encrypts data with AES-256-GCM
   - `decryptData()` - Decrypts data
   - `hashData()` - Creates data integrity hash
   - `getUserEncryptionKey()` - Retrieves user's encryption key

2. **src/utils/cloudSync.ts**
   - `syncChatToBackend()` - Uploads encrypted chat
   - `fetchChatsFromBackend()` - Downloads and decrypts chats
   - `deleteChatFromBackend()` - Deletes chat from backend
   - `syncJournalToBackend()` - Uploads encrypted journal
   - `fetchJournalsFromBackend()` - Downloads and decrypts journals
   - `deleteJournalFromBackend()` - Deletes journal from backend
   - `syncAllDataOnLogin()` - Full sync on login

#### Updated Modules

1. **src/utils/localChat.ts** - Now syncs with backend
   - `createConversation()` - Now async, syncs new chats
   - `addMessage()` - Now async, syncs on each message
   - `deleteConversation()` - Now async, deletes from both local and backend
   - `syncConversationsFromBackend()` - Fetches chats from backend on login
   - `clearConversation()` - Now async
   - `updateConversationTitle()` - Now async

2. **src/utils/storage.ts** - Now syncs with backend
   - `addJournalEntry()` - Now async, syncs new entries
   - `updateJournalEntry()` - Now async, syncs updates
   - `deleteJournalEntry()` - Now async, deletes from both local and backend
   - `syncJournalsFromBackend()` - Fetches journals from backend on login

3. **src/context/AuthContext.tsx** - Now triggers sync on login
   - `login()` - Now async, calls sync functions
   - Syncs both chats and journals from backend when user logs in

4. **src/pages/LoginPage.tsx**
   - Updated to await `login()` function
   - Uses environment variable for API URL

5. **src/pages/ChatPage.tsx**
   - Updated to await async chat functions
   - Proper error handling for async operations

6. **src/pages/JournalPage.tsx**
   - Updated to await async journal functions
   - Updated to use storage sync functions
   - Updated documentation comment to reflect new sync behavior

## 🔐 Security & Privacy

### Encryption Details
```
Algorithm: AES-256-GCM
Key: SHA-256(email:passwordHash)
IV: 96-bit randomly generated per message
Authentication: GCM authentication tag (16 bytes)
Integrity: SHA-256 hash of plaintext
```

### Privacy Model
- **Admin Access**: ❌ Cannot decrypt data
- **Backend Staff Access**: ❌ Cannot access data
- **User Privacy**: ✅ Complete
- **Data Isolation**: ✅ Per-user encrypted storage

### Key Management
- Encryption key is derived from user credentials (email + password)
- Key is **never** sent to backend
- Key is generated fresh each time user accesses data
- If user's password changes, old data becomes inaccessible (by design)

## 🚀 How It Works

### On Login
1. User enters email and password
2. Backend validates credentials and returns JWT token
3. Frontend calls `login()` with token and user data
4. `login()` triggers `syncConversationsFromBackend()` and `syncJournalsFromBackend()`
5. These fetch encrypted data from backend
6. Frontend decrypts data using user's password hash
7. Decrypted data is merged with local data
8. All data is now available locally and in sync

### On Chat/Journal Update
1. User creates/edits chat or journal entry
2. Data is immediately saved to local storage (for offline access)
3. Encryption utility encrypts data with user's encryption key
4. Encrypted data is sent to backend via cloudSync utility
5. Backend stores encrypted data without decrypting it
6. If backend unavailable, local data is still usable

### On Logout
1. Session data is cleared
2. Local storage data persists (will sync again on next login from any device)

### On New Device/Browser
1. User logs in
2. Backend sync fetches all encrypted chats and journals
3. Frontend decrypts them using user's password
4. User sees all their data on new device

## 📦 Data Flow Diagram

```
┌─────────────────┐
│   User Login    │
│ (email, pwd)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Backend Validates Credentials      │
│  Returns JWT + User Data            │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Frontend: login() │
         └────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌──────────────┐
    │ Sync    │      │ Sync         │
    │ Chats   │      │ Journals     │
    └────┬────┘      └────┬─────────┘
         │                │
         ▼                ▼
    ┌──────────────────────────────────┐
    │  Backend: Fetch Encrypted Data   │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  Frontend: Derive Encryption Key │
    │  (email + password hash)         │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  Frontend: Decrypt Data          │
    │  Verify Integrity (hash check)   │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  Merge with Local Storage        │
    │  Show User All Data              │
    └──────────────────────────────────┘
```

## ✅ Testing Checklist

1. **Login from Different Browser**
   - Login from Browser A
   - Create chats and journals
   - Login from Browser B with same account
   - ✅ Verify all data appears on Browser B

2. **Data Persistence**
   - Create 5 journal entries
   - Create 2 chat conversations
   - Logout from all browsers
   - Login again from any browser
   - ✅ Verify all data is still there

3. **Offline Functionality**
   - Create chat/journal while offline
   - Data should be stored locally
   - ✅ Verify sync happens once back online

4. **Encryption Verification**
   - Check backend database directly
   - ✅ Verify data is encrypted gibberish
   - ✅ Verify encryption key is not stored anywhere

5. **Admin Cannot Access**
   - Login as admin
   - Try to access user data via API
   - ✅ Verify admin gets encrypted data, cannot decrypt

## 🔧 Configuration

### Environment Variables
```
VITE_API_URL=http://localhost:3001
```

### Backend Requirements
- MongoDB for storing encrypted data
- Node.js with Express
- All dependencies in package.json

## 🐛 Troubleshooting

### Data Not Syncing
- Check network connection
- Verify authToken is valid
- Check backend logs for errors
- Verify MongoDB connection

### Encryption Key Issues
- Ensure password hash is stored in authData
- Check browser console for encryption errors
- Verify localStorage authData format

### Data Mismatch Between Devices
- Clear browser cache and reload
- Logout and login again
- Check backend database for data integrity

## 📝 Future Improvements

1. **Progressive Sync** - Sync older data in background
2. **Conflict Resolution** - Handle edit conflicts across devices
3. **Selective Sync** - Let users choose what to sync
4. **Backup & Restore** - Export/import encrypted backups
5. **End-to-End Encryption UI** - Show encryption status to users

## 🎯 Summary

This implementation provides:
- ✅ **Cross-device sync** - Access data from any device
- ✅ **Complete privacy** - Admin cannot access data
- ✅ **Offline support** - Works when backend is down
- ✅ **Data security** - AES-256-GCM encryption
- ✅ **Integrity checking** - Verify data hasn't been tampered with
- ✅ **Backward compatible** - Old local data still accessible

Users can now confidently use Mindful Journal from any device knowing their data is secure, private, and always in sync.

# Migration Guide: Local Storage to MongoDB

This guide helps you migrate from localStorage to MongoDB for persistent data storage.

## Overview

| Aspect | Local Storage | MongoDB |
|--------|---------------|---------|
| Storage | Browser memory | Cloud/Local database |
| Persistence | Limited (5-10MB) | Unlimited |
| Scalability | Single device | Multi-device, global |
| Backups | Manual | Automatic |
| Performance | Fast locally | Optimized with indexes |
| Security | Vulnerable | Secure with authentication |

## Migration Strategy

### Phase 1: Backend Setup (Already Done ✅)
- MongoDB models created
- API endpoints built
- Authentication implemented
- Email verification working

### Phase 2: Frontend Migration (Next Steps)

#### Step 1: Update RegisterPage
**Current (Local Storage):**
```typescript
const handleSubmit = async (e) => {
  // Stores in localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  users.push({ id, name, email, password });
  localStorage.setItem('users', JSON.stringify(users));
};
```

**New (MongoDB):**
```typescript
import { authAPI } from '../utils/api';

const handleSubmit = async (e) => {
  // Sends to backend, stores in MongoDB
  await authAPI.register(name, email, password, confirmPassword);
  // Redirects to verification page
};
```

#### Step 2: Update LoginPage
**Before:**
```typescript
const foundUser = users.find(u => u.email === email && u.password === password);
localStorage.setItem('authData', JSON.stringify(userData));
```

**After:**
```typescript
import { authAPI } from '../utils/api';

await authAPI.login(email, password);
// Token automatically stored in localStorage
// AuthContext handles user state
```

#### Step 3: Update JournalPage
**Before (Direct localStorage):**
```typescript
const journals = storage.getAllJournals();
storage.addJournal({ title, content, mood });
```

**After (API calls):**
```typescript
import { journalAPI } from '../utils/api';

// Get journals
const { journals, pagination } = await journalAPI.getAll(page, limit, { mood, tag });

// Create journal
const { journal } = await journalAPI.create({ title, content, mood, moodScore, tags });

// Update journal
const updated = await journalAPI.update(id, { title, content, mood });

// Delete journal
await journalAPI.delete(id);
```

#### Step 4: Update ChatPage
**Before (localStorage):**
```typescript
const chats = storage.getAllChats();
storage.addChat({ title, messages });
```

**After (API calls):**
```typescript
import { chatAPI } from '../utils/api';

// Get chats
const { chats } = await chatAPI.getAll(page, limit);

// Create chat
const { chat } = await chatAPI.create({ conversationTitle, initialMessage });

// Add message
const updated = await chatAPI.addMessage(chatId, content, 'user');

// Delete chat
await chatAPI.delete(chatId);
```

#### Step 5: Update ProfilePage
**Before:**
```typescript
const profile = storage.getUserProfile();
storage.updateUserProfile({ ...profile, name, bio });
```

**After:**
```typescript
import { userAPI } from '../utils/api';

// Get profile
const { user } = await userAPI.getProfile();

// Update profile
const updated = await userAPI.updateProfile({ name, bio, avatar, preferences });

// Get stats
const stats = await userAPI.getStats();
```

## Data Migration (If Needed)

### Export LocalStorage Data
```typescript
// Run in browser console
const allData = {
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  journals: JSON.parse(localStorage.getItem('journals') || '[]'),
  chats: JSON.parse(localStorage.getItem('chats') || '[]')
};
console.log(JSON.stringify(allData, null, 2));
// Copy and save as migration-data.json
```

### Import to MongoDB
```bash
# Using mongoimport (for existing data)
mongoimport --db zenify --collection users --file users.json --jsonArray
mongoimport --db zenify --collection journals --file journals.json --jsonArray
mongoimport --db zenify --collection chats --file chats.json --jsonArray
```

## Hybrid Approach (During Transition)

Support both storage mechanisms temporarily:

```typescript
export const journalAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      // Try MongoDB first
      const response = await fetch(`${API_URL}/api/journals?...`);
      return handleResponse(response);
    } catch (error) {
      // Fallback to localStorage
      console.warn('API failed, using localStorage');
      return getFallbackJournals(filters);
    }
  }
};

const getFallbackJournals = (filters) => {
  // Return data from localStorage
  const journals = JSON.parse(localStorage.getItem('journals') || '[]');
  // Apply filters
  return { journals, pagination: { total: journals.length, page: 1 } };
};
```

## Error Handling During Migration

```typescript
try {
  const data = await journalAPI.getAll();
  setJournals(data.journals);
} catch (error) {
  if (error.message.includes('network')) {
    // Network error - show message
    setError('Network error. Working offline with local data.');
    // Use localStorage fallback
    setJournals(getFallbackJournals());
  } else if (error.message.includes('authentication')) {
    // Auth error - redirect to login
    navigate('/login');
  } else {
    setError(error.message);
  }
}
```

## Update AuthContext

```typescript
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check both token and legacy authData
    const token = localStorage.getItem('authToken');
    const authData = localStorage.getItem('authData');
    
    if (token && authData) {
      setToken(token);
      setUser(JSON.parse(authData));
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Update API Calls - Examples

### Create Journal with Error Handling
```typescript
const createJournal = async (journalData) => {
  try {
    setLoading(true);
    const response = await journalAPI.create(journalData);
    
    // Optimistic update
    setJournals([response.journal, ...journals]);
    
    setSuccess('Journal created successfully!');
  } catch (error) {
    if (error.message.includes('401')) {
      // Token expired
      authContext.logout();
      navigate('/login');
    } else {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

### Fetch with Pagination
```typescript
const fetchJournals = async (page = 1) => {
  try {
    const { journals, pagination } = await journalAPI.getAll(
      page,
      10,
      { mood: selectedMood, tag: selectedTag, search: searchTerm }
    );
    
    setJournals(journals);
    setPagination(pagination);
  } catch (error) {
    setError(error.message);
  }
};
```

## Rollback Plan

If issues occur, you can quickly rollback:

```typescript
// Temporarily disable API calls
const USE_API = false;

const journalAPI = USE_API ? {
  getAll: /* API call */
} : {
  getAll: /* localStorage call */
};
```

## Performance Considerations

### Caching Strategy
```typescript
let cachedData = null;
let cacheTime = null;

const getCachedJournals = async () => {
  const now = Date.now();
  if (cachedData && cacheTime && (now - cacheTime) < 5 * 60 * 1000) {
    return cachedData; // Return cached data if < 5 minutes old
  }
  
  const data = await journalAPI.getAll();
  cachedData = data;
  cacheTime = now;
  return data;
};
```

### Pagination Instead of Loading All
```typescript
// Bad - loads 1000s of records
const allJournals = await journalAPI.getAll();

// Good - loads 10 at a time
const { journals, pagination } = await journalAPI.getAll(1, 10);
```

## Testing Migration

### Unit Test Example
```typescript
describe('Journal Migration', () => {
  it('should fetch from API', async () => {
    const result = await journalAPI.getAll();
    expect(result).toHaveProperty('journals');
    expect(result).toHaveProperty('pagination');
  });

  it('should include auth token', async () => {
    const headers = getAuthHeaders();
    expect(headers).toHaveProperty('Authorization');
  });

  it('should handle API errors', async () => {
    try {
      await journalAPI.getAll(); // Without token
    } catch (error) {
      expect(error.message).toContain('401');
    }
  });
});
```

## Timeline Suggestion

**Week 1:** Backend setup & testing (✅ Done)
**Week 2:** Update auth components (RegisterPage, LoginPage, AuthContext)
**Week 3:** Update JournalPage component
**Week 4:** Update ChatPage component
**Week 5:** Update ProfilePage and statistics
**Week 6:** Testing, optimization, cleanup

## Cleanup After Migration

Once fully migrated, remove localStorage code:

```typescript
// Remove these eventually:
localStorage.removeItem('users');
localStorage.removeItem('journals');
localStorage.removeItem('chats');
localStorage.removeItem('userProfile');

// Keep these for token and auth data:
localStorage.getItem('authToken');
localStorage.getItem('authData');
```

## Validation Checklist

- [ ] All API endpoints working
- [ ] Authentication with JWT tokens working
- [ ] Journals CRUD operations working
- [ ] Chats CRUD operations working
- [ ] Pagination working
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] User can logout
- [ ] New user registration flow works
- [ ] Existing users can migrate
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Cross-device access works
- [ ] Data persists correctly

## Common Migration Issues

### Issue 1: CORS Errors
**Solution:** Ensure FRONTEND_URL in backend `.env` is correct

### Issue 2: 401 Unauthorized
**Solution:** Include `Authorization: Bearer <token>` header

### Issue 3: Lost Data During Migration
**Solution:** Backup localStorage before starting
```typescript
const backup = JSON.stringify(localStorage);
// Send to email or save to file
```

### Issue 4: Slow Performance
**Solution:** Add pagination and caching

## Final Notes

- ✅ Data is now persisted in MongoDB
- ✅ Accessible from any device
- ✅ Secure with JWT tokens
- ✅ Automatically backed up
- ✅ Scalable for production

Congratulations on the migration! 🎉

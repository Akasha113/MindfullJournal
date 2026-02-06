# Complete Setup Guide for Login & Register

This guide fixes both database persistence and email verification code issues.

## Problem 1: Database Data Lost on Restart ⚠️

**Cause:** MongoDB is not running or not properly persisting data.

### Solution A: Use Local MongoDB (Recommended for Development)

**Windows:**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. During installation, choose "Install as Service"
3. Open Admin Command Prompt and run:
   ```
   net start MongoDB
   ```
4. Test connection:
   ```
   node backend/scripts/testDBConnection.js
   ```

**Mac:**
1. Install via Homebrew:
   ```
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```
2. Test connection:
   ```
   node backend/scripts/testDBConnection.js
   ```

**Linux (Ubuntu):**
1. Install MongoDB:
   ```
   sudo apt-get install -y mongodb
   sudo systemctl start mongod
   ```
2. Test connection:
   ```
   node backend/scripts/testDBConnection.js
   ```

### Solution B: Use MongoDB Atlas (Cloud Database - Easiest)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free account)
3. Create a new cluster
4. Click "Connect" and get your connection string
5. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/mindful-journal?retryWrites=true&w=majority
   ```
6. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindful-journal?retryWrites=true&w=majority
   ```
7. Restart backend server
8. Test with: `node backend/scripts/testDBConnection.js`

---

## Problem 2: Verification Code Not Resending 📧

**Cause:** Gmail credentials not set up properly.

### Solution: Setup Gmail App Password

1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification" and enable it
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password (remove spaces)
6. Update `backend/.env`:
   ```
   GMAIL_APP_PASSWORD=ygbeyxpdtyhbsolr
   ```
7. Test email with:
   ```
   curl -X POST http://localhost:3001/api/debug/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@gmail.com"}'
   ```
   Or use Postman/Thunder Client and send POST to:
   - URL: `http://localhost:3001/api/debug/test-email`
   - Body: `{"email":"your-test-email@gmail.com"}`

---

## Complete Setup Steps

### 1. Test Database Connection
```bash
node backend/scripts/testDBConnection.js
```
Expected output:
```
✅ MongoDB Connection Successful!
📊 Database Statistics:
  MongoDB Version: 5.0.0
✅ Write Test: Successful
```

### 2. Test Email Service
```bash
curl -X POST http://localhost:3001/api/debug/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```
Expected response:
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "testTo": "your-email@gmail.com",
  "testCode": "123456"
}
```

### 3. Start the Application
```bash
npm start
```
This will start both frontend (port 5173) and backend (port 3001).

### 4. Test Registration Flow
1. Go to http://localhost:5173
2. Click "Register"
3. Fill in the form with test data
4. Check your email for verification code
5. Enter the code to complete registration
6. Login with your credentials

### 5. Test Resend Verification Code
1. During registration, if you don't receive the email:
   - Check spam folder
   - Test email service (step 2 above)
2. After receiving first code, click "Resend Code"
3. You should now get the new code in your email

---

## Troubleshooting

### Database Issues
- **"connect ECONNREFUSED"**: MongoDB is not running. Start it!
- **"Invalid credentials"**: If using Atlas, verify username/password in connection string
- Data not persisting: Restart MongoDB with `-d` flag to run as daemon

### Email Issues
- **"Failed to send verification email"**: Check Gmail App Password is correct (no spaces!)
- **Emails in spam**: Increase Gmail trust by replying to one test email
- **"Too many failed login attempts"**: Confirm the 16-character App Password copied correctly

### Port Issues
- **Port 3001 in use**: Kill the process: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr 3001` (Windows)
- **Port 5173 in use**: Kill the process: `lsof -i :5173` (Mac/Linux) or `netstat -ano | findstr 5173` (Windows)

---

## Quick Commands

```bash
# Test database only
node backend/scripts/testDBConnection.js

# Start just backend
npm run start:backend

# Start just frontend
npm run start:frontend

# Start both
npm start

# Stop all (Ctrl+C)

# View backend logs (if running)
# Check terminal output
```

---

## Data Persistence Verification

After setup, verify data persists:

1. Register an account and verify email
2. Stop the application (Ctrl+C)
3. Wait 10 seconds
4. Restart the application
5. Login with the same account - it should work!

If login fails, check:
- MongoDB is running: `node backend/scripts/testDBConnection.js`
- Correct MongoDB URI in `.env`
- No connection errors in terminal

---

## Important Files

- `backend/.env` - Configuration (Database, Email, JWT)
- `backend/scripts/testDBConnection.js` - Test database connection
- `backend/server.js` - Main backend server with all API endpoints
- `src/pages/RegisterPage.tsx` - Frontend registration form
- `src/pages/VerificationPage.tsx` - Email verification UI
- `src/pages/LoginPage.tsx` - Frontend login form

---

## Need Help?

1. Check backend console for errors
2. Check browser console (F12) for frontend errors
3. Test email manually: `curl` command above
4. Test database: `node backend/scripts/testDBConnection.js`
5. Check `.env` file has correct credentials

**Next**: Run the test commands and let me know the output!

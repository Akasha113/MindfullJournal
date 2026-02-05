# Clerk Integration Quick Start

## 🎯 In 5 Minutes

### 1. Get Clerk Keys (2 min)
```
1. Go to https://clerk.com → Sign up
2. Create new app
3. Get Publishable Key (pk_...) and Secret Key (sk_...)
```

### 2. Add Environment Variables (1 min)
Create `.env` in project root:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_API_URL=http://localhost:3001
```

### 3. Start App (1 min)
```bash
npm install
npm run dev
```

### 4. Test (1 min)
Visit: `http://localhost:5173/sign-up`

Create account → Automatically redirected to dashboard ✅

---

## 📝 What's Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Added ClerkProvider |
| `src/context/AuthContext.tsx` | Uses Clerk hooks |
| `src/pages/LoginPage.tsx` | Uses `<SignIn />` component |
| `src/pages/RegisterPage.tsx` | Uses `<SignUp />` component |
| `src/main.tsx` | Added Clerk styles |
| `package.json` | Added @clerk/clerk-react |
| `.env.example` | Configuration template |

---

## 🔑 Clerk Keys Location

1. Go to https://dashboard.clerk.com
2. Select your app
3. Click **API Keys** in left sidebar
4. Copy **Publishable Key** and **Secret Key**

---

## ✨ New Features

✅ Automatic email verification  
✅ Social login (Google, GitHub, etc.)  
✅ Password reset built-in  
✅ Session management  
✅ Multi-factor authentication  
✅ User management dashboard  

---

## 🚨 If Something Breaks

### Blank Login Page?
→ Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env`

### Redirect Loop?
→ Go to Clerk Dashboard → Paths → Check URLs

### Won't Load?
→ `npm install` → `npm run dev` → Clear cache

---

## 📱 Test It

**Sign up**: http://localhost:5173/sign-up  
**Sign in**: http://localhost:5173/sign-in  
**Dashboard**: http://localhost:5173/dashboard  

---

## 🎨 Customize Theme

Edit `src/pages/LoginPage.tsx`:

```tsx
<SignIn 
  appearance={{
    elements: {
      headerTitle: "your-custom-class",
      formButtonPrimary: "your-button-class",
    }
  }}
/>
```

---

## 📞 Help

- **Docs**: https://clerk.com/docs
- **Support**: https://support.clerk.com
- **Status**: https://status.clerk.com

---

**You're all set! 🎉**

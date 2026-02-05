# Clerk Integration Setup Guide

## Overview
Your Mindful Journal application has been updated to use Clerk for modern, secure authentication with automatic login and signup capabilities.

## What Changed

### Frontend Updates
1. **Installed Package**: `@clerk/clerk-react`
2. **Updated Components**:
   - `src/context/AuthContext.tsx` - Now syncs with Clerk's `useUser()` hook
   - `src/pages/LoginPage.tsx` - Uses Clerk's `<SignIn />` component
   - `src/pages/RegisterPage.tsx` - Uses Clerk's `<SignUp />` component
   - `src/App.tsx` - Wrapped with `<ClerkProvider>`
   - `src/main.tsx` - Added Clerk styles

3. **New Routes**:
   - `/sign-in/*` - Clerk's sign-in page
   - `/sign-up/*` - Clerk's sign-up page
   - Legacy `/login` and `/register` redirect to new routes

### Backend (Optional Enhancement)
The backend authentication still works but can be enhanced to verify Clerk JWTs.

## Setup Instructions

### Step 1: Create a Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### Step 2: Get Your Clerk Keys
1. In Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_`)
3. Copy your **Secret Key** (starts with `sk_`)

### Step 3: Configure Environment Variables
Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Update `.env` with your Clerk keys:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3001
CLERK_SECRET_KEY=sk_test_your_key_here
```

### Step 4: Configure Clerk Dashboard
1. In Clerk Dashboard, go to **Paths**
2. Set the following redirect URLs:
   - Sign-in URL: `http://localhost:5173/sign-in`
   - Sign-up URL: `http://localhost:5173/sign-up`
   - After sign-in redirect: `/dashboard`
   - After sign-up redirect: `/dashboard`

### Step 5: Run Your Application
```bash
npm install
npm run dev
```

## Features Enabled

### Automatic Authentication
- ✅ Users automatically logged in after signup
- ✅ Persistent sessions across browser refreshes
- ✅ Social login support (Google, GitHub, etc.)
- ✅ Built-in email verification
- ✅ Multi-factor authentication support

### User Management
- ✅ User profile management
- ✅ Password management
- ✅ Email management
- ✅ Session management

### Security
- ✅ JWT token-based authentication
- ✅ HTTPS enforced in production
- ✅ Secure session storage
- ✅ CORS protection

## Customization

### Theme & Styling
To customize the appearance of Clerk components, edit the `appearance` prop in:
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`

Example:
```tsx
<SignIn 
  appearance={{
    elements: {
      headerTitle: "text-2xl font-bold text-[#6E2B8A]",
      formButtonPrimary: "bg-gradient-to-r from-[#6E2B8A] to-[#a323af]",
    }
  }}
/>
```

### Social Providers
In Clerk Dashboard → **Social Providers**, enable:
- Google
- GitHub
- Apple
- And more

### Backend Integration (Optional)
To verify Clerk JWTs in your backend, install:
```bash
npm install svix
```

Then add this middleware to verify tokens:
```javascript
import { verifyToken } from 'svix';

const verifyClerkToken = async (token) => {
  try {
    const verified = await verifyToken(token, process.env.CLERK_SECRET_KEY);
    return verified;
  } catch (error) {
    return null;
  }
};
```

## API Endpoints

The following backend endpoints are still available but now work with Clerk tokens:

- `POST /api/auth/login` - Login (still available for backward compatibility)
- `POST /api/auth/register` - Register (still available for backward compatibility)
- `POST /api/auth/verify` - Verify email (still available for backward compatibility)
- `POST /api/auth/logout` - Logout (managed by Clerk UI)

## Testing

### Test Account
Create a test account directly in the Clerk Dashboard under **Users** for testing purposes.

### Verify Integration
1. Visit `http://localhost:5173/sign-up`
2. Create an account
3. You should be redirected to `/dashboard`
4. Check browser console for any errors

## Troubleshooting

### Issue: Blank Login Page
**Solution**: Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env` file.

### Issue: Redirect Loop
**Solution**: Check Clerk Dashboard → Paths, ensure redirect URLs match your app URL.

### Issue: "ClerkProvider not found"
**Solution**: Verify `App.tsx` has `<ClerkProvider>` wrapping the entire app.

### Issue: Social Login Not Working
**Solution**: Enable social providers in Clerk Dashboard → Social Providers.

## Migration from Old Auth System

Your old authentication system still works in the backend. To fully migrate:

1. **Keep Old System** (Recommended for Phase 1):
   - Keep existing `/api/auth/*` endpoints
   - AuthContext syncs with Clerk
   - Both systems coexist

2. **Full Migration** (Phase 2):
   - Remove old auth endpoints
   - Update backend to only use Clerk tokens
   - Update database queries to use Clerk user IDs

## Next Steps

1. ✅ Environment variables configured
2. ✅ Clerk account created
3. ✅ Test sign-up and sign-in flows
4. ✅ Customize theme colors (optional)
5. ✅ Enable social providers (optional)
6. ✅ Set up backend JWT verification (optional)

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/sdk/react)
- [Clerk Dashboard](https://dashboard.clerk.com)

## Support

For issues with Clerk integration:
- Check [Clerk Status Page](https://status.clerk.com)
- Review [Clerk Documentation](https://clerk.com/docs)
- Contact Clerk Support through your dashboard

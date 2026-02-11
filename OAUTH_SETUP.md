# Google and Apple OAuth Setup Guide

## Overview
The app now supports social login via Google. Apple Sign-In requires native implementation and is marked as coming soon. Follow these steps to set up Google login.

## What Changed
We use the simplified Expo Web Browser approach with Google OAuth. This avoids dependency issues and works reliably on both Android and iOS.

## Google OAuth Setup

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### 2. For Mobile (Android/iOS)
1. Choose **Android** as the application type (if deploying to Android)
   - Get your package name from `app.json` 
   - Get your SHA-1 certificate fingerprint by running: `eas credentials`
2. OR Choose **Application type: Web** for development
3. Add authorized redirect URIs:
   - `exp://localhost:19000/--/oauth-callback` (development)
   - For production, use your actual app URI

### 3. Mobile App Configuration
Add your Google Client ID to `mobile/iHmaket/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

## How Google Login Works

1. User taps the "Google" button on login screen
2. App opens Google's OAuth URL in browser using `expo-web-browser`
3. User logs in with their Google account
4. Browser redirects back to the app with an access token in the URL
5. App extracts the access token and sends it to the backend
6. Backend verifies the token with Google's API
7. Backend creates or links the user account
8. Backend returns JWT token for app sessions
9. User is logged in!

## Backend Configuration

### 1. Update Environment Variables
Add to `backend/.env`:
```env
# Google OAuth - Optional (validation can be done on frontend)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. MongoDB Updates
The User model has been updated with:
- `googleId` - Stores Google user ID for linking
- Optional `password` - Not required for OAuth-created accounts

## Endpoints

### POST /api/auth/google-login
```json
{
  "accessToken": "google_access_token_here"
}
```

Response:
```json
{
  "success": true,
  "message": "Google login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@gmail.com",
    "profilePic": "...",
    "role": "customer"
  }
}
```

## Testing

### Local Development
```bash
cd mobile/iHmaket
npm start

# Scan QR code with Expo Go app or press 'a'/'w'/'i'
```

### Test Accounts
- Use any valid Google account
- First login automatically creates new account
- Subsequent logins link to existing account with same email

## Troubleshooting

### Google Login Not Working
- ✅ Check that `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env`
- ✅ Verify Google+ API is enabled in Google Cloud Console
- ✅ Check that redirect URI is correct (`exp://localhost:19000/--/oauth-callback` for dev)
- ✅ Ensure backend is running on correct port (5000)
- ✅ Check browser console for auth errors

### "Access Denied" Error
- Verify that the redirect URI registered in Google Console matches the app's redirect URL
- For development: `exp://localhost:19000/--/oauth-callback`
- For production: Use your actual app's URI

### Backend Connection Issues
- Verify backend service is running: `cd backend && npm run dev`
- Check that `EXPO_PUBLIC_API_URL` is correct in `.env`
- Ensure CORS is enabled on the backend

### Token Extraction Issues
- The app extracts token from URL hash: `url.hash.split('access_token=')[1]`
- If this fails, check that Google returns the token properly
- In development, you may need to adjust the redirect URL format

## Apple Sign-In (Coming Soon)

Apple Sign-In requires native iOS implementation. For now:
- The "Apple" button shows a "Coming Soon" message on iOS
- Android doesn't show the Apple button (iOS-only feature)
- Users can sign in with Google or email/password

To implement Apple Sign-In in the future, you'll need:
1. Set up Sign in with Apple in Apple Developer Account
2. Install a native library like `@invertase/react-native-apple-authentication`
3. Configure services in `app.json`

## User Experience Flow

1. User opens login screen
2. User sees three options:
   - Email/Password sign in
   - Google button
   - Apple button (iOS only)
3. Clicking "Google":
   - Opens browser with Google login
   - User authenticates
   - Returns to app logged in
4. Account is auto-created on first login
5. Subsequent logins find existing account by email

## Account Linking

If a user has an existing account and then logs in with Google using the same email:
- The Google ID is linked to their existing account
- They can now use either password or Google to login with this account
- No duplicate accounts are created


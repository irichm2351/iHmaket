# 📱 ServiceHub Mobile App Setup Guide

Welcome to the ServiceHub iOS and Android mobile applications! This guide will help you get the mobile apps running on your devices.

## ✅ What's Been Set Up

Your ServiceHub project now includes:

1. **iOS & Android Apps** - Built with Expo + React Native
2. **Complete UI** - Login, register, services, bookings, messages, dashboard, and profile screens
3. **Authentication** - Secure login with JWT token storage
4. **API Integration** - Connected to your existing backend
5. **State Management** - Using Zustand for global state
6. **Navigation** - File-based routing with Expo Router

## 📂 Project Structure

```
service hubs/
├── backend/              # Your existing Node.js backend
├── frontend/             # Your existing React web app
└── mobile/              # NEW! Mobile apps
    └── iHmaket/        # iOS & Android app
        ├── app/         # Screens and navigation
        ├── src/         # Components and utilities
        └── assets/      # Images and assets
```

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Computer's IP Address

The mobile app needs to connect to your backend server. First, find your computer's local IP address:

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**On Mac/Linux:**
```bash
ifconfig
```
Look for your network interface (e.g., 192.168.1.100)

**Important:** Do NOT use `localhost` or `127.0.0.1` - mobile apps need the actual IP address!

### Step 2: Configure the Mobile App

1. Open the `.env` file at `mobile/iHmaket/.env`
2. Update the API URL with your IP address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```
Replace `192.168.1.100` with YOUR computer's IP address

### Step 3: Start Everything

**Terminal 1 - Start Backend:**
```bash
cd "service hubs/backend"
npm run dev
```

**Terminal 2 - Start Mobile App:**
```bash
cd "service hubs/mobile/iHmaket"
npm start
```

## 📱 Running on Your Device

### Option A: Physical Device (Easiest!)

1. Install **Expo Go** app:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. Make sure your phone and computer are on **the same Wi-Fi network**

3. In the terminal where you ran `npm start`, you'll see a QR code

4. Scan the QR code:
   - **iOS**: Open Camera app and scan
   - **Android**: Open Expo Go app and tap "Scan QR code"

5. The app will load on your device!

### Option B: iOS Simulator (Mac Only)

```bash
cd "service hubs/mobile/iHmaket"
npm run ios
```

Requires Xcode to be installed.

### Option C: Android Emulator

1. Install Android Studio
2. Create a virtual device in AVD Manager
3. Start the emulator
4. Run:
```bash
cd "service hubs/mobile/iHmaket"
npm run android
```

## 🎯 Key Features Implemented

### ✅ Authentication
- Login screen with email/password
- Registration with validation
- Secure JWT token storage
- Auto-redirect when logged in/out

### ✅ Home Screen
- Service categories
- Featured services section
- Quick actions
- Beautiful UI with Material Design icons

### ✅ Services
- Browse all services
- Search and filter
- Category filtering
- Service details page

### ✅ Bookings
- View all bookings
- Filter by status (pending, accepted, completed, cancelled)
- Booking details with date, time, and location

### ✅ Messages
- Conversations list
- Chat interface ready
- Real-time messaging support

### ✅ Dashboard
- Statistics cards (total bookings, completed, earnings)
- Quick actions
- Account status

### ✅ Profile
- User information
- Settings and preferences
- Logout functionality

## 🔧 Development Workflow

### Making Changes

1. Edit files in `mobile/iHmaket/src/screens/`
2. Save the file
3. The app will automatically reload on your device
4. Press `r` in terminal to manually reload

### Viewing Logs

All console.log statements appear in the terminal where you ran `npm start`.

### Developer Menu

Shake your device or press:
- iOS Simulator: `Cmd + D`
- Android Emulator: `Cmd + M` (Mac) or `Ctrl + M` (Windows)

## 🐛 Troubleshooting

### "Unable to connect to API"

**Problem:** App can't reach the backend server

**Solutions:**
1. Check backend is running (`npm run dev` in backend folder)
2. Verify IP address in `.env` file is correct
3. Make sure phone and computer are on same Wi-Fi
4. Try temporarily disabling Windows Firewall
5. Check if another app is using port 5000

### "Metro bundler error"

**Problem:** JavaScript bundler issues

**Solutions:**
```bash
cd "service hubs/mobile/iHmaket"
npx expo start -c  # Clear cache
```

### "Can't scan QR code"

**Problem:** Camera not detecting QR

**Solutions:**
1. In Expo Go app, manually enter the URL shown in terminal
2. Make sure QR code is clearly visible
3. Try adjusting phone's brightness

### "Module not found"

**Problem:** Missing dependencies

**Solutions:**
```bash
cd "service hubs/mobile/iHmaket"
rm -rf node_modules
npm install
```

## 📦 Building for Production

### Android APK/AAB

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account (create free account at expo.dev)
eas login

# Build for Android
cd "service hubs/mobile/iHmaket"
eas build -p android
```

### iOS IPA (Mac only)

```bash
# Build for iOS
cd "service hubs/mobile/iHmaket"
eas build -p ios
```

**Note:** You'll need:
- iOS: Apple Developer account ($99/year)
- Android: Google Play Console account ($25 one-time)

## 🎨 Customization

### Change App Name

1. Open `mobile/iHmaket/app.json`
2. Update the `name` field:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-name"
  }
}
```

### Change App Icon

Replace these files in `mobile/iHmaket/assets/images/`:
- `icon.png` - Main app icon (1024x1024px)
- `android-icon-foreground.png` - Android icon
- `favicon.png` - Web favicon

### Change Theme Colors

Edit colors in your screen components (e.g., `#3b82f6` for blue theme).

## 📚 Next Steps

### Enhance Your App

1. **Add Push Notifications**
   ```bash
   npx expo install expo-notifications
   ```

2. **Add Camera Support**
   ```bash
   npx expo install expo-camera expo-image-picker
   ```

3. **Add Maps Integration**
   ```bash
   npx expo install react-native-maps
   ```

4. **Add Payment Integration**
   - Integrate Paystack or Stripe
   - Add payment screens

### Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)

## 📞 Need Help?

1. Check the detailed README: `mobile/iHmaket/MOBILE_README.md`
2. Review Expo documentation
3. Check common issues section above
4. Restart both backend and mobile app

## ✨ Success Checklist

- [ ] Backend server is running
- [ ] Updated `.env` file with correct IP address
- [ ] Mobile app is started (`npm start`)
- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same Wi-Fi
- [ ] Scanned QR code or opened in emulator
- [ ] App is loading successfully
- [ ] Can login/register
- [ ] Can browse services

---

## 🎉 Congratulations!

You now have a fully functional iOS and Android app for ServiceHub! The app includes authentication, service browsing, bookings, messaging, and more.

**Happy developing! 📱✨**

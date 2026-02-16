# Ihmaket Mobile App

The official iOS and Android mobile application for Ihmaket - A service marketplace connecting customers with professional service providers.

## 📱 Features

- **Authentication** - Secure login and registration with JWT tokens
- **Service Browsing** - Browse, search, and filter services
- **Booking System** - Book services directly from your phone
- **Real-time Messaging** - Chat with service providers
- **Dashboard** - Track bookings, earnings, and performance
- **Profile Management** - Manage your account settings
- **Push Notifications** - Stay updated with booking status
- **Offline Support** - Basic functionality works offline

## 🛠️ Tech Stack

- **Expo SDK 54** - React Native framework
- **Expo Router** - File-based routing for navigation
- **React Native** - Cross-platform mobile development
- **Zustand** - State management
- **Axios** - API client
- **Expo Secure Store** - Secure token storage
- **Expo Icons** - Material Community Icons

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo Go** app on your phone (for testing)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - Mac only)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd "service hubs/mobile/iHmaket"
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5000/api
```

**Important:** Replace `YOUR_IP_ADDRESS` with your computer's local IP address (not localhost)

To find your IP:
- **Windows**: Run `ipconfig` and look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` and look for your network interface

### 3. Start Backend Server

Make sure your backend server is running:

```bash
cd "service hubs/backend"
npm run dev
```

### 4. Start the Mobile App

```bash
cd "service hubs/mobile/iHmaket"
npm start
```

### 5. Run on Device/Emulator

- **iOS (Mac only)**: Press `i` or run `npm run ios`
- **Android**: Press `a` or run `npm run android`
- **Physical Device**: Scan QR code with Expo Go app

## 📂 Project Structure

```
mobile/iHmaket/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication routes
│   │   ├── login.jsx            # Login screen
│   │   └── register.jsx         # Register screen
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx            # Home screen
│   │   ├── services.jsx         # Services list
│   │   ├── bookings.jsx         # My bookings
│   │   ├── messages.jsx         # Chat/messages
│   │   ├── dashboard.jsx        # Provider dashboard
│   │   └── profile.jsx          # Profile settings
│   └── _layout.tsx              # Root layout with auth logic
├── src/
│   ├── screens/                 # Screen components
│   │   ├── auth/               # Login, Register
│   │   ├── home/               # Home screen
│   │   ├── services/           # Service screens
│   │   ├── bookings/           # Booking screens
│   │   ├── messages/           # Message screens
│   │   ├── dashboard/          # Dashboard screens
│   │   └── profile/            # Profile screens
│   ├── store/                   # State management
│   │   ├── authStore.js        # Authentication state
│   │   └── messageStore.js     # Chat state
│   ├── utils/                   # Utilities
│   │   ├── api.js              # API client
│   │   └── socket.js           # WebSocket client
│   └── components/              # Reusable components
├── assets/                      # Images, fonts, etc.
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🎨 Key Components

### Authentication Flow

The app uses protected routes via Expo Router:
- Unauthenticated users see login/register screens
- Authenticated users see the main tab navigation
- JWT tokens stored securely using Expo Secure Store

### State Management

Uses Zustand for global state:
- `authStore` - User authentication and profile
- `messageStore` - Real-time messaging state

### API Integration

All API calls go through `src/utils/api.js`:
- Automatic token injection
- Request/response interceptors
- Error handling

## 📱 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build -p android --profile preview
```

### iOS IPA (Mac only)

```bash
# Configure build
eas build:configure

# Build IPA
eas build -p ios --profile preview
```

## 🔧 Development Tips

### Testing on Physical Device

1. Install **Expo Go** from App Store or Google Play
2. Make sure your phone and computer are on the same Wi-Fi network
3. Scan the QR code from the terminal
4. App will load on your device

### Hot Reloading

- Press `r` in terminal to reload app
- Changes are automatically reflected
- Shake device to open developer menu

### Debugging

```bash
# View logs
npx expo start

# Debug with React DevTools
npm install -g react-devtools
react-devtools
```

### Common Issues

**Cannot connect to API:**
- Ensure backend is running
- Check `.env` file has correct IP address
- Make sure devices are on same network
- Try disabling firewall temporarily

**App won't load:**
- Clear Expo cache: `npx expo start -c`
- Delete `node_modules` and reinstall
- Restart Expo Go app

**Build errors:**
- Run `npm install` again
- Clear watchman: `watchman watch-del-all`
- Reset Metro bundler cache

## 🚀 Deployment

### App Store (iOS)

1. Enroll in Apple Developer Program ($99/year)
2. Configure app signing in Xcode
3. Build with EAS: `eas build -p ios --profile production`
4. Submit to App Store Connect

### Google Play Store (Android)

1. Create Google Play Console account ($25 one-time)
2. Build AAB: `eas build -p android --profile production`
3. Upload to Google Play Console
4. Complete store listing and submit for review

## 📦 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator (Mac only)
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

## 🔐 Security

- JWT tokens stored in Expo Secure Store (encrypted)
- API requests use HTTPS in production
- User passwords never stored locally
- Secure communication with backend

## 📄 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| EXPO_PUBLIC_API_URL | Backend API URL | http://192.168.1.100:5000/api |

## 🤝 Contributing

1. Create a new branch for features
2. Test on both iOS and Android
3. Follow React Native best practices
4. Submit pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Expo documentation
- Contact the development team

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Expo and React Native**

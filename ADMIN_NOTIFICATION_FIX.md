# Admin Notification Troubleshooting Guide

## Problem: Admins Not Receiving Alerts When Users Request Support

This guide will help you diagnose and fix the issue where admins don't receive notifications when users open chat and send messages.

---

## 🔧 Quick Fixes Applied

I've implemented several improvements to fix this issue:

### 1. **Fixed Socket URL Detection (CRITICAL)**
- **Problem**: Socket was connecting to wrong URL (localhost instead of production)
- **Solution**: Updated `frontend/src/utils/socket.js` to auto-detect production vs development
- **Production URL**: `https://ihmaket-backend.onrender.com`

### 2. **Enhanced Logging**
- Added detailed console logs to track:
  - Socket connection status
  - User connected events
  - Admin notification emissions
  - Online users map state

### 3. **Debug Tools**
- Created Socket Debug Panel (🔧 button in bottom-right)
- Backend endpoint: `GET /api/debug/online-users`
- Console commands for log analysis

---

## 📋 Step-by-Step Debugging Process

### Step 1: Test on Production (ihmaket.com)

#### As Regular User:
1. Login to ihmaket.com
2. Open browser console (F12)
3. Look for these logs:
   ```
   🔌 Socket connecting to: https://ihmaket-backend.onrender.com
   ✅ Socket connected: [socket-id]
   👤 Emitting user_connected for: [user-id]
   ```

#### As Admin (in another browser/incognito):
1. Login with admin account
2. Open browser console (F12)
3. Look for these logs:
   ```
   🔌 Socket connecting to: https://ihmaket-backend.onrender.com
   ✅ Socket connected: [socket-id]
   👤 Emitting user_connected for: [admin-id]
   [SUPPORT INFO] Setting up admin support request listener
   [SUPPORT SUCCESS] Admin support request listener registered
   ```

---

### Step 2: Use the Debug Panel

1. **Open Debug Panel**: Click the **🔧 Debug** button (bottom-right corner, above chat button)

2. **Check Socket Status**:
   - Status should show: ✅ Connected
   - Socket ID should be present
   - URL should be: `https://ihmaket-backend.onrender.com`

3. **Check Online Users**:
   - Click "Check Online" button
   - Verify your user ID appears in the list
   - Note the total number of online users

4. **For Admins - Test Alert**:
   - Click "Test Alert" button
   - You should receive a toast notification
   - Check if the alert badge appears on chat button

---

### Step 3: Test User → Admin Notification Flow

#### User Side:
1. Click the blue chat button
2. Type a message: "I need help"
3. Click send
4. Watch browser console for:
   ```
   [SUPPORT INFO] User creating support ticket
   [SUPPORT SUCCESS] Support ticket created
   [SUPPORT SUCCESS] User support message sent
   ```

#### Admin Side:
Watch for:
1. **Toast notification**: "[User Name] needs help!"
2. **Yellow badge** on chat button showing alert count
3. **Browser notification** (if permissions granted)
4. **Console logs**:
   ```
   [Layout] Admin received support request
   [SUPPORT SOCKET] Admin received support request
   ```

---

### Step 4: Check Backend Logs (Render Dashboard)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click "Logs" tab
4. Look for these logs when user sends support message:

```
✅ New support ticket created: [ticket-id] by user [user-name]
👥 Found X active admin(s): [admin-names]
🌐 Total online users: X
🔍 Online user IDs: [array of user ids]
🔍 Admin [admin-name] ([admin-id]): ✅ Online ([socket-id])
📤 Emitting support_request to admin [admin-name]
✅ Notified X online admin(s) about support request
```

**If you see "❌ Offline" for admin:**
- Admin is not connected to socket server
- Check admin's browser console for connection errors
- Verify admin refreshed page after latest deployment

---

## 🐛 Common Issues & Solutions

### Issue 1: Socket Shows "Disconnected"

**Diagnosis:**
```javascript
// In browser console, run:
console.log(socket.connected)  // Should be: true
console.log(socket.io.uri)     // Should be: https://ihmaket-backend.onrender.com
```

**Solutions:**
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Check Render backend is running (not sleeping)
- [ ] Click "Reconnect" in Debug Panel

---

### Issue 2: Admin Not in Online Users List

**Diagnosis:**
```javascript
// Check online users via API
fetch('https://ihmaket-backend.onrender.com/api/debug/online-users')
  .then(r => r.json())
  .then(data => console.log(data))
```

**Backend logs should show:**
```
👤 User [admin-id] connected with socket [socket-id]
```

**Solutions:**
- [ ] Admin must refresh page to reconnect socket
- [ ] Check Layout.jsx is calling `connectSocket(user._id)`
- [ ] Verify admin's user ID is correct
- [ ] Check browser console for "user_connected" emission

---

### Issue 3: Support Request Not Emitted

**Backend logs should show:**
```
📤 Emitting support_request to admin [name]
✅ Notified X online admin(s)
```

**If "Notified 0 admins":**
- [ ] No admins are online (they need to be logged in and connected)
- [ ] Admin's socket ID not in onlineUsers map
- [ ] Admin needs to refresh after deployment

**If admin ID not found:**
- [ ] Check database - user must have `role: "admin"` and `isActive: true`
- [ ] Run seed script if needed: `cd backend && node seedAdmin.js`

---

### Issue 4: Socket URL Wrong (Shows localhost)

**Symptom:** Debug panel shows `http://localhost:5000`

**Solution:**
This should be fixed now, but if it still shows localhost:

1. Check `frontend/src/utils/socket.js`:
   ```javascript
   // Should have auto-detection:
   const getSocketUrl = () => {
     if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
       return 'https://ihmaket-backend.onrender.com';
     }
     return 'http://localhost:5000';
   };
   ```

2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

---

## 🔍 Advanced Debugging

### View All Debug Logs

```javascript
// In browser console
window.__SUPPORT_DEBUG_LOGS()
```

This shows a table with all support-related events.

### Export Logs for Analysis

```javascript
// Downloads JSON file with all logs
window.__EXPORT_SUPPORT_LOGS()
```

Send this file for detailed debugging.

### Filter Error Logs Only

```javascript
debugSupport.filter(log => log.level === 'ERROR').forEach(log => console.log(log))
```

### Check Socket Connection Timeline

```javascript
debugSupport.filter(log => log.level === 'SOCKET').forEach(log => {
  console.log(log.timestamp, log.message, log.data)
})
```

---

## ✅ Testing Checklist

Use this to verify everything works:

- [ ] **User socket connects** - Check Debug Panel shows "Connected"
- [ ] **Admin socket connects** - Check Debug Panel shows "Connected"
- [ ] **User appears in online users** - Check via "Check Online" button
- [ ] **Admin appears in online users** - Check via API or Debug Panel
- [ ] **User sends support message** - Message appears in chat
- [ ] **Backend creates ticket** - Check Render logs for "New support ticket created"
- [ ] **Backend finds online admins** - Check logs for "Found X active admin(s)"
- [ ] **Backend emits to admin** - Check logs for "Emitting support_request to admin"
- [ ] **Admin receives toast** - "[User Name] needs help!" appears
- [ ] **Admin sees badge** - Yellow badge on chat button shows count
- [ ] **Admin opens chat** - User info and message load correctly

---

## 🚀 Production Deployment Checklist

Before testing on production:

1. **Verify Environment Variables** (Render Dashboard):
   - [ ] `MONGODB_URI` is set
   - [ ] `JWT_SECRET` is set
   - [ ] Backend is not sleeping

2. **Clear Browser Cache**:
   - [ ] User browser: Ctrl+Shift+Delete
   - [ ] Admin browser: Ctrl+Shift+Delete

3. **Fresh Login**:
   - [ ] User logs out and logs back in
   - [ ] Admin logs out and logs back in

4. **Monitor Backend Logs**:
   - [ ] Open Render dashboard
   - [ ] Watch logs in real-time during test

---

## 📊 Expected Log Flow

### Successful Flow:

#### 1. User Opens Page
```
Frontend Console (User):
🔌 Socket connecting to: https://ihmaket-backend.onrender.com
✅ Socket connected: abc123
👤 Emitting user_connected for: user-id-123

Backend Logs:
🔌 New client connected: abc123
👤 User user-id-123 connected with socket abc123
📊 Total online users: 1
```

#### 2. Admin Opens Page
```
Frontend Console (Admin):
🔌 Socket connecting to: https://ihmaket-backend.onrender.com
✅ Socket connected: def456
👤 Emitting user_connected for: admin-id-456
[SUPPORT INFO] Setting up admin support request listener
[SUPPORT SUCCESS] Admin support request listener registered

Backend Logs:
🔌 New client connected: def456
👤 User admin-id-456 connected with socket def456
📊 Total online users: 2
🌐 Currently online: ['user-id-123', 'admin-id-456']
```

#### 3. User Sends Support Message
```
Frontend Console (User):
[SUPPORT INFO] User creating support ticket { userId: 'user-id-123' }
[SUPPORT SUCCESS] Support ticket created { ticketId: 'ticket-789', status: 'open' }

Backend Logs:
📨 POST /api/support/messages
✅ New support ticket created: ticket-789 by user John Doe
👥 Found 1 active admin(s): Admin Name
🌐 Total online users: 2
🔍 Online user IDs: ['user-id-123', 'admin-id-456']
🔍 Admin Admin Name (admin-id-456): ✅ Online (def456)
📤 Emitting support_request to admin Admin Name
✅ Notified 1 online admin(s) about support request from John Doe

Frontend Console (Admin):
[Layout] Admin received support request: { ticketId: 'ticket-789', user: {...}, ... }
[SUPPORT SOCKET] Admin received support request { userName: 'John Doe', ... }
```

---

## 🆘 Still Having Issues?

If admins still don't receive notifications after following this guide:

1. **Export Debug Logs**:
   - Click "Export Logs" in Debug Panel
   - OR run: `window.__EXPORT_SUPPORT_LOGS()`

2. **Check Backend Logs**:
   - Go to Render dashboard
   - Copy logs from when support message was sent

3. **Screenshot Debug Panel**:
   - Open Debug Panel
   - Click "Check Online"
   - Take screenshot

4. **Provide This Information**:
   - Browser console logs (user + admin)
   - Backend logs from Render
   - Debug panel screenshot
   - Admin user ID and name

---

## 📝 Quick Reference

### Console Commands
```javascript
// View all debug logs
window.__SUPPORT_DEBUG_LOGS()

// Export logs as JSON
window.__EXPORT_SUPPORT_LOGS()

// Clear logs
window.__CLEAR_SUPPORT_LOGS()

// Check socket status
console.log('Connected:', socket.connected)
console.log('Socket ID:', socket.id)
console.log('URL:', socket.io.uri)

// Check online users
fetch('https://ihmaket-backend.onrender.com/api/debug/online-users')
  .then(r => r.json())
  .then(d => console.table(d))
```

### Debug Panel Actions
- **Check Online** - Fetch and display online users
- **Reconnect** - Force socket reconnection
- **Test Alert** - Simulate support request (admin only)
- **Export Logs** - Download debug logs as JSON
- **Clear Logs** - Clear all stored logs
- **Log Summary** - Print log statistics to console

---

**Last Updated:** 2025-02-25  
**Version:** 2.0  
**Commit:** d83adde

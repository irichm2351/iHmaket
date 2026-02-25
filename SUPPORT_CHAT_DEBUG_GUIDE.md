# Support Chat Debugging Guide

## Step-by-Step Local Test

### 1. START BACKEND
```bash
cd backend
npm run dev
```
Watch for these logs when user opens chat:
```
[Support Ticket] Created ticket <ID>
[Support Ticket] Found X admin(s)
[Support Ticket] Online users map size: X
[Support Ticket] Online user IDs: <comma-separated IDs>
[Support Ticket] Checking admin <name> (<id>): online=true/false
```

If you see `online=false`, the admin socket isn't connected.

---

### 2. START FRONTEND
```bash
cd frontend
npm run dev
```

---

### 3. OPEN TWO BROWSERS

**Browser 1 - ADMIN:**
- Go to `http://localhost:5173`
- Log in as **ADMIN**
- Open DevTools (F12)
- Go to **Console** tab
- Look for:
  ```
  [Layout] Connecting socket for user: <ID> Role: admin
  [Layout] Admin detected, setting up support request listener
  [Socket] Connected! Emitting user_connected with userId: <ID>
  ```
- Go to **Network** tab → filter for "socket.io"
- Look for a WebSocket connection that says "101 Switching Protocols"

**Browser 2 - USER:**
- Go to `http://localhost:5173` (or different incognito)
- Log in as **regular USER**
- Open DevTools (F12)
- Go to **Console** tab

---

### 4. USER OPENS SUPPORT CHAT

In **User Browser Console**, you should see:
```
[Support Chat] Creating support ticket...
[Support Chat] Ticket created: <TICKET_ID>
```

In **Backend Terminal**, you should see:
```
[Support Ticket] Created ticket <TICKET_ID> for user <USER_NAME>
[Support Ticket] Found 1 admin(s)
[Support Ticket] Admin emails: admin@xxx.com
[Support Ticket] Online users map size: 2
[Support Ticket] Online user IDs: <ADMIN_ID>, <USER_ID>
[Support Ticket] Checking admin <ADMIN_NAME> (<ADMIN_ID>): online=true
[Support Ticket] ✅ Emitted support_request to admin <ADMIN_NAME>
```

In **Admin Browser Console**, you should see:
```
[Layout] Received support_request event: {ticketId: "<ID>", user: {...}}
```

And the **navbar badge** should update with a yellow circle showing "1"

---

## Common Issues & Fixes

### Issue 1: Backend doesn't find admins
**Log:** `Found 0 admin(s)`
**Cause:** No admin account or admin not in database
**Fix:** Verify admin exists and has `role: 'admin'`

### Issue 2: Admin found but not online
**Log:** `Checking admin XXX: online=false`
**Cause:** Admin's socket not connected
**Fix:** Check admin's browser console for socket connection errors

### Issue 3: Admin online but no notification
**Log:** Admin browser shows no `[Layout] Received support_request` message
**Cause:** Event emitted but not received, or listener not attached
**Fix:** Ensure admin browser console shows socket connection logs

### Issue 4: Socket won't connect
**Log in backend:** No connection logs
**Fix:** 
- Check `npm run dev` is running
- Check frontend's Network tab for WebSocket - should connect to `ws://localhost:5000`

---

## What to Share With Me

When it doesn't work, please provide:

1. **Full backend terminal output** when user opens chat
2. **Admin browser console** ALL messages (full screenshot)
3. **User browser console** ALL messages
4. **Confirmation** that both are logged in to the correct roles

This will help me identify exactly where the issue is.

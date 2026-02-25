# Support Chat Feature - Testing & Debugging Guide

## Overview

The support chat feature has been enhanced with:
- ✅ Ticket status tracking (open → assigned → closed)
- ✅ Admin message history loading
- ✅ Debug logging for production troubleshooting
- ✅ Fixed socket initialization bugs
- ✅ Admin action buttons to assign and resolve tickets

---

## Quick Start Testing

### 1. Test User Initiating Support Chat

**Steps:**
1. Login as a regular user on [ihmaket.com](https://ihmaket.com)
2. Click the blue chat button in the bottom-right corner
3. Type a message like "I need help with my booking"
4. Click send

**Expected Results:**
- ✅ Message appears in the chat
- ✅ A support ticket is created on the backend
- ✅ Admin(s) should receive a notification

**Debug Console Output:**
```
[SUPPORT INFO] User creating support ticket { userId: "..." }
[SUPPORT SUCCESS] Support ticket created { ticketId: "...", status: "open" }
[SUPPORT SUCCESS] User message sent to admin { messageId: "...", adminId: "..." }
```

---

### 2. Test Admin Receiving Support Request

**Steps:**
1. While user is in chat, login as admin in another browser tab/incognito
2. Admin should see a yellow notification toast saying "[User Name] needs help!"
3. Chat button icon should show a yellow badge with alert count

**Expected Results:**
- ✅ Toast notification appears (top-right)
- ✅ Browser notification may appear (if permissions granted)
- ✅ Yellow badge on chat button shows alert count
- ✅ Sound notification plays

**Debug Console Output (Admin):**
```
[SUPPORT SOCKET] Admin received support request { 
  userName: "John Doe", 
  ticketId: "...", 
  lastMessage: "I need help..." 
}
```

---

### 3. Test Admin Viewing Support Alert

**Steps:**
1. Admin clicks the blue chat button
2. Support chat modal opens with the user's request
3. Modal header should show:
   - "Supporting User"
   - User's name
   - Ticket status badge (yellow "open" tag)

**Expected Results:**
- ✅ Modal shows correct user information
- ✅ Previous messages load (if any)
- ✅ Admin action buttons appear:
  - "Assign to Me" button (if status is "open")
  - "Resolve" button (if status is "assigned")
- ✅ No error messages in console

---

### 4. Test Admin Assigning Ticket

**Steps:**
1. Admin clicks "Assign to Me" button
2. Observe status change

**Expected Results:**
- ✅ Button changes from "Assign to Me" to "Resolve"
- ✅ Status badge changes from "open" (yellow) to "assigned" (blue)
- ✅ Toast shows "Ticket marked as assigned"
- ✅ User receives notification that admin is helping (if socket forward works)

**Debug Console Output:**
```
[SUPPORT INFO] Admin updating ticket status { 
  ticketId: "...", 
  oldStatus: "open", 
  newStatus: "assigned" 
}
[SUPPORT SUCCESS] Ticket status updated { 
  ticketId: "...", 
  status: "assigned" 
}
```

---

### 5. Test Message Exchange Between User and Admin

**Steps:**
1. Both user and admin have the chat modal open
2. User types and sends a message
3. Admin should receive the message in real-time
4. Admin types and sends a reply
5. User should receive the reply in real-time

**Expected Results:**
- ✅ Messages appear on both sides
- ✅ Correct message order and timestamps
- ✅ Sent messages show on right side, received on left
- ✅ No "Failed to send message" errors

**Debug Console Output (User):**
```
[SUPPORT INFO] user sending message { 
  role: "user", 
  receiverId: "admin-id", 
  messagePreview: "Can you help me with..." 
}
[SUPPORT SUCCESS] User message sent to admin { 
  messageId: "msg-id", 
  adminId: "admin-id" 
}
```

---

### 6. Test Admin Resolving Ticket

**Steps:**
1. Admin clicks "Resolve" button
2. Confirm the action

**Expected Results:**
- ✅ Toast shows "Ticket marked as closed"
- ✅ Modal automatically closes after 1 second
- ✅ Chat input is disabled (greyed out)
- ✅ Status badge shows "closed" (green)

**Debug Console Output:**
```
[SUPPORT INFO] Admin updating ticket status { 
  ticketId: "...", 
  oldStatus: "assigned", 
  newStatus: "closed" 
}
[SUPPORT SUCCESS] Ticket status updated { 
  ticketId: "...", 
  status: "closed" 
}
```

---

## Debug Tools & Commands

### Access Debug Console in Browser

Open browser DevTools (F12) and run these commands:

#### 1. View All Support Debug Logs
```javascript
window.__SUPPORT_DEBUG_LOGS()
```
Shows a table with all support-related events logged since page load.

#### 2. Export Logs as JSON
```javascript
window.__EXPORT_SUPPORT_LOGS()
```
Downloads a JSON file with all debug logs. Useful for sending to developers.

#### 3. Clear All Debug Logs
```javascript
window.__CLEAR_SUPPORT_LOGS()
```
Wipes localStorage debug logs (only for testing).

#### 4. Filter Specific Logs
```javascript
const logs = debugSupport.getLogs();
logs.filter(log => log.level === 'SUCCESS').forEach(log => console.log(log));
```

#### 5. View Log Summary
```javascript
debugSupport.summary()
```
Shows count of each log level type.

---

## Common Issues & Solutions

### Issue: Admin Not Receiving Support Alert

**Diagnosis Steps:**
1. Check browser console for socket connection errors:
   ```javascript
   console.log(socket.connected) // Should be: true
   ```

2. Verify backend socket is emitting:
   ```javascript
   window.__SUPPORT_DEBUG_LOGS() // Look for SOCKET level logs
   ```

3. Check if user socket ID is stored correctly:
   - Open Network tab in DevTools
   - Look for WebSocket connection to `wss://ihmaket-backend.onrender.com`

**Solutions:**
- [ ] Refresh the admin page
- [ ] Check if admin's socket is connected: `socket.connected`
- [ ] Verify admin is logged in with role "admin"
- [ ] Check backend logs on Render dashboard

---

### Issue: Messages Not Sending Between User and Admin

**Diagnosis:**
1. Check console for error messages
2. Run: `window.__SUPPORT_DEBUG_LOGS()` and look for ERROR level logs
3. Check Network tab → XHR for failed POST requests to `/api/messages`

**Solutions:**
- [ ] Verify both users are logged in with correct roles
- [ ] Check if receiving user's ID is correct in the message payload
- [ ] Test message sending with DevTools Network tab open
- [ ] Check if admin is assigned to the ticket (status should be "assigned")

---

### Issue: Socket Events Not Working on Production

**Diagnosis:**
1. Check socket connection URL:
   ```javascript
   console.log(socket.io.uri) // Should be: https://ihmaket-backend.onrender.com
   ```

2. Verify socket is using production URL in `frontend/src/utils/socket.js`

**Root Cause:** Socket connecting to localhost instead of production backend

**Solution:**
- Ensure `socket.js` has correct production URL detection
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh the page (Ctrl+Shift+R)

---

### Issue: Ticket Status Not Updating

**Diagnosis:**
1. Check if admin request reached backend:
   - Network tab → PUT → `/api/support/tickets/{id}/status`
   - Should return 200 status

2. Check if ticket ID exists:
   ```javascript
   window.__SUPPORT_DEBUG_LOGS().filter(log => log.message.includes('ticket')).slice(-5)
   ```

**Solutions:**
- [ ] Ensure admin is logged in
- [ ] Ticket must exist (check backend database)
- [ ] Admin must have role "admin" 
- [ ] Wait 1-2 seconds before clicking button again

---

## Testing Checklist

Use this checklist to verify all features work:

- [ ] **User creates support ticket** - Message sends, notification appears for admin
- [ ] **Admin receives alert** - Toast, browser notification, and badge count appear
- [ ] **Admin opens chat modal** - User info loads, message history appears
- [ ] **Admin assigns ticket** - Status changes to "assigned", button updates
- [ ] **Message exchange** - Real-time messages between user and admin
- [ ] **Admin resolves ticket** - Status changes to "closed", modal closes
- [ ] **Socket reconnection** - Events work after browser refresh
- [ ] **Multiple admins** - All online admins receive the alert
- [ ] **Offline handling** - Graceful degradation if socket fails
- [ ] **Mobile responsiveness** - Modal displays correctly on mobile

---

## Production Deployment Steps

1. **Verify on staging first** (if available)
   ```bash
   # Deploy to staging environment
   git push staging main
   ```

2. **Test all features** on staging using this guide

3. **Deploy to production**
   ```bash
   # Deploy to production
   git push production main
   ```

4. **Monitor for errors**
   - Watch browser console for error messages
   - Check Render dashboard for backend logs
   - Monitor support ticket creation count

5. **Get user feedback**
   - Have admin test the feature
   - Ask users to verify notifications work
   - Collect any error messages

---

## Backend API Endpoints Reference

### Support Ticket Endpoints

#### 1. Create Support Message
```
POST /api/support/messages
Body: { text: "Help needed" }
Response: { ticket: {...}, message: {...} }
```

#### 2. Get Open Tickets
```
GET /api/support/tickets/open
Response: { tickets: [...] }
```

#### 3. Get Ticket Details
```
GET /api/support/tickets/:ticketId
Response: { ticket: {...} }
```

#### 4. Update Ticket Status
```
PUT /api/support/tickets/:ticketId/status
Body: { status: "assigned" | "closed" }
Response: { ticket: {...} }
```

#### 5. Claim Ticket
```
POST /api/support/tickets/:ticketId/claim
Response: { ticket: {...} }
```

---

## Socket Events Reference

### Events Emitted by Backend

#### 1. Support Request (to admins)
```javascript
socket.emit('support_request', {
  ticketId: "...",
  user: { _id, name, profilePic },
  lastMessage: "...",
  createdAt: timestamp
})
```

#### 2. Support Assigned (to user)
```javascript
socket.emit('support_assigned', {
  ticketId: "...",
  userId: "...",
  admin: { _id, name, profilePic }
})
```

#### 3. Receive Message (to recipient)
```javascript
socket.emit('receive_message', {
  senderId, receiverId, text, _id, createdAt
})
```

---

## Performance & Monitoring

### Key Metrics to Monitor

1. **Ticket Creation Time**
   - Should be < 1 second
   - Check `Support.log()` timestamps

2. **Message Delivery Latency**
   - Should be < 500ms
   - Monitor socket event timing

3. **Socket Connection Success Rate**
   - Should be 99%+
   - Track failed connections

4. **Admin Response Time**
   - Average time to assign ticket
   - Helps measure support efficiency

---

## Troubleshooting References

**Document Location:** `frontend/src/utils/debugSupport.js`
- Debug utility functions
- Console logging wrapper
- localStorage persistence

**Main Files:**
- `frontend/src/components/Layout.jsx` - Support alert handling
- `frontend/src/components/SupportChatModal.jsx` - Chat UI and logic
- `backend/controllers/supportController.js` - Ticket management
- `backend/routes/supportRoutes.js` - API endpoints

---

## Next Steps

After successful testing:

1. **Gather User Feedback**
   - Are admins receiving alerts quickly?
   - Is message delivery reliable?
   - Any UX improvements needed?

2. **Optimization**
   - Add message pagination for large histories
   - Implement typing indicators
   - Add read receipts

3. **Additional Features**
   - Support ticket assignment to specific admins
   - Support categories/routing
   - Canned responses for admins
   - Support chat archive/history

---

## Contact & Support

For issues during testing:
1. Check debug logs: `window.__SUPPORT_DEBUG_LOGS()`
2. Export logs: `window.__EXPORT_SUPPORT_LOGS()`
3. Share logs with development team
4. Include any error messages from console

---

**Last Updated:** 2025-02-25
**Version:** 1.0

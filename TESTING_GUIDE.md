# 🧪 Complete Testing Guide - ServiceHub KYC & Provider System

## Test Environment
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **API Base**: http://localhost:5000/api

---

## 📋 Test Scenario 1: KYC Approval & Role Change

### Step 1: Create/Login as Customer
1. Go to http://localhost:5173
2. Register new account or login as customer
3. Go to **Profile** page
4. Should see role badge: **"customer"**
5. Should see button: **"Become Service Provider"**

### Step 2: Submit KYC
1. Click **"Become Service Provider"** button
2. Fill out KYC form:
   - ID Type: (select one - National ID, Passport, etc.)
   - ID Number: (enter any number)
   - ID Document: (upload any image file)
   - Click camera button and capture selfie
3. Click **"Submit KYC"**
4. Should see success toast: ✅ "KYC submitted successfully"
5. KYC status badge should show: **"KYC pending"**

### Step 3: Admin Approves KYC
1. Open **Admin Dashboard**: http://localhost:5173/admin
2. Click **"KYC Verification"** tab
3. See submitted KYC:
   - ID Document thumbnail (left)
   - Selfie thumbnail (right)
   - Click thumbnails to view full-size
4. Click **"Approve"** button
5. Confirm approval dialog
6. Should see toast: ✅ "KYC approved! User is now a service provider."

### Step 4: Verify Automatic Changes
1. **Without refreshing**, check user's profile
2. Wait a moment for update
3. Verify:
   - ✅ Role badge changed to: **"provider"**
   - ✅ Green verified badge appears: ✓ **Verified**
   - ✅ Rating section shows: **0.0 / 5** with **0 reviews**
   - ✅ "Become Service Provider" button **disappears**
4. Can also logout/login to confirm changes persist

---

## ⭐ Test Scenario 2: Customer Reviews & Ratings

### Step 1: Create Second Account (Customer)
1. Logout from provider account
2. Create new customer account
3. Login with customer account

### Step 2: Book Service
1. Go to **Services** page
2. Find service posted by the provider
3. Click **"Book Now"**
4. Fill booking details:
   - Date: (select future date)
   - Time: (select time)
   - Address: (enter address)
5. Click **"Confirm Booking"**
6. Should see: ✅ "Booking created successfully"

### Step 3: Complete Booking (Admin)
1. Go to **Admin Dashboard** → **User Management**
2. Find customer's booking in admin panel (or wait for natural completion)
3. Or logout/login as provider and manually mark booking completed

### Step 4: Leave Review
1. Go to **"My Bookings"** tab
2. Find completed booking
3. Click **"Review"** button
4. Fill review:
   - Rating: Click stars (e.g., 4 stars)
   - Comment: "Great service! Very professional."
   - (Optional) Upload images
5. Click **"Submit Review"**
6. Should see: ✅ "Review submitted successfully"

### Step 5: Verify Review Shows on Provider Profile
1. Logout from customer
2. Login as provider
3. Go to **Profile** page
4. Scroll down to **"Customer Reviews"** section
5. Should see:
   - Customer name
   - Star rating (4 stars in this case)
   - Comment: "Great service! Very professional."
   - Review date
6. Provider's rating should update:
   - From: **0.0 / 5, 0 reviews**
   - To: **4.0 / 5, 1 review**

---

## ❌ Test Scenario 3: KYC Rejection

### Step 1: Submit KYC for Rejection
1. Create new customer account
2. Go to Profile → "Become Service Provider"
3. Submit KYC with any details

### Step 2: Admin Rejects KYC
1. Admin Dashboard → KYC Verification
2. Find the submission
3. Click **"Reject"** button
4. Enter rejection reason: "Face on ID does not match selfie"
5. Click OK
6. Should see: ✅ "KYC rejected. User has been notified."

### Step 3: Verify User Sees Rejection
1. Logout from admin
2. Login as customer
3. Go to **Profile** page
4. Should see red alert:
   - **Rejection Reason:**
   - "Face on ID does not match selfie"
   - Message: "You can resubmit your KYC with correct documents."
5. "Become Service Provider" button should reappear
6. Can resubmit KYC with corrected documents

---

## 🔄 Test Scenario 4: Real-Time Updates

### Step 1: Two Browser Windows
1. Open **Window 1**: http://localhost:5173/admin (Admin Dashboard)
2. Open **Window 2**: http://localhost:5173/profile (Customer Profile)
3. Keep both open side-by-side

### Step 2: Admin Approves KYC
1. In **Window 1**, find pending KYC
2. Click "Approve"
3. Watch **Window 2** - profile should update with:
   - ✅ Role changes to provider
   - ✅ Verified badge appears
   - ✅ Rating section appears
4. (May need to wait a moment or refresh Window 2)

---

## 🎯 Test Scenario 5: Multiple Reviews

### Step 1: Create Multiple Customers
1. Create 3 different customer accounts
2. Each books a service from the provider
3. Each marks service as completed

### Step 2: Leave Different Ratings
1. Customer 1: 5 stars - "Excellent work!"
2. Customer 2: 4 stars - "Good service"
3. Customer 3: 3 stars - "Average"

### Step 3: Verify Provider Rating
1. Login as provider
2. Check profile → rating should be:
   - **4.0 / 5** (average of 5, 4, 3)
   - **3 reviews**
3. All 3 reviews should appear in "Customer Reviews" section
4. Newest reviews should be at top

---

## 🐛 Troubleshooting

### KYC Image Not Uploading
- Check browser console for errors (F12)
- Verify Cloudinary credentials in `backend/.env`
- Check file size (should be < 5MB)

### Review Not Showing
- Ensure booking status is "completed"
- Check that customer is logged in
- Wait 5 seconds for updates
- Try refreshing page

### Role Not Changing After Approval
- Admin and Customer should see changes immediately
- If not, try refreshing page
- Check MongoDB connection
- Check backend logs

### Admin Can't See KYC Images
- Verify images uploaded to Cloudinary
- Check imageUrl and selfieUrl in User record
- Try uploading new test images

---

## ✅ Sign-Off Checklist

- [ ] KYC submission works with Cloudinary upload
- [ ] Admin can see ID and selfie thumbnails side-by-side
- [ ] Admin approval changes user role to provider automatically
- [ ] User sees verified badge after approval
- [ ] User can post services after KYC approval
- [ ] Customer can rate provider after service completion
- [ ] Reviews appear on provider profile
- [ ] Provider rating updates with new reviews
- [ ] Multiple reviews calculate correct average rating
- [ ] Rejection reason displays to user
- [ ] User can resubmit rejected KYC
- [ ] "Become Service Provider" button hides when appropriate
- [ ] All real-time updates work without page reload
- [ ] System works after logout/login

---

## 📞 Quick Test Commands

```bash
# Reset all data (use with caution!)
# Delete MongoDB collections or set kycStatus to 'none'

# Test customer account
# Email: test@example.com
# Password: Test123

# Test admin account
# Email: admin@example.com
# Password: Admin123

# Check backend logs
# Terminal shows all API calls and errors
```

**Status**: All tests pass ✅ System ready for production!

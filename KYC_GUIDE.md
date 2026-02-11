# KYC Management Guide

## 📋 Overview

The KYC (Know Your Customer) verification system allows admin to review and approve user identity documents. This ensures trust and security on the platform.

## 🔐 For Users

### How to Submit KYC

1. Go to your **Profile** page
2. Click **"Become Service Provider"** button
3. Fill in the KYC form:
   - Select ID Type (Passport, Driver's License, National ID)
   - Enter ID Number
   - Upload ID Document photo
   - Take a selfie for verification
4. Submit and wait for admin approval

### KYC Status

Your KYC status will be displayed on your profile:

- 🟡 **Pending** - Submission is under review
- 🟢 **Verified** - Approved! You can now offer services
- 🔴 **Rejected** - Not approved (reason will be shown)

### If Your KYC is Rejected

- You'll see the **rejection reason** on your profile
- Review the reason carefully
- Fix the issues mentioned
- Submit a new KYC application

## 👨‍💼 For Admin

### Accessing KYC Submissions

1. Login with admin credentials
2. Go to **Admin Panel**
3. Click **"KYC Verification"** tab
4. You'll see a badge showing pending KYC count

### Reviewing Submissions

**Table Columns:**
- **Name** - User's name
- **Email** - User's email address
- **ID Type** - Type of document submitted
- **Submitted** - Date of submission
- **Status** - Current KYC status
- **Actions** - Available actions

### Filtering Options

- **Pending** - New submissions waiting for review
- **Verified** - Already approved submissions
- **Rejected** - Previously rejected submissions
- **All** - Show all submissions

### Approving KYC

1. Click **"View ID"** to see the uploaded document
2. Verify the document is:
   - Clear and readable
   - Matches the user's name
   - Is a valid government ID
   - Not expired
3. Click **"Approve"**
4. Confirm the action
5. User will be verified and can become a provider

### Rejecting KYC

1. Review the submission
2. Click **"Reject"**
3. **Enter a clear rejection reason**, for example:
   - "Document is blurry, please upload a clearer image"
   - "ID has expired, please upload a valid ID"
   - "Name on ID doesn't match profile name"
   - "Document appears to be tampered with"
4. Confirm
5. User will see the reason on their profile

## 📊 Dashboard Statistics

The admin dashboard shows:
- **Pending KYC** - Number of submissions waiting for review (with yellow badge)
- Click the number to quickly jump to pending submissions

## ⚠️ Best Practices

### For Admin

1. **Review carefully** - Take time to verify each document
2. **Be specific** - When rejecting, provide clear reasons
3. **Be fair** - Apply the same standards to all users
4. **Respond quickly** - Try to review within 24-48 hours
5. **Document concerns** - Note any suspicious patterns

### For Users

1. **Use clear images** - Take photos in good lighting
2. **Show full document** - All corners must be visible
3. **Match your profile** - Name on ID should match your profile
4. **Use valid IDs** - Documents must not be expired
5. **Be patient** - Allow time for admin review

## 🔍 Verification Checklist

Before approving a KYC submission, check:

- [ ] Image is clear and readable
- [ ] All document details are visible
- [ ] Name matches user profile
- [ ] ID is not expired
- [ ] Photo on ID matches selfie (if applicable)
- [ ] No signs of tampering or editing
- [ ] Document appears authentic

## 📱 Common Rejection Reasons

Use these standard reasons or customize as needed:

- "Document image is too blurry or unclear"
- "ID document has expired"
- "Name on ID doesn't match profile name"
- "Incomplete document - all corners must be visible"
- "Document appears to be edited or tampered with"
- "Invalid document type - please use government-issued ID"
- "Selfie doesn't match ID photo"

## 🎯 API Endpoints

### Get KYC Submissions
```
GET /api/admin/kyc?status=pending&page=1&limit=10
```

### Get Single Submission
```
GET /api/admin/kyc/:userId
```

### Approve KYC
```
PUT /api/admin/kyc/:userId/approve
```

### Reject KYC
```
PUT /api/admin/kyc/:userId/reject
Body: { "reason": "Your rejection reason here" }
```

## 📞 Support

For issues with the KYC system:
- Admin: Check server logs for API errors
- Users: Contact support if status hasn't updated

---

**Last Updated:** 2026-02-02
**Feature Version:** 1.0

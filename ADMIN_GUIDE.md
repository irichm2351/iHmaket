# Admin Panel Guide

## 🔐 Admin Access

### Default Credentials
- **Email:** `admin@servicehub.com`
- **Password:** `Admin123456`
- **⚠️ Important:** Change the password immediately after first login!

## 📋 Admin Features

### Dashboard Statistics
View real-time platform metrics:
- **Total Users** - All registered users count
- **Providers** - Service providers count
- **Services** - Total active services
- **Restricted Users** - Banned/restricted users count

### User Management

#### Viewing Users
1. Click on Admin Panel from the dashboard
2. Use filters to find users:
   - **Search** - Filter by name or email
   - **Role** - Filter by user type (Customer, Provider, Admin)
   - **Status** - Filter by account status (Active, Inactive, Restricted)

#### Changing User Role
1. Select a user from the list
2. Click the role dropdown next to their name
3. Choose new role: `Customer`, `Provider`, or `Admin`
4. Changes take effect immediately

#### User Actions

| Action | Icon | Purpose |
|--------|------|---------|
| **Power Button** | ⚡ | Activate/Deactivate user account |
| **Ban Icon** | 🚫 | Restrict user (requires reason) |
| **Delete Icon** | 🗑️ | Permanently delete user account |

### User Status Indicators

- 🟢 **Active** - User account is active and can access platform
- ⚪ **Inactive** - User account is deactivated
- 🔴 **Restricted** - User account is banned with a specific reason

## 📱 Common Tasks

### Deactivate a User
1. Find user in the list
2. Click the power button icon
3. User will be marked as Inactive

### Restrict a User (Ban)
1. Find user in the list
2. Click the ban icon
3. Enter the reason for restriction
4. User cannot access the platform anymore

### Delete a User
1. Find user in the list
2. Click the delete icon
3. Confirm the action (⚠️ This cannot be undone)
4. User and all their data will be removed

### Promote a User to Provider
1. Find customer in the list
2. Change role to `Provider`
3. User can now post and manage services

### Promote a User to Admin
1. Find user in the list
2. Change role to `Admin`
3. User gets full admin panel access

## 🔍 Search & Filter Tips

- **Search by name:** Type the user's name
- **Search by email:** Type the user's email address
- **Filter by role:** Select Customer, Provider, or Admin
- **Filter by status:** Select Active, Inactive, or Restricted
- **Clear filters:** Click "Clear Filters" button to reset

## 📄 Pagination

- Navigate between pages using Previous/Next buttons
- Each page shows 10 users
- Current page number is displayed

## ⚠️ Important Notes

1. **Cannot delete yourself** - You cannot delete your own admin account
2. **Cannot demote yourself** - You cannot change your own role from admin
3. **Permanent actions** - Deleting users is permanent and cannot be undone
4. **Audit trail** - All admin actions are logged (in development)
5. **Password security** - Change the default admin password immediately

## 🔒 Security Best Practices

1. Use a strong, unique admin password
2. Do not share admin credentials
3. Review user accounts regularly
4. Monitor restricted users list
5. Log out when leaving your desk
6. Keep the platform updated

## 📞 Support

For issues or questions about the admin panel:
- Check the documentation
- Contact the development team
- Review system logs for errors

---

**Last Updated:** 2026-02-02
**Version:** 1.0

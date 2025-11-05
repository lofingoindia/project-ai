# Admin User Management System

This document explains how to use the Admin User Management functionality in the Settings page.

## Features

### 1. Admin Registration
- **Location**: Settings page → "Register New Admin" tab
- **Purpose**: Create new admin user accounts
- **Required Fields**:
  - Full Name
  - Email Address
  - Password (minimum 6 characters)
  - Confirm Password

### 2. Change Password
- **Location**: Settings page → "Change Password" tab  
- **Purpose**: Update password for existing admin users
- **Required Fields**:
  - Admin Email
  - Current Password
  - New Password (minimum 6 characters)
  - Confirm New Password

## Database Setup

### 1. Run the SQL Migration
Execute the SQL script `admin_users_table.sql` in your Supabase database to create the necessary table and policies:

```sql
-- The script creates:
-- - admin_users table with proper structure
-- - Indexes for performance
-- - RLS policies for security
-- - Triggers for automatic updated_at timestamps
```

### 2. Table Structure
The `admin_users` table includes:
- `id` (Primary Key)
- `email` (Unique)
- `full_name`
- `password_hash` (bcrypt hashed)
- `role` (default: 'admin')
- `is_active` (default: true)
- `created_at` & `updated_at` (timestamps)

## Security Features

### Password Security
- **Bcrypt Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
- **Password Validation**: Minimum 6 characters required
- **Password Confirmation**: Double verification to prevent typos

### Database Security
- **Row Level Security (RLS)**: Enabled on admin_users table
- **Unique Email Constraint**: Prevents duplicate admin accounts
- **Input Validation**: Email format validation and required field checks

## Usage Instructions

### Creating a New Admin
1. Navigate to Settings page
2. Click "Register New Admin" tab
3. Fill in all required fields
4. Click "Create Admin User"
5. Success message will confirm creation

### Changing Admin Password
1. Navigate to Settings page
2. Click "Change Password" tab
3. Enter the admin email
4. Provide current password
5. Enter new password and confirm
6. Click "Change Password"
7. Success message will confirm update

## Error Handling

The system handles various error scenarios:
- **Duplicate Email**: Shows error if admin email already exists
- **Wrong Current Password**: Validates current password before allowing change
- **Password Mismatch**: Ensures password and confirmation match
- **Invalid Email**: Validates email format
- **Network Errors**: Graceful handling of database connection issues

## Environment Variables

Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Dependencies

The following packages are required:
- `@supabase/supabase-js`: Database client
- `bcryptjs`: Password hashing
- `@types/bcryptjs`: TypeScript types for bcrypt

## File Structure

```
src/
├── components/
│   ├── AdminRegistrationForm.tsx
│   └── ChangePasswordForm.tsx
├── pages/
│   └── Settings.tsx
├── utils/
│   └── passwordUtils.ts
└── lib/
    └── supabase.ts
```

## Future Enhancements

Potential improvements:
- Email notifications for new admin registrations
- Password strength meter
- Admin user listing and management
- Role-based permissions
- Two-factor authentication
- Password reset functionality
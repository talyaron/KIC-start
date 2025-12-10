# Firebase Authentication Setup Guide

Complete these steps to enable authentication in your TaskFlow app.

---

## Step 1: Enable Firebase Authentication

1. **Open Firebase Console**  
   Go to [Firebase Console](https://console.firebase.google.com/) and select your project **kic1-ab4a0**

2. **Navigate to Authentication**

   - Click **"Authentication"** in the left sidebar
   - Click **"Get Started"** button

3. **Enable Email/Password Sign-In**
   - Go to the **"Sign-in method"** tab
   - Click on **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**

![Firebase Auth Enable](https://firebase.google.com/static/images/brand-guidelines/logo-standard.png)

---

## Step 2: Update Firestore Security Rules

Your tasks need to be user-specific. Update the security rules:

1. **Go to Firestore Database**

   - Click **"Firestore Database"** in the left sidebar
   - Click the **"Rules"** tab

2. **Replace the existing rules with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      // Allow users to create tasks (must include userId matching auth)
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;

      // Allow users to read their own tasks
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Allow users to update/delete their own tasks
      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. **Click "Publish"** to save the rules

> [!IMPORTANT]
> These rules ensure that each user can only access their own tasks. Without these rules, the app won't work properly!

---

## Step 3: (Optional) Clear Existing Tasks

Since existing tasks don't have a `userId`, they won't be accessible by any user.

**Option A: Delete All Tasks (Recommended)**

1. Go to **Firestore Database** → **Data** tab
2. Click on the `tasks` collection
3. Delete all documents, or delete the entire collection

**Option B: Keep Them**

- Old tasks will remain in the database but won't show up for any user
- New tasks will work correctly

---

## Step 4: Test the Authentication

1. **Access the auth page**  
   Navigate to: `http://localhost:8000/auth.html`

2. **Register a new account**

   - Switch to the "Sign Up" tab
   - Enter an email and password (min 6 characters)
   - Click "Create Account"
   - You should be redirected to the main app

3. **Verify you're logged in**

   - Check that your email appears in the top right
   - The "Logout" button should be visible

4. **Test creating tasks**

   - Add a few tasks
   - They should appear immediately

5. **Test logout and login**

   - Click "Logout"
   - You should be redirected to auth page
   - Log back in with your credentials
   - Your tasks should still be there

6. **Test task isolation (multi-user)**
   - Logout
   - Register a different user account
   - Verify you see an empty task list
   - Add tasks as the second user
   - Logout and login as the first user
   - Verify you only see the first user's tasks

---

## Troubleshooting

### "Permission denied" errors

- **Cause**: Firestore security rules not updated
- **Fix**: Follow Step 2 above and publish the new rules

### Can't see tasks after login

- **Cause**: Existing tasks don't have `userId` field
- **Fix**: Clear old tasks (Step 3) and create new ones

### Redirect loop or auth not working

- **Cause**: Email/Password auth not enabled in Firebase Console
- **Fix**: Follow Step 1 to enable authentication

### Browser console shows errors

- Open browser console (F12) and check error messages
- Most errors will indicate which step is missing

---

## Next Steps

Once authentication is working:

1. ✅ Test all functionality thoroughly
2. 🚀 Deploy to Firebase Hosting (optional)
3. 🔐 Consider adding password reset functionality
4. 📱 Add Google Sign-In or other auth providers
5. 🎨 Customize the auth page design

---

## Security Notes

> [!WARNING] > **Current Setup**: Email/Password authentication with user-specific data isolation
>
> **For Production**:
>
> - Consider adding email verification
> - Implement password reset functionality
> - Add rate limiting for login attempts
> - Consider adding multi-factor authentication

---

## Summary

- ✅ Created beautiful authentication UI (`auth.html`)
- ✅ Integrated Firebase Authentication
- ✅ Added user-specific task filtering
- ✅ Implemented logout functionality
- ✅ Updated Firestore security rules

Your app now supports multiple users with private task lists! 🎉

# Firebase Firestore Rules Setup

## Issue

Tasks are not being added because Firestore security rules are blocking write operations by default.

## Solution: Update Firestore Security Rules

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kic1-ab4a0**

### Step 2: Navigate to Firestore Rules

1. Click on **Firestore Database** in the left sidebar
2. Click on the **Rules** tab at the top

### Step 3: Update Rules

#### Option A: For Testing (Allow All - NOT for production!)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Option B: For Production (Recommended)

If you plan to add authentication later:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if true; // For now, change later with auth
    }
  }
}
```

### Step 4: Publish Rules

1. Click the **Publish** button
2. Wait for the confirmation message

### Step 5: Test Your App

1. Refresh your browser at http://localhost:8000
2. Try adding a task - it should work now! ✅

---

## Important Security Note

⚠️ **WARNING**: The rules above allow anyone to read/write to your database. This is fine for development/testing, but you should secure your database before deploying to production.

### Future: Add Authentication

When you're ready to secure your app:

1. **Enable Firebase Authentication**
2. **Update rules to require authentication:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Verification

After updating the rules, you should see:

- ✅ Tasks being added when you click "Add Task"
- ✅ Tasks appearing in real-time
- ✅ No errors in the browser console
- ✅ Data visible in Firebase Console under Firestore Database > Data tab

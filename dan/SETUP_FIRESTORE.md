# Setup Firestore for "kyc-dan"

You have switched to Firestore. You must enable it in the console.

## 1. Enable Firestore
1. Go to [Firebase Console](https://console.firebase.google.com/project/kyc-dan/firestore).
2. Click **Create Database**.
3. Select **Start in Test Mode** (Quickest setup).
   - Rules: `allow read, write: if true;` (for 30 days)
4. Choose a Location (e.g. `eur3` or `us-central`).
5. Click **Enable**.

## 2. Check Rules (If not in Test Mode)
If you didn't choose Test Mode, go to **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. Play
Run `npx serve dan` or click the link in the chat.

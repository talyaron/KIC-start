# CRITICAL: Missing Database URL

The error logs show that the game cannot connect to the database. This is because **Realtime Database URL** is incorrect or missing.

1. Go to [Firebase Console](https://console.firebase.google.com/project/kyc-dan/database).
2. Click **Realtime Database** in the left menu.
3. Look at the top of the Data tab. You will see a URL like:
   `https://kyc-dan-default-rtdb.firebaseio.com/` 
   OR 
   `https://kyc-dan-default-rtdb.europe-west1.firebasedatabase.app/`
4. **COPY** that entire URL.
5. **PASTE** it into the chat so I can fix your code, OR edit `dan/js/firebase-config.js` yourself.

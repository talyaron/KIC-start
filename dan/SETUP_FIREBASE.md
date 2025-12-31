# Firebase Setup Guide for "kyc-dan"

Since I cannot access your Google Account directly, you need to perform these steps in the Firebase Console.

## 1. Get your API Credentials
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **kyc-dan**.
3. Click the **Gear Icon** (Settings) -> **Project Settings**.
4. Scroll down to **Your apps**.
5. Click the **</>** icon to create a Web App.
6. Name it "Square Siege" and Register.
7. **Copy** the `apiKey`, `messagingSenderId`, and `appId` from the code snippet shown.
8. **Paste** them into `dan/js/firebase-config.js`.

## 2. Enable Authentication
1. Go to **Build** -> **Authentication** in the left menu.
2. Click **Get Started**.
3. Select **Google** -> Enable -> Save.
4. Click **Add new provider** -> **Anonymous** -> Enable -> Save.

## 3. Create the Database
1. Go to **Build** -> **Realtime Database**.
2. Click **Create Database**.
3. Choose a location (e.g., United States) -> Next.
4. Choose **Start in Test Mode** (or Locked, we will start with Test) -> Enable.
5. Go to the **Rules** tab.
6. Copy the content from `dan/database-rules.json` and paste it there.
7. Click **Publish**.

## 4. Play!
Run the game using a local server (e.g. `npx serve dan`).

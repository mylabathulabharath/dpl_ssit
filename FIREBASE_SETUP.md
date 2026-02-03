# Firebase Setup Guide

This application uses Firebase Authentication and Firestore for user management and role-based access control.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Firebase Authentication enabled with Email/Password provider
3. Firestore Database enabled

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Save changes

### 3. Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location for your database

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**To get your Firebase config:**

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Copy the config values

### 5. Update Firebase Config

Edit `lib/firebase.ts` and replace the placeholder values with your actual Firebase config, or ensure your `.env` file is properly configured.

### 6. Firestore Security Rules (Optional but Recommended)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing Authentication

### Create a Student Account

1. Open the app
2. Tap "Create one" on the login screen
3. Fill in:
   - Name: Your name
   - Email: student@example.com
   - Password: password123
   - Tutor Code: Leave empty
4. Tap "Create Account"
5. You'll be redirected to the Student Dashboard

### Create a Tutor Account

1. Open the app
2. Tap "Create one" on the login screen
3. Fill in:
   - Name: Your name
   - Email: tutor@example.com
   - Password: password123
   - Tutor Code: **TUTOR** (must be exactly "TUTOR")
4. Tap "Create Account"
5. You'll be redirected to the Tutor Dashboard

## User Roles

- **Student**: Default role when no tutor code is provided
- **Tutor**: Assigned when tutor code "TUTOR" is entered during signup

Roles are stored in Firestore under `/users/{userId}` with the field `role: "student" | "tutor"`.

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your Firebase API key is correct in `.env` or `lib/firebase.ts`

### "Firebase: Error (auth/email-already-in-use)"
- The email is already registered. Try logging in instead.

### "Firebase: Error (auth/weak-password)"
- Password must be at least 6 characters

### User profile not loading
- Check Firestore rules allow read access
- Verify the user document exists in `/users/{userId}`


# Phase 1 Authentication Testing Checklist

## Overview

This document outlines the complete testing procedure for Phase 1 authentication implementation.

## Prerequisites

1. Firebase project configured with Authentication and Firestore
2. Environment variables properly set in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   BOOTSTRAP_ADMIN_SECRET=your_secret_key
   ```
3. **CRITICAL**: Firebase Admin Service Account JSON must be properly formatted as a single-line JSON string
4. Google OAuth configured in Firebase Console

## ⚠️ Common Setup Issues

### Firebase Admin Service Account Key

The `FIREBASE_SERVICE_ACCOUNT_KEY` must be a complete JSON object as a string. Common issues:

- **Missing quotes**: The value must be wrapped in single quotes in .env.local
- **Invalid JSON**: Download the service account key from Firebase Console and ensure it's valid JSON
- **Multiline format**: The JSON must be on a single line, not formatted with line breaks

Example of correct format:

```
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com","client_id":"123456","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com"}'
```

## 1. Initial Setup Testing

### 1.1 Environment Validation

- [ ] Run environment validation: `npm run validate-env`
- [ ] Fix any reported issues before proceeding
- [ ] All environment variables should show as ✅ configured

### 1.2 Application Startup

- [ ] Start dev server: `npm run dev`
- [ ] Verify no compilation errors
- [ ] Check browser console for Firebase initialization
- [ ] Visit http://localhost:3000 - should load homepage

### 1.3 Firebase Admin Connection

- [ ] Test health endpoint: `GET /api/health` should return 200
- [ ] Check console for Firebase Admin initialization
- [ ] **If you see "Failed to initialize Firebase Admin: SyntaxError"**:
  - Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set in `.env.local`
  - Verify the JSON is valid (no syntax errors)
  - Ensure the JSON is on a single line wrapped in single quotes
  - Download a fresh service account key from Firebase Console if needed
- [ ] Test debug endpoint: `GET /api/debug/token` with Authorization header to verify token processing

## 2. Admin Bootstrap Testing

### 2.1 Create First Admin (Bootstrap Method)

- [ ] Use Postman/curl to create first admin:
  ```bash
  curl -X POST http://localhost:3000/api/admin/admins.create \
    -H "Content-Type: application/json" \
    -H "X-Bootstrap-Secret: your_secret_key" \
    -d '{
      "email": "admin@example.com",
      "password": "SecurePassword123!"
    }'
  ```
- [ ] Should return 201 with success message
- [ ] Check Firebase Auth console - new user should exist
- [ ] Check Firestore users collection - document should exist with role: 'admin'

### 2.2 Verify Admin Login

- [ ] Visit `/admin/login`
- [ ] Login with created admin credentials
- [ ] Should redirect to `/admin` page
- [ ] Should display admin dashboard with sign out button

## 3. End User Authentication Testing

### 3.1 Google Authentication

- [ ] Visit `/login`
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Should redirect to `/dashboard`
- [ ] Check Firestore - user document created with role: 'user'
- [ ] Check loginEvents collection - login event recorded

### 3.2 User Dashboard Access

- [ ] Visit `/dashboard` while logged in
- [ ] Should display user dashboard with streak counter
- [ ] First login should show "Login streak: 1 day"
- [ ] Sign out and sign in again same day - streak should remain 1
- [ ] Test debug endpoint: `GET /api/auth/me` should return user info

## 4. Authorization Testing

### 4.1 Role-Based Access Control

- [ ] As end user, try to visit `/admin` - should redirect to login
- [ ] As end user, try to visit `/admin/login` - should be accessible
- [ ] As admin, visit `/dashboard` - should be accessible
- [ ] As admin, visit `/admin` - should be accessible

### 4.2 API Endpoint Security

- [ ] Call admin APIs without auth - should return 401:
  ```bash
  curl -X POST http://localhost:3000/api/admin/admins.create \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "test"}'
  ```
- [ ] Call admin APIs with user token - should return 401
- [ ] Call admin APIs with admin token - should work

## 5. Streak Logic Testing

### 5.1 Login Streak Mechanics

- [ ] User logs in for first time - streak = 1
- [ ] Same user logs in again same day - streak remains 1
- [ ] Manually set lastLoginDate in Firestore to yesterday - login should increment streak to 2
- [ ] Manually set lastLoginDate to 3 days ago - login should reset streak to 1

### 5.2 Login Events Tracking

- [ ] Each login should create document in loginEvents collection
- [ ] Document should contain: userId, timestamp, metadata
- [ ] Multiple logins same day should create multiple events
- [ ] Events should be properly timestamped in UTC

## 6. Session Management Testing

### 6.1 Authentication State

- [ ] Refresh page while logged in - should maintain auth state
- [ ] Open new tab while logged in - should maintain auth state
- [ ] Clear browser storage - should require re-authentication
- [ ] Token expiry handling (test with expired token)

### 6.2 Sign Out Functionality

- [ ] Sign out from admin dashboard - should redirect to admin login
- [ ] Sign out from user dashboard - should redirect to home
- [ ] After sign out, try accessing protected pages - should require auth

## 7. Multiple Admin Testing

### 7.1 Admin Creation by Existing Admin

- [ ] Login as first admin
- [ ] Use admin APIs to create second admin
- [ ] Should require valid admin authentication
- [ ] New admin should be able to login and access admin features

### 7.2 Admin Management

- [ ] List all admins (if API exists)
- [ ] Verify admin role in custom claims
- [ ] Test admin-only operations

## 8. Error Handling Testing

### 8.1 Authentication Errors

- [ ] Invalid email/password for admin login
- [ ] Cancelled Google OAuth flow
- [ ] Network errors during authentication
- [ ] Malformed tokens

### 8.2 API Error Responses

- [ ] Missing required fields in requests
- [ ] Invalid JSON in request bodies
- [ ] Unauthorized access attempts
- [ ] Server errors (invalid service account, etc.)

## 9. Security Validation

### 9.1 Custom Claims

- [ ] Verify admin users have custom claim: `role: 'admin'`
- [ ] Verify end users have custom claim: `role: 'user'`
- [ ] Test that custom claims are enforced server-side

### 9.2 Provider Enforcement

- [ ] Admin users can only use email/password
- [ ] End users can only use Google OAuth
- [ ] Cross-provider attempts should be rejected

## 10. Production Readiness

### 10.1 Build Testing

- [ ] Production build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No linting errors: `npm run lint`
- [ ] All routes accessible in production build

### 10.2 Environment Security

- [ ] Service account key properly secured
- [ ] Bootstrap secret sufficiently complex
- [ ] No secrets exposed in client-side code
- [ ] Firebase security rules updated (next phase)

## Common Issues & Solutions

### 401 Unauthorized Error on Mark-Login

- **Error**: `POST /api/auth/mark-login 401 (Unauthorized)` after Google login
- **Root Cause**: Firebase Admin SDK not properly initialized due to missing/invalid service account key
- **Solution**:
  1. Check browser console for "Failed to initialize Firebase Admin" errors
  2. Verify `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is properly set
  3. Restart dev server after fixing environment variables
  4. Test with debug endpoint: `GET /api/debug/token` with auth header

### Firebase Admin Initialization

- **Error**: "SyntaxError: Expected property name or '}' in JSON"
- **Solution**: Check FIREBASE_SERVICE_ACCOUNT_KEY formatting - must be valid JSON string

### Google OAuth Issues

- **Error**: "unauthorized_client"
- **Solution**: Verify OAuth redirect URIs in Firebase Console

### Custom Claims Not Applied

- **Error**: User shows wrong role
- **Solution**: Custom claims take time to propagate, or force token refresh

### Streak Logic Issues

- **Error**: Streak not incrementing properly
- **Solution**: Check UTC date calculations and Firestore timestamps

## Test Data Cleanup

After testing, clean up test data:

- [ ] Remove test users from Firebase Auth
- [ ] Clear test documents from Firestore users collection
- [ ] Clear test documents from loginEvents collection
- [ ] Reset any modified environment variables

## Next Steps

Once Phase 1 testing is complete:

1. Update Firestore security rules
2. Implement Phase 2 features
3. Add comprehensive error logging
4. Set up monitoring and analytics

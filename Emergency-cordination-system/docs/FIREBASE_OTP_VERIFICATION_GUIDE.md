# Firebase Phone Authentication OTP Verification System - Guide & Testing Documentation

This document describes the design, setup, architecture, security controls, and step-by-step testing procedure for the **Firebase Phone Authentication OTP Verification System** integrated into the **Community Emergency Coordination & Citizen Assistance Network**.

---

## 1. System Architecture & Component Design

```
+-----------------------------------------------------------------------------------+
|                               REACT NATIVE APP                                    |
|                                                                                   |
|  [Emergency Contacts] ---> [Add Contact Screen] ---> [OTP Verification Screen]    |
|                                                            |                      |
|                                                 (1) Send OTP via Firebase         |
|                                                            v                      |
|                                                Firebase Auth SDK (Client)         |
|                                                            |                      |
|                                                 (2) Receive OTP via SMS           |
|                                                            v                      |
|                                                 (3) Enter & Verify OTP            |
|                                                            |                      |
|                                                 (4) Obtain Firebase ID Token      |
|                                                            v                      |
|                                                Call Backend POST /contacts/{id}/verify |
+------------------------------------------------------------|----------------------+
                                                             |
                                                             v (HTTPS + JWT Auth)
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  [POST /contacts/{id}/verify]                                                     |
|           |                                                                       |
|           v                                                                       |
|  [services/firebase_service.py] ---> Verify Firebase ID Token via Admin SDK       |
|           |                                                                       |
|           v                                                                       |
|  Extract Verified Phone Number & Compare with Contact's Phone Number              |
|           |                                                                       |
|           +---> Match: Update PostgreSQL DB (is_verified=True, method="FIREBASE")  |
|           +---> Mismatch / Expired: Return 400 Bad Request / 401 Unauthorized      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Configuration & Setup Instructions

### A. Firebase Console Setup
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select or create your Firebase project.
3. Go to **Authentication** > **Sign-in method** > **Phone** and enable **Phone Authentication**.
4. (Optional for testing) Add test phone numbers (e.g., `+1 650-555-3434` with test OTP `654321`) under **Phone numbers for testing**.

### B. Android Configuration
1. Register your Android app in Firebase settings (`com.communityemergency` or app package name).
2. Download `google-services.json` and place it at:
   `MobileApp/android/app/google-services.json`
3. Ensure `MobileApp/android/build.gradle` includes the Google services plugin:
   ```gradle
   buildscript {
       dependencies {
           classpath('com.google.gms:google-services:4.4.1')
       }
   }
   ```
4. Ensure `MobileApp/android/app/build.gradle` applies the plugin:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### C. FastAPI Backend Firebase Admin Setup
1. In the Firebase Console, go to **Project Settings** > **Service Accounts**.
2. Click **Generate New Private Key** to download your JSON credentials file.
3. Place the file in the `backend/` directory as `firebase-credentials.json` OR set the environment variable:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/firebase-credentials.json
   ```

---

## 3. API Endpoints Specification

### 1. Create Emergency Contact
- **Endpoint**: `POST /contacts`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone_number": "+1234567890",
    "email": "jane@example.com"
  }
  ```
- **Response** (HTTP 201 Created):
  ```json
  {
    "id": 12,
    "user_id": 4,
    "name": "Jane Doe",
    "phone_number": "+1234567890",
    "relationship": "Spouse",
    "priority": 1,
    "is_verified": false,
    "verified_at": null,
    "verification_method": null,
    "created_at": "2026-07-24T19:00:00Z"
  }
  ```

### 2. Get User Emergency Contacts
- **Endpoint**: `GET /contacts`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (HTTP 200 OK):
  ```json
  [
    {
      "id": 12,
      "user_id": 4,
      "name": "Jane Doe",
      "phone_number": "+1234567890",
      "relationship": "Spouse",
      "priority": 1,
      "is_verified": false,
      "verified_at": null,
      "verification_method": null
    }
  ]
  ```

### 3. Verify Contact with Firebase Token
- **Endpoint**: `POST /contacts/{contact_id}/verify`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "firebase_id_token": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Success Response** (HTTP 200 OK):
  ```json
  {
    "success": true,
    "message": "Emergency Contact Verified Successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: "Emergency contact is already verified"
  - `400 Bad Request`: "Verified phone number does not match emergency contact phone number"
  - `401 Unauthorized`: "Invalid or expired Firebase ID token"
  - `403 Forbidden`: "Access forbidden: You do not own this emergency contact"
  - `404 Not Found`: "Emergency contact not found"

---

## 4. Testing & Verification Guide

### Step 1: Start Backend Server
```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
Verify interactive docs are available at: `http://localhost:8000/docs`

### Step 2: Start Mobile App
```bash
cd MobileApp
npx react-native run-android
```

### Step 3: End-to-End User Verification Workflow
1. **Login**: Log into the React Native app as a resident.
2. **Navigate to Contacts**: Tap the **Contacts** tab on the bottom bar.
3. **Add Contact**: Tap `+ Add` button to open the **Add Emergency Contact** screen.
4. **Enter Contact Info**:
   - Name: `Jane Doe`
   - Relationship: `Sister`
   - Phone Number: `+16505553434` (or test phone number configured in Firebase)
   - Tap **Save Contact**.
5. **Send OTP**:
   - The app automatically navigates to **Firebase OTP Verification**.
   - Tap **Send OTP**. Firebase sends an SMS containing a 6-digit code.
6. **Enter & Verify OTP**:
   - Input the 6-digit code into the custom pin input (`OTPInput`).
   - Tap **Verify OTP**.
   - Client authenticates with Firebase, gets Firebase ID Token, and calls `POST /contacts/{contact_id}/verify`.
7. **Confirmation**:
   - The app displays a green success confirmation banner.
   - Database record is updated (`is_verified = True`, `verification_method = "FIREBASE"`).
   - Navigation returns to Dashboard/Contacts with verified badge indicator `✓ Verified`.

---

## 5. Security Summary
- **Client Trust Prevention**: Backend NEVER relies on client boolean claims. Every single verification call requires a signed Firebase ID Token verified server-side via the official Firebase Admin SDK.
- **Ownership Verification**: Contacts can only be verified by the user who owns them.
- **Number Consistency**: Verified token phone number must match the emergency contact's stored phone number.
- **Duplicate Protection**: Verified contacts reject duplicate verification requests.

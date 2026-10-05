# Mobile Application — Community Emergency Coordination Network

> **Cross-Platform React Native & TypeScript Mobile Application for Real-Time Emergency SOS Dispatch, Live Location Tracking, and Mobile Role Governance.**

---

## 🛠️ Tech Stack & Libraries Used

| Technology / Package | Purpose |
| :--- | :--- |
| **React Native 0.86+** | Native cross-platform mobile framework |
| **TypeScript 5.8+** | Type-safe application logic and interface definitions |
| **React Navigation v7** | `@react-navigation/native`, `native-stack`, and `bottom-tabs` |
| **AsyncStorage** | Local persistent storage for JWT tokens, user profiles, and active role states |
| **Axios** | HTTP client with automatic backend candidate auto-discovery |
| **Firebase Auth SDK** | `@react-native-firebase/app` & `@react-native-firebase/auth` for Phone Auth |
| **React Native Maps** | Interactive map visualization for emergency incident locations |
| **Android Gradle 8.x** | Native Android compilation target (SDK 34) |

---

## ⚙️ How the Mobile App Works

### 1. Parallel Multi-Candidate Auto-Discovery ([apiClient.ts](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/MobileApp/src/api/apiClient.ts))
- On launch and during network retry, `findWorkingBackendUrl()` probes candidate endpoints in parallel (`http://127.0.0.1:8000`, `http://localhost:8000`, `http://10.0.2.2:8000`, `http://192.168.31.225:8000`).
- Auto-selects the fastest reachable server, saves it to `AsyncStorage`, and transparently recovers from network failures.

---

### 2. Automatic Role Detection & Navigation ([AppNavigator.tsx](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/MobileApp/src/navigation/AppNavigator.tsx))
- `detectUserRole` inspects the `roles` array returned from `GET /users/me`.
- Dynamically mounts the appropriate navigation tabs:
  - **Admin**: Dedicated `AdminTabNavigator` (Admin Dashboard, Manage Residents & Roles, Manage Societies, Incident Logs, Emergency Broadcasts).
  - **Security**: Dedicated `SecurityTabNavigator` (Guards Portal, Security Profile).
  - **Volunteer**: Dedicated `VolunteerTabNavigator` (Volunteers Portal, Availability Settings).
  - **Resident**: Dedicated `ResidentTabNavigator` (Home, Emergency Contacts, Alerts, Profile).

---

### 3. Mobile Resident & Role Governance ([ManageResidentsScreen.tsx](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/MobileApp/src/screens/admin/ManageResidentsScreen.tsx))
- Displays user accounts with status pills (`⏳ Plain (Pending Role)` or active role).
- Admins can assign roles (`Resident`, `Security Guard`, `Volunteer`, `Admin`) and map residents to housing society flats directly from their mobile phone.

---

## 🚀 Running on Mobile Device / Emulator

### Step 1: Set Up ADB Reverse Port Forwarding
Ensure your connected Android device can access the local FastAPI backend server and Metro bundler:

```powershell
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
```

### Step 2: Build & Launch Android App

```powershell
# Navigate to MobileApp directory
cd MobileApp

# Install node dependencies
npm install

# Start Metro bundler (in a separate terminal)
npx react-native start

# Build APK and deploy to connected Android device
npm run android
```

---

## 🧪 Type Checking

Validate TypeScript types across all screens and navigators:

```powershell
npx tsc --noEmit
```
*Result:* **0 errors**

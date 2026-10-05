# Web Application — Community Emergency Coordination Network

> **Modern, High-Aesthetic Web Application providing dedicated Command Dashboards for Admins, Security Guards, Volunteers, and Residents.**

---

## 🛠️ Tech Stack & Libraries Used

| Technology / Package | Purpose |
| :--- | :--- |
| **React 18+** | Frontend component framework |
| **Vite** | Next-generation fast frontend build tool and dev server |
| **Axios** | HTTP API client with global JWT request/response interceptors |
| **Vanilla CSS (HSL)** | Apple-inspired Design System with dark mode, glassmorphism, and responsive CSS variables |
| **LanguageContext** | Multilingual internationalization (English, Hindi, Tamil, Telugu, Bengali, Kannada) |

---

## ⚙️ How the Frontend Works

### 1. Role-Based Navigation & View Security ([App.jsx](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/frontend/src/App.jsx))
- Upon authentication (`fetchUserProfile`), the web app inspects `currentUser.roles`.
- Automatically sets `activeRole` and mounts the corresponding workspace dashboard:
  - `Admin`: `admin-dashboard` (**Admin Command & Governance Dashboard**)
  - `Security`: `security-dashboard` (**Guards Command Center**)
  - `Volunteer`: `volunteer-dashboard` (**Volunteer Responder Portal**)
  - `Resident`: `resident-dashboard` (**Resident SOS Portal**)

---

### 2. Dedicated Admin Sidebar ([Sidebar.jsx](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/frontend/src/components/Sidebar.jsx))
- When logged in as **Admin**, the menu strictly displays governance tools:
  - 📊 **Admin Command Center** (`admin-dashboard`)
  - 👥 **Manage Residents & Roles** (`manage-residents`)
  - 🏢 **Manage Societies & Flats** (`manage-societies`)
  - 📜 **System Incident Logs** (`incident-history`)
  - 📢 **Emergency Broadcasts** (`notifications`)
- Omits all standard resident options (Home, Emergency Contacts, Profile).

---

### 3. Plain Account Governance UI ([ManageResidents.jsx](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/frontend/src/pages/ManageResidents.jsx))
- Newly registered plain accounts appear under a **"Plain / Pending"** filter tab with status **"⏳ Pending Admin Role Assignment"**.
- Admins select any role (`Resident`, `Security Guard`, `Volunteer`, `Admin`) from the dropdown selector to assign permissions in real time.

---

## 🚀 Running the Web Application

```powershell
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Build production bundle
npm run build
```

- **Dev URL**: [http://localhost:5173](http://localhost:5173)

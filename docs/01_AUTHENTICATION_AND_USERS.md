# 01 — Authentication, Users & Access Control (Login aur User Management)

Is document me hum **Authentication System**, **Team User Management**, **Roles & Permissions**, aur **Logout Flow** ke har ek field aur business use case ko detail me samjhenge.

---

## 1. Login Page (`/login` — `LoginPage.tsx`)

Login page pure application ka entry gate hai. Isme clean dual-pane layout diya gaya hai:
- **Left Side**: 5-step interactive branding carousel with modern illustrations.
- **Right Side**: Clean, focused authentication card with Automate Business official logo.

### 1.1 Left Side Carousel Slides (Field-by-Field)

Carousel me 5 automated slides hain jo 5 seconds ke interval me crossfade transition karti hain:

1. **Slide 1 — Warehouse & Stock Control**:
   - *Headline*: “Every Stock. Every Sale. Under Control.”
   - *Subtitle*: `Reports • Invoices • E-way Bill • E-Invoice • POS`
   - *Image*: `/login-illustration-hd.jpg`
   - *Use Case*: Business owner ko overall inventory & multi-channel billing ka overview deta hai.

2. **Slide 2 — Reports & Analytics**:
   - *Headline*: “Real-Time Insights. Smarter Decisions.”
   - *Subtitle*: `Profit & Loss • Stock Valuation • GST Summary • Sales Trends`
   - *Image*: `/login-reports-hd.jpg`
   - *Use Case*: Business decision makers ko analytics capabilities showcase karta hai.

3. **Slide 3 — E-Way Bills & Logistics**:
   - *Headline*: “Instant E-Way Bills. Automated & Compliant.”
   - *Subtitle*: `1-Click Generation • Vehicle Tracking • QR Verification • E-Invoice Sync`
   - *Image*: `/login-eway-hd.jpg`
   - *Use Case*: Dispatch aur transport team ko fast logistics clearance demonstrate karta hai.

4. **Slide 4 — E-Invoicing & GST Clearance**:
   - *Headline*: “Seamless E-Invoicing. Instant GST Clearance.”
   - *Subtitle*: `IRN Generation • Signed QR Codes • Automated B2B Billing • IRP Portal Sync`
   - *Image*: `/login-einvoice-hd.jpg`
   - *Use Case*: Mandatory B2B GST compliance ke liye direct IRP portal sync show karta hai.

5. **Slide 5 — POS Billing & Counter Checkout**:
   - *Headline*: “Lightning-Fast POS. Seamless Counter Checkout.”
   - *Subtitle*: `Barcode Scanning • UPI QR • Split Tender`
   - *Image*: `/login-pos-hd.jpg`
   - *Use Case*: Retail stores aur warehouse counters ke liye fast billing show karta hai.

### 1.2 Login Form Fields (Field-by-Field)

| Field Name | Type | Rules & Validation | Description & Purpose |
|---|---|---|---|
| **Log In with Google** | Button | OAuth trigger | 1-Click corporate Google account login. |
| **Email Address** | Text / Email | Required, valid email format | User ka login email ID (e.g. `admin@apexglobal.in`). |
| **Password** | Password | Required, min 6 characters | User ka secure password. Right side me **Eye / EyeOff** toggle button hai jisse password show ya hide kiya ja sakta hai. |
| **Forgot Password?** | Link | Action trigger | Password reset form open karta hai jisme registered email par reset link/OTP bheja jata hai. |
| **Log In →** | Submit Button | Primary blue button | Form validate karke session authenticate karta hai aur user ko Dashboard par redirect karta hai. |
| **Create one** | Link | Switch auth mode | "Sign Up" form open karta hai new business registration ke liye. |

---

## 2. Team User Management (`UsersSettings.tsx`)

Enterprise businesses me alag-alag staff members hote hain (Billing Counter, Warehouse Store Keeper, Accountant, Sales Executive, etc.). Yeh module multi-user collaboration enable karta hai.

### 2.1 "Invite Team User" Modal Fields (Field-by-Field)

Jab admin **"+ Invite User"** button par click karta hai, toh yeh modal open hota hai:

| Field Name | Type | Mandatory? | Field Details & Business Purpose |
|---|---|---|---|
| **User Full Name** | Text input | **Yes (Required)** | Employee ka poora naam (e.g. `Rahul Sharma`). Dashboard aur invoice logs me yahi naam display hoga. |
| **Email Address** | Email input | **Yes (Required)** | User ka official email ID (e.g. `rahul@company.com`). User isi email aur password se application me login karega. |
| **Password** | Password input | **Yes (Required)** | Admin user ke liye initial password set karta hai. Isme **Hide/Unhide (Eye icon)** functionality di gayi hai taaki typing mistake na ho. |
| **Assign Access Role** | Dropdown | **Yes (Required)** | User ko specific role assign karta hai (e.g., Billing Staff, Store Keeper, Accountant, Sales Manager). Ye role user ki sidebar permissions decide karta hai. |
| **Cancel Button** | Button | No | Modal ko close karta hai aur entered inputs ko discard karta hai. |
| **Add & Invite User** | Submit Button | Yes | User ko create karke `teamUsers` state aur LocalStorage me save karta hai. |

### 2.2 Users & Team Members Table Fields (Field-by-Field)

Table me created users ki list display hoti hai:

1. **Team Member**:
   - User ka Name (e.g. `Rajesh Sharma`)
   - Unique User ID (e.g. `ID: user-1`)
2. **Contact (Email & Mobile)**:
   - User ka registered Email address
   - Mobile number (agar provided ho)
3. **Assigned Role**:
   - Visual role badge (e.g., `Business Owner`, `Purchase Manager`, `Accountant`)
   - Role description subtitle
4. **Status**:
   - `Active` / `Inactive` toggle button.
   - Admin kisi bhi employee ko 1 click me deactivate kar sakta hai bina uska historical data delete kiye.
5. **Actions**:
   - **Delete (Trash icon)**: Non-admin users ko permanently delete karne ke liye. (Main Business Owner account protected hota hai aur delete nahi ho sakta).

---

## 3. Safe Log Out Confirmation Flow (`Navbar.tsx` & `ConfirmModal.tsx`)

### Problem & Solution
Pehle "Log Out" click karte hi direct logout ho jata tha, jisse agar user kisi invoice form par kaam kar raha ho toh unsaved work lose hone ka risk tha.

### Naya Flow:
1. User top-right user profile icon par click karta hai.
2. Dropdown me **"Log Out"** button select karta hai.
3. System standard **ConfirmModal** popup show karta hai:
   - **Icon**: Red outlined `LogOut` icon.
   - **Title**: *"Log Out"*
   - **Description**: *"Are you sure you want to log out of Automate Business? Any unsaved edits will be discarded."*
   - **Buttons**:
     - `Cancel`: Modal dismiss ho jata hai aur user usi screen par rehta hai.
     - `Log Out` (Red Button): Session cleanly invalidate hota hai aur user safely `/login` page par redirect ho jata hai.

---

## 4. Real-World Business Use Cases

### Use Case 1: Naye Billing Counter Boy ko Onboard Karna
- **Scenario**: Store owner ne counter billing ke liye naya staff hire kiya.
- **Action**: Owner `Settings > Users` me jata hai, **Invite User** par click karta hai.
- **Entry**:
  - Name: `Suresh Kumar`
  - Email: `suresh.billing@apexglobal.in`
  - Password: `Password@123` (Eye icon se check kiya)
  - Role: `Billing Staff — (Counter Sales & Billing)`
- **Result**: Suresh sirf POS aur Sales Invoice dekh sakta hai. Purchase rates, vendor margins, aur Profit & Loss usse hidden rehte hain.

### Use Case 2: Employee Resignation / Access Revocation
- **Scenario**: Ek accountant ne job chhod di.
- **Action**: Business owner table me accountant ke aage **Active** button par click karke use **Inactive** kar deta hai.
- **Result**: Accountant ka account instantly block ho jata hai, par uske banaye hue past vouchers audit trial ke liye safe rehte hain.


# Automate Business (AB Inventory) — Complete Project Documentation

Namaste! Yeh **Automate Business (AB Inventory)** ka official aur comprehensive documentation hai. Yeh document **Hinglish** (Hindi + English) me banaya gaya hai taaki developers, business owners, accountants, aur warehouse managers poore project ke har ek module, har ek form field, aur business use cases ko asaani se samajh sakein.

---

## 📌 Project Overview (Project Kya Hai?)

**Automate Business (AB Inventory)** ek modern, cloud-ready, enterprise-grade **Inventory Management & GST Billing ERP Software** hai. Yeh Indian MSMEs, manufacturers, wholesalers, distributors, aur retail counter businesses ke liye design kiya gaya hai.

Is software ki madad se aap:
1. **Inventory & Warehouse** track kar sakte hain across multiple godowns.
2. **GST Compliance** handle kar sakte hain (E-Invoicing with IRN, E-Way Bills, GSTR-1, GSTR-3B).
3. **Sales & POS Billing** kar sakte hain (Quotations, Orders, Delivery Challans, Tax Invoices, Thermal Receipt POS).
4. **Purchase & Vendor Management** kar sakte hain (PO, Vendor Bills, Payment Out, Debit Notes).
5. **Manufacturing & Job Work** execute kar sakte hain (Bill of Materials - BOM, Raw Material Consumption, Worker Challans).
6. **Parties & CRM** manage kar sakte hain with **1-Click WhatsApp Payment Reminders** and automated UPI QR codes.
7. **Banking & Cash Flow** monitor kar sakte hain with real-time receivables and payables aging.

---

## 🛠️ Technology Stack (Tech Stack Kya Hai?)

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript (Strict typing for enterprise reliability)
- **Styling**: Tailwind CSS (Clean, modern Linear/Raycast inspired design system)
- **Icons**: Lucide React
- **State Management**: React Context (`AppContext.tsx`, `ThemeContext.tsx`)
- **Data Persistence**: LocalStorage sync with preloaded realistic mock business datasets (`mockData.ts`)

---

## 📂 Documentation Structure (Docs Folder Index)

Yeh documentation alag-alag focused guides me divided hai:

| Doc File | Subject & Scope |
|---|---|
| [**01_AUTHENTICATION_AND_USERS.md**](./01_AUTHENTICATION_AND_USERS.md) | Login Page, Password Visibility, Team Member Invites, Role Access Control |
| [**02_DASHBOARD_AND_METRICS.md**](./02_DASHBOARD_AND_METRICS.md) | Executive Home Dashboard, Receivables/Payables, Stock Valuation, Pipeline Status |
| [**03_ITEMS_AND_INVENTORY.md**](./03_ITEMS_AND_INVENTORY.md) | Products, Batches, Expiry, Units, Multi-Godown Transfers, Stock Adjustments & Audits |
| [**04_MANUFACTURING_AND_BOM.md**](./04_MANUFACTURING_AND_BOM.md) | Bill of Materials (BOM), Finished Goods Production, Raw Material Tracking, Job Work |
| [**05_SALES_MODULE.md**](./05_SALES_MODULE.md) | Quotations, Proforma, Sales Orders, Challans, Tax Invoices, POS Counter, Returns |
| [**06_PURCHASES_MODULE.md**](./06_PURCHASES_MODULE.md) | Purchase Orders (PO), Inward Challans, Purchase Bills, Debit Notes, Vendor Payments |
| [**07_PARTIES_AND_BANKING.md**](./07_PARTIES_AND_BANKING.md) | Customer/Supplier CRM, Ledgers, WhatsApp Reminders, Bank Accounts & UPI Collections |
| [**08_GST_EWAY_EINVOICE.md**](./08_GST_EWAY_EINVOICE.md) | GST Configuration, HSN/SAC Directory, E-Way Bill Part A/B, E-Invoice IRN & Signed QR |
| [**09_REPORTS_AND_ANALYTICS.md**](./09_REPORTS_AND_ANALYTICS.md) | Profit & Loss, GSTR-1, GSTR-3B, Stock Valuation, Party Aging Analysis, Day Book |
| [**10_SETTINGS_AND_CUSTOMIZATION.md**](./10_SETTINGS_AND_CUSTOMIZATION.md) | Company Profile, Print & Invoice Templates, Roles & Permissions, Custom Fields |

---

## 🚀 Quick Start Guide (Local Setup Kaise Karein)

1. **Repository install karein**:
   ```bash
   npm install
   ```

2. **Development server run karein**:
   ```bash
   npm run dev
   ```

3. **Browser me open karein**:
   - URL: `http://localhost:3000`
   - Default Login Email: `admin@apexglobal.in`
   - Default Password: Any string (Pre-filled demo credentials)

---

## 💡 Key Design Philosophies (Design Principles)

1. **Zero Clutter, Maximum Productivity**: Screen par faltu slop ya extra popups nahi hain. Saare actions keyboard-friendly command palette (`Ctrl + /`) aur contextual side drawers me khulte hain.
2. **Indian Business Workflows**: HSN codes, IGST/CGST/SGST splits, State Codes, Reverse Charge (RCM), Transport Vehicle Number, aur Thermal Receipt Printing native level par supported hain.
3. **Data Safety & Confirmations**: Critical actions jaise Log Out ya Delete karne par custom confirmation modal open hota hai taaki accidental data loss na ho.


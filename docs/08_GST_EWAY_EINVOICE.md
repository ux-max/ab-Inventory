# 08 — GST Compliance, E-Way Bills & E-Invoicing (Taxation aur Government Portals)

Is document me hum **GST Tax Settings**, **HSN/SAC Directory**, **E-Way Bills (Part A & B)**, **E-Invoicing (IRN & Signed QR Codes)**, aur **GSP Portal Sync** ke har ek field aur business use case ko detail me samjhenge.

---

## 1. GST & Tax Engine (`GstModule.tsx`)

Automate Business ka GST engine Indian Goods & Services Tax rules ke hisaab se completely compliant hai.

### 1.1 GST Settings Fields (Field-by-Field Breakdown)

| Field / Setting Name | Type | Description & Accounting Behavior |
|---|---|---|
| **Enable GST** | Checkbox | Application me tax calculations activate karta hai. |
| **Composition Scheme** | Checkbox | Agar business composition dealer hai (1% ya 5% turnover tax without input tax credit). |
| **Enable HSN/SAC Code** | Checkbox | Invoices aur item master me HSN/SAC codes compulsory karta hai (Tooltips explain mandates: 4 digits for turnover < ₹5 Cr, 6/8 digits for turnover > ₹5 Cr). |
| **Enable Place of Supply** | Checkbox | Interstate vs Intrastate tax split (CGST+SGST vs IGST) determine karta hai. |
| **Enable Input Tax Credit (ITC)** | Checkbox | Purchase bills me eligible aur ineligible ITC tracking on karta hai. |
| **Enable Reverse Charge (RCM)** | Checkbox | Section 9(3) aur 9(4) ke under RCM invoices allow karta hai jahan buyer tax liability pay karta hai. |
| **Enable TCS / TDS** | Checkbox | Tax Collected at Source (Section 52 / 206C) aur Tax Deducted at Source settings. |
| **Tax Rates & Tax Groups** | Matrix Grid | Standard tax groups: `GST@0%`, `GST@0.25%`, `GST@3%`, `GST@5%`, `GST@12%`, `GST@18%`, `GST@28%`. |

> [!NOTE]
> **PortalTooltip Architecture**: GST module me lambe legal descriptions ko display karne ke liye React `createPortal` use kiya gaya hai taaki sidebar ya table ke `overflow-y-auto` boundary me tooltips kabhi cut ya clip na hon.

---

## 2. E-Way Bill Generation (`EWayBillsModule.tsx`)

Agar kisi consignment ka invoice value ₹50,000 se zyada ho (ya specific states me intrastate limit exceed ho), toh transport se pehle **E-Way Bill** generate karna legal requirement hai.

### 2.1 E-Way Bill Form Fields (Field-by-Field Breakdown)

#### Part A (Consignment Information):
- **E-Way Bill Number (EWB No)**: 12-digit government issued unique number (e.g. `2410 9821 7734`).
- **Document Type & No**: `Tax Invoice`, `Delivery Challan`, `Bill of Entry`, `Credit Note`.
- **Supply Type**: `Outward (Sales)` ya `Inward (Purchase / Return)`.
- **Sub-Type**: `Supply`, `Export`, `Job Work`, `Recipient Not Known`, `For Own Use`, `Exhibition`.
- **From (Consignor)**: Supplier GSTIN, Dispatch address, Pin code.
- **To (Consignee)**: Buyer GSTIN, Delivery address, Destination Pin code.
- **Distance (in KM)**: Source aur destination pincodes ke beech ki road distance (Government portal validity isi distance ke basis par calculate karta hai, e.g. 1 day per 200 KM).

#### Part B (Vehicle & Transporter Information):
- **Transportation Mode**: `Road`, `Rail`, `Air`, `Ship`.
- **Transporter ID**: Transporter ka GSTIN ya TRANSIN (e.g. `27AABCT1234F1Z9`).
- **Transporter Name**: E.g. `VRL Logistics Ltd.`, `TCI Freight`.
- **Vehicle Number**: Truck/Lorry registration number (e.g. `MH-04-AZ-9921`). Vehicle breakdown hone par Part B update kiya ja sakta hai.
- **LR / RR / Airway Bill No & Date**: Lorry receipt number.

---

## 3. E-Invoicing System (`EInvoicesModule.tsx`)

B2B transactions ke liye Government mandate ke mutabiq **Invoice Registration Portal (IRP)** se real-time clearance lena zaroori hai.

### 3.1 E-Invoice Lifecycle & Fields:

1. **IRN (Invoice Reference Number)**:
   - 64-character unique cryptographic hash jo IRP portal generate karta hai:
     ```
     e7b1a293c8d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
     ```
2. **Ack No & Ack Date**: Government confirmation acknowledgement timestamp.
3. **Signed QR Code**:
   - IRP portal se return hua encrypted digital signature QR code jo invoice PDF ke top-right corner par print hota hai.
   - GST tax officer ya highway transport inspector is QR code ko scan karke bill ki authenticity verify kar sakte hain.
4. **1-Click Generation**: Automate Business me invoice open karke direct **"Generate E-Invoice"** click karne par GSP API ke through 2 seconds me IRN aur QR code fetch ho jata hai.

---

## 4. GSP & Direct NIC Connection Drawer (`GspConnectDrawer.tsx`)

- Supported GST Suvidha Providers: `Direct NIC API`, `ClearTax`, `Masters India`, `Iris GST`, `Sandbox Test Environment`.
- **API Username & Password**: Taxpayer ka IRP portal credentials.
- **Environment Switcher**: Testing ke liye `Sandbox` aur live production billing ke liye `Production`.

---

## 5. Real-World Business Use Cases

### Use Case: Highway Inspection Protection
- **Scenario**: Maharashtra se Gujarat ₹4,50,000 ka pharma stock truck me dispatch hua.
- **Action**: Dispatch manager invoice banate hi 1-click me **E-Invoice (IRN)** aur **E-Way Bill (Part A + B)** generate karta hai.
- **Result**: Highway checkpost par inspector sirf QR code scan karta hai. Goods bina kisi delay ya penalty ke instantly clear ho jate hain.


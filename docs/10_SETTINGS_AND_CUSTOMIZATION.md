# 10 — Settings, Print Customization & Permissions (System Configuration)

Is document me hum **Company Profile**, **Print & Invoice Templates**, **Thermal POS Setup**, **Roles & Granular Permissions**, **Terms & Conditions**, aur **Document Custom Fields** ke har ek configuration field aur business use case ko detail me samjhenge.

---

## 1. Company Profile & General Settings (`GeneralSettings.tsx`)

Aapke business ki legal identity yahan define hoti hai jo har print document aur GST submission par print hoti hai.

### 1.1 Company Information Fields:
- **Legal Business Name**: Official registered entity name (e.g. `Apex Global Solutions Pvt. Ltd.`).
- **Trade Name**: Market trading brand name (e.g. `Automate Business`).
- **Company Logo**: Uploaded PNG/JPG logo (Invoices, quotations, aur dashboard header par display hota hai).
- **GSTIN**: 15-digit GST registration number.
- **PAN**: Company Permanent Account Number.
- **CIN (Corporate Identity No)**: Private Limited companies ke liye.
- **Registered Address**: Street, City, District, State, Pincode.
- **Financial Year & Books Beginning Date**: E.g. `01-04-2026 to 31-03-2027`.
- **Base Currency**: Indian Rupee (`₹ - INR`).

---

## 2. Print & Invoice Template Customization (`PrintSettingsView.tsx`)

Invoices business ka physical brand ambassador hote hain. Automate Business me customizable layout engine diya gaya hai:

### 2.1 Supported Print Formats:
1. **Standard A4 Full Page**: Detailed B2B tax invoice with complete line-item specifications, HSN table, bank details, and terms.
2. **Standard A5 Half Page**: Compact wholesale billing (paper saving).
3. **Thermal Receipt (80mm & 58mm POS)**: Supermarket and counter billing with barcode, UPI QR, and cashier footer.

### 2.2 Template Toggle Options:
- **Show Company Logo & Watermark**: Toggle on/off.
- **Show Dynamic UPI QR Code**: Bill total ka scan-to-pay QR code embed karta hai.
- **Show Authorized Signatory Stamp & Signature Box**.
- **Show Bank Account Details in Footer**.
- **Show Previous Balance / Current Balance on Invoice**.
- **Color Themes**: Classic Blue, Professional Slate, Emerald Green, Indigo.

---

## 3. Roles & Granular Permissions (`RolesPermissionsSettings.tsx`)

Enterprise security ke liye har staff member ki permissions isolate ki ja sakti hain:

### 3.1 Predefined Roles:
1. **Business Owner / Admin**: Unlimited full access across all modules, settings, financial statements, and user management.
2. **Sales Manager / Executive**: Quotations, Orders, Invoices, Customer Directory. Purchase cost aur vendor profit margins hidden rehte hain.
3. **Purchase Manager**: Vendor management, Purchase Orders, Goods Inward, Debit Notes.
4. **Warehouse / Store Keeper**: Stock checking, Godown-to-Godown transfers, Physical count adjustments, Delivery Challans. Customer billing financial details hidden rehti hain.
5. **Accountant**: Tax invoices, Vendor bills, Payment vouchers, Bank ledgers, GSTR returns, Profit & Loss.

### 3.2 Granular Action Flags (Per Module):
- `View`: Kya user is module ko dekh sakta hai?
- `Create`: Kya naya document bana sakta hai?
- `Edit`: Kya existing bill ko alter kar sakta hai?
- `Delete`: Kya records delete karne ki permission hai?
- `Export`: Excel/PDF export allow karna hai ya nahi.

---

## 4. Document Prefix & Numbering Series (`DocumentPrefixSuffixDrawer.tsx`)

Har commercial financial year me bill numbering compliant serial sequence me honi chahiye.

### 4.1 Numbering Fields:
- **Sales Invoice Prefix**: E.g. `INV-26-` (Generates `INV-26-0001`, `INV-26-0002`).
- **Quotation Prefix**: E.g. `QT-26-`.
- **Purchase Order Prefix**: E.g. `PO-26-`.
- **Delivery Challan Prefix**: E.g. `DC-26-`.
- **Auto-Increment Width**: Zero padding digits (e.g. `4 digits` = `0001`).

---

## 5. Terms & Conditions Master (`TermsConditionsSettings.tsx`)

Invoices aur quotations ke footer par print hone wali legal terms:
- **Standard Sales Terms**:
  1. *"Goods once sold will not be taken back or exchanged."*
  2. *"Payment due within 15 days of invoice date."*
  3. *"Interest @ 18% p.a. will be charged on overdue payments."*
  4. *"Subject to Mumbai jurisdiction only."*

---

## 6. Real-World Business Use Cases

### Use Case: Confidential Profit Margins Protection
- **Scenario**: Store owner chahta hai ki counter billing boy customer ko bill print karke de sake, lekin counter boy ko ye pata na chale ki product ka purchase cost kitna tha ya owner kitna margin kama raha hai.
- **Action**: Owner `Settings > Roles & Permissions` me jata hai, `Billing Staff` role edit karta hai, aur **"Can View Cost & Profit"** permission toggle `OFF` kar deta hai.
- **Result**: Counter boy ke screen par purchase price column disappear ho jata hai aur top bar me `Costs & profits hidden` badge show hota hai. Business margins 100% confidential rehte hain.


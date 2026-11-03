# 03 — Items Catalog, Multi-Godown & Inventory Management (Products aur Warehouse)

Is document me hum **Item Master (Product Catalog)**, **Batch & Expiry Management**, **Multi-Godown Stock**, **Stock Transfers**, **Physical Stock Adjustments**, aur **Stock Audits** ke har ek field aur business use case ko detail me samjhenge.

---

## 1. Item Master — Products & Services (`ItemsModule.tsx` & `ItemDetailView.tsx`)

Item Master application ka core foundation hai. Yahan har ek goods ya service ki complete technical aur financial identity configure hoti hai.

### 1.1 Item Form Fields (Field-by-Field Breakdown)

| Field Name | Type | Mandatory? | Field Significance & Accounting Behavior |
|---|---|---|---|
| **Item Type** | Radio / Tab | Yes | `Product (Goods)` ya `Service`. Services me physical inventory quantity track nahi hoti (e.g. Consulting, Freight Charges). |
| **Item Name** | Text | **Yes** | Product ka poora commercial naam (e.g. `Paracetamol 650mg Blister Pack`, `Thermal Receipt Printer 80mm USB+LAN`). Invoices par yahi print hoga. |
| **Item Code / SKU** | Text (Alphanumeric) | **Yes** | Unique Stock Keeping Unit (e.g. `MED-PCM-650`, `ELC-POS-TH80`). Barcode scanning aur fast omni-search isi code se hoti hai. |
| **Category / Group** | Dropdown / Text | No | Item group (e.g. `Pharmaceuticals`, `Electronics`, `Raw Materials`). Group-wise sales aur stock reporting ke liye use hota hai. |
| **HSN / SAC Code** | Number (4 to 8 digits) | **Yes (GST)** | Harmonized System of Nomenclature code (e.g. `300490`, `844332`). GST portal par mandatory classification. |
| **Unit of Measurement (UOM)** | Dropdown | **Yes** | Primary unit (e.g., `BOX`, `PCS`, `KGS`, `LTR`, `MTR`, `NOS`). |
| **Alternate / Secondary Unit** | Dropdown & Ratio | Optional | E.g. `1 BOX = 10 STRIP`. Multi-unit billing support karta hai. |
| **GST Tax Rate (%)** | Dropdown | **Yes** | Item par lagne wala GST slab: `0%`, `0.25%`, `3%`, `5%`, `12%`, `18%`, ya `28%`. Invoices par automatic CGST+SGST ya IGST calculate karta hai. |
| **Sale Price (Selling Rate)** | Currency (₹) | **Yes** | Standard B2B/B2C selling rate before or after tax. |
| **Purchase Price (Cost Rate)** | Currency (₹) | **Yes** | Vendor se khareedne ka rate. Stock valuation aur Gross Profit margin calculation me use hota hai. |
| **MRP (Max Retail Price)** | Currency (₹) | Optional | Retail pack par printed price. Counter POS me discount calculate karne ke kaam aata hai. |
| **Min Stock / Reorder Point** | Number | Yes | Agar stock is number se kam hota hai, toh dashboard par **Low Stock Alert (Red Badge)** trigger ho jata hai. |
| **Max Stock Limit** | Number | Optional | Godown me over-stocking aur capital blockage rokne ke liye upper threshold. |
| **Enable Batch Tracking** | Checkbox / Toggle | Optional | Pharmaceuticals, food, aur chemical products ke liye batch no, manufacturing date, aur expiry date tracking enable karta hai. |

---

## 2. Batch & Expiry Tracking (`SelectBatchModal.tsx`, `AddBatchModal.tsx`)

Jab batch tracking on hoti hai, toh ek hi SKU ke multiple batches alag-alag godowns me exist kar sakte hain.

### 2.1 Batch Fields (Field-by-Field)

- **Batch Number**: Alphanumeric unique code (e.g. `BATCH-2026-X01`).
- **Manufacturing Date (MFD)**: Jis date ko product bana.
- **Expiry Date (EXP)**: Expiration cutoff date. Invoices banate waqt software expired batches ko select karne se alert ya block karta hai (**FEFO - First Expired, First Out**).
- **Available Quantity**: Is specific batch me kitni units available hain.
- **Batch MRP & Sale Rate**: Agar naye batch me price badal gaya hai, toh software batch-level pricing allow karta hai.

---

## 3. Multi-Godown / Multi-Warehouse Architecture (`InventoryModule.tsx`)

Automate Business ek saath multiple warehouses manage kar sakta hai (e.g. `Main Warehouse Bhiwandi`, `Central Godown Mumbai`, `Shop Floor Store`, `Transit Godown`).

### 3.1 Godown Management Fields
- **Godown Name**: Warehouse ka naam.
- **Location / Address**: Full postal address.
- **Manager / In-Charge**: Warehouse manager ka contact info.
- **Active Godown Switcher**: Top navbar me Godown dropdown se user kisi bhi specific warehouse ka stock isolated view me dekh sakta hai.

---

## 4. Stock Transfers (Godown-to-Godown Shifting)

Jab ek branch ya warehouse se doosre warehouse me maal transfer karna ho.

### 4.1 Stock Transfer Order Fields
- **Transfer Order No**: Unique document number (e.g. `TO-2026-004`).
- **Source Godown (From)**: Jahan se stock minus hoga.
- **Destination Godown (To)**: Jahan stock add hoga.
- **Item & Batch Selection**: Koun sa item aur kaun sa batch shift ho raha hai.
- **Quantity to Transfer**: Kitni units transfer karni hain.
- **Vehicle / Transporter Details**: Truck number aur driver contact.
- **Status Pipeline**: `Draft` → `In-Transit` → `Completed (Received)`.

---

## 5. Stock Adjustments (Damage, Loss & Surplus Correction)

Physical stock count aur software stock count me discrepancy hone par Adjustment voucher pass kiya jata hai.

### 5.1 Adjustment Fields
- **Adjustment Date**: Voucher pass karne ki date.
- **Target Godown**: Kis godown me correction karna hai.
- **Adjustment Type**:
  - `Increase Stock (Surplus)`: Software me stock badhane ke liye.
  - `Decrease Stock (Damage / Theft / Expiry)`: Damaged ya expired maal ko write-off karne ke liye.
- **Reason Code**: E.g. `Damaged in Transit`, `Inventory Count Correction`, `Expired Goods Write-off`.
- **Accounting Impact**: Loss/Surplus account me expense record hota hai aur stock valuation sync ho jati hai.

---

## 6. Real-World Business Use Cases

### Use Case 1: Expiry-Based Pharma Distribution
- **Scenario**: Medical distributor ke paas Paracetamol ke 2 batches hain: Batch A (Expires in 2 months), Batch B (Expires in 1 year).
- **Action**: B2B Sales Invoice me software automatically Batch A (FEFO) suggest karta hai taaki purana stock pehle clear ho jaye aur loss na ho.

### Use Case 2: Warehouse Restocking Trigger
- **Scenario**: Thermal printer paper roll ka min reorder level `50 rolls` set hai. Godown me `35 rolls` bache.
- **Action**: Dashboard par instant **Low Stock Alert** pop hota hai. Store keeper 1-click me purchase requisition generate karke supplier ko send kar deta hai.


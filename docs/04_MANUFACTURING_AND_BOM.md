# 04 — Manufacturing, Bill of Materials (BOM) & Job Work (Production aur Assembly)

Is document me hum **Bill of Materials (BOM)**, **Manufacturing / Production Orders**, **Raw Material Consumption**, aur **External Job Work Challans** ke har ek field aur business use case ko detail me samjhenge.

---

## 1. Manufacturing Architecture (`ManufacturingModule.tsx`)

Trading businesses maal khareedte hain aur bechte hain, lekin **Manufacturers & Assemblers** raw materials khareedte hain, unko process karte hain, aur finished product banate hain. Automate Business me complete multi-stage production workflow built-in hai.

---

## 2. Bill of Materials — BOM Master (Recipe of Finished Goods)

BOM basically ek "Formula ya Recipe" hai jo batata hai ki 1 unit Finished Good banane me kaun-kaun se raw materials aur kitni quantity lagti hai.

### 2.1 BOM Form Fields (Field-by-Field Breakdown)

| Field Name | Type | Mandatory? | Field Description & Behavior |
|---|---|---|---|
| **BOM Name** | Text | **Yes** | Formula ka title (e.g. `BOM - Standard Electric Water Dispenser`, `BOM - 1000 Tablets Paracetamol Batch`). |
| **Finished Good (Output Item)** | Dropdown / Search | **Yes** | Wo item jo production complete hone ke baad warehouse me add hoga (Catalog me item type `Finished Goods` hona chahiye). |
| **Output Quantity** | Number | **Yes** | Standard batch size (e.g. `100 Units` ya `1000 Tablets`). |
| **Raw Materials (Input Items Table)** | Dynamic Rows | **Yes** | Har ek required component ki row: |
| ↳ *Raw Item SKU / Name* | Dropdown | Yes | Raw material (e.g. Copper Wire, Plastic Casing, API Chemical). |
| ↳ *Required Quantity* | Number | Yes | 1 standard batch ke liye kitni quantity lagegi. |
| ↳ *Unit (UOM)* | Text | Auto | Raw material ki unit (e.g. Meters, Kgs, Pcs). |
| ↳ *Standard Cost per Unit* | Currency (₹) | Auto | Raw material ka current purchase rate. |
| ↳ *Total Line Cost* | Currency (₹) | Calculated | $\text{Required Qty} \times \text{Cost per Unit}$. |
| **Additional Costs (Overheads)** | Table / Fields | Optional | Production me lagne wale non-material kharche: |
| ↳ *Direct Labor Charges* | Currency (₹) | Optional | Workers ki labor cost. |
| ↳ *Electricity / Machine Fuel* | Currency (₹) | Optional | Power charges. |
| ↳ *Packaging Charges* | Currency (₹) | Optional | Outer carton aur packing cost. |
| **Scrap / Wastage Allowance (%)** | Percentage | Optional | Expected production loss (e.g., `2%` cutting loss). |
| **Total Production Cost per Unit** | Currency (₹) | Calculated | $(\text{Total Material Cost} + \text{Overheads}) / \text{Output Qty}$. |

---

## 3. Production Work Orders (Manufacturing Execution)

Jab actual factory me production run start hota hai, toh **Production Order** generate hota hai.

### 3.1 Work Order Execution Lifecycle:

1. **Step 1: Order Creation**:
   - Supervisor BOM select karta hai aur target quantity daalta hai (e.g. `500 Water Dispensers`).
2. **Step 2: Raw Material Availability Check**:
   - System godown me available raw materials check karta hai. Agar koi component short hai (e.g. Plastic Casing missing), toh warning aati hai.
3. **Step 3: Issue to Shop Floor**:
   - Raw materials Main Godown se cut hokar Shop Floor Godown me move hote hain.
4. **Step 4: Completion & Stock Inward**:
   - Production complete hone par finished goods target warehouse me automatically add ho jate hain aur unka cost of production calculate ho jata hai.

---

## 4. External Job Work Challans (`JobWorkDetailView.tsx`)

Bahut saari industries me certain processes (e.g., Powder Coating, Chrome Plating, Chemical Blending, Stitching, Heat Treatment) factory ke bahar third-party **Job Workers** se karwaye jaate hain.

### 4.1 Job Work Outward Challan Fields:
- **Challan Number**: Unique outward document (e.g. `JWO-2026-012`).
- **Job Worker (Party Name)**: Vendor ka naam jiske paas maal process hone ja raha hai.
- **Process Description**: E.g. `Zinc Galvanizing`, `CNC Laser Cutting`.
- **Items Dispatched**: Raw sheets, casting parts, ya semi-finished goods ki list with quantity.
- **Expected Return Date**: Maal wapas aane ki expected date (GST rules ke under 1-3 years ki deadline hoti hai).

### 4.2 Job Work Inward (Return Receipt) & Processing Charges:
- **Processed Quantity Received**: Kitna maal finished hokar wapas aaya.
- **Scrap Quantity Returned**: Bacha hua scrap ya wastage.
- **Job Work Billing (Service Charge)**: Job worker ka processing invoice (e.g. `₹15 per kg` coating charge).
- **Stock Movement**: Processed parts factory warehouse me inward ho jate hain aur job work liability book ho jati hai.

---

## 5. Real-World Business Use Cases

### Use Case: LED Light Assembly Plant
- **Scenario**: 1000 units LED Bulb assemble karne hain.
- **BOM Formula**:
  - 1000 LED Chips
  - 1000 Aluminum Housings
  - 1000 Diffuser Covers
  - 1000 Driver Circuits
  - Labor cost: ₹5 per bulb.
- **Action**: Supervisor "Execute Production Order" par click karta hai.
- **Result**: Ek click me 4000 raw material pieces inventory se deduct ho gaye, 1000 finished LED Bulbs finished stock godown me add ho gaye, aur cost sheet automatically generate ho gayi.


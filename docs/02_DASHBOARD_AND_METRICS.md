# 02 — Executive Dashboard & Real-Time Metrics (Dashboard aur Business Intelligence)

Is document me hum **Home Dashboard** aur **Role-Based Metrics** ke har ek KPI card, metrics block, aur real-time data calculations ko field-by-field samjhenge.

---

## 1. Executive Dashboard Architecture (`HomeDashboard.tsx`)

Dashboard business owner aur managers ke liye "Cockpit" ka kaam karta hai. Screen open karte hi business ki financial health, pending payments, aur warehouse stock status 1 second me samajh aa jata hai.

---

## 2. Top KPI Metric Cards (Field-by-Field Breakdown)

### 2.1 Total Receivables (Lene Wala Paisa)
- **Displayed Value**: E.g. `₹12,668`
- **Subtext**: `2 Invoices pending collection`
- **Calculation Logic**: Saare unpaid aur partially paid Sales Invoices ka remaining balance sum hota hai (`invoice.totalAmount - invoice.amountPaid`).
- **View Link**: Is par click karne par direct Sales Invoices filter hokar "Unpaid" list open hoti hai.
- **Business Use Case**: Cash flow predict karne ke liye. Agar receivables bahut high hain toh accounts team ko follow-up karne ke instructions diye ja sakte hain.

### 2.2 Total Payables (Dene Wala Paisa)
- **Displayed Value**: E.g. `₹24,250`
- **Subtext**: `1 purchase bill to pay`
- **Calculation Logic**: Saare pending Purchase Bills ka outstanding amount sum hota hai (`bill.totalAmount - bill.amountPaid`).
- **View Link**: Direct Unpaid Purchase Bills view open karta hai.
- **Business Use Case**: Upcoming vendor liabilities aur supplier payment deadlines plan karne ke liye.

### 2.3 Cash & Bank Balance (Hath Me Paisa / Bank Balance)
- **Displayed Value**: E.g. `₹31,77,600`
- **Subtext**: `Across 3 active accounts`
- **Calculation Logic**: Saare active Current Accounts, Savings Accounts, aur Cash-in-Hand ledgers ka net balance sum hota hai.
- **View Link**: Direct **Bank Accounts Module** open karta hai jahan account-wise balance aur statement check ho sakta hai.
- **Business Use Case**: Working capital check karne ke liye taaki raw material purchase ya salaries release karne se pehle liquidity confirm ho sake.

### 2.4 Total Stock Valuation (Godown Me Rakhe Maal Ki Keemat)
- **Displayed Value**: E.g. `₹3,32,900`
- **Subtext**: `2,263 units in inventory`
- **Calculation Logic**: Har ek item ki available quantity ko uske purchase cost / moving average rate se multiply karke sum kiya jata hai:
  $$\text{Stock Valuation} = \sum (\text{Current Stock} \times \text{Purchase Cost})$$
- **View Link**: Direct Inventory module open karta hai.
- **Business Use Case**: Balance sheet aur asset valuation ke liye, aur dead stock monitor karne ke liye.

---

## 3. Sales Activity Pipeline (Sales Funnel Blocks)

Yeh block sales order processing pipeline ka live status batata hai:

| Stage Name | Count / Value | Description & Stage Significance |
|---|---|---|
| **1. Quotes (Estimates)** | E.g. `2 Estimates` | Prospective customers ko bheje gaye quotations. Abhi confirm nahi hue hain. |
| **2. Confirmed (Orders)** | E.g. `2 Confirmed` | Customer se purchase order ya approval mil chuka hai. Delivery aur packing pending hai. |
| **3. Challans (Dispatches)** | E.g. `3 Dispatches` | Maal warehouse se truck me load hokar nikal chuka hai (Delivery Challan ban gaya hai). |
| **4. Invoices (Unpaid)** | E.g. `2 Invoices` | Maal deliver ho chuka hai aur GST Tax Invoice generate ho chuki hai, payment collection baaki hai. |

---

## 4. Inventory Summary Block (Stock Health)

- **Quantity in Hand**: Total units currently available across all godowns (e.g., `2,263 Across 5 Godowns`).
- **Quantity to be Received**: Confirmed purchase orders ka wo maal jo vendors se transit me hai aur godown me aana baaki hai (e.g., `300`).
- **Low Stock SKUs**: Wo items jinka current stock predefined **Reorder Level** se niche chala gaya hai (e.g., `2 Low Stock SKUs` highlighted in red). Is par click karte hi direct purchase requisition initiate ho sakti hai.

---

## 5. Item Details & Active Health Gauge

- **Low Stock Items**: E.g. `2` (Red warning indicator).
- **All Items**: Total registered SKUs in system (e.g. `8`).
- **All Item Groups**: Categories like Pharmaceuticals, Electronics, Raw Materials (e.g. `5`).
- **Circular Health Gauge**: `100% Active Items` gauge visually confirm karta hai ki catalog me kitne items active trading ke liye enabled hain.

---

## 6. Top Selling Items Block (Fast-Moving SKUs)

- **Time Filter**: `This Month` / `This Quarter` / `This Year` dropdown.
- **Item Cards**:
  - Item 1: `Paracetamol 650mg Blister Pack` — `40 box` sold.
  - Item 2: `Hand Sanitizer Gel 500ml Dispenser` — `30 btl` sold.
- **Business Use Case**: Business owner ko pata chalta hai ki kaun sa product market me sabse zyada demand me hai taaki unka stock kabhi stock-out na ho.

---

## 7. Purchase Order Summary Block

- **Quantity Ordered**: Total items currently ordered from vendors (e.g. `500`).
- **Total Cost**: Total purchase commitment value (e.g. `₹72,570`).
- **View Link**: `View 1 open purchase orders >` direct PO management module open karta hai.

---

## 8. Sales Order Pipeline Matrix (Channel-by-Channel Grid)

Yeh table sales pipeline ko alag-alag business channels ke hisaab se break down karti hai:

| Sales Channel | Draft | Confirmed | Packed | Shipped | Invoiced |
|---|---|---|---|---|---|
| **Direct Sales Invoices** | Count | Count | Count | Count | Count |
| **Customer Sales Orders** | Count | Count | Count | Count | Count |
| **Goods Delivery Challans** | Count | Count | Count | Count | Count |
| **Quotations & Estimates** | Count | Count | Count | Count | Count |

**Business Significance**: Agar kisi channel me "Packed" me 10 orders fase hue hain par "Shipped" 0 hai, toh logistics ya dispatch team ki bottleneck turant pakad me aa jati hai.

---

## 9. Header Quick Action Buttons (`Navbar.tsx` & `HomeDashboard.tsx`)

Top right me 4 one-click primary shortcuts hain:
1. **`+ New Invoice`**: Direct sales invoice form open karta hai.
2. **`+ New Purchase Bill`**: Vendor invoice data entry screen kholta hai.
3. **`+ Add Item`**: Naya SKU ya product catalog me add karta hai.
4. **`⇄ Transfer Stock`**: Warehouse-to-warehouse stock shifting drawer open karta hai.


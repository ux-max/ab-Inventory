# 07 — Parties (CRM), Ledgers & Banking (Customers, Vendors aur Bank Accounts)

Is document me hum **Parties Master (Customers & Suppliers)**, **Party Ledgers & Statement of Accounts**, **Credit Limits**, aur **Bank & Cash Accounts Management** ke har ek field aur business use case ko detail me samjhenge.

---

## 1. Parties Master — CRM Directory (`PartiesModule.tsx` & `PartyDetailView.tsx`)

Automate Business me Customer aur Supplier dono ko "Party" ke roop me manage kiya jata hai. Ek party buyer aur vendor dono ho sakti hai.

### 1.1 Party Form Fields (Field-by-Field Breakdown)

| Field Name | Type | Mandatory? | Field Details & Business Purpose |
|---|---|---|---|
| **Party Type** | Radio | **Yes** | `Customer`, `Supplier (Vendor)`, ya `Both`. |
| **Party Name (Business / Trade Name)** | Text | **Yes** | Client ka official business naam (e.g. `MedLife Healthcare Distributors`, `Gujarat Surgical & Diagnostics`). |
| **Contact Person** | Text | Optional | Manager ya proprietor ka naam (e.g. `Dr. Alok Verma`). |
| **Mobile Number** | Phone (10-digit) | **Yes** | WhatsApp billing notifications aur payment reminder dispatch ke liye primary phone number. |
| **Email Address** | Email | Optional | Invoices aur ledgers email karne ke liye. |
| **GSTIN (GST Identification Number)** | Text (15 chars) | Conditional | E.g. `27AAACM9988G1Z2`. Enter karte hi State code (e.g., 27 = Maharashtra) aur PAN automatically decode ho jata hai. |
| **GST Registration Type** | Dropdown | **Yes** | `Regular (Registered)`, `Composition Scheme`, `Unregistered Consumer`, `SEZ Unit`, `Overseas / Export`. |
| **PAN Number** | Text (10 chars) | Optional | Income Tax PAN number (TDS/TCS compliance ke liye). |
| **Billing Address** | Multiline Text | **Yes** | Invoices par print hone wala legal address (Street, City, State, Pincode). |
| **Shipping Address (Delivery Godown)** | Multiline Text | Optional | Agar customer ka delivery warehouse billing address se alag ho. |
| **Credit Period (Payment Terms)** | Dropdown | Optional | E.g., `Immediate / COD`, `Net 15 Days`, `Net 30 Days`, `Net 45 Days`. |
| **Credit Limit (₹)** | Currency | Optional | E.g., `₹2,00,000`. Agar customer ka outstanding balance is limit ko cross karta hai, toh naya sales invoice banate waqt system manager approval request karta hai. |
| **Opening Balance (₹)** | Currency & Type | Optional | Software switch karte waqt customer/vendor ka purana balance: `Dr (Receivable)` ya `Cr (Payable)`. |

---

## 2. Party Detail View & Statement of Accounts (`PartyDetailView.tsx`)

Party profile open karne par complete financial transaction history milti hai:

1. **Header KPI Cards**:
   - **Current Balance**: Live outstanding dues (e.g., `₹54,722 Receivable`).
   - **Total Invoiced**: Lifetime business done with this party.
   - **Total Payments Collected**: Received collections.
   - **Average Payment Days**: Customer average kitne dinon me bill settle karta hai.
2. **Transaction History Ledger**:
   - Chronological list of all Quotations, Orders, Challans, Invoices, Receipts, and Credit Notes.
   - **Filter by Date Range**: E.g., Current Month, Last Quarter, Financial Year.
   - **PDF Statement of Account**: 1-click me branded ledger statement print ya customer ko email/WhatsApp kiya ja sakta hai.

---

## 3. Bank Accounts & Cash Management (`BankAccountsModule.tsx` & `BankAccountDetailView.tsx`)

Business ka daily cash flow aur multiple bank accounts ek consolidated ledger me sync hote hain.

### 3.1 Bank Account Fields (Field-by-Field Breakdown)

| Field Name | Type | Mandatory? | Field Details & Financial Role |
|---|---|---|---|
| **Account Display Name** | Text | **Yes** | E.g. `HDFC Bank - Current A/c`, `ICICI Bank - Cash Credit`, `Main Office Petty Cash`. |
| **Account Type** | Dropdown | **Yes** | `Current Account`, `Savings Account`, `Overdraft / CC Limit`, `Cash in Hand (Petty Cash)`. |
| **Bank Name** | Text | Yes | E.g. `HDFC Bank Ltd.`, `State Bank of India`. |
| **Account Number** | Number | **Yes** | Full bank account number (Invoices par print hone ke liye). |
| **IFSC Code** | Text (11 chars) | **Yes** | E.g. `HDFC0000128`. NEFT/RTGS payments ke liye mandatory. |
| **Branch Name** | Text | Optional | E.g. `Nariman Point Branch, Mumbai`. |
| **UPI ID / VPA** | Text | Optional | E.g. `apexglobal@okhdfcbank`. Invoices par printed Dynamic UPI QR code isi VPA se link hota hai. |
| **Set as Default Billing Account** | Toggle | Optional | Toggle on hone par naye sales invoices par is bank ki details aur QR code automatically print hota hai. |

---

## 4. Bank Account Detail View & Transaction Feeds

Har bank account ka apna detailed ledger hota hai:
- **Total Inflows (Credits)**: Customer collections, transfers in.
- **Total Outflows (Debits)**: Vendor payouts, expenses, salary disbursements.
- **Reconciliation Status**: Uncleared cheques aur pending bank clearances track karne ke liye.

---

## 5. Real-World Business Use Cases

### Use Case: Overdue Customer Credit Block
- **Scenario**: Ek customer ki credit limit ₹1,00,000 thi aur uska outstanding balance ₹1,12,000 ho chuka hai (payment 20 din overdue hai).
- **Action**: Sales executive jab naya invoice banane ki koshish karta hai, system pop-up dikhata hai: *"Credit Limit Exceeded by ₹12,000. Invoice requires Owner Authorization."*
- **Resolution**: Executive invoice screen se direct **Send via WhatsApp** reminder trigger karta hai. Customer UPI se ₹50,000 clear karta hai aur billing resume ho jati hai.


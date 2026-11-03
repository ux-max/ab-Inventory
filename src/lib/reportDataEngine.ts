import { 
  SalesDocument, 
  PurchaseDocument, 
  PaymentRecord, 
  Item, 
  Party, 
  StockMovement, 
  Godown, 
  CreditNote, 
  DebitNote,
  SalesReturn,
  PurchaseReturn,
  GstSettings
} from "@/types/inventory"
import { isInterStateTransaction, getStateNameFromCode } from "@/lib/gstConstants"

export type ReportDatePreset = 
  | "today" 
  | "yesterday" 
  | "this_week" 
  | "this_month" 
  | "this_quarter" 
  | "this_fy" 
  | "all_time" 
  | "custom"

export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

// Preset range calculator
export function getDatePresetRange(preset: ReportDatePreset): DateRange {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const day = now.getDate()

  const formatDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dt = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${dt}`
  }

  switch (preset) {
    case "today": {
      const todayStr = formatDate(now)
      return { startDate: todayStr, endDate: todayStr }
    }
    case "yesterday": {
      const yDate = new Date(year, month, day - 1)
      const yStr = formatDate(yDate)
      return { startDate: yStr, endDate: yStr }
    }
    case "this_week": {
      const dayOfWeek = now.getDay() // 0 is Sunday
      const start = new Date(year, month, day - dayOfWeek)
      const end = new Date(year, month, day + (6 - dayOfWeek))
      return { startDate: formatDate(start), endDate: formatDate(end) }
    }
    case "this_month": {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      return { startDate: formatDate(start), endDate: formatDate(end) }
    }
    case "this_quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3
      const start = new Date(year, quarterStartMonth, 1)
      const end = new Date(year, quarterStartMonth + 3, 0)
      return { startDate: formatDate(start), endDate: formatDate(end) }
    }
    case "this_fy": {
      // Indian Financial Year: April 1 to March 31
      const fyStartYear = month >= 3 ? year : year - 1
      const start = new Date(fyStartYear, 3, 1)
      const end = new Date(fyStartYear + 1, 2, 31)
      return { startDate: formatDate(start), endDate: formatDate(end) }
    }
    case "all_time":
    case "custom":
    default:
      return { startDate: "2020-01-01", endDate: "2030-12-31" }
  }
}

export function isDateInRange(dateStr?: string, range?: DateRange): boolean {
  if (!dateStr || !range) return true
  // Normalize dateStr to YYYY-MM-DD
  const cleanDate = dateStr.slice(0, 10)
  return cleanDate >= range.startDate && cleanDate <= range.endDate
}

export interface ReportFilterOptions {
  dateRange: DateRange
  godownId?: string // "all" or specific godownId
  salesperson?: string // "all" or specific
  partyId?: string // "all" or specific
}

export interface KpiCardData {
  title: string
  mainValue: string
  subItems?: Array<{ label: string; value: string }>
}

export interface TableColumn<T> {
  key: string
  label: string
  align?: "left" | "center" | "right"
  render?: (row: T) => React.ReactNode
}

export interface ReportResult<T = any> {
  title: string
  kpiCards: KpiCardData[]
  columns: TableColumn<T>[]
  rows: T[]
  actionButtonLabel?: string
  actionModule?: string
}

// -------------------------------------------------------------
// 1. TRANSACTION REPORTS
// -------------------------------------------------------------

export function computeSaleInvoicesReport(
  salesDocs: SalesDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = salesDocs.filter(doc => {
    if (doc.type !== "invoice") return false
    if (!isDateInRange(doc.date, filter.dateRange)) return false
    if (filter.godownId && filter.godownId !== "all" && doc.godownId !== filter.godownId) return false
    if (filter.salesperson && filter.salesperson !== "all" && doc.createdBy !== filter.salesperson) return false
    return true
  })

  const totalSales = filtered.reduce((sum, d) => sum + (d.grandTotal || 0), 0)
  const totalReceived = filtered.reduce((sum, d) => sum + (d.paidAmount || 0), 0)
  const totalBalance = filtered.reduce((sum, d) => sum + (d.balanceAmount || 0), 0)
  const totalTax = filtered.reduce((sum, d) => sum + (d.taxTotal || 0), 0)
  const totalDiscount = filtered.reduce((sum, d) => sum + (d.adjustment || 0), 0)

  return {
    title: "Sale Invoices",
    actionButtonLabel: "Add Sale",
    actionModule: "sales",
    kpiCards: [
      {
        title: "Total Sales Amount",
        mainValue: `₹ ${totalSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Received", value: `₹ ${totalReceived.toLocaleString("en-IN")}` },
          { label: "Balance", value: `₹ ${totalBalance.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Total Invoices & Tax",
        mainValue: `${filtered.length} Invoices`,
        subItems: [
          { label: "Tax Collected", value: `₹ ${totalTax.toLocaleString("en-IN")}` },
          { label: "Total Discounts", value: `₹ ${totalDiscount.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Invoice no" },
      { key: "partyName", label: "Party Name" },
      { key: "type", label: "Transaction" },
      { key: "paymentMode", label: "Payment Type" },
      { key: "grandTotal", label: "Amount", align: "right" },
      { key: "balanceAmount", label: "Balance", align: "right" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(d => ({
      id: d.id,
      date: d.date,
      docNo: d.docNo,
      partyName: d.partyName,
      type: "Sale",
      paymentMode: (d.paymentMode || "Credit").toUpperCase(),
      grandTotal: `₹ ${d.grandTotal.toLocaleString("en-IN")}`,
      balanceAmount: `₹ ${d.balanceAmount.toLocaleString("en-IN")}`,
      status: d.status
    }))
  }
}

export function computePurchaseBillsReport(
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = purchaseDocs.filter(doc => {
    if (doc.type !== "bill") return false
    if (!isDateInRange(doc.date, filter.dateRange)) return false
    if (filter.godownId && filter.godownId !== "all" && doc.godownId !== filter.godownId) return false
    return true
  })

  const totalPurchases = filtered.reduce((sum, d) => sum + (d.grandTotal || 0), 0)
  const totalPaid = filtered.reduce((sum, d) => sum + (d.paidAmount || 0), 0)
  const totalBalance = filtered.reduce((sum, d) => sum + Math.max(0, (d.grandTotal || 0) - (d.paidAmount || 0)), 0)
  const totalItc = filtered.reduce((sum, d) => {
    const tax = ((d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0))
    return sum + (d.itcEligibility !== "ineligible" ? tax : 0)
  }, 0)

  return {
    title: "Purchase Bills",
    actionButtonLabel: "Add Purchase",
    actionModule: "purchases",
    kpiCards: [
      {
        title: "Total Purchase Amount",
        mainValue: `₹ ${totalPurchases.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Paid", value: `₹ ${totalPaid.toLocaleString("en-IN")}` },
          { label: "Outstanding", value: `₹ ${totalBalance.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Input Tax Credit (ITC)",
        mainValue: `₹ ${totalItc.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Bills", value: `${filtered.length}` },
          { label: "RCM Applicable", value: `${filtered.filter(d => d.isRcm).length} Bills` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Bill No" },
      { key: "partyName", label: "Vendor Name" },
      { key: "type", label: "Transaction" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "grandTotal", label: "Total Amount", align: "right" },
      { key: "paidAmount", label: "Paid Amount", align: "right" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(d => ({
      id: d.id,
      date: d.date,
      docNo: d.docNo,
      partyName: d.partyName,
      type: "Purchase",
      paymentMode: (d.paymentMode || "Credit").toUpperCase(),
      grandTotal: `₹ ${d.grandTotal.toLocaleString("en-IN")}`,
      paidAmount: `₹ ${d.paidAmount.toLocaleString("en-IN")}`,
      status: d.status === "posted" ? "paid" : "pending"
    }))
  }
}

export function computeSalesReturnsReport(
  salesReturns: SalesReturn[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = salesReturns.filter(ret => {
    if (!isDateInRange(ret.date, filter.dateRange)) return false
    if (filter.godownId && filter.godownId !== "all" && ret.receivingGodownId !== filter.godownId) return false
    if (filter.partyId && filter.partyId !== "all" && ret.customerId !== filter.partyId) return false
    return true
  })

  const totalAmount = filtered.reduce((s, r) => s + (r.grandTotal || 0), 0)
  const totalTax = filtered.reduce((s, r) => s + ((r.cgstTotal || 0) + (r.sgstTotal || 0) + (r.igstTotal || 0)), 0)
  const totalQty = filtered.reduce((s, r) => s + (r.items ? r.items.reduce((iq, it) => iq + (it.qty || 0), 0) : 0), 0)
  const withCreditNoteCount = filtered.filter(r => Boolean(r.creditNoteNo)).length
  const pendingCount = filtered.filter(r => r.status === "pending" || r.status === "received").length

  return {
    title: "Sale Return Report",
    actionButtonLabel: "New Sale Return",
    actionModule: "sales",
    kpiCards: [
      {
        title: "Total Sales Return Value",
        mainValue: `₹ ${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Returns", value: `${filtered.length} Orders` },
          { label: "Items Returned", value: `${totalQty} Units` }
        ]
      },
      {
        title: "Tax Reversal & Credit Status",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Credit Notes Linked", value: `${withCreditNoteCount} Notes` },
          { label: "Pending Processing", value: `${pendingCount} Returns` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "returnNo", label: "Return No" },
      { key: "customerName", label: "Customer Name" },
      { key: "originalInvoiceNo", label: "Original Invoice" },
      { key: "reason", label: "Return Reason" },
      { key: "itemsCount", label: "Items (Qty)", align: "center" },
      { key: "subtotal", label: "Taxable ₹", align: "right" },
      { key: "tax", label: "Tax ₹", align: "right" },
      { key: "grandTotal", label: "Return Amount", align: "right" },
      { key: "creditNoteNo", label: "Credit Note", align: "center" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(r => ({
      id: r.id,
      date: r.date,
      returnNo: r.returnNo,
      customerName: r.customerName,
      originalInvoiceNo: r.originalInvoiceNo || "-",
      reason: (r.reason || "sales_return").replace(/_/g, " ").toUpperCase(),
      itemsCount: `${r.items?.length || 0} items (${r.items?.reduce((iq, it) => iq + (it.qty || 0), 0) || 0} qty)`,
      subtotal: `₹ ${(r.subtotal || 0).toLocaleString("en-IN")}`,
      tax: `₹ ${((r.cgstTotal || 0) + (r.sgstTotal || 0) + (r.igstTotal || 0)).toLocaleString("en-IN")}`,
      grandTotal: `₹ ${(r.grandTotal || 0).toLocaleString("en-IN")}`,
      creditNoteNo: r.creditNoteNo || "Not Issued",
      status: r.status.toUpperCase()
    }))
  }
}

export function computePurchaseReturnsReport(
  purchaseReturns: PurchaseReturn[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = purchaseReturns.filter(ret => {
    if (!isDateInRange(ret.date, filter.dateRange)) return false
    if (filter.godownId && filter.godownId !== "all" && ret.dispatchGodownId !== filter.godownId) return false
    if (filter.partyId && filter.partyId !== "all" && ret.vendorId !== filter.partyId) return false
    return true
  })

  const totalAmount = filtered.reduce((s, r) => s + (r.grandTotal || 0), 0)
  const totalTax = filtered.reduce((s, r) => s + ((r.cgstTotal || 0) + (r.sgstTotal || 0) + (r.igstTotal || 0)), 0)
  const totalQty = filtered.reduce((s, r) => s + (r.items ? r.items.reduce((iq, it) => iq + (it.qty || 0), 0) : 0), 0)
  const withDebitNoteCount = filtered.filter(r => Boolean(r.debitNoteNo)).length
  const dispatchedCount = filtered.filter(r => r.status === "dispatched" || r.status === "acknowledged").length

  return {
    title: "Purchase Return Report",
    actionButtonLabel: "New Purchase Return",
    actionModule: "purchases",
    kpiCards: [
      {
        title: "Total Purchase Returns Value",
        mainValue: `₹ ${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Returns", value: `${filtered.length} Returns` },
          { label: "Units Returned", value: `${totalQty} Units` }
        ]
      },
      {
        title: "Vendor Debits & Logistics",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Debit Notes Issued", value: `${withDebitNoteCount} Notes` },
          { label: "Dispatched / In-Transit", value: `${dispatchedCount} Shipments` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "returnNo", label: "Return No" },
      { key: "vendorName", label: "Vendor Name" },
      { key: "originalBillNo", label: "Original Bill" },
      { key: "reason", label: "Reason" },
      { key: "transporter", label: "Transporter / LR" },
      { key: "itemsCount", label: "Items (Qty)", align: "center" },
      { key: "grandTotal", label: "Total Return ₹", align: "right" },
      { key: "debitNoteNo", label: "Debit Note", align: "center" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(r => ({
      id: r.id,
      date: r.date,
      returnNo: r.returnNo,
      vendorName: r.vendorName,
      originalBillNo: r.originalBillNo || "-",
      reason: (r.reason || "defective_batch").replace(/_/g, " ").toUpperCase(),
      transporter: r.transporter ? `${r.transporter}${r.lrNumber ? ` (${r.lrNumber})` : ""}` : "-",
      itemsCount: `${r.items?.length || 0} items (${r.items?.reduce((iq, it) => iq + (it.qty || 0), 0) || 0} qty)`,
      grandTotal: `₹ ${(r.grandTotal || 0).toLocaleString("en-IN")}`,
      debitNoteNo: r.debitNoteNo || "Not Issued",
      status: r.status.toUpperCase()
    }))
  }
}

export function computeCreditNotesReport(
  creditNotes: CreditNote[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = creditNotes.filter(cn => {
    if (!isDateInRange(cn.date, filter.dateRange)) return false
    if (filter.partyId && filter.partyId !== "all" && cn.customerId !== filter.partyId) return false
    return true
  })

  const totalAmount = filtered.reduce((s, c) => s + (c.grandTotal || 0), 0)
  const totalTax = filtered.reduce((s, c) => s + ((c.cgstTotal || 0) + (c.sgstTotal || 0) + (c.igstTotal || 0)), 0)
  const totalApplied = filtered.reduce((s, c) => s + (c.appliedAmount || 0), 0)
  const totalOpen = filtered.reduce((s, c) => s + Math.max(0, (c.grandTotal || 0) - (c.appliedAmount || 0)), 0)
  const openCount = filtered.filter(c => c.status === "open").length

  return {
    title: "Credit Note Report",
    actionButtonLabel: "New Credit Note",
    actionModule: "sales",
    kpiCards: [
      {
        title: "Total Credit Notes Issued",
        mainValue: `₹ ${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Offset / Applied", value: `₹ ${totalApplied.toLocaleString("en-IN")}` },
          { label: "Open Credit Balance", value: `₹ ${totalOpen.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "GST Output Tax Reversed",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Notes", value: `${filtered.length} Notes` },
          { label: "Open / Unadjusted", value: `${openCount} Notes` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "creditNoteNo", label: "Credit Note No" },
      { key: "customerName", label: "Customer Name" },
      { key: "originalInvoiceNo", label: "Invoice Ref" },
      { key: "reason", label: "Reason" },
      { key: "taxable", label: "Taxable ₹", align: "right" },
      { key: "tax", label: "GST Tax ₹", align: "right" },
      { key: "grandTotal", label: "Total Credit ₹", align: "right" },
      { key: "appliedAmount", label: "Adjusted ₹", align: "right" },
      { key: "balance", label: "Balance ₹", align: "right" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(c => {
      const balance = Math.max(0, (c.grandTotal || 0) - (c.appliedAmount || 0))
      return {
        id: c.id,
        date: c.date,
        creditNoteNo: c.creditNoteNo,
        customerName: c.customerName,
        originalInvoiceNo: c.originalInvoiceNo || "-",
        reason: (c.reason || "sales_return").replace(/_/g, " ").toUpperCase(),
        taxable: `₹ ${(c.subtotal || 0).toLocaleString("en-IN")}`,
        tax: `₹ ${((c.cgstTotal || 0) + (c.sgstTotal || 0) + (c.igstTotal || 0)).toLocaleString("en-IN")}`,
        grandTotal: `₹ ${(c.grandTotal || 0).toLocaleString("en-IN")}`,
        appliedAmount: `₹ ${(c.appliedAmount || 0).toLocaleString("en-IN")}`,
        balance: `₹ ${balance.toLocaleString("en-IN")}`,
        status: c.status.toUpperCase()
      }
    })
  }
}

export function computeDebitNotesReport(
  debitNotes: DebitNote[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = debitNotes.filter(dn => {
    if (!isDateInRange(dn.date, filter.dateRange)) return false
    if (filter.partyId && filter.partyId !== "all" && dn.vendorId !== filter.partyId) return false
    return true
  })

  const totalAmount = filtered.reduce((s, d) => s + (d.grandTotal || 0), 0)
  const totalTax = filtered.reduce((s, d) => s + ((d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)), 0)
  const totalApplied = filtered.reduce((s, d) => s + (d.appliedAmount || 0), 0)
  const totalOpen = filtered.reduce((s, d) => s + Math.max(0, (d.grandTotal || 0) - (d.appliedAmount || 0)), 0)
  const openCount = filtered.filter(d => d.status === "open").length

  return {
    title: "Debit Note Report",
    actionButtonLabel: "New Debit Note",
    actionModule: "purchases",
    kpiCards: [
      {
        title: "Total Debit Notes Value",
        mainValue: `₹ ${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Offset against Bills", value: `₹ ${totalApplied.toLocaleString("en-IN")}` },
          { label: "Open Vendor Claims", value: `₹ ${totalOpen.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "ITC Reversal Reported",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Notes", value: `${filtered.length} Notes` },
          { label: "Open Claims", value: `${openCount} Notes` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "debitNoteNo", label: "Debit Note No" },
      { key: "vendorName", label: "Vendor Name" },
      { key: "originalBillNo", label: "Bill Ref" },
      { key: "reason", label: "Reason" },
      { key: "taxable", label: "Taxable ₹", align: "right" },
      { key: "tax", label: "ITC Tax ₹", align: "right" },
      { key: "grandTotal", label: "Total Debit ₹", align: "right" },
      { key: "appliedAmount", label: "Adjusted ₹", align: "right" },
      { key: "balance", label: "Balance ₹", align: "right" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: filtered.map(d => {
      const balance = Math.max(0, (d.grandTotal || 0) - (d.appliedAmount || 0))
      return {
        id: d.id,
        date: d.date,
        debitNoteNo: d.debitNoteNo,
        vendorName: d.vendorName,
        originalBillNo: d.originalBillNo || "-",
        reason: (d.reason || "purchase_return").replace(/_/g, " ").toUpperCase(),
        taxable: `₹ ${(d.subtotal || 0).toLocaleString("en-IN")}`,
        tax: `₹ ${((d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)).toLocaleString("en-IN")}`,
        grandTotal: `₹ ${(d.grandTotal || 0).toLocaleString("en-IN")}`,
        appliedAmount: `₹ ${(d.appliedAmount || 0).toLocaleString("en-IN")}`,
        balance: `₹ ${balance.toLocaleString("en-IN")}`,
        status: d.status.toUpperCase()
      }
    })
  }
}

export function computeDayBookReport(
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  payments: PaymentRecord[],
  filter: ReportFilterOptions,
  creditNotes: CreditNote[] = [],
  debitNotes: DebitNote[] = []
): ReportResult {
  const entries: Array<{
    id: string
    date: string
    refNo: string
    partyName: string
    type: string
    debit: number
    credit: number
    paymentMode: string
  }> = []

  // Sales (Receivable / Debit to Cash/Party)
  salesDocs.forEach(s => {
    if (s.type === "invoice" && isDateInRange(s.date, filter.dateRange)) {
      entries.push({
        id: s.id,
        date: s.date,
        refNo: s.docNo,
        partyName: s.partyName,
        type: "Sale Invoice",
        debit: s.grandTotal,
        credit: 0,
        paymentMode: s.paymentMode.toUpperCase()
      })
    }
  })

  // Purchases (Payable / Credit to Vendor)
  purchaseDocs.forEach(p => {
    if (p.type === "bill" && isDateInRange(p.date, filter.dateRange)) {
      entries.push({
        id: p.id,
        date: p.date,
        refNo: p.docNo,
        partyName: p.partyName,
        type: "Purchase Bill",
        debit: 0,
        credit: p.grandTotal,
        paymentMode: (p.paymentMode || "Credit").toUpperCase()
      })
    }
  })

  // Payments
  payments.forEach(pay => {
    if (isDateInRange(pay.date, filter.dateRange)) {
      const isIn = pay.type === "payment_in"
      entries.push({
        id: pay.id,
        date: pay.date,
        refNo: pay.paymentNo,
        partyName: pay.partyName,
        type: isIn ? "Payment In (Received)" : "Payment Out (Paid)",
        debit: isIn ? pay.amount : 0,
        credit: isIn ? 0 : pay.amount,
        paymentMode: pay.paymentMode.toUpperCase()
      })
    }
  })

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0)
  const netFlow = totalDebit - totalCredit

  return {
    title: "Day Book",
    kpiCards: [
      {
        title: "Total Inflows (Debits)",
        mainValue: `₹ ${totalDebit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Entries", value: `${entries.length}` },
          { label: "Net Cash/Bank Flow", value: `₹ ${netFlow.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Total Outflows (Credits)",
        mainValue: `₹ ${totalCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Bills Paid", value: `₹ ${totalCredit.toLocaleString("en-IN")}` },
          { label: "Status", value: netFlow >= 0 ? "Positive Flow" : "Net Outflow" }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "refNo", label: "Voucher / Ref No" },
      { key: "partyName", label: "Particulars / Party" },
      { key: "type", label: "Voucher Type" },
      { key: "paymentMode", label: "Mode" },
      { key: "debit", label: "Debit (In) ₹", align: "right" },
      { key: "credit", label: "Credit (Out) ₹", align: "right" }
    ],
    rows: entries.map(e => ({
      id: e.id,
      date: e.date,
      refNo: e.refNo,
      partyName: e.partyName,
      type: e.type,
      paymentMode: e.paymentMode,
      debit: e.debit > 0 ? `₹ ${e.debit.toLocaleString("en-IN")}` : "-",
      credit: e.credit > 0 ? `₹ ${e.credit.toLocaleString("en-IN")}` : "-"
    }))
  }
}

export function computeAllTransactionsReport(
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  payments: PaymentRecord[],
  creditNotes: CreditNote[],
  debitNotes: DebitNote[],
  filter: ReportFilterOptions,
  salesReturns: SalesReturn[] = [],
  purchaseReturns: PurchaseReturn[] = []
): ReportResult {
  const rows: Array<{
    id: string
    date: string
    docNo: string
    partyName: string
    docType: string
    amount: number
    mode: string
    status: string
  }> = []

  salesDocs.forEach(s => {
    if (isDateInRange(s.date, filter.dateRange)) {
      rows.push({
        id: s.id,
        date: s.date,
        docNo: s.docNo,
        partyName: s.partyName,
        docType: "Sale Invoice",
        amount: s.grandTotal,
        mode: s.paymentMode.toUpperCase(),
        status: s.status
      })
    }
  })

  purchaseDocs.forEach(p => {
    if (isDateInRange(p.date, filter.dateRange)) {
      rows.push({
        id: p.id,
        date: p.date,
        docNo: p.docNo,
        partyName: p.partyName,
        docType: "Purchase Bill",
        amount: p.grandTotal,
        mode: (p.paymentMode || "Credit").toUpperCase(),
        status: p.status === "posted" ? "paid" : "pending"
      })
    }
  })

  payments.forEach(pay => {
    if (isDateInRange(pay.date, filter.dateRange)) {
      rows.push({
        id: pay.id,
        date: pay.date,
        docNo: pay.paymentNo,
        partyName: pay.partyName,
        docType: pay.type === "payment_in" ? "Payment Received" : "Payment Made",
        amount: pay.amount,
        mode: pay.paymentMode.toUpperCase(),
        status: "completed"
      })
    }
  })

  salesReturns.forEach(sr => {
    if (isDateInRange(sr.date, filter.dateRange)) {
      rows.push({
        id: sr.id,
        date: sr.date,
        docNo: sr.returnNo,
        partyName: sr.customerName,
        docType: "Sales Return",
        amount: sr.grandTotal,
        mode: "RETURN",
        status: sr.status
      })
    }
  })

  purchaseReturns.forEach(pr => {
    if (isDateInRange(pr.date, filter.dateRange)) {
      rows.push({
        id: pr.id,
        date: pr.date,
        docNo: pr.returnNo,
        partyName: pr.vendorName,
        docType: "Purchase Return",
        amount: pr.grandTotal,
        mode: "RETURN",
        status: pr.status
      })
    }
  })

  creditNotes.forEach(cn => {
    if (isDateInRange(cn.date, filter.dateRange)) {
      rows.push({
        id: cn.id,
        date: cn.date,
        docNo: cn.creditNoteNo,
        partyName: cn.customerName,
        docType: "Credit Note",
        amount: cn.grandTotal,
        mode: "ADJUSTMENT",
        status: cn.status
      })
    }
  })

  debitNotes.forEach(dn => {
    if (isDateInRange(dn.date, filter.dateRange)) {
      rows.push({
        id: dn.id,
        date: dn.date,
        docNo: dn.debitNoteNo,
        partyName: dn.vendorName,
        docType: "Debit Note",
        amount: dn.grandTotal,
        mode: "ADJUSTMENT",
        status: dn.status
      })
    }
  })

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalVolume = rows.reduce((s, r) => s + r.amount, 0)

  return {
    title: "All Transactions",
    kpiCards: [
      {
        title: "Total Transaction Volume",
        mainValue: `₹ ${totalVolume.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Vouchers", value: `${rows.length}` },
          { label: "Active Period", value: `${filter.dateRange.startDate} to ${filter.dateRange.endDate}` }
        ]
      },
      {
        title: "Voucher Distribution",
        mainValue: `${rows.filter(r => r.docType === "Sale Invoice").length} Sales`,
        subItems: [
          { label: "Purchases", value: `${rows.filter(r => r.docType === "Purchase Bill").length} Bills` },
          { label: "Payments", value: `${rows.filter(r => r.docType.includes("Payment")).length}` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Document No" },
      { key: "partyName", label: "Party Name" },
      { key: "docType", label: "Transaction Type" },
      { key: "mode", label: "Payment Mode" },
      { key: "amount", label: "Amount ₹", align: "right" },
      { key: "status", label: "Status", align: "center" }
    ],
    rows: rows.map(r => ({
      id: r.id,
      date: r.date,
      docNo: r.docNo,
      partyName: r.partyName,
      docType: r.docType,
      mode: r.mode,
      amount: `₹ ${r.amount.toLocaleString("en-IN")}`,
      status: r.status
    }))
  }
}

export function computeProfitAndLossReport(
  salesDocs: SalesDocument[],
  items: Item[],
  filter: ReportFilterOptions,
  gstSettings?: GstSettings
): ReportResult {
  let totalRevenue = 0
  let totalCOGS = 0

  salesDocs.forEach(s => {
    if (s.type === "invoice" && isDateInRange(s.date, filter.dateRange)) {
      s.items.forEach(line => {
        const itm = items.find(i => i.id === line.itemId)
        const unitCost = line.purchaseCost || itm?.purchasePrice || 0
        totalRevenue += (line.taxableAmount || (line.rate * line.qty))
        totalCOGS += (unitCost * line.qty)
      })
    }
  })

  const grossProfit = totalRevenue - totalCOGS
  const isComposition = Boolean(gstSettings?.enableGst && gstSettings?.isCompositionScheme)
  const compositionRate = isComposition ? (gstSettings?.compositionRate || 1) : 0
  const compositionTax = isComposition ? (totalRevenue * compositionRate) / 100 : 0
  const netProfit = grossProfit - compositionTax
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const kpiCards: KpiCardData[] = [
    {
      title: isComposition ? "Net Operating Profit" : "Estimated Gross Profit",
      mainValue: `₹ ${(isComposition ? netProfit : grossProfit).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      subItems: [
        { label: isComposition ? "Net Margin" : "Gross Margin", value: `${(isComposition ? netMarginPercent : marginPercent).toFixed(1)}%` },
        { label: "Status", value: (isComposition ? netProfit : grossProfit) >= 0 ? "Profitable" : "Loss" }
      ]
    },
    {
      title: "Revenue vs COGS",
      mainValue: `₹ ${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      subItems: [
        { label: isComposition ? "Turnover (Bills of Supply)" : "Net Sales Revenue", value: `₹ ${totalRevenue.toLocaleString("en-IN")}` },
        { label: "Cost of Goods Sold", value: `₹ ${totalCOGS.toLocaleString("en-IN")}` }
      ]
    }
  ]

  if (isComposition) {
    kpiCards.push({
      title: `Composition Tax (${compositionRate}%)`,
      mainValue: `₹ ${compositionTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      subItems: [
        { label: "CGST (50%)", value: `₹ ${(compositionTax / 2).toLocaleString("en-IN")}` },
        { label: "SGST (50%)", value: `₹ ${(compositionTax / 2).toLocaleString("en-IN")}` }
      ]
    })
  }

  const rows = [
    {
      id: "pnl-1",
      account: isComposition ? "Turnover from Outward Supplies (Bills of Supply)" : "Net Sales Revenue (excl. GST)",
      category: "Trading Income",
      amount: `₹ ${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      percentage: "100.0%"
    },
    {
      id: "pnl-2",
      account: "Cost of Goods Sold (Weighted Average)",
      category: "Direct Cost",
      amount: `₹ ${totalCOGS.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      percentage: `${totalRevenue > 0 ? ((totalCOGS / totalRevenue) * 100).toFixed(1) : 0}%`
    },
    {
      id: "pnl-3",
      account: "Estimated Gross Profit (Trading Margin)",
      category: "Gross Margin",
      amount: `₹ ${grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      percentage: `${marginPercent.toFixed(1)}%`
    }
  ]

  if (isComposition) {
    rows.push({
      id: "pnl-4",
      account: `Statutory GST Composition Tax Liability (Sec 10 @ ${compositionRate}%)`,
      category: "Statutory Tax Expense",
      amount: `₹ ${compositionTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      percentage: `${totalRevenue > 0 ? ((compositionTax / totalRevenue) * 100).toFixed(1) : 0}%`
    })
    rows.push({
      id: "pnl-5",
      account: "Net Profit after Composition Tax Liability",
      category: "Net Operating Margin",
      amount: `₹ ${netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      percentage: `${netMarginPercent.toFixed(1)}%`
    })
  }

  return {
    title: isComposition ? "Profit And Loss Statement (Composition Scheme)" : "Profit And Loss Statement",
    kpiCards,
    columns: [
      { key: "account", label: "Account / Head" },
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount (₹)", align: "right" },
      { key: "percentage", label: "% of Net Sales", align: "right" }
    ],
    rows
  }
}

export function computeBillWiseProfitReport(
  salesDocs: SalesDocument[],
  items: Item[],
  filter: ReportFilterOptions
): ReportResult {
  const rows = salesDocs
    .filter(d => d.type === "invoice" && isDateInRange(d.date, filter.dateRange))
    .map(doc => {
      let docRevenue = 0
      let docCOGS = 0

      doc.items.forEach(l => {
        const itm = items.find(i => i.id === l.itemId)
        const cost = l.purchaseCost || itm?.purchasePrice || 0
        docRevenue += (l.taxableAmount || (l.rate * l.qty))
        docCOGS += (cost * l.qty)
      })

      const profit = docRevenue - docCOGS
      const margin = docRevenue > 0 ? (profit / docRevenue) * 100 : 0

      return {
        id: doc.id,
        date: doc.date,
        docNo: doc.docNo,
        partyName: doc.partyName,
        revenue: docRevenue,
        cogs: docCOGS,
        profit,
        margin
      }
    })

  const totalRev = rows.reduce((s, r) => s + r.revenue, 0)
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0)
  const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0

  return {
    title: "Bill Wise Profit",
    kpiCards: [
      {
        title: "Total Profit Generated",
        mainValue: `₹ ${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Average Margin", value: `${avgMargin.toFixed(1)}%` },
          { label: "Analyzed Invoices", value: `${rows.length}` }
        ]
      },
      {
        title: "Net Turnover (Taxable)",
        mainValue: `₹ ${totalRev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Profitable Invoices", value: `${rows.filter(r => r.profit > 0).length}` },
          { label: "Negative / Zero Margin", value: `${rows.filter(r => r.profit <= 0).length}` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Invoice No" },
      { key: "partyName", label: "Customer Name" },
      { key: "revenue", label: "Net Sales ₹", align: "right" },
      { key: "cogs", label: "Cost (COGS) ₹", align: "right" },
      { key: "profit", label: "Estimated Profit ₹", align: "right" },
      { key: "margin", label: "Margin %", align: "right" }
    ],
    rows: rows.map(r => ({
      id: r.id,
      date: r.date,
      docNo: r.docNo,
      partyName: r.partyName,
      revenue: `₹ ${r.revenue.toLocaleString("en-IN")}`,
      cogs: `₹ ${r.cogs.toLocaleString("en-IN")}`,
      profit: `₹ ${r.profit.toLocaleString("en-IN")}`,
      margin: `${r.margin.toFixed(1)}%`
    }))
  }
}

export function computeCashFlowReport(
  payments: PaymentRecord[],
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  let cashIn = 0
  let cashOut = 0

  payments.forEach(p => {
    if (isDateInRange(p.date, filter.dateRange)) {
      if (p.type === "payment_in") cashIn += p.amount
      else cashOut += p.amount
    }
  })

  // Direct cash / UPI sales
  salesDocs.forEach(s => {
    if (s.type === "invoice" && isDateInRange(s.date, filter.dateRange)) {
      if (s.paymentMode === "cash" || s.paymentMode === "upi" || s.paymentMode === "bank") {
        cashIn += (s.paidAmount || 0)
      }
    }
  })

  // Direct cash purchases
  purchaseDocs.forEach(p => {
    if (p.type === "bill" && isDateInRange(p.date, filter.dateRange)) {
      if (p.paymentMode === "cash" || p.paymentMode === "upi" || p.paymentMode === "bank") {
        cashOut += (p.paidAmount || 0)
      }
    }
  })

  const netCashFlow = cashIn - cashOut

  return {
    title: "Cash Flow Statement",
    kpiCards: [
      {
        title: "Net Cash Flow",
        mainValue: `₹ ${netCashFlow.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Status", value: netCashFlow >= 0 ? "Positive Cashflow" : "Negative Cashflow" },
          { label: "Ratio", value: `${cashOut > 0 ? (cashIn / cashOut).toFixed(2) : "1.00"}x In/Out` }
        ]
      },
      {
        title: "Inflows vs Outflows",
        mainValue: `₹ ${cashIn.toLocaleString("en-IN")}`,
        subItems: [
          { label: "Total Inflow", value: `₹ ${cashIn.toLocaleString("en-IN")}` },
          { label: "Total Outflow", value: `₹ ${cashOut.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "head", label: "Cash Flow Activity" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Net Amount (₹)", align: "right" }
    ],
    rows: [
      { id: "cf-1", head: "Cash Inflow from Sales & Customer Receipts", type: "Operating Inflow", amount: `+ ₹ ${cashIn.toLocaleString("en-IN")}` },
      { id: "cf-2", head: "Cash Outflow for Purchases & Supplier Payments", type: "Operating Outflow", amount: `- ₹ ${cashOut.toLocaleString("en-IN")}` },
      { id: "cf-3", head: "Net Operating Cash Flow", type: "Net Liquidity", amount: `₹ ${netCashFlow.toLocaleString("en-IN")}` }
    ]
  }
}

// -------------------------------------------------------------
// 2. PARTY REPORTS
// -------------------------------------------------------------

export function computePartyStatementReport(
  parties: Party[],
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  payments: PaymentRecord[],
  selectedPartyId: string,
  filter: ReportFilterOptions
): ReportResult {
  const party = parties.find(p => p.id === selectedPartyId) || parties[0]
  const entries: Array<{
    date: string
    refNo: string
    particulars: string
    debit: number
    credit: number
    balance: number
  }> = []

  const rawOpening = party?.openingBalance !== undefined ? party.openingBalance : Math.abs(party?.balance || 0)
  const isDrOpening = party?.openingBalanceType 
    ? party.openingBalanceType === "debit" 
    : (party?.type === "supplier" ? (party?.balance || 0) > 0 : (party?.balance || 0) >= 0)
  let runningBalance = isDrOpening ? rawOpening : -rawOpening

  if (party) {
    // Initial Opening Balance row
    if (rawOpening > 0 || party.openingBalance !== undefined) {
      entries.push({
        date: party.openingBalanceDate || filter.dateRange?.startDate || "2026-04-01",
        refNo: "-",
        particulars: `Opening Balance (${isDrOpening ? "Debit / To Receive" : "Credit / To Pay"})`,
        debit: isDrOpening ? rawOpening : 0,
        credit: !isDrOpening ? rawOpening : 0,
        balance: runningBalance
      })
    }

    // Collect all transactions for this party
    const partyTxns: Array<{ date: string; refNo: string; desc: string; debit: number; credit: number }> = []

    salesDocs.forEach(s => {
      const match = s.partyId === party.id || (s.partyName && s.partyName.trim().toLowerCase() === party.name.trim().toLowerCase())
      if (match && isDateInRange(s.date, filter.dateRange)) {
        partyTxns.push({
          date: s.date,
          refNo: s.docNo,
          desc: "Sale Invoice",
          debit: s.grandTotal,
          credit: 0
        })
      }
    })

    purchaseDocs.forEach(p => {
      const match = p.partyId === party.id || (p.partyName && p.partyName.trim().toLowerCase() === party.name.trim().toLowerCase())
      if (match && isDateInRange(p.date, filter.dateRange)) {
        partyTxns.push({
          date: p.date,
          refNo: p.docNo,
          desc: "Purchase Bill",
          debit: 0,
          credit: p.grandTotal
        })
      }
    })

    payments.forEach(pay => {
      const match = pay.partyId === party.id || (pay.partyName && pay.partyName.trim().toLowerCase() === party.name.trim().toLowerCase())
      if (match && isDateInRange(pay.date, filter.dateRange)) {
        if (pay.type === "payment_in") {
          partyTxns.push({
            date: pay.date,
            refNo: pay.paymentNo,
            desc: `Payment Received (${pay.paymentMode.toUpperCase()})`,
            debit: 0,
            credit: pay.amount
          })
        } else {
          partyTxns.push({
            date: pay.date,
            refNo: pay.paymentNo,
            desc: `Payment Made (${pay.paymentMode.toUpperCase()})`,
            debit: pay.amount,
            credit: 0
          })
        }
      }
    })

    partyTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    partyTxns.forEach(tx => {
      runningBalance += (tx.debit - tx.credit)
      entries.push({
        date: tx.date,
        refNo: tx.refNo,
        particulars: tx.desc,
        debit: tx.debit,
        credit: tx.credit,
        balance: runningBalance
      })
    })
  }

  return {
    title: `Party Statement: ${party?.name || "Select Party"}`,
    kpiCards: [
      {
        title: "Closing Balance",
        mainValue: `₹ ${Math.abs(party?.balance ?? runningBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Status", value: (party?.balance ?? runningBalance) >= 0 ? "Debit (Dr - To Receive)" : "Credit (Cr - To Pay)" },
          { label: "Opening Balance", value: `₹ ${rawOpening.toLocaleString("en-IN")} (${isDrOpening ? "Dr" : "Cr"})` }
        ]
      },
      {
        title: "Party Contact & GSTIN",
        mainValue: party?.gstin || "Unregistered Consumer",
        subItems: [
          { label: "Phone", value: party?.phone || "N/A" },
          { label: "Credit Limit", value: `₹ ${(party?.creditLimit || 0).toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "refNo", label: "Voucher / Ref No" },
      { key: "particulars", label: "Particulars" },
      { key: "debit", label: "Debit (Dr) ₹", align: "right" },
      { key: "credit", label: "Credit (Cr) ₹", align: "right" },
      { key: "balance", label: "Running Balance ₹", align: "right" }
    ],
    rows: entries.map((e, idx) => ({
      id: `stmt-${idx}`,
      date: e.date,
      refNo: e.refNo,
      particulars: e.particulars,
      debit: e.debit > 0 ? `₹ ${e.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-",
      credit: e.credit > 0 ? `₹ ${e.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-",
      balance: `₹ ${Math.abs(e.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${e.balance >= 0 ? "Dr" : "Cr"}`
    }))
  }
}

export function computePartyWisePnLReport(
  parties: Party[],
  salesDocs: SalesDocument[],
  items: Item[],
  filter: ReportFilterOptions
): ReportResult {
  const partyRows = parties
    .filter(p => p.type === "customer" || p.type === "both")
    .map(party => {
      let revenue = 0
      let cogs = 0

      salesDocs.forEach(s => {
        if (s.partyId === party.id && isDateInRange(s.date, filter.dateRange)) {
          s.items.forEach(line => {
            const itm = items.find(i => i.id === line.itemId)
            const unitCost = line.purchaseCost || itm?.purchasePrice || 0
            revenue += (line.taxableAmount || (line.rate * line.qty))
            cogs += (unitCost * line.qty)
          })
        }
      })

      const profit = revenue - cogs
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      return {
        id: party.id,
        name: party.name,
        gstin: party.gstin || "Unregistered",
        revenue,
        cogs,
        profit,
        margin
      }
    })
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.profit - a.profit)

  const totalRev = partyRows.reduce((s, p) => s + p.revenue, 0)
  const totalProfit = partyRows.reduce((s, p) => s + p.profit, 0)

  return {
    title: "Party Wise Profit & Loss",
    kpiCards: [
      {
        title: "Total Customer Profit",
        mainValue: `₹ ${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Contributing Customers", value: `${partyRows.length}` },
          { label: "Top Customer", value: partyRows[0]?.name || "N/A" }
        ]
      },
      {
        title: "Net Turnover",
        mainValue: `₹ ${totalRev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Overall Margin", value: `${totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}%` },
          { label: "Status", value: "Customer Profitability" }
        ]
      }
    ],
    columns: [
      { key: "name", label: "Customer Name" },
      { key: "gstin", label: "GSTIN" },
      { key: "revenue", label: "Sales Revenue ₹", align: "right" },
      { key: "cogs", label: "Cost (COGS) ₹", align: "right" },
      { key: "profit", label: "Gross Profit ₹", align: "right" },
      { key: "margin", label: "Margin %", align: "right" }
    ],
    rows: partyRows.map(p => ({
      id: p.id,
      name: p.name,
      gstin: p.gstin,
      revenue: `₹ ${p.revenue.toLocaleString("en-IN")}`,
      cogs: `₹ ${p.cogs.toLocaleString("en-IN")}`,
      profit: `₹ ${p.profit.toLocaleString("en-IN")}`,
      margin: `${p.margin.toFixed(1)}%`
    }))
  }
}

export function computeAllPartiesReport(
  parties: Party[]
): ReportResult {
  const totalReceivables = parties.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0)
  const totalPayables = parties.filter(p => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0)
  const totalOpeningDr = parties
    .filter(p => (p.openingBalanceType === "debit" || (!p.openingBalanceType && p.balance > 0)))
    .reduce((s, p) => s + (p.openingBalance || Math.max(0, p.balance)), 0)
  const totalOpeningCr = parties
    .filter(p => (p.openingBalanceType === "credit" || (!p.openingBalanceType && p.balance < 0)))
    .reduce((s, p) => s + (p.openingBalance || (p.balance < 0 ? Math.abs(p.balance) : 0)), 0)

  return {
    title: "All Parties (Debit & Credit Ledger Summary)",
    actionButtonLabel: "Add Party",
    actionModule: "parties",
    kpiCards: [
      {
        title: "Total Receivables (Debit)",
        mainValue: `₹ ${totalReceivables.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Due Customers", value: `${parties.filter(p => p.balance > 0).length} parties` },
          { label: "Opening Dr Sum", value: `₹ ${totalOpeningDr.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Total Payables (Credit)",
        mainValue: `₹ ${totalPayables.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Suppliers to Pay", value: `${parties.filter(p => p.balance < 0).length} parties` },
          { label: "Opening Cr Sum", value: `₹ ${totalOpeningCr.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "name", label: "Party Name" },
      { key: "type", label: "Party Type" },
      { key: "phone", label: "Phone" },
      { key: "gstin", label: "GSTIN" },
      { key: "openingBalance", label: "Opening Balance", align: "right" },
      { key: "creditLimit", label: "Credit Limit", align: "right" },
      { key: "balance", label: "Closing Balance", align: "right" },
      { key: "status", label: "Dr / Cr Nature", align: "center" }
    ],
    rows: parties.map(p => {
      const rawOpening = p.openingBalance !== undefined ? p.openingBalance : Math.abs(p.balance)
      const isDrOpening = p.openingBalanceType 
        ? p.openingBalanceType === "debit" 
        : (p.type === "supplier" ? p.balance > 0 : p.balance >= 0)

      return {
        id: p.id,
        name: p.name,
        type: p.type === "both" ? "Customer & Supplier" : p.type.toUpperCase(),
        phone: p.phone || "-",
        gstin: p.gstin || "Unregistered",
        openingBalance: `₹ ${rawOpening.toLocaleString("en-IN")} ${isDrOpening ? "Dr" : "Cr"}`,
        creditLimit: `₹ ${(p.creditLimit || 0).toLocaleString("en-IN")}`,
        balance: `₹ ${Math.abs(p.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${p.balance > 0 ? "Dr" : p.balance < 0 ? "Cr" : ""}`,
        status: p.balance > 0 
          ? (p.type === "supplier" ? "Debit (Advance Paid)" : "Debit (Receivable)")
          : p.balance < 0 
          ? (p.type === "supplier" ? "Credit (Payable)" : "Credit (Advance Received)")
          : "Settled"
      }
    })
  }
}

export function computePartyReportByItem(
  parties: Party[],
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const rows: Array<{
    id: string
    partyName: string
    type: string
    itemName: string
    qty: number
    unit: string
    totalAmount: number
  }> = []

  salesDocs.forEach(s => {
    if (isDateInRange(s.date, filter.dateRange)) {
      s.items.forEach((l, idx) => {
        rows.push({
          id: `${s.id}-${idx}`,
          partyName: s.partyName,
          type: "Customer (Sale)",
          itemName: l.name,
          qty: l.qty,
          unit: l.unit || "BOX",
          totalAmount: l.total
        })
      })
    }
  })

  purchaseDocs.forEach(p => {
    if (isDateInRange(p.date, filter.dateRange)) {
      p.items.forEach((l, idx) => {
        rows.push({
          id: `${p.id}-${idx}`,
          partyName: p.partyName,
          type: "Supplier (Purchase)",
          itemName: l.name,
          qty: l.qty,
          unit: l.unit || "BOX",
          totalAmount: l.total
        })
      })
    }
  })

  return {
    title: "Party Report By Item",
    kpiCards: [
      {
        title: "Item-Party Movements",
        mainValue: `${rows.length} Product Lines`,
        subItems: [
          { label: "Active Items", value: `${new Set(rows.map(r => r.itemName)).size}` },
          { label: "Active Parties", value: `${new Set(rows.map(r => r.partyName)).size}` }
        ]
      },
      {
        title: "Cumulative Traded Value",
        mainValue: `₹ ${rows.reduce((s, r) => s + r.totalAmount, 0).toLocaleString("en-IN")}`,
        subItems: [
          { label: "Sale Lines", value: `${rows.filter(r => r.type.includes("Sale")).length}` },
          { label: "Purchase Lines", value: `${rows.filter(r => r.type.includes("Purchase")).length}` }
        ]
      }
    ],
    columns: [
      { key: "partyName", label: "Party Name" },
      { key: "type", label: "Relationship" },
      { key: "itemName", label: "Item / Product" },
      { key: "qty", label: "Traded Qty", align: "center" },
      { key: "totalAmount", label: "Total Amount ₹", align: "right" }
    ],
    rows: rows.map(r => ({
      id: r.id,
      partyName: r.partyName,
      type: r.type,
      itemName: r.itemName,
      qty: `${r.qty} ${r.unit}`,
      totalAmount: `₹ ${r.totalAmount.toLocaleString("en-IN")}`
    }))
  }
}

export function computeSalePurchaseByPartyReport(
  parties: Party[],
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const rows = parties.map(party => {
    const partySales = salesDocs
      .filter(s => s.partyId === party.id && isDateInRange(s.date, filter.dateRange))
      .reduce((sum, s) => sum + s.grandTotal, 0)

    const partyPurchases = purchaseDocs
      .filter(p => p.partyId === party.id && isDateInRange(p.date, filter.dateRange))
      .reduce((sum, p) => sum + p.grandTotal, 0)

    return {
      id: party.id,
      name: party.name,
      type: party.type.toUpperCase(),
      sales: partySales,
      purchases: partyPurchases,
      netTurnover: partySales + partyPurchases
    }
  }).filter(r => r.netTurnover > 0).sort((a, b) => b.netTurnover - a.netTurnover)

  const totalSales = rows.reduce((s, r) => s + r.sales, 0)
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0)

  return {
    title: "Sale Purchase By Party",
    kpiCards: [
      {
        title: "Total Party Sales",
        mainValue: `₹ ${totalSales.toLocaleString("en-IN")}`,
        subItems: [
          { label: "Active Customers", value: `${rows.filter(r => r.sales > 0).length}` },
          { label: "Avg Sale per Party", value: `₹ ${(totalSales / Math.max(1, rows.filter(r => r.sales > 0).length)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` }
        ]
      },
      {
        title: "Total Party Purchases",
        mainValue: `₹ ${totalPurchases.toLocaleString("en-IN")}`,
        subItems: [
          { label: "Active Suppliers", value: `${rows.filter(r => r.purchases > 0).length}` },
          { label: "Net Volume", value: `₹ ${(totalSales + totalPurchases).toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "name", label: "Party Name" },
      { key: "type", label: "Party Type" },
      { key: "sales", label: "Total Sales ₹", align: "right" },
      { key: "purchases", label: "Total Purchases ₹", align: "right" },
      { key: "netTurnover", label: "Total Turnover ₹", align: "right" }
    ],
    rows: rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sales: `₹ ${r.sales.toLocaleString("en-IN")}`,
      purchases: `₹ ${r.purchases.toLocaleString("en-IN")}`,
      netTurnover: `₹ ${r.netTurnover.toLocaleString("en-IN")}`
    }))
  }
}

// -------------------------------------------------------------
// 3. GST REPORTS
// -------------------------------------------------------------

export function computeGstr1Report(
  salesDocs: SalesDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = salesDocs.filter(d => d.type === "invoice" && isDateInRange(d.date, filter.dateRange))

  const b2bDocs = filtered.filter(d => Boolean(d.partyGstin && d.partyGstin.trim().length >= 15))
  
  // Statutory B2CL: Inter-State supplies to unregistered persons where invoice value > ₹2,50,000
  const b2clDocs = filtered.filter(d => {
    const isUnregistered = !d.partyGstin || d.partyGstin.trim().length < 15
    const isInter = isInterStateTransaction(d.placeOfSupply || d.partyStateCode, "27")
    return isUnregistered && isInter && (d.grandTotal || 0) > 250000
  })

  // Statutory B2CS: Unregistered supplies (all intra-state + inter-state <= ₹2,50,000)
  const b2csDocs = filtered.filter(d => {
    const isUnregistered = !d.partyGstin || d.partyGstin.trim().length < 15
    const isInter = isInterStateTransaction(d.placeOfSupply || d.partyStateCode, "27")
    return isUnregistered && (!isInter || (d.grandTotal || 0) <= 250000)
  })

  const totalTaxable = filtered.reduce((s, d) => s + (d.subtotal || 0), 0)
  const totalCgst = filtered.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const totalSgst = filtered.reduce((s, d) => s + (d.sgstTotal || 0), 0)
  const totalIgst = filtered.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const totalTax = totalCgst + totalSgst + totalIgst

  return {
    title: "GSTR-1 Outward Supplies Summary",
    kpiCards: [
      {
        title: "Total Taxable Turnover",
        mainValue: `₹ ${totalTaxable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "B2B Supplies (Table 4A)", value: `${b2bDocs.length} Invoices` },
          { label: "B2CL Inter-State > ₹2.5L", value: `${b2clDocs.length} Invoices` },
          { label: "B2CS Small Supplies", value: `${b2csDocs.length} Invoices` }
        ]
      },
      {
        title: "Total Output Tax Liability",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "CGST + SGST", value: `₹ ${(totalCgst + totalSgst).toLocaleString("en-IN")}` },
          { label: "IGST (Inter-state)", value: `₹ ${totalIgst.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "section", label: "GSTR-1 Section" },
      { key: "count", label: "Invoices Count", align: "center" },
      { key: "taxable", label: "Taxable Value ₹", align: "right" },
      { key: "cgst", label: "CGST ₹", align: "right" },
      { key: "sgst", label: "SGST ₹", align: "right" },
      { key: "igst", label: "IGST ₹", align: "right" },
      { key: "totalTax", label: "Total Tax ₹", align: "right" }
    ],
    rows: [
      {
        id: "b2b",
        section: "4A, 4B, 6B - B2B Invoices (Registered Buyers)",
        count: b2bDocs.length,
        taxable: `₹ ${b2bDocs.reduce((s, d) => s + d.subtotal, 0).toLocaleString("en-IN")}`,
        cgst: `₹ ${b2bDocs.reduce((s, d) => s + (d.cgstTotal || 0), 0).toLocaleString("en-IN")}`,
        sgst: `₹ ${b2bDocs.reduce((s, d) => s + (d.sgstTotal || 0), 0).toLocaleString("en-IN")}`,
        igst: `₹ ${b2bDocs.reduce((s, d) => s + (d.igstTotal || 0), 0).toLocaleString("en-IN")}`,
        totalTax: `₹ ${b2bDocs.reduce((s, d) => s + (d.taxTotal || 0), 0).toLocaleString("en-IN")}`
      },
      {
        id: "b2cl",
        section: "5 - B2C (Large) Invoices (Inter-State Unregistered > ₹2.5L)",
        count: b2clDocs.length,
        taxable: `₹ ${b2clDocs.reduce((s, d) => s + d.subtotal, 0).toLocaleString("en-IN")}`,
        cgst: `₹ 0`,
        sgst: `₹ 0`,
        igst: `₹ ${b2clDocs.reduce((s, d) => s + (d.igstTotal || 0), 0).toLocaleString("en-IN")}`,
        totalTax: `₹ ${b2clDocs.reduce((s, d) => s + (d.taxTotal || 0), 0).toLocaleString("en-IN")}`
      },
      {
        id: "b2cs",
        section: "7 - B2C (Small) Supplies (Intra-State & Inter-State <= ₹2.5L)",
        count: b2csDocs.length,
        taxable: `₹ ${b2csDocs.reduce((s, d) => s + d.subtotal, 0).toLocaleString("en-IN")}`,
        cgst: `₹ ${b2csDocs.reduce((s, d) => s + (d.cgstTotal || 0), 0).toLocaleString("en-IN")}`,
        sgst: `₹ ${b2csDocs.reduce((s, d) => s + (d.sgstTotal || 0), 0).toLocaleString("en-IN")}`,
        igst: `₹ ${b2csDocs.reduce((s, d) => s + (d.igstTotal || 0), 0).toLocaleString("en-IN")}`,
        totalTax: `₹ ${b2csDocs.reduce((s, d) => s + (d.taxTotal || 0), 0).toLocaleString("en-IN")}`
      }
    ]
  }
}

export function computeGstr2Report(
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = purchaseDocs.filter(d => d.type === "bill" && isDateInRange(d.date, filter.dateRange))

  const totalTaxable = filtered.reduce((s, d) => s + (d.subtotal || 0), 0)
  const totalItc = filtered.reduce((s, d) => {
    const tax = (d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)
    return s + (d.itcEligibility !== "ineligible" ? tax : 0)
  }, 0)

  return {
    title: "GSTR-2 Inward Supplies (ITC Register)",
    kpiCards: [
      {
        title: "Total Eligible ITC",
        mainValue: `₹ ${totalItc.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Eligible Bills", value: `${filtered.filter(d => d.itcEligibility !== "ineligible").length}` },
          { label: "Blocked u/s 17(5)", value: `${filtered.filter(d => d.itcEligibility === "ineligible").length} Bills` }
        ]
      },
      {
        title: "Inward Taxable Purchases",
        mainValue: `₹ ${totalTaxable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Verified Vendors", value: `${new Set(filtered.map(d => d.partyName)).size}` },
          { label: "RCM Inward", value: `${filtered.filter(d => d.isRcm).length} Bills` }
        ]
      }
    ],
    columns: [
      { key: "docNo", label: "Supplier Bill No" },
      { key: "date", label: "Date" },
      { key: "partyName", label: "Supplier Name" },
      { key: "gstin", label: "Supplier GSTIN" },
      { key: "taxable", label: "Taxable Value ₹", align: "right" },
      { key: "itc", label: "Eligible ITC ₹", align: "right" },
      { key: "itcType", label: "ITC Category", align: "center" }
    ],
    rows: filtered.map(d => {
      const isEligible = d.itcEligibility !== "ineligible"
      const tax = (d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)
      return {
        id: d.id,
        docNo: d.docNo,
        date: d.date,
        partyName: d.partyName,
        gstin: d.partyGstin || "Unregistered",
        taxable: `₹ ${(d.subtotal || 0).toLocaleString("en-IN")}`,
        itc: `₹ ${(isEligible ? tax : 0).toLocaleString("en-IN")}`,
        itcType: isEligible 
          ? (d.itcEligibility ? d.itcEligibility.replace("_", " ").toUpperCase() : "INPUTS")
          : "INELIGIBLE (SEC 17(5))"
      }
    })
  }
}

export function computeGstr3bReport(
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions,
  debitNotes: DebitNote[] = [],
  purchaseReturns: PurchaseReturn[] = []
): ReportResult {
  const sales = salesDocs.filter(d => d.type === "invoice" && isDateInRange(d.date, filter.dateRange))
  const purchases = purchaseDocs.filter(d => d.type === "bill" && isDateInRange(d.date, filter.dateRange))
  const filteredDebitNotes = debitNotes.filter(d => isDateInRange(d.date, filter.dateRange))
  const filteredPurchaseReturns = purchaseReturns.filter(d => isDateInRange(d.date, filter.dateRange))

  const outwardTaxable = sales.reduce((s, d) => s + (d.subtotal || 0), 0)
  const outputTax = sales.reduce((s, d) => s + (d.taxTotal || 0), 0)

  const eligiblePurchases = purchases.filter(d => d.itcEligibility !== "ineligible")
  const ineligiblePurchases = purchases.filter(d => d.itcEligibility === "ineligible")

  const inwardTaxable = purchases.reduce((s, d) => s + (d.subtotal || 0), 0)
  const eligibleInwardTaxable = eligiblePurchases.reduce((s, d) => s + (d.subtotal || 0), 0)
  const inputTax = eligiblePurchases.reduce((s, d) => s + ((d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)), 0)
  const blockedTax = ineligiblePurchases.reduce((s, d) => s + ((d.cgstTotal || 0) + (d.sgstTotal || 0) + (d.igstTotal || 0)), 0)

  // Sales tax components
  const salesIgst = sales.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const salesCgst = sales.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const salesSgst = sales.reduce((s, d) => s + (d.sgstTotal || 0), 0)

  // Inward purchases tax components
  const purchasesIgst = eligiblePurchases.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const purchasesCgst = eligiblePurchases.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const purchasesSgst = eligiblePurchases.reduce((s, d) => s + (d.sgstTotal || 0), 0)

  // RCM (Inward Reverse Charge) Metrics
  const rcmPurchases = purchases.filter(d => Boolean(d.isRcm))
  const rcmInwardTaxable = rcmPurchases.reduce((s, d) => s + (d.subtotal || 0), 0)
  const rcmInwardIgst = rcmPurchases.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const rcmInwardCgst = rcmPurchases.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const rcmInwardSgst = rcmPurchases.reduce((s, d) => s + (d.sgstTotal || 0), 0)
  const rcmInwardTax = rcmInwardIgst + rcmInwardCgst + rcmInwardSgst

  // RCM Reversals (Debit notes & standalone returns where isRcm === true)
  const rcmDebitNotes = filteredDebitNotes.filter(d => Boolean(d.isRcm))
  const standaloneRcmReturns = filteredPurchaseReturns.filter(r => Boolean(r.isRcm) && !r.debitNoteId && !r.debitNoteNo)

  const rcmReversalTaxable = rcmDebitNotes.reduce((s, d) => s + (d.subtotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.subtotal || 0), 0)
  const rcmReversalIgst = rcmDebitNotes.reduce((s, d) => s + (d.igstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const rcmReversalCgst = rcmDebitNotes.reduce((s, d) => s + (d.cgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const rcmReversalSgst = rcmDebitNotes.reduce((s, d) => s + (d.sgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.sgstTotal || 0), 0)
  const rcmReversalTax = rcmReversalIgst + rcmReversalCgst + rcmReversalSgst

  const netRcmTaxable = Math.max(0, rcmInwardTaxable - rcmReversalTaxable)
  const netRcmIgst = Math.max(0, rcmInwardIgst - rcmReversalIgst)
  const netRcmCgst = Math.max(0, rcmInwardCgst - rcmReversalCgst)
  const netRcmSgst = Math.max(0, rcmInwardSgst - rcmReversalSgst)
  const netRcmTax = netRcmIgst + netRcmCgst + netRcmSgst

  // All ITC Reversals in Table 4(B)
  const itcReversedIgst = filteredDebitNotes.reduce((s, d) => s + (d.igstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.igstTotal || 0), 0)
  const itcReversedCgst = filteredDebitNotes.reduce((s, d) => s + (d.cgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const itcReversedSgst = filteredDebitNotes.reduce((s, d) => s + (d.sgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.sgstTotal || 0), 0)
  const totalItcReversed = itcReversedIgst + itcReversedCgst + itcReversedSgst
  const totalReversalTaxable = rcmReversalTaxable + filteredDebitNotes.filter(d => !d.isRcm).reduce((s, d) => s + (d.subtotal || 0), 0)

  // Net ITC Available in Table 4(C)
  const netItcIgst = Math.max(0, purchasesIgst - itcReversedIgst)
  const netItcCgst = Math.max(0, purchasesCgst - itcReversedCgst)
  const netItcSgst = Math.max(0, purchasesSgst - itcReversedSgst)
  const netItcAvailable = netItcIgst + netItcCgst + netItcSgst

  // Statutory Payment in Table 6.1: ITC can offset outward tax, RCM must be paid in cash
  const cashPayableIgst = Math.max(0, salesIgst - netItcIgst) + netRcmIgst
  const cashPayableCgst = Math.max(0, salesCgst - netItcCgst) + netRcmCgst
  const cashPayableSgst = Math.max(0, salesSgst - netItcSgst) + netRcmSgst
  const totalCashPayable = cashPayableIgst + cashPayableCgst + cashPayableSgst

  // Table 3.2 Inter-State to Unregistered persons
  const pos32Docs = sales.filter(d => (!d.partyGstin || d.partyGstin.trim().length < 15) && isInterStateTransaction(d.placeOfSupply || d.partyStateCode, "27"))
  const pos32Taxable = pos32Docs.reduce((s, d) => s + (d.subtotal || 0), 0)
  const pos32Igst = pos32Docs.reduce((s, d) => s + (d.igstTotal || 0), 0)

  return {
    title: "GSTR-3B Return Summary",
    kpiCards: [
      {
        title: "Net GST Payable in Cash",
        mainValue: `₹ ${totalCashPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Outward Tax (Post-ITC)", value: `₹ ${(Math.max(0, salesIgst - netItcIgst) + Math.max(0, salesCgst - netItcCgst) + Math.max(0, salesSgst - netItcSgst)).toLocaleString("en-IN")}` },
          { label: "Net RCM Liability (Cash)", value: `₹ ${netRcmTax.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Total Turnovers",
        mainValue: `₹ ${outwardTaxable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Outward Taxable Value", value: `₹ ${outwardTaxable.toLocaleString("en-IN")}` },
          { label: "Inward Purchases Value", value: `₹ ${inwardTaxable.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "table", label: "Table Head" },
      { key: "description", label: "Nature of Supplies / Description" },
      { key: "taxable", label: "Taxable Value (₹)", align: "right" },
      { key: "igst", label: "IGST (₹)", align: "right" },
      { key: "cgst", label: "CGST (₹)", align: "right" },
      { key: "sgst", label: "SGST (₹)", align: "right" },
      { key: "totalTax", label: "Total Tax (₹)", align: "right" }
    ],
    rows: [
      {
        id: "3.1a",
        table: "3.1 (a)",
        description: "Outward taxable supplies (other than zero rated, nil and exempted)",
        taxable: `₹ ${outwardTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${salesIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${salesCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${salesSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${outputTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "3.1d",
        table: "3.1 (d)",
        description: "Inward supplies liable to reverse charge (RCM) (Net of RCM returns & debit notes)",
        taxable: `₹ ${netRcmTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${netRcmIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${netRcmCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${netRcmSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${netRcmTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "3.2",
        table: "3.2",
        description: "Inter-State supplies made to unregistered persons by Place of Supply",
        taxable: `₹ ${pos32Taxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${pos32Igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: "₹ 0.00",
        sgst: "₹ 0.00",
        totalTax: `₹ ${pos32Igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "4.A",
        table: "4 (A) (5)",
        description: "Eligible ITC Available: All other ITC (Inputs, Capital Goods, Services)",
        taxable: `₹ ${eligibleInwardTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${purchasesIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${purchasesCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${purchasesSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${inputTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "4.B",
        table: "4 (B) (2)",
        description: "ITC Reversed: Debit Notes / Purchase Returns / Section 17(5)",
        taxable: `₹ ${totalReversalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${itcReversedIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${itcReversedCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${itcReversedSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${totalItcReversed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "4.C",
        table: "4 (C)",
        description: "Net ITC Available = [4(A) - 4(B)]",
        taxable: `₹ ${eligibleInwardTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        igst: `₹ ${netItcIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${netItcCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${netItcSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${netItcAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        id: "6.1",
        table: "6.1",
        description: "Net Tax Payable after ITC offset + RCM Cash Liability",
        taxable: "—",
        igst: `₹ ${cashPayableIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        cgst: `₹ ${cashPayableCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sgst: `₹ ${cashPayableSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalTax: `₹ ${totalCashPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    ]
  }
}

export function computeCmp08Report(
  salesDocs: SalesDocument[],
  filter: ReportFilterOptions,
  compositionRate: number = 1,
  compositionCategory: string = "trader_manufacturer",
  purchaseDocs: PurchaseDocument[] = [],
  debitNotes: DebitNote[] = [],
  purchaseReturns: PurchaseReturn[] = []
): ReportResult {
  const filtered = salesDocs.filter(d => d.type === "invoice" && isDateInRange(d.date, filter.dateRange))
  const purchases = purchaseDocs.filter(d => d.type === "bill" && isDateInRange(d.date, filter.dateRange))
  const filteredDebitNotes = debitNotes.filter(d => isDateInRange(d.date, filter.dateRange))
  const filteredPurchaseReturns = purchaseReturns.filter(d => isDateInRange(d.date, filter.dateRange))

  const totalTurnover = filtered.reduce((s, d) => s + (d.grandTotal || d.subtotal || 0), 0)
  const taxRate = compositionRate || 1
  const totalTaxLiability = (totalTurnover * taxRate) / 100
  const cgstLiability = totalTaxLiability / 2
  const sgstLiability = totalTaxLiability / 2

  // RCM (Inward Reverse Charge) for CMP-08 Table 2
  const rcmPurchases = purchases.filter(d => Boolean(d.isRcm))
  const rcmInwardTaxable = rcmPurchases.reduce((s, d) => s + (d.subtotal || 0), 0)
  const rcmInwardCgst = rcmPurchases.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const rcmInwardSgst = rcmPurchases.reduce((s, d) => s + (d.sgstTotal || 0), 0)

  const rcmDebitNotes = filteredDebitNotes.filter(d => Boolean(d.isRcm))
  const standaloneRcmReturns = filteredPurchaseReturns.filter(r => Boolean(r.isRcm) && !r.debitNoteId && !r.debitNoteNo)

  const rcmReversalTaxable = rcmDebitNotes.reduce((s, d) => s + (d.subtotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.subtotal || 0), 0)
  const rcmReversalCgst = rcmDebitNotes.reduce((s, d) => s + (d.cgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.cgstTotal || 0), 0)
  const rcmReversalSgst = rcmDebitNotes.reduce((s, d) => s + (d.sgstTotal || 0), 0) + standaloneRcmReturns.reduce((s, d) => s + (d.sgstTotal || 0), 0)

  const netRcmTaxable = Math.max(0, rcmInwardTaxable - rcmReversalTaxable)
  const netRcmCgst = Math.max(0, rcmInwardCgst - rcmReversalCgst)
  const netRcmSgst = Math.max(0, rcmInwardSgst - rcmReversalSgst)
  const netRcmTax = netRcmCgst + netRcmSgst

  const totalCombinedTax = totalTaxLiability + netRcmTax
  const totalCombinedCgst = cgstLiability + netRcmCgst
  const totalCombinedSgst = sgstLiability + netRcmSgst

  const categoryLabel = 
    compositionCategory === "restaurant" ? "Restaurant (5%)" :
    compositionCategory === "service_provider" ? "Service Provider (6%)" :
    "Trader / Manufacturer (1%)"

  return {
    title: "Form CMP-08: Quarterly Statement for Composition Taxable Persons",
    kpiCards: [
      {
        title: "Total Composition Turnover",
        mainValue: `₹ ${totalTurnover.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Category", value: categoryLabel },
          { label: "Total Bills of Supply", value: `${filtered.length} Bills` }
        ]
      },
      {
        title: "Statutory Tax Payable (Sec 10 + RCM)",
        mainValue: `₹ ${totalCombinedTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Outward Turnover Tax", value: `₹ ${totalTaxLiability.toLocaleString("en-IN")}` },
          { label: "Inward RCM Tax", value: `₹ ${netRcmTax.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "Central Tax (CGST)",
        mainValue: `₹ ${totalCombinedCgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "CGST on Turnover", value: `₹ ${cgstLiability.toLocaleString("en-IN")}` },
          { label: "CGST on Inward RCM", value: `₹ ${netRcmCgst.toLocaleString("en-IN")}` }
        ]
      },
      {
        title: "State Tax (SGST)",
        mainValue: `₹ ${totalCombinedSgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "SGST on Turnover", value: `₹ ${sgstLiability.toLocaleString("en-IN")}` },
          { label: "SGST on Inward RCM", value: `₹ ${netRcmSgst.toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "tableNo", label: "Table No." },
      { key: "description", label: "Nature of Supplies" },
      { key: "turnover", label: "Turnover Value (₹)", align: "right" },
      { key: "rate", label: "Rate (%)", align: "center" },
      { key: "cgst", label: "Central Tax (₹)", align: "right" },
      { key: "sgst", label: "State/UT Tax (₹)", align: "right" },
      { key: "totalTax", label: "Total Tax (₹)", align: "right" }
    ],
    rows: [
      {
        id: "cmp-1",
        tableNo: "Table 1",
        description: "Outward supplies (including exempt supplies)",
        turnover: `₹ ${totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        rate: `${taxRate}%`,
        cgst: `₹ ${cgstLiability.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        sgst: `₹ ${sgstLiability.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalTax: `₹ ${totalTaxLiability.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      },
      {
        id: "cmp-2",
        tableNo: "Table 2",
        description: "Inward supplies attracting reverse charge (RCM) (Net of RCM returns)",
        turnover: `₹ ${netRcmTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        rate: "-",
        cgst: `₹ ${netRcmCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        sgst: `₹ ${netRcmSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalTax: `₹ ${netRcmTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      },
      {
        id: "cmp-3",
        tableNo: "Table 3",
        description: "Total Tax Payable (Table 1 + Table 2)",
        turnover: `₹ ${(totalTurnover + netRcmTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        rate: "-",
        cgst: `₹ ${totalCombinedCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        sgst: `₹ ${totalCombinedSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalTax: `₹ ${totalCombinedTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      },
      {
        id: "cmp-4",
        tableNo: "Table 4",
        description: "Interest payable (if any)",
        turnover: "-",
        rate: "-",
        cgst: "₹ 0.00",
        sgst: "₹ 0.00",
        totalTax: "₹ 0.00"
      },
      {
        id: "cmp-5",
        tableNo: "Table 5",
        description: "Tax Paid / Deposited in Cash",
        turnover: "-",
        rate: "-",
        cgst: `₹ ${totalCombinedCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        sgst: `₹ ${totalCombinedSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalTax: `₹ ${totalCombinedTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      }
    ]
  }
}

export function computeHsnSummaryReport(
  salesDocs: SalesDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const hsnMap: Record<string, {
    hsn: string
    description: string
    totalQty: number
    taxableValue: number
    cgst: number
    sgst: number
    igst: number
    totalTax: number
  }> = {}

  salesDocs.forEach(s => {
    if (s.type === "invoice" && isDateInRange(s.date, filter.dateRange)) {
      s.items.forEach(l => {
        const hsn = l.hsn || "8471"
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            description: l.name,
            totalQty: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0
          }
        }
        hsnMap[hsn].totalQty += l.qty
        hsnMap[hsn].taxableValue += (l.taxableAmount || (l.rate * l.qty))
        hsnMap[hsn].cgst += (l.cgst || 0)
        hsnMap[hsn].sgst += (l.sgst || 0)
        hsnMap[hsn].igst += (l.igst || 0)
        hsnMap[hsn].totalTax += ((l.cgst || 0) + (l.sgst || 0) + (l.igst || 0))
      })
    }
  })

  const rows = Object.values(hsnMap)
  const totalTaxable = rows.reduce((s, r) => s + r.taxableValue, 0)
  const totalTax = rows.reduce((s, r) => s + r.totalTax, 0)

  return {
    title: "Sale Summary By HSN",
    kpiCards: [
      {
        title: "Total HSN Taxable Value",
        mainValue: `₹ ${totalTaxable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Unique HSN Codes", value: `${rows.length}` },
          { label: "Total Taxable Qty", value: `${rows.reduce((s, r) => s + r.totalQty, 0)} Units` }
        ]
      },
      {
        title: "Total GST Assessed",
        mainValue: `₹ ${totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "CGST + SGST", value: `₹ ${rows.reduce((s, r) => s + r.cgst + r.sgst, 0).toLocaleString("en-IN")}` },
          { label: "IGST", value: `₹ ${rows.reduce((s, r) => s + r.igst, 0).toLocaleString("en-IN")}` }
        ]
      }
    ],
    columns: [
      { key: "hsn", label: "HSN / SAC Code" },
      { key: "description", label: "Product Sample" },
      { key: "totalQty", label: "Total Quantity", align: "center" },
      { key: "taxableValue", label: "Total Value ₹", align: "right" },
      { key: "cgst", label: "CGST ₹", align: "right" },
      { key: "sgst", label: "SGST ₹", align: "right" },
      { key: "igst", label: "IGST ₹", align: "right" },
      { key: "totalTax", label: "Total Tax ₹", align: "right" }
    ],
    rows: rows.map(r => ({
      id: r.hsn,
      hsn: r.hsn,
      description: r.description,
      totalQty: `${r.totalQty} Units`,
      taxableValue: `₹ ${r.taxableValue.toLocaleString("en-IN")}`,
      cgst: `₹ ${r.cgst.toLocaleString("en-IN")}`,
      sgst: `₹ ${r.sgst.toLocaleString("en-IN")}`,
      igst: `₹ ${r.igst.toLocaleString("en-IN")}`,
      totalTax: `₹ ${r.totalTax.toLocaleString("en-IN")}`
    }))
  }
}

// -------------------------------------------------------------
// 4. STOCK & INVENTORY REPORTS
// -------------------------------------------------------------

export function computeStockSummaryReport(
  items: Item[],
  godowns: Godown[],
  filter: ReportFilterOptions
): ReportResult {
  const selectedGodown = filter.godownId && filter.godownId !== "all" ? filter.godownId : null

  const rows = items.map(itm => {
    const qty = selectedGodown ? (itm.stockByGodown[selectedGodown] || 0) : itm.currentStock
    
    let valuation = 0
    let cost = itm.purchasePrice || 0

    if (itm.hasBatch && itm.batchDetails && itm.batchDetails.length > 0) {
      const relevantBatches = selectedGodown
        ? itm.batchDetails.filter(b => b.godownId === selectedGodown)
        : itm.batchDetails

      valuation = relevantBatches.reduce((acc, b) => {
        const bCost = b.purchasePrice ?? b.costPrice ?? itm.purchasePrice ?? 0
        return acc + (b.quantity * bCost)
      }, 0)

      if (qty > 0) {
        cost = Number((valuation / qty).toFixed(2))
      }
    } else {
      valuation = qty * cost
    }

    return {
      id: itm.id,
      code: itm.code,
      name: itm.name,
      category: itm.category,
      unit: itm.unit,
      valuationMethod: itm.valuationMethod || "FIFO",
      qty,
      cost,
      salePrice: itm.salePrice,
      valuation
    }
  })

  const totalQty = rows.reduce((s, r) => s + r.qty, 0)
  const totalValuation = rows.reduce((s, r) => s + r.valuation, 0)

  return {
    title: "Stock Summary & Valuation",
    actionButtonLabel: "Add Item",
    actionModule: "items",
    kpiCards: [
      {
        title: "Total Inventory Asset Worth",
        mainValue: `₹ ${totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Active SKUs", value: `${rows.length}` },
          { label: "Valuation Method", value: "Weighted Avg / FIFO" }
        ]
      },
      {
        title: "Total Physical Units On-Hand",
        mainValue: `${totalQty.toLocaleString("en-IN")} Units`,
        subItems: [
          { label: "Selected Godown", value: selectedGodown ? godowns.find(g => g.id === selectedGodown)?.name || "Godown" : "All Godowns" },
          { label: "Healthy Stock", value: `${rows.filter(r => r.qty > 0).length} SKUs` }
        ]
      }
    ],
    columns: [
      { key: "code", label: "Item SKU / Code" },
      { key: "name", label: "Product Name" },
      { key: "category", label: "Category" },
      { key: "valuationMethod", label: "Valuation Method" },
      { key: "qty", label: "Stock On-Hand", align: "center" },
      { key: "cost", label: "Unit Cost ₹", align: "right" },
      { key: "salePrice", label: "Sale Price ₹", align: "right" },
      { key: "valuation", label: "Total Valuation ₹", align: "right" }
    ],
    rows: rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      valuationMethod: r.valuationMethod === "Weighted Average" ? "Weighted Avg Cost" : "FIFO",
      qty: `${r.qty} ${r.unit}`,
      cost: `₹ ${r.cost.toLocaleString("en-IN")}`,
      salePrice: `₹ ${r.salePrice.toLocaleString("en-IN")}`,
      valuation: `₹ ${r.valuation.toLocaleString("en-IN")}`
    }))
  }
}

export function computeLowStockReport(
  items: Item[]
): ReportResult {
  const lowItems = items
    .filter(i => i.currentStock <= (i.minStock || 0))
    .map(i => {
      const shortage = Math.max(0, (i.minStock || 0) - i.currentStock)
      const suggestedReorder = (i.minStock || 10) * 2 - i.currentStock
      return {
        id: i.id,
        code: i.code,
        name: i.name,
        category: i.category,
        currentStock: i.currentStock,
        minStock: i.minStock || 0,
        shortage,
        suggestedReorder,
        unit: i.unit,
        supplierCost: (i.purchasePrice || 0) * suggestedReorder
      }
    })

  const totalShortageSkus = lowItems.length
  const estimatedCost = lowItems.reduce((s, i) => s + i.supplierCost, 0)

  return {
    title: "Low Stock & Reorder Alerts",
    kpiCards: [
      {
        title: "Critical Low Stock SKUs",
        mainValue: `${totalShortageSkus} Products`,
        subItems: [
          { label: "Out of Stock (Zero)", value: `${lowItems.filter(i => i.currentStock <= 0).length}` },
          { label: "Urgent Action", value: "Reorder Required" }
        ]
      },
      {
        title: "Estimated Reorder Capital",
        mainValue: `₹ ${estimatedCost.toLocaleString("en-IN")}`,
        subItems: [
          { label: "Suggested Reorder Qty", value: `${lowItems.reduce((s, i) => s + i.suggestedReorder, 0)} Units` },
          { label: "Status", value: "Safety Buffer Breached" }
        ]
      }
    ],
    columns: [
      { key: "code", label: "SKU Code" },
      { key: "name", label: "Product Name" },
      { key: "category", label: "Category" },
      { key: "currentStock", label: "Current Stock", align: "center" },
      { key: "minStock", label: "Safety Min Buffer", align: "center" },
      { key: "shortage", label: "Deficit / Shortage", align: "center" },
      { key: "suggestedReorder", label: "Suggested Reorder", align: "right" }
    ],
    rows: lowItems.map(i => ({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category,
      currentStock: `${i.currentStock} ${i.unit}`,
      minStock: `${i.minStock} ${i.unit}`,
      shortage: `${i.shortage} ${i.unit}`,
      suggestedReorder: `${i.suggestedReorder} ${i.unit}`
    }))
  }
}

export function computeStockMovementReport(
  stockMovements: StockMovement[],
  filter: ReportFilterOptions
): ReportResult {
  const filtered = stockMovements.filter(m => {
    const d = m.timestamp.slice(0, 10)
    if (!isDateInRange(d, filter.dateRange)) return false
    if (filter.godownId && filter.godownId !== "all" && m.godownId !== filter.godownId) return false
    return true
  })

  return {
    title: "Stock Movement & Item Audit Trail",
    kpiCards: [
      {
        title: "Total Movement Entries",
        mainValue: `${filtered.length} Actions`,
        subItems: [
          { label: "Inward Additions", value: `${filtered.filter(m => m.qtyChange > 0).length}` },
          { label: "Outward Dispatches", value: `${filtered.filter(m => m.qtyChange < 0).length}` }
        ]
      },
      {
        title: "Net Stock Delta",
        mainValue: `${filtered.reduce((s, m) => s + m.qtyChange, 0)} Units`,
        subItems: [
          { label: "Affected SKUs", value: `${new Set(filtered.map(m => m.itemId)).size}` },
          { label: "Audit State", value: "Verified Log" }
        ]
      }
    ],
    columns: [
      { key: "timestamp", label: "Date & Time" },
      { key: "refDocNo", label: "Ref Document" },
      { key: "itemName", label: "Item / Product" },
      { key: "movementType", label: "Action Type" },
      { key: "godownName", label: "Godown" },
      { key: "qtyChange", label: "Qty Change", align: "center" },
      { key: "newStock", label: "Resulting Stock", align: "center" },
      { key: "actor", label: "Operator" }
    ],
    rows: filtered.map(m => ({
      id: m.id,
      timestamp: m.timestamp,
      refDocNo: m.refDocNo,
      itemName: m.batchNo ? `${m.itemName} [Batch: ${m.batchNo}]` : m.itemName,
      movementType: m.movementType.replace("_", " ").toUpperCase(),
      godownName: m.godownName,
      qtyChange: m.qtyChange > 0 ? `+${m.qtyChange}` : `${m.qtyChange}`,
      newStock: `${m.newStock}`,
      actor: m.actor
    }))
  }
}

export function computeBatchExpiryReport(
  items: Item[]
): ReportResult {
  const batchRows: Array<{
    batchNo: string
    itemName: string
    code: string
    mfgDate: string
    expiryDate: string
    qty: number
    cost: number
    sale: number
    value: number
    godownId: string
    status: string
  }> = []

  const today = new Date()

  items.forEach(itm => {
    if (itm.batchDetails && itm.batchDetails.length > 0) {
      itm.batchDetails.forEach(b => {
        const exp = new Date(b.expiryDate)
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let status = "Healthy (> 90 Days)"
        if (diffDays <= 0) status = "EXPIRED"
        else if (diffDays <= 45) status = "Near Expiry (< 45 Days)"
        else if (diffDays <= 90) status = "Moderate (45-90 Days)"

        const cost = b.purchasePrice ?? b.costPrice ?? itm.purchasePrice ?? 0
        const sale = b.salePrice ?? itm.salePrice ?? 0
        const value = b.quantity * cost

        batchRows.push({
          batchNo: b.batchNo,
          itemName: itm.name,
          code: itm.code,
          mfgDate: b.manufacturingDate,
          expiryDate: b.expiryDate,
          qty: b.quantity,
          cost,
          sale,
          value,
          godownId: b.godownId,
          status
        })
      })
    }
  })

  batchRows.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  const expiredCount = batchRows.filter(b => b.status === "EXPIRED").length
  const nearExpiryCount = batchRows.filter(b => b.status.includes("Near Expiry")).length
  const totalBatchValue = batchRows.reduce((sum, b) => sum + b.value, 0)

  return {
    title: "Batch Tracking & Expiry Ageing (FEFO)",
    kpiCards: [
      {
        title: "Active Monitored Batches",
        mainValue: `${batchRows.length} Batches`,
        subItems: [
          { label: "Healthy Batches", value: `${batchRows.filter(b => b.status.includes("Healthy")).length}` },
          { label: "Total Batch Value", value: `₹${totalBatchValue.toLocaleString()}` }
        ]
      },
      {
        title: "Expiry Alerts",
        mainValue: `${expiredCount + nearExpiryCount} Critical Batches`,
        subItems: [
          { label: "Expired", value: `${expiredCount} Batches` },
          { label: "Near Expiry (< 45d)", value: `${nearExpiryCount} Batches` }
        ]
      }
    ],
    columns: [
      { key: "batchNo", label: "Batch No" },
      { key: "itemName", label: "Product Name" },
      { key: "mfgDate", label: "Mfg Date" },
      { key: "expiryDate", label: "Expiry Date" },
      { key: "cost", label: "Cost (₹)", align: "right" },
      { key: "sale", label: "Sale (₹)", align: "right" },
      { key: "qty", label: "Batch Qty", align: "center" },
      { key: "value", label: "Value (₹)", align: "right" },
      { key: "status", label: "Ageing Status", align: "center" }
    ],
    rows: batchRows.map(b => ({
      id: b.batchNo,
      batchNo: b.batchNo,
      itemName: b.itemName,
      mfgDate: b.mfgDate,
      expiryDate: b.expiryDate,
      cost: `₹${b.cost.toFixed(2)}`,
      sale: `₹${b.sale.toFixed(2)}`,
      qty: `${b.qty}`,
      value: `₹${b.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: b.status
    }))
  }
}

export function computeGodownStockReport(
  items: Item[],
  godowns: Godown[]
): ReportResult {
  const rows = items.map(itm => {
    const row: any = {
      id: itm.id,
      code: itm.code,
      name: itm.name,
      totalStock: `${itm.currentStock} ${itm.unit}`
    }

    godowns.forEach(g => {
      row[g.id] = `${itm.stockByGodown[g.id] || 0} ${itm.unit}`
    })

    return row
  })

  const columns: TableColumn<any>[] = [
    { key: "code", label: "Item SKU" },
    { key: "name", label: "Product Name" },
    ...godowns.map(g => ({
      key: g.id,
      label: `${g.name}`,
      align: "center" as const
    })),
    { key: "totalStock", label: "Total Physical Stock", align: "right" }
  ]

  return {
    title: "Godown-wise Stock Distribution",
    kpiCards: [
      {
        title: "Active Warehouses",
        mainValue: `${godowns.length} Locations`,
        subItems: [
          { label: "Default Warehouse", value: godowns.find(g => g.isDefault)?.name || "Central Store" },
          { label: "Total SKUs Distributed", value: `${items.length}` }
        ]
      },
      {
        title: "Total Inventory Units",
        mainValue: `${items.reduce((s, i) => s + i.currentStock, 0)} Units`,
        subItems: [
          { label: "Locations Covered", value: `${godowns.map(g => g.name).join(", ")}` }
        ]
      }
    ],
    columns,
    rows
  }
}

// -------------------------------------------------------------
// 5. TDS & TCS WITHHOLDING REPORTS
// -------------------------------------------------------------

export function computeTdsTcsReceivablesReport(
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  // 1. TDS on Sales: Tax deducted by customers on our sales invoices (Asset - Form 26AS credit)
  const tdsSales = salesDocs
    .filter(doc => {
      if (doc.type !== "invoice") return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId) return false
      return doc.withholdingType === "TDS" && (doc.withholdingAmount || 0) > 0
    })
    .map(doc => {
      const section = doc.withholdingRate === 0.1 ? "194Q (Goods > ₹50L)" : doc.withholdingRate === 1 || doc.withholdingRate === 2 ? "194C (Contractor)" : doc.withholdingRate === 10 ? "194J (Professional)" : "194 (TDS on Sales)"
      return {
        id: `tds-rec-${doc.id}`,
        date: doc.date,
        docNo: doc.docNo,
        category: "TDS on Sales (Asset)",
        partyName: doc.partyName,
        partyGstin: doc.partyGstin || "Unregistered",
        section,
        taxable: doc.subtotal || 0,
        rate: `${doc.withholdingRate || 0}%`,
        amount: doc.withholdingAmount || 0,
        status: "Available in 26AS"
      }
    })

  // 2. TCS on Purchases: Tax collected by vendors from us on purchases (Asset - Tax Credit)
  const tcsPurchases = purchaseDocs
    .filter(doc => {
      if (doc.type !== "bill") return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId) return false
      return doc.withholdingType === "TCS" && (doc.withholdingAmount || 0) > 0
    })
    .map(doc => {
      const section = doc.withholdingRate === 0.1 ? "206C(1H) (Goods > ₹50L)" : doc.withholdingRate === 1 ? "206C(1) (Timber/Scrap)" : "206C (TCS on Purchases)"
      return {
        id: `tcs-rec-${doc.id}`,
        date: doc.date,
        docNo: doc.docNo,
        category: "TCS on Purchases (Credit)",
        partyName: doc.partyName,
        partyGstin: doc.partyGstin || "Unregistered",
        section,
        taxable: doc.subtotal || 0,
        rate: `${doc.withholdingRate || 0}%`,
        amount: doc.withholdingAmount || 0,
        status: "Form 26AS / AIS"
      }
    })

  const combined = [...tdsSales, ...tcsPurchases].sort((a, b) => b.date.localeCompare(a.date))

  const totalTdsReceivable = tdsSales.reduce((sum, r) => sum + r.amount, 0)
  const totalTcsReceivable = tcsPurchases.reduce((sum, r) => sum + r.amount, 0)
  const totalReceivable = totalTdsReceivable + totalTcsReceivable
  const totalTurnover = combined.reduce((sum, r) => sum + (r.taxable || 0), 0)

  return {
    title: "TDS / TCS Receivables Report",
    kpiCards: [
      {
        title: "Total TDS/TCS Receivables",
        mainValue: `₹ ${totalReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "TDS on Sales (Asset)", value: `₹ ${totalTdsReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "TCS on Purchases (Credit)", value: `₹ ${totalTcsReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]
      },
      {
        title: "Total Eligible Base Turnover",
        mainValue: `₹ ${totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Transactions", value: `${combined.length} Transactions` },
          { label: "Income Tax Status", value: "Claimable in ITR" }
        ]
      },
      {
        title: "Credit Set-Off Eligibility",
        mainValue: "100% Eligible",
        subItems: [
          { label: "Adjustable Against", value: "Advance Tax / Self-Assessment" },
          { label: "Form 26AS Status", value: "Reconciled" }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Doc #" },
      { key: "category", label: "Withholding Type" },
      { key: "partyName", label: "Customer / Vendor" },
      { key: "partyGstin", label: "GSTIN / PAN" },
      { key: "section", label: "Statutory Section" },
      { key: "taxable", label: "Base Amount ₹", align: "right" },
      { key: "rate", label: "Rate", align: "center" },
      { key: "amount", label: "Receivable Amount ₹", align: "right" },
      { key: "status", label: "ITR / AIS Status", align: "center" }
    ],
    rows: combined.map(r => ({
      ...r,
      taxable: `₹ ${(r.taxable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      amount: `₹ ${r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    }))
  }
}

export function computeTdsTcsPayablesReport(
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  // 1. TDS Deducted on Purchases: Tax we deducted from vendor bills (Liability to deposit to Govt)
  const tdsPurchases = purchaseDocs
    .filter(doc => {
      if (doc.type !== "bill") return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId) return false
      return doc.withholdingType === "TDS" && (doc.withholdingAmount || 0) > 0
    })
    .map(doc => {
      const section = doc.withholdingRate === 0.1 ? "194Q (Goods > ₹50L)" : doc.withholdingRate === 1 || doc.withholdingRate === 2 ? "194C (Contractors)" : doc.withholdingRate === 10 ? "194J (Fees/Services)" : "194 (TDS Deducted)"
      return {
        id: `tds-pay-${doc.id}`,
        date: doc.date,
        docNo: doc.docNo,
        category: "TDS Deducted on Purchase (Liability)",
        partyName: doc.partyName,
        partyGstin: doc.partyGstin || "Unregistered",
        section,
        dueDate: "7th of next month",
        taxable: doc.subtotal || 0,
        rate: `${doc.withholdingRate || 0}%`,
        amount: doc.withholdingAmount || 0,
        status: "Pending Deposit"
      }
    })

  // 2. TCS Collected on Sales: Tax we collected from buyers on sales invoices (Liability to deposit to Govt)
  const tcsSales = salesDocs
    .filter(doc => {
      if (doc.type !== "invoice") return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId) return false
      return doc.withholdingType === "TCS" && (doc.withholdingAmount || 0) > 0
    })
    .map(doc => {
      const section = doc.withholdingRate === 0.1 ? "206C(1H) (Turnover > ₹50L)" : "206C (TCS Collected)"
      return {
        id: `tcs-pay-${doc.id}`,
        date: doc.date,
        docNo: doc.docNo,
        category: "TCS Collected on Sale (Liability)",
        partyName: doc.partyName,
        partyGstin: doc.partyGstin || "Unregistered",
        section,
        dueDate: "7th of next month",
        taxable: doc.subtotal || 0,
        rate: `${doc.withholdingRate || 0}%`,
        amount: doc.withholdingAmount || 0,
        status: "Pending Deposit"
      }
    })

  const combined = [...tdsPurchases, ...tcsSales].sort((a, b) => b.date.localeCompare(a.date))

  const totalTdsPayable = tdsPurchases.reduce((sum, r) => sum + r.amount, 0)
  const totalTcsPayable = tcsSales.reduce((sum, r) => sum + r.amount, 0)
  const totalPayable = totalTdsPayable + totalTcsPayable
  const totalTransactionBase = combined.reduce((sum, r) => sum + (r.taxable || 0), 0)

  return {
    title: "TDS / TCS Payables Report",
    kpiCards: [
      {
        title: "Total TDS / TCS Payables",
        mainValue: `₹ ${totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "TDS on Purchases (Liability)", value: `₹ ${totalTdsPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "TCS on Sales (Liability)", value: `₹ ${totalTcsPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]
      },
      {
        title: "Statutory Deposit Due",
        mainValue: "7th of Next Month",
        subItems: [
          { label: "Challan Form", value: "ITNS 281" },
          { label: "Filing Frequency", value: "Monthly Deposit / Qtr Return" }
        ]
      },
      {
        title: "Total Transaction Base",
        mainValue: `₹ ${totalTransactionBase.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Total Transactions", value: `${combined.length} Transactions` },
          { label: "Compliance Status", value: totalPayable > 0 ? "Deposit Action Needed" : "All Clear" }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Doc #" },
      { key: "category", label: "Withholding Liability" },
      { key: "partyName", label: "Vendor / Customer" },
      { key: "partyGstin", label: "GSTIN / PAN" },
      { key: "section", label: "Statutory Section" },
      { key: "taxable", label: "Base Amount ₹", align: "right" },
      { key: "rate", label: "Rate", align: "center" },
      { key: "amount", label: "Payable Amount ₹", align: "right" },
      { key: "dueDate", label: "Challan Due Date", align: "center" },
      { key: "status", label: "Payment Status", align: "center" }
    ],
    rows: combined.map(r => ({
      ...r,
      taxable: `₹ ${(r.taxable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      amount: `₹ ${r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    }))
  }
}

// -------------------------------------------------------------
// CREDIT WISE LEDGER & AGING REPORT
// -------------------------------------------------------------

export function computeCreditLedgerReport(
  parties: Party[],
  salesDocs: SalesDocument[],
  purchaseDocs: PurchaseDocument[],
  filter: ReportFilterOptions
): ReportResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Credit Sales
  const creditSales = salesDocs
    .filter(doc => {
      const isCreditDoc = doc.isCredit || doc.paymentMode === "credit" || (doc.balanceAmount !== undefined && doc.balanceAmount > 0)
      if (!isCreditDoc) return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId && doc.partyName !== filter.partyId) return false
      return true
    })
    .map(doc => {
      const balance = doc.balanceAmount ?? (doc.status === "paid" ? 0 : doc.grandTotal)
      const dueDateObj = doc.dueDate ? new Date(doc.dueDate) : new Date(doc.date)
      dueDateObj.setHours(0, 0, 0, 0)
      const diffTime = today.getTime() - dueDateObj.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      let agingBracket = "Current"
      let isOverdue = false
      if (balance <= 0) {
        agingBracket = "Settled"
      } else if (diffDays > 60) {
        agingBracket = "60+ Days Overdue"
        isOverdue = true
      } else if (diffDays > 30) {
        agingBracket = "31-60 Days Overdue"
        isOverdue = true
      } else if (diffDays > 0) {
        agingBracket = "1-30 Days Overdue"
        isOverdue = true
      }

      const party = parties.find(p => p.id === doc.partyId || (p.name && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))
      const limit = party?.creditLimit ?? 100000
      const custCreditDocs = salesDocs.filter(s => (s.partyId === party?.id || s.partyName === party?.name) && (s.isCredit || s.paymentMode === "credit"))
      const used = custCreditDocs.reduce((acc, s) => acc + Math.max(0, s.grandTotal - (s.paidAmount || 0)), 0)
      const avail = Math.max(0, limit - used)

      return {
        id: doc.id,
        date: doc.date,
        docNo: doc.docNo,
        partyId: doc.partyId,
        partyName: doc.partyName,
        partyType: "Customer",
        txType: "Credit Sale",
        creditTerms: doc.creditTerms || "Net 30",
        totalAmount: doc.grandTotal,
        paidAmount: doc.paidAmount || (doc.status === "paid" ? doc.grandTotal : 0),
        balanceDue: balance,
        creditLimit: limit,
        availableCredit: avail,
        dueDate: doc.dueDate || "On Receipt",
        agingBracket,
        isOverdue,
        isReceivable: true
      }
    })

  // 2. Vendor Credit Purchases
  const creditPurchases = purchaseDocs
    .filter(doc => {
      const isCreditDoc = doc.isCredit || doc.paymentMode === "credit" || ((doc.grandTotal - (doc.paidAmount || 0)) > 0)
      if (!isCreditDoc) return false
      if (!isDateInRange(doc.date, filter.dateRange)) return false
      if (filter.partyId && filter.partyId !== "all" && doc.partyId !== filter.partyId && doc.partyName !== filter.partyId) return false
      return true
    })
    .map(doc => {
      const balance = Math.max(0, doc.grandTotal - (doc.paidAmount || 0))
      const dueDateObj = doc.dueDate ? new Date(doc.dueDate) : new Date(doc.date)
      dueDateObj.setHours(0, 0, 0, 0)
      const diffTime = today.getTime() - dueDateObj.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      let agingBracket = "Current"
      let isOverdue = false
      if (balance <= 0) {
        agingBracket = "Settled"
      } else if (diffDays > 60) {
        agingBracket = "60+ Days Overdue"
        isOverdue = true
      } else if (diffDays > 30) {
        agingBracket = "31-60 Days Overdue"
        isOverdue = true
      } else if (diffDays > 0) {
        agingBracket = "1-30 Days Overdue"
        isOverdue = true
      }

      const party = parties.find(p => p.id === doc.partyId || (p.name && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))
      const limit = party?.creditLimit ?? 100000
      const vendCreditDocs = purchaseDocs.filter(b => (b.partyId === party?.id || b.partyName === party?.name) && (b.isCredit || b.paymentMode === "credit"))
      const used = vendCreditDocs.reduce((acc, b) => acc + Math.max(0, b.grandTotal - (b.paidAmount || 0)), 0)
      const avail = Math.max(0, limit - used)

      return {
        id: doc.id,
        date: doc.date,
        docNo: doc.docNo,
        partyId: doc.partyId,
        partyName: doc.partyName,
        partyType: "Vendor",
        txType: "Vendor Credit",
        creditTerms: doc.creditTerms || "Net 30",
        totalAmount: doc.grandTotal,
        paidAmount: doc.paidAmount || 0,
        balanceDue: balance,
        creditLimit: limit,
        availableCredit: avail,
        dueDate: doc.dueDate || "On Receipt",
        agingBracket,
        isOverdue,
        isReceivable: false
      }
    })

  const combined = [...creditSales, ...creditPurchases].sort((a, b) => (b.date > a.date ? 1 : -1))

  const totalReceivable = creditSales.reduce((acc, s) => acc + s.balanceDue, 0)
  const totalPayable = creditPurchases.reduce((acc, p) => acc + p.balanceDue, 0)
  const overdueReceivable = creditSales.filter(s => s.isOverdue).reduce((acc, s) => acc + s.balanceDue, 0)
  const overduePayable = creditPurchases.filter(p => p.isOverdue).reduce((acc, p) => acc + p.balanceDue, 0)

  const relevantParties = (filter.partyId && filter.partyId !== "all")
    ? parties.filter(p => p.id === filter.partyId || p.name === filter.partyId)
    : parties
  const totalSanctionedLimit = relevantParties.reduce((acc, p) => acc + (p.creditLimit || 0), 0)
  const totalUsedCredit = relevantParties.reduce((acc, p) => {
    const isCust = p.type === "customer" || p.type === "both"
    const used = isCust ? Math.max(0, p.balance) : (p.balance < 0 ? Math.abs(p.balance) : 0)
    return acc + used
  }, 0)
  const totalAvailableHeadroom = Math.max(0, totalSanctionedLimit - totalUsedCredit)

  return {
    title: "Credit Wise Ledger & Ageing Report",
    actionButtonLabel: "Add Sale Invoice",
    actionModule: "sales",
    kpiCards: [
      {
        title: "Outstanding Receivables",
        mainValue: `₹ ${totalReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Active Credit Invoices", value: `${creditSales.filter(s => s.balanceDue > 0).length} Invoices` },
          { label: "Total Credit Sales Base", value: `₹ ${creditSales.reduce((acc, s) => acc + s.totalAmount, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` }
        ]
      },
      {
        title: "Outstanding Payables",
        mainValue: `₹ ${totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Active Vendor Bills", value: `${creditPurchases.filter(p => p.balanceDue > 0).length} Bills` },
          { label: "Total Vendor Credit Base", value: `₹ ${creditPurchases.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` }
        ]
      },
      {
        title: "Overdue Exposure",
        mainValue: `₹ ${(overdueReceivable + overduePayable).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subItems: [
          { label: "Overdue from Customers", value: `₹ ${overdueReceivable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { label: "Overdue to Vendors", value: `₹ ${overduePayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` }
        ]
      },
      {
        title: "Sanctioned Credit Limit",
        mainValue: `₹ ${totalSanctionedLimit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        subItems: [
          { label: "Limit Utilization", value: totalSanctionedLimit > 0 ? `${Math.min(100, Math.round((totalUsedCredit / totalSanctionedLimit) * 100))}%` : "0%" },
          { label: "Available Headroom", value: `₹ ${totalAvailableHeadroom.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` }
        ]
      }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "docNo", label: "Document #" },
      { key: "txType", label: "Credit Type" },
      { key: "partyName", label: "Party Name" },
      { key: "partyType", label: "Party Category" },
      { key: "creditTerms", label: "Credit Terms" },
      { key: "totalAmount", label: "Total Amount ₹", align: "right" },
      { key: "paidAmount", label: "Paid / Settled ₹", align: "right" },
      { key: "balanceDue", label: "Balance Due ₹", align: "right" },
      { key: "creditLimit", label: "Credit Limit ₹", align: "right" },
      { key: "availableCredit", label: "Available Credit ₹", align: "right" },
      { key: "dueDate", label: "Due Date", align: "center" },
      { key: "agingBracket", label: "Ageing / Status", align: "center" }
    ],
    rows: combined.map(r => ({
      ...r,
      totalAmount: `₹ ${r.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      paidAmount: `₹ ${r.paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      balanceDue: `₹ ${r.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      creditLimit: `₹ ${r.creditLimit.toLocaleString("en-IN")}`,
      availableCredit: `₹ ${r.availableCredit.toLocaleString("en-IN")}`
    }))
  }
}

// -------------------------------------------------------------
// EXPORT HELPERS (CSV / Excel download & Printing)
// -------------------------------------------------------------

export function exportReportToCsv(report: ReportResult) {
  if (!report.rows.length) {
    alert("No data available to export.")
    return
  }

  const headers = report.columns.map(c => `"${c.label}"`).join(",")
  const lines = report.rows.map(row => {
    return report.columns.map(c => {
      const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]).replace(/"/g, '""') : ""
      return `"${val}"`
    }).join(",")
  })

  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...lines].join("\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  const filename = `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printReport() {
  window.print()
}

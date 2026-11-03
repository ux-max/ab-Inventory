"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { NewInvoiceForm } from "@/components/forms/NewInvoiceForm"
import { NewSalesOrderForm } from "@/components/forms/NewSalesOrderForm"
import { NewDeliveryChallanForm } from "@/components/forms/NewDeliveryChallanForm"
import { NewQuotationForm } from "@/components/forms/NewQuotationForm"
import { NewProformaForm } from "@/components/forms/NewProformaForm"
import { NewSalesReturnForm } from "@/components/forms/NewSalesReturnForm"
import { NewCreditNoteForm } from "@/components/forms/NewCreditNoteForm"
import { RecordPaymentForm } from "@/components/forms/RecordPaymentForm"
import { PaymentDetailView } from "./PaymentDetailView"
import { InvoiceDetailView } from "./InvoiceDetailView"
import { OrderDetailView } from "./OrderDetailView"
import { ChallanDetailView } from "./ChallanDetailView"
import { QuotationDetailView } from "./QuotationDetailView"
import { ProformaDetailView } from "./ProformaDetailView"
import { SalesReturnDetailView } from "./SalesReturnDetailView"
import { CreditNoteDetailView } from "./CreditNoteDetailView"
import {
  Plus,
  Search,
  Receipt,
  Truck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Package,
  RotateCcw,
  TrendingUp,
  Clock,
  FileSpreadsheet,
  MoreVertical,
  QrCode,
  ShieldCheck,
  Printer,
  Eye,
  X
} from "lucide-react"
import { GspConnectDrawer } from "@/components/modals/GspConnectDrawer"
import { SalesDocument, InvoiceItem, SalesOrder, DeliveryChallan, Quotation, ProformaInvoice, SalesReturn, CreditNote } from "@/types/inventory"
import { formatINR } from "@/lib/utils"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"

interface SalesModuleProps {
  initialOpenCreate?: boolean
  onCloseCreateTrigger?: () => void
  subModule?: string
}

export function SalesModule({ initialOpenCreate = false, onCloseCreateTrigger, subModule = "invoice" }: SalesModuleProps) {
  const {
    salesDocs,
    salesOrders,
    deliveryChallans,
    quotations,
    proformaInvoices,
    salesReturns,
    creditNotes,
    parties,
    items,
    godowns,
    activeGodownId,
    business,
    createSalesInvoice,
    createSalesOrder,
    createDeliveryChallan,
    createQuotation,
    createProformaInvoice,
    createSalesReturn,
    deleteSalesReturn,
    createCreditNote,
    deleteCreditNote,
    convertQuotationToOrder,
    convertQuotationToInvoice,
    convertProformaToInvoice,
    convertOrderToChallan,
    convertChallanToInvoice,
    convertOrderToInvoice,
    payments,
    gspConnection,
    generateEwayBillForInvoice,
    generateEInvoiceForInvoice
  } = useApp()

  const [menuAnchor, setMenuAnchor] = useState<{
    doc: SalesDocument
    top: number
    right: number
  } | null>(null)
  const [isGspDrawerOpen, setIsGspDrawerOpen] = useState(false)
  const [ewayModalDoc, setEwayModalDoc] = useState<SalesDocument | null>(null)
  const [ewayVehicleNo, setEwayVehicleNo] = useState("MH-04-AB-1092")
  const [ewayDistance, setEwayDistance] = useState<number>(45)
  const [ewayTransporterId, setEwayTransporterId] = useState("TRANS-IN-9821")

  const [activeSubModule, setActiveSubModule] = useState(subModule === "return" ? "credit_notes" : subModule)
  const [viewFilter, setViewFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Selected IDs for Master-Detail views
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedChallanId, setSelectedChallanId] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [selectedProformaId, setSelectedProformaId] = useState<string | null>(null)
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null)
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<string | null>(null)

  // Creation Drawer / Form States
  const [isCreateInvoiceMode, setIsCreateInvoiceMode] = useState(initialOpenCreate && subModule === "invoice")
  const [isCreateOrderMode, setIsCreateOrderMode] = useState(initialOpenCreate && subModule === "orders")
  const [isCreateChallanMode, setIsCreateChallanMode] = useState(initialOpenCreate && subModule === "challan")
  const [isCreateQuotationMode, setIsCreateQuotationMode] = useState(initialOpenCreate && subModule === "quotation")
  const [isCreateProformaMode, setIsCreateProformaMode] = useState(initialOpenCreate && subModule === "proforma")
  const [isCreateSalesReturnMode, setIsCreateSalesReturnMode] = useState(initialOpenCreate && (subModule === "sales_returns" || subModule === "return"))
  const [isCreateCreditNoteMode, setIsCreateCreditNoteMode] = useState(initialOpenCreate && subModule === "credit_notes")
  const [linkedReturnIdForCreditNote, setLinkedReturnIdForCreditNote] = useState<string | undefined>(undefined)
  const [isRecordPaymentMode, setIsRecordPaymentMode] = useState(false)
  const [activePaymentDocId, setActivePaymentDocId] = useState<string | undefined>(undefined)
  const [activePaymentPartyId, setActivePaymentPartyId] = useState<string | undefined>(undefined)
  const [linkedOrderIdForChallan, setLinkedOrderIdForChallan] = useState<string | undefined>(undefined)

  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [inlineSearch, setInlineSearch] = useState("")
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (subModule === "return") {
      setActiveSubModule("credit_notes")
    } else {
      setActiveSubModule(subModule)
    }
    setSelectedDocId(null)
    setSelectedOrderId(null)
    setSelectedChallanId(null)
    setSelectedPaymentId(null)
    setSelectedQuotationId(null)
    setSelectedProformaId(null)
    setSelectedReturnId(null)
    setSelectedCreditNoteId(null)
  }, [subModule])

  useEffect(() => {
    if (!menuAnchor) return
    const handleScrollOrResize = () => setMenuAnchor(null)
    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [menuAnchor])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setActionToast({ message, type })
    setTimeout(() => setActionToast(null), 4000)
  }

  // Filtered Tax Invoices
  const filteredSalesDocs = salesDocs.filter(doc => {
    if (viewFilter === "paid") {
      const isPaid = doc.status === "paid" || doc.balanceAmount === 0
      if (!isPaid) return false
    }
    if (viewFilter === "unpaid") {
      const isUnpaid = (doc.status === "partial" || doc.status === "pending" || doc.balanceAmount > 0) && doc.status !== "cancelled"
      if (!isUnpaid) return false
    }
    if (viewFilter === "cancelled") {
      if (doc.status !== "cancelled") return false
    }
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        doc.docNo.toLowerCase().includes(q) ||
        doc.partyName.toLowerCase().includes(q) ||
        (doc.ewayBillNo && doc.ewayBillNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filtered Sales Orders
  const filteredSalesOrders = salesOrders.filter(so => {
    if (viewFilter === "confirmed" && so.orderStatus !== "confirmed") return false
    if (viewFilter === "fulfilled" && so.orderStatus !== "fulfilled") return false
    if (viewFilter === "unbilled" && so.invoicedStatus === "invoiced") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        so.orderNo.toLowerCase().includes(q) ||
        so.partyName.toLowerCase().includes(q) ||
        (so.referenceNo && so.referenceNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filtered Delivery Challans
  const filteredDeliveryChallans = deliveryChallans.filter(dc => {
    if (viewFilter === "dispatch" && dc.challanType !== "goods_dispatch") return false
    if (viewFilter === "approval" && dc.challanType !== "supply_on_approval") return false
    if (viewFilter === "job_work" && dc.challanType !== "job_work") return false
    if (viewFilter === "unbilled" && dc.status === "invoiced") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        dc.challanNo.toLowerCase().includes(q) ||
        dc.partyName.toLowerCase().includes(q) ||
        dc.vehicleNo.toLowerCase().includes(q) ||
        dc.transporter.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Filtered Payments In
  const paymentsIn = payments.filter(p => p.type === "payment_in")
  const filteredPaymentsIn = paymentsIn.filter(p => {
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        p.paymentNo.toLowerCase().includes(q) ||
        p.partyName.toLowerCase().includes(q) ||
        (p.docNo && p.docNo.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filtered Quotations
  const filteredQuotations = quotations.filter(q => {
    if (viewFilter === "sent" && q.status !== "sent") return false
    if (viewFilter === "accepted" && q.status !== "accepted") return false
    if (viewFilter === "converted" && q.status !== "converted") return false
    if (viewFilter === "expired") {
      const isExpired = q.status === "expired" || (q.validTillDate && new Date(q.validTillDate) < new Date())
      if (!isExpired) return false
    }
    if (inlineSearch.trim()) {
      const qry = inlineSearch.toLowerCase()
      return (
        q.quotationNo.toLowerCase().includes(qry) ||
        q.partyName.toLowerCase().includes(qry)
      )
    }
    return true
  })

  // Filtered Proforma Invoices
  const filteredProformaInvoices = proformaInvoices.filter(p => {
    if (viewFilter === "sent" && p.status !== "sent") return false
    if (viewFilter === "advance_received" && p.status !== "advance_received") return false
    if (viewFilter === "invoiced" && p.status !== "invoiced") return false
    if (inlineSearch.trim()) {
      const qry = inlineSearch.toLowerCase()
      return (
        p.proformaNo.toLowerCase().includes(qry) ||
        p.partyName.toLowerCase().includes(qry)
      )
    }
    return true
  })

  // Filtered Sales Returns
  const filteredSalesReturns = salesReturns.filter(sr => {
    if (viewFilter === "received" && sr.status !== "received") return false
    if (viewFilter === "pending" && sr.status !== "pending") return false
    if (viewFilter === "draft" && sr.status !== "draft") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        sr.returnNo.toLowerCase().includes(q) ||
        sr.customerName.toLowerCase().includes(q) ||
        sr.originalInvoiceNo.toLowerCase().includes(q) ||
        (sr.creditNoteNo && sr.creditNoteNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filtered Credit Notes
  const filteredCreditNotes = creditNotes.filter(cn => {
    if (viewFilter === "open" && cn.status !== "open") return false
    if (viewFilter === "applied" && cn.status !== "applied") return false
    if (viewFilter === "closed" && cn.status !== "closed") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        cn.creditNoteNo.toLowerCase().includes(q) ||
        cn.customerName.toLowerCase().includes(q) ||
        cn.originalInvoiceNo.toLowerCase().includes(q) ||
        (cn.salesReturnNo && cn.salesReturnNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  const selectedDoc = salesDocs.find(s => s.id === selectedDocId) || null
  const selectedOrder = salesOrders.find(o => o.id === selectedOrderId) || null
  const selectedChallan = deliveryChallans.find(c => c.id === selectedChallanId) || null
  const selectedPayment = paymentsIn.find(p => p.id === selectedPaymentId) || null
  const selectedQuotation = quotations.find(q => q.id === selectedQuotationId) || null
  const selectedProforma = proformaInvoices.find(p => p.id === selectedProformaId) || null
  const selectedReturn = salesReturns.find(r => r.id === selectedReturnId) || null
  const selectedCreditNote = creditNotes.find(c => c.id === selectedCreditNoteId) || null

  // 1-Click Conversion Handlers
  const handleOrderToChallan = (orderId: string) => {
    const res = convertOrderToChallan(orderId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  const handleOrderToInvoice = (orderId: string) => {
    const res = convertOrderToInvoice(orderId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  const handleChallanToInvoice = (challanId: string) => {
    const res = convertChallanToInvoice(challanId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  const handleQuotationToOrder = (quotationId: string) => {
    const res = convertQuotationToOrder(quotationId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  const handleQuotationToInvoice = (quotationId: string) => {
    const res = convertQuotationToInvoice(quotationId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  const handleProformaToInvoice = (proformaId: string) => {
    const res = convertProformaToInvoice(proformaId)
    if (res.success) {
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  // E-Way Bill & E-Invoice Generation Handlers for Invoices
  const handleTriggerEway = (doc: SalesDocument) => {
    if (!gspConnection?.isConnected) {
      setIsGspDrawerOpen(true)
      showToast("Please connect to E-Way Bill Portal first", "error")
      return
    }
    setEwayModalDoc(doc)
    setEwayVehicleNo(doc.vehicleNo || "MH-04-AB-1092")
    setEwayDistance(45)
    setEwayTransporterId(doc.transporterId || "TRANS-IN-9821")
  }

  const handleConfirmEway = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ewayModalDoc) return
    const res = generateEwayBillForInvoice(ewayModalDoc.docNo, {
      vehicleNo: ewayVehicleNo,
      distanceKm: ewayDistance,
      transporterId: ewayTransporterId
    })
    if (res.success) {
      showToast(`E-Way Bill ${res.ewayBillNo} generated successfully for ${ewayModalDoc.docNo}!`, "success")
      setEwayModalDoc(null)
    } else {
      showToast(res.message, "error")
    }
  }

  const handleTriggerEInvoice = (doc: SalesDocument) => {
    if (!gspConnection?.isConnected) {
      setIsGspDrawerOpen(true)
      showToast("Please connect to E-Invoice Portal first", "error")
      return
    }
    const res = generateEInvoiceForInvoice(doc.docNo)
    if (res.success) {
      showToast(`E-Invoice IRN & Signed QR generated successfully for ${doc.docNo}!`, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  // ==========================================
  // RENDER CREATION FORMS
  // ==========================================
  if (isCreateQuotationMode) {
    return (
      <NewQuotationForm
        onCancel={() => {
          setIsCreateQuotationMode(false)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(quotationNo) => {
          setIsCreateQuotationMode(false)
          showToast(`Quotation ${quotationNo || ""} created successfully!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isCreateProformaMode) {
    return (
      <NewProformaForm
        onCancel={() => {
          setIsCreateProformaMode(false)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(proformaNo) => {
          setIsCreateProformaMode(false)
          showToast(`Proforma Invoice ${proformaNo || ""} generated successfully!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isCreateOrderMode) {
    return (
      <NewSalesOrderForm
        onCancel={() => {
          setIsCreateOrderMode(false)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(orderNo) => {
          setIsCreateOrderMode(false)
          showToast(`Sales Order ${orderNo || ""} created successfully!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isCreateChallanMode) {
    return (
      <NewDeliveryChallanForm
        initialLinkedOrderId={linkedOrderIdForChallan}
        onCancel={() => {
          setIsCreateChallanMode(false)
          setLinkedOrderIdForChallan(undefined)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(challanNo) => {
          setIsCreateChallanMode(false)
          setLinkedOrderIdForChallan(undefined)
          showToast(`Delivery Challan ${challanNo || ""} dispatched and stock deducted!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isCreateInvoiceMode) {
    return (
      <NewInvoiceForm
        onSave={(data) => {
          const party = parties.find(p => p.name?.trim().toLowerCase() === data.partyName?.trim().toLowerCase() || p.id === data.partyId)
          const godown = godowns.find(g => g.id === data.godownId) || godowns[0]
          const partyName = data.partyName?.trim() || party?.name || "Cash Customer"
          const partyGstin = data.partyGstin !== undefined ? data.partyGstin.trim() : (party?.gstin || "")
          const pos = data.placeOfSupply || data.partyStateCode || party?.stateCode || business.stateCode || "27"
          const itemsPayload: InvoiceItem[] = data.items.map((it: any) => {
            const matched = items.find(i => i.id === it.itemId) || items[0]
            return {
              itemId: it.itemId,
              name: it.name,
              sku: it.sku || matched?.code || "",
              hsn: matched?.hsn || "8471",
              qty: it.qty,
              unit: it.unit || "unit",
              rate: it.rate,
              discountPercent: it.discount || 0,
              discountType: it.discountType,
              discountAmount: it.discountAmount,
              gstRate: it.gstRate || 18,
              taxableAmount: it.taxableAmount,
              cgst: it.cgst ?? (data.cgstTotal ? data.cgstTotal / Math.max(1, data.items.length) : 0),
              sgst: it.sgst ?? (data.sgstTotal ? data.sgstTotal / Math.max(1, data.items.length) : 0),
              igst: it.igst ?? (data.igstTotal ? data.igstTotal / Math.max(1, data.items.length) : 0),
              total: it.total,
              purchaseCost: it.purchaseCost !== undefined && it.purchaseCost > 0 ? it.purchaseCost : (matched?.purchasePrice || 0),
              isWholesale: it.isWholesale,
              batchNo: it.batchNo,
              manufacturingDate: it.manufacturingDate,
              expiryDate: it.expiryDate,
              customColumns: it.customColumns,
              description: it.description
            }
          })
          const balance = data.grandTotal - (data.paidAmount || 0)
          const docCurrency = data.currency || (party ? party.currency : "INR") || "INR"
          const docCurrencySymbol = data.currencySymbol || (party ? party.currencySymbol : "₹") || (docCurrency === "USD" ? "$" : docCurrency === "EUR" ? "€" : docCurrency === "AED" ? "د.إ" : docCurrency === "GBP" ? "£" : "₹")
          const docExchangeRate = data.exchangeRate || 1

          const res = createSalesInvoice({
            type: "invoice",
            partyId: party?.id || data.partyId || `party-adhoc-${Date.now()}`,
            partyName: partyName,
            partyGstin: partyGstin,
            partyStateCode: pos,
            placeOfSupply: pos,
            godownId: godown.id,
            godownName: godown.name,
            currency: docCurrency,
            currencySymbol: docCurrencySymbol,
            exchangeRate: docExchangeRate,
            items: itemsPayload,
            subtotal: data.subtotal,
            taxTotal: (data.cgstTotal || 0) + (data.sgstTotal || 0) + (data.igstTotal || 0),
            cgstTotal: data.cgstTotal || 0,
            sgstTotal: data.sgstTotal || 0,
            igstTotal: data.igstTotal || 0,
            roundOff: data.roundOff || 0,
            adjustment: data.adjustment || 0,
            grandTotal: data.grandTotal,
            paidAmount: data.paidAmount || 0,
            balanceAmount: balance,
            paymentMode: data.paymentMode || (data.isCredit ? "credit" : "upi"),
            isCredit: data.isCredit,
            creditTerms: data.creditTerms || data.paymentTerms,
            dueDate: data.dueDate,
            status: data.status || (balance === 0 ? "paid" : ((data.paidAmount || 0) > 0 ? "partial" : "pending")),
            withholdingType: data.withholdingType,
            withholdingRate: data.withholdingRate,
            withholdingAmount: data.withholdingAmount,
            notes: data.notes
          })

          setIsCreateInvoiceMode(false)
          if (res.success) showToast(res.message, "success")
          else showToast(res.message, "error")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onCancel={() => {
          setIsCreateInvoiceMode(false)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isRecordPaymentMode) {
    return (
      <RecordPaymentForm
        type="payment_in"
        defaultPartyId={activePaymentPartyId}
        defaultDocId={activePaymentDocId}
        onCancel={() => {
          setIsRecordPaymentMode(false)
          setActivePaymentDocId(undefined)
          setActivePaymentPartyId(undefined)
        }}
        onSuccess={() => {
          setIsRecordPaymentMode(false)
          setActivePaymentDocId(undefined)
          setActivePaymentPartyId(undefined)
          showToast("Payment In recorded successfully!", "success")
        }}
      />
    )
  }

  if (isCreateSalesReturnMode) {
    return (
      <NewSalesReturnForm
        onCancel={() => {
          setIsCreateSalesReturnMode(false)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(returnNo) => {
          setIsCreateSalesReturnMode(false)
          showToast(`Sales Return ${returnNo || ""} recorded successfully!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  if (isCreateCreditNoteMode) {
    return (
      <NewCreditNoteForm
        initialSalesReturnId={linkedReturnIdForCreditNote}
        onCancel={() => {
          setIsCreateCreditNoteMode(false)
          setLinkedReturnIdForCreditNote(undefined)
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
        onSuccess={(noteNo) => {
          setIsCreateCreditNoteMode(false)
          setLinkedReturnIdForCreditNote(undefined)
          showToast(`Credit Note ${noteNo || ""} issued successfully!`, "success")
          if (onCloseCreateTrigger) onCloseCreateTrigger()
        }}
      />
    )
  }

  // ==========================================
  // MASTER-DETAIL: SALES RETURNS VIEW
  // ==========================================
  if ((activeSubModule === "sales_returns" || activeSubModule === "return") && selectedReturnId && selectedReturn) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Return List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Sales Returns</span>
              <span className="text-xs text-slate-500 font-medium">({filteredSalesReturns.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateSalesReturnMode(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSalesReturns.map(sr => (
              <div
                key={sr.id}
                onClick={() => setSelectedReturnId(sr.id)}
                className={`p-3 text-xs cursor-pointer transition-colors ${sr.id === selectedReturnId
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600 text-blue-900 dark:text-blue-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white font-medium">{sr.returnNo}</span>
                  <span className="text-slate-900 dark:text-white tabular-nums font-semibold">
                    {(() => {
                      const srParty = parties.find(p => p.id === sr.customerId || (p.name && sr.customerName && p.name.trim().toLowerCase() === sr.customerName.trim().toLowerCase()))
                      const sym = sr.currencySymbol || srParty?.currencySymbol || (sr.currency === "USD" ? "$" : "₹")
                      return `${sym}${sym === "₹" ? formatINR(sr.grandTotal) : sr.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })()}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-normal truncate mt-0.5">{sr.customerName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{sr.date}</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{sr.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Return Detail & A4 View */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <SalesReturnDetailView
            salesReturn={selectedReturn}
            onClose={() => setSelectedReturnId(null)}
            onGenerateCreditNote={(srId) => {
              setLinkedReturnIdForCreditNote(srId)
              setIsCreateCreditNoteMode(true)
            }}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: CREDIT NOTES VIEW
  // ==========================================
  if (activeSubModule === "credit_notes" && selectedCreditNoteId && selectedCreditNote) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Credit Note List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Credit Notes</span>
              <span className="text-xs text-slate-500 font-medium">({filteredCreditNotes.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateCreditNoteMode(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCreditNotes.map(cn => (
              <div
                key={cn.id}
                onClick={() => setSelectedCreditNoteId(cn.id)}
                className={`p-3 text-xs cursor-pointer transition-colors ${cn.id === selectedCreditNoteId
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600 text-blue-900 dark:text-blue-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white font-medium">{cn.creditNoteNo}</span>
                  <span className="text-slate-900 dark:text-white tabular-nums font-semibold">
                    {(() => {
                      const cnParty = parties.find(p => p.id === cn.customerId || (p.name && cn.customerName && p.name.trim().toLowerCase() === cn.customerName.trim().toLowerCase()))
                      const sym = cn.currencySymbol || cnParty?.currencySymbol || (cn.currency === "USD" ? "$" : "₹")
                      return `${sym}${sym === "₹" ? formatINR(cn.grandTotal) : cn.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })()}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-normal truncate mt-0.5">{cn.customerName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{cn.date}</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{cn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Credit Note Detail & A4 View */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <CreditNoteDetailView
            creditNote={selectedCreditNote}
            onClose={() => setSelectedCreditNoteId(null)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: QUOTATIONS VIEW
  // ==========================================
  if (activeSubModule === "quotation" && selectedQuotationId && selectedQuotation) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Quotations List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Quotations</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val)}
                options={[
                  { value: "all", label: "All Quotes" },
                  { value: "sent", label: "Sent" },
                  { value: "accepted", label: "Accepted" },
                  { value: "converted", label: "Converted" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateQuotationMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add Quotation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredQuotations.map(qt => {
              const isSelected = qt.id === selectedQuotationId
              return (
                <div
                  key={qt.id}
                  onClick={() => setSelectedQuotationId(qt.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {qt.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {qt.quotationNo} • {qt.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {qt.currencySymbol || parties.find(p => p.id === qt.partyId || (p.name && qt.partyName && p.name.trim().toLowerCase() === qt.partyName.trim().toLowerCase()))?.currencySymbol || "₹"}{qt.grandTotal.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${qt.status === "converted" ? "text-purple-600" : qt.status === "accepted" ? "text-emerald-600" : "text-blue-600"
                      }`}>
                      {qt.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredQuotations.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Quotation Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <QuotationDetailView
            quotation={selectedQuotation}
            onClose={() => setSelectedQuotationId(null)}
            onConvertToOrder={(qid) => handleQuotationToOrder(qid)}
            onConvertToInvoice={(qid) => handleQuotationToInvoice(qid)}
            onEdit={() => setIsCreateQuotationMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: PROFORMA INVOICES VIEW
  // ==========================================
  if (activeSubModule === "proforma" && selectedProformaId && selectedProforma) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Proforma List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Proforma Invoices</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val)}
                options={[
                  { value: "all", label: "All Proforma" },
                  { value: "sent", label: "Sent" },
                  { value: "advance_received", label: "Advance Received" },
                  { value: "invoiced", label: "Invoiced" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateProformaMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add Proforma"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search proforma..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredProformaInvoices.map(pi => {
              const isSelected = pi.id === selectedProformaId
              return (
                <div
                  key={pi.id}
                  onClick={() => setSelectedProformaId(pi.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {pi.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pi.proformaNo} • {pi.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {pi.currencySymbol || parties.find(p => p.id === pi.partyId || (p.name && pi.partyName && p.name.trim().toLowerCase() === pi.partyName.trim().toLowerCase()))?.currencySymbol || "₹"}{pi.grandTotal.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${pi.status === "invoiced" ? "text-purple-600" : pi.status === "advance_received" ? "text-emerald-600" : "text-blue-600"
                      }`}>
                      {pi.status.replace("_", " ").toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredProformaInvoices.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Proforma Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <ProformaDetailView
            proforma={selectedProforma}
            onClose={() => setSelectedProformaId(null)}
            onConvertToInvoice={(pid) => handleProformaToInvoice(pid)}
            onEdit={() => setIsCreateProformaMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: SALES ORDERS VIEW (MATCHING ITEM DETAIL VIEW LAYOUT)
  // ==========================================
  if (activeSubModule === "orders" && selectedOrderId && selectedOrder) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Sales Orders List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Sales Orders</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val)}
                options={[
                  { value: "all", label: "All Orders" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "fulfilled", label: "Fulfilled" },
                  { value: "unbilled", label: "Unbilled" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateOrderMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add Sales Order"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search orders..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSalesOrders.map(so => {
              const isSelected = so.id === selectedOrderId
              return (
                <div
                  key={so.id}
                  onClick={() => setSelectedOrderId(so.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {so.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {so.orderNo} • {so.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {so.currencySymbol || parties.find(p => p.id === so.partyId || (p.name && so.partyName && p.name.trim().toLowerCase() === so.partyName.trim().toLowerCase()))?.currencySymbol || "₹"}{so.grandTotal.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${so.orderStatus === "fulfilled" ? "text-emerald-600" : "text-blue-600"
                      }`}>
                      {so.orderStatus.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredSalesOrders.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Order Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <OrderDetailView
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
            onConvertToChallan={(oid) => handleOrderToChallan(oid)}
            onConvertToInvoice={(oid) => handleOrderToInvoice(oid)}
            onEdit={() => setIsCreateOrderMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: DELIVERY CHALLANS VIEW (MATCHING ITEM DETAIL VIEW LAYOUT)
  // ==========================================
  if (activeSubModule === "challan" && selectedChallanId && selectedChallan) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Delivery Challans List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Delivery Challans</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val)}
                options={[
                  { value: "all", label: "All Challans" },
                  { value: "dispatch", label: "Dispatch" },
                  { value: "approval", label: "Approval" },
                  { value: "job_work", label: "Job Work" },
                  { value: "unbilled", label: "Unbilled" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateChallanMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add Delivery Challan"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search challans..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredDeliveryChallans.map(dc => {
              const isSelected = dc.id === selectedChallanId
              return (
                <div
                  key={dc.id}
                  onClick={() => setSelectedChallanId(dc.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {dc.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {dc.challanNo} • {dc.vehicleNo}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {dc.totalUnits} Units
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5 uppercase text-slate-500">
                      {dc.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredDeliveryChallans.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Challan Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <ChallanDetailView
            challan={selectedChallan}
            onClose={() => setSelectedChallanId(null)}
            onConvertToInvoice={(cid) => handleChallanToInvoice(cid)}
            onEdit={() => setIsCreateChallanMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: INVOICES VIEW
  // ==========================================
  if (activeSubModule === "invoice" && selectedDocId && selectedDoc) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Sales List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">

          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Invoices</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val)}
                options={[
                  { value: "all", label: "All Invoices" },
                  { value: "paid", label: "Paid" },
                  { value: "pending", label: "Pending" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateInvoiceMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add New Invoice"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSalesDocs.map(doc => {
              const isSelected = doc.id === selectedDocId
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {doc.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {doc.docNo} • {doc.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {doc.currencySymbol || parties.find(p => p.id === doc.partyId || (p.name && doc.partyName && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))?.currencySymbol || "₹"}{doc.grandTotal.toFixed(2)}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${doc.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}>
                      {doc.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredSalesDocs.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Invoice Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <InvoiceDetailView
            invoice={selectedDoc}
            onClose={() => setSelectedDocId(null)}
            onEdit={() => setIsCreateInvoiceMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MASTER-DETAIL: PAYMENT RECEIVED VIEW
  // ==========================================
  if (activeSubModule === "payments_received" && selectedPaymentId && selectedPayment) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Payments In List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Payments Received</span>
            </div>

            <Button
              size="sm"
              onClick={() => setIsRecordPaymentMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Record Payment"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search payments..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredPaymentsIn.map(pmt => {
              const isSelected = pmt.id === selectedPaymentId
              return (
                <div
                  key={pmt.id}
                  onClick={() => setSelectedPaymentId(pmt.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {pmt.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pmt.paymentNo} • {pmt.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {pmt.currencySymbol && pmt.currencySymbol !== "₹" ? `${pmt.currencySymbol}${pmt.amount.toFixed(2)}` : `₹${pmt.amount.toLocaleString()}`}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5 uppercase text-slate-500">
                      {pmt.paymentMode}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span>Rows: {filteredPaymentsIn.length}</span>
          </div>
        </div>

        {/* Right: Payment Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <PaymentDetailView
            payment={selectedPayment}
            onClose={() => setSelectedPaymentId(null)}
            onEdit={() => setIsRecordPaymentMode(true)}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // FULL TABLE VIEW (NO ITEM SELECTED)
  // ==========================================
  const totalOrderValue = salesOrders.reduce((sum, so) => sum + so.grandTotal, 0)
  const pendingFulfillmentCount = salesOrders.filter(so => so.orderStatus !== "fulfilled").length
  const readyToInvoiceCount = salesOrders.filter(so => so.orderStatus === "fulfilled" && so.invoicedStatus !== "invoiced").length

  const activeDispatchesCount = deliveryChallans.filter(dc => dc.status === "in_transit" || dc.status === "delivered").length
  const goodsOnApprovalCount = deliveryChallans.filter(dc => dc.challanType === "supply_on_approval").length
  const totalUnitsDispatched = deliveryChallans.reduce((sum, dc) => sum + dc.totalUnits, 0)
  const unbilledChallanCount = deliveryChallans.filter(dc => dc.status !== "invoiced").length

  // All-time business accounting metrics
  const totalInvoicedAmount = salesDocs
    .filter(doc => doc.status !== "cancelled")
    .reduce((sum, doc) => sum + doc.grandTotal, 0)

  const paidInvoicesAmount = salesDocs
    .filter(doc => doc.status !== "cancelled")
    .reduce((sum, doc) => {
      if (doc.status === "paid") return sum + doc.grandTotal
      if (doc.paidAmount) return sum + doc.paidAmount
      if (doc.balanceAmount !== undefined && doc.balanceAmount < doc.grandTotal) {
        return sum + (doc.grandTotal - doc.balanceAmount)
      }
      return sum
    }, 0)

  const unpaidInvoicesAmount = salesDocs
    .filter(doc => doc.status !== "cancelled")
    .reduce((sum, doc) => {
      if (doc.status === "paid") return sum
      return sum + (doc.balanceAmount !== undefined ? doc.balanceAmount : doc.grandTotal)
    }, 0)

  const paginatedSalesDocs = filteredSalesDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedSalesOrders = filteredSalesOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedDeliveryChallans = filteredDeliveryChallans.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedQuotations = filteredQuotations.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedProformaInvoices = filteredProformaInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedSalesReturns = filteredSalesReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedCreditNotes = filteredCreditNotes.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* 1. Zoho Standard Action & Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-12 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Sales
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={activeSubModule}
            onValueChange={(val) => {
              setActiveSubModule(val)
              setSelectedDocId(null)
              setSelectedOrderId(null)
              setSelectedChallanId(null)
              setSelectedPaymentId(null)
              setSelectedQuotationId(null)
              setSelectedProformaId(null)
              setSelectedReturnId(null)
              setSelectedCreditNoteId(null)
              setViewFilter("all")
              setInlineSearch("")
              setCurrentPage(1)
            }}
            options={[
              { value: "invoice", label: "Invoices" },
              { value: "quotation", label: "Quotations / Estimates" },
              { value: "proforma", label: "Proforma Invoices" },
              { value: "orders", label: "Sales Orders" },
              { value: "challan", label: "Delivery Challans" },
              { value: "payments_received", label: "Payment In" },
              { value: "sales_returns", label: "Sales Returns (Inward Slips)" },
              { value: "credit_notes", label: "Credit Notes (GST Section 34)" },
            ]}
            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative hidden sm:block w-48 md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={`Search ${activeSubModule === "quotation" ? "quotes, customer..."
                  : activeSubModule === "proforma" ? "proforma, customer..."
                    : activeSubModule === "orders" ? "orders or PO..."
                      : activeSubModule === "challan" ? "challans, vehicles..."
                        : activeSubModule === "payments_received" ? "payments..."
                          : activeSubModule === "sales_returns" ? "return no, customer..."
                            : activeSubModule === "credit_notes" ? "credit notes, customer..."
                              : "invoices..."
                }`}
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="h-7 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md"
            />
          </div>

          {/* Standard Primary Action Button */}
          {activeSubModule === "quotation" && (
            <Button
              size="sm"
              onClick={() => setIsCreateQuotationMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Quotation</span>
            </Button>
          )}

          {activeSubModule === "proforma" && (
            <Button
              size="sm"
              onClick={() => setIsCreateProformaMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Proforma</span>
            </Button>
          )}

          {activeSubModule === "orders" && (
            <Button
              size="sm"
              onClick={() => setIsCreateOrderMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Sales Order</span>
            </Button>
          )}

          {activeSubModule === "challan" && (
            <Button
              size="sm"
              onClick={() => {
                setLinkedOrderIdForChallan(undefined)
                setIsCreateChallanMode(true)
              }}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Delivery Challan</span>
            </Button>
          )}

          {activeSubModule === "invoice" && (
            <Button
              size="sm"
              onClick={() => setIsCreateInvoiceMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </Button>
          )}

          {activeSubModule === "payments_received" && (
            <Button
              size="sm"
              onClick={() => setIsRecordPaymentMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          {activeSubModule === "sales_returns" && (
            <Button
              size="sm"
              onClick={() => setIsCreateSalesReturnMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Sales Return</span>
            </Button>
          )}

          {activeSubModule === "credit_notes" && (
            <Button
              size="sm"
              onClick={() => {
                setLinkedReturnIdForCreditNote(undefined)
                setIsCreateCreditNoteMode(true)
              }}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Credit Note</span>
            </Button>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionToast && (
        <div className={`mx-4 sm:mx-6 mt-3 p-3 rounded-lg flex items-center justify-between text-xs shadow-xs animate-in fade-in slide-in-from-top-2 ${actionToast.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
            : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
          }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 2. Primary Workspace Body */}
      <div className="p-4 sm:p-6 flex-1 overflow-auto space-y-4">

        {/* ========================================================= */}
        {/* VIEW: QUOTATIONS / ESTIMATES                              */}
        {/* ========================================================= */}
        {activeSubModule === "quotation" && (
          <div className="space-y-4">

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "all" ? "all" : "all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Quotations</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {quotations.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "sent" ? "all" : "sent")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "sent"
                    ? "border-sky-600 bg-sky-50/60 dark:bg-sky-950/25 ring-1 ring-sky-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Active / Sent Quotes</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {quotations.filter(q => q.status === "sent").length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "accepted" ? "all" : "accepted")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "accepted"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Accepted Quotes</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {quotations.filter(q => q.status === "accepted").length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "converted" ? "all" : "converted")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "converted"
                    ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/25 ring-1 ring-purple-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Converted Value</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {formatINR(quotations.filter(q => q.status === "converted").reduce((sum, q) => sum + q.grandTotal, 0))}
                </div>
              </button>
            </div>

            {/* Quotations Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredQuotations.length}
                        indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < filteredQuotations.length}
                        onChange={() => {
                          if (selectedRowIds.length === filteredQuotations.length) setSelectedRowIds([])
                          else setSelectedRowIds(filteredQuotations.map(s => s.id))
                        }}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">QUOTATION #</TableHead>
                    <TableHead className="px-4 py-3">PROSPECT / CUSTOMER</TableHead>
                    <TableHead className="px-4 py-3">DISPATCH GODOWN</TableHead>
                    <TableHead className="px-4 py-3">VALID TILL</TableHead>
                    <TableHead className="px-4 py-3 text-right">ITEMS</TableHead>
                    <TableHead className="px-4 py-3 text-right">ESTIMATED TOTAL</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                        <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No Quotations found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateQuotationMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Create New Quotation
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedQuotations.map(qt => {
                      const isSelected = selectedRowIds.includes(qt.id)
                      const isExpired = qt.status === "expired" || (qt.validTillDate && new Date(qt.validTillDate) < new Date())
                      return (
                        <TableRow
                          key={qt.id}
                          onClick={() => setSelectedQuotationId(qt.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                        >
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRowIds(prev => prev.includes(qt.id) ? prev.filter(x => x !== qt.id) : [...prev, qt.id])
                          }}>
                            <TableCheckbox checked={isSelected} onChange={() => { }} />
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {qt.date}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {qt.quotationNo}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {qt.partyName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            {qt.godownName}
                          </TableCell>

                          <TableCell className={`px-4 py-3.5 text-sm tabular-nums ${isExpired ? "text-rose-600 font-semibold" : "text-slate-600 dark:text-slate-300"}`}>
                            {qt.validTillDate}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right">
                            <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {qt.items.length}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            {(() => {
                              const qtParty = parties.find(p => p.id === qt.partyId || (p.name && qt.partyName && p.name.trim().toLowerCase() === qt.partyName.trim().toLowerCase()))
                              const sym = qt.currencySymbol || qtParty?.currencySymbol || (qt.currency === "USD" ? "$" : "₹")
                              return `${sym}${sym === "₹" ? formatINR(qt.grandTotal) : qt.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            })()}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${qt.status === "converted"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                : qt.status === "accepted"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : qt.status === "sent"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}>
                              {qt.status}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {qt.status !== "converted" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuotationToOrder(qt.id)}
                                  className="h-7 px-2.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                                  title="Convert to Sales Order"
                                >
                                  Order
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuotationToInvoice(qt.id)}
                                  className="h-7 px-2.5 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/40"
                                  title="Direct Invoice"
                                >
                                  Invoice
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-purple-600 font-semibold">
                                {qt.convertedDocNo || "Converted"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredQuotations.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Quotations"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: PROFORMA INVOICES                                   */}
        {/* ========================================================= */}
        {activeSubModule === "proforma" && (
          <div className="space-y-4">

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "all" ? "all" : "all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Proforma</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {proformaInvoices.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "advance_received" ? "all" : "advance_received")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "advance_received"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Advances Received</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {formatINR(proformaInvoices.reduce((sum, p) => sum + (p.advanceReceived || 0), 0))}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "invoiced" ? "all" : "invoiced")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "invoiced"
                    ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/25 ring-1 ring-purple-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Invoiced / Billed</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {proformaInvoices.filter(p => p.status === "invoiced").length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "all" ? "all" : "all")
                  setCurrentPage(1)
                }}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Pending Balances</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {formatINR(proformaInvoices.reduce((sum, p) => sum + Math.max(0, p.grandTotal - (p.advanceReceived || 0)), 0))}
                </div>
              </button>
            </div>

            {/* Proforma Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredProformaInvoices.length}
                        indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < filteredProformaInvoices.length}
                        onChange={() => {
                          if (selectedRowIds.length === filteredProformaInvoices.length) setSelectedRowIds([])
                          else setSelectedRowIds(filteredProformaInvoices.map(s => s.id))
                        }}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">PROFORMA #</TableHead>
                    <TableHead className="px-4 py-3">BUYER / CUSTOMER</TableHead>
                    <TableHead className="px-4 py-3">DUE DATE</TableHead>
                    <TableHead className="px-4 py-3 text-right">GROSS VAL</TableHead>
                    <TableHead className="px-4 py-3 text-right">ADVANCE RCVD</TableHead>
                    <TableHead className="px-4 py-3 text-right">BALANCE DUE</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProformaInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                        <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No Proforma Invoices found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateProformaMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Generate Proforma Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProformaInvoices.map(pi => {
                      const isSelected = selectedRowIds.includes(pi.id)
                      const advanceRcvd = pi.advanceReceived || 0
                      const balance = Math.max(0, pi.grandTotal - advanceRcvd)
                      const isInvoiced = pi.status === "invoiced"
                      return (
                        <TableRow
                          key={pi.id}
                          onClick={() => setSelectedProformaId(pi.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                        >
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRowIds(prev => prev.includes(pi.id) ? prev.filter(x => x !== pi.id) : [...prev, pi.id])
                          }}>
                            <TableCheckbox checked={isSelected} onChange={() => { }} />
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {pi.date}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {pi.proformaNo}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {pi.partyName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {pi.dueDate || "Immediate"}
                          </TableCell>

                          {(() => {
                            const piParty = parties.find(p => p.id === pi.partyId || (p.name && pi.partyName && p.name.trim().toLowerCase() === pi.partyName.trim().toLowerCase()))
                            const sym = pi.currencySymbol || piParty?.currencySymbol || (pi.currency === "USD" ? "$" : "₹")
                            return (
                              <>
                                <TableCell className="px-4 py-3.5 text-right text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                  {sym}{sym === "₹" ? formatINR(pi.grandTotal) : pi.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {advanceRcvd > 0 ? `${sym}${sym === "₹" ? formatINR(advanceRcvd) : advanceRcvd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-right text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                  {sym}{sym === "₹" ? formatINR(balance) : balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                              </>
                            )
                          })()}

                          <TableCell className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${pi.status === "invoiced"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                : pi.status === "advance_received"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              }`}>
                              {pi.status.replace("_", " ")}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {!isInvoiced ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProformaToInvoice(pi.id)}
                                className="h-7 px-3 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                                title="Convert to Commercial Tax Invoice"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                Invoice
                              </Button>
                            ) : (
                              <span className="text-xs text-purple-600 font-semibold">
                                {pi.linkedInvoiceNo || "Billed"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredProformaInvoices.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Proforma Invoices"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SALES ORDERS (SO)                                */}
        {/* ========================================================= */}
        {activeSubModule === "orders" && (
          <div className="space-y-4">

            {/* Clean Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "all" ? "all" : "all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Sales Orders</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {salesOrders.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "confirmed" ? "all" : "confirmed")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "confirmed"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Confirmed Orders</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {salesOrders.filter(so => so.orderStatus === "confirmed").length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "unbilled" ? "all" : "unbilled")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "unbilled"
                    ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/25 ring-1 ring-amber-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Pending Fulfillment</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {pendingFulfillmentCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "fulfilled" ? "all" : "fulfilled")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "fulfilled"
                    ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/25 ring-1 ring-purple-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Ready to Invoice</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {readyToInvoiceCount}
                </div>
              </button>
            </div>

            {/* Sales Orders Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-10 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredSalesOrders.length}
                        indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < filteredSalesOrders.length}
                        onChange={() => {
                          if (selectedRowIds.length === filteredSalesOrders.length) setSelectedRowIds([])
                          else setSelectedRowIds(filteredSalesOrders.map(s => s.id))
                        }}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">ORDER #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER NAME</TableHead>
                    <TableHead className="px-4 py-3">REF PO #</TableHead>
                    <TableHead className="px-4 py-3">EXPECTED DELIVERY</TableHead>
                    <TableHead className="px-4 py-3 text-right">ORDER AMOUNT</TableHead>
                    <TableHead className="px-4 py-3 text-center">ORDER STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-center">INVOICING</TableHead>
                    <TableHead className="px-4 py-3 text-right">QUICK ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                        <Package className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No Sales Orders found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateOrderMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Create First Sales Order
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSalesOrders.map(order => {
                      const isFulfilled = order.orderStatus === "fulfilled"
                      const isInvoiced = order.invoicedStatus === "invoiced"
                      const isSelected = selectedRowIds.includes(order.id)

                      return (
                        <TableRow
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                        >
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRowIds(prev => prev.includes(order.id) ? prev.filter(x => x !== order.id) : [...prev, order.id])
                          }}>
                            <TableCheckbox checked={isSelected} onChange={() => { }} />
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {order.date}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {order.orderNo}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {order.partyName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-400 font-mono">
                            {order.referenceNo || "—"}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-xs text-slate-700 dark:text-slate-300">
                              {order.expectedDeliveryDate}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {(() => {
                              const soParty = parties.find(p => p.id === order.partyId || (p.name && order.partyName && p.name.trim().toLowerCase() === order.partyName.trim().toLowerCase()))
                              const sym = order.currencySymbol || soParty?.currencySymbol || (order.currency === "USD" ? "$" : "₹")
                              return `${sym}${sym === "₹" ? formatINR(order.grandTotal) : order.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            })()}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isFulfilled
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                                }`}
                            >
                              {order.orderStatus}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isInvoiced
                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                            >
                              {order.invoicedStatus === "invoiced" ? "Invoiced" : "Unbilled"}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {!isFulfilled && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOrderToChallan(order.id)}
                                  className="h-7 px-2.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                                  title="Dispatch goods under Rule 55"
                                >
                                  <Truck className="h-3.5 w-3.5 mr-1" />
                                  Challan
                                </Button>
                              )}

                              {!isInvoiced && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOrderToInvoice(order.id)}
                                  className="h-7 px-2.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                                  title="Convert to Tax Invoice"
                                >
                                  <Receipt className="h-3.5 w-3.5 mr-1" />
                                  Invoice
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredSalesOrders.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Sales Orders"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: DELIVERY CHALLANS (DC - RULE 55 CGST)             */}
        {/* ========================================================= */}
        {activeSubModule === "challan" && (
          <div className="space-y-4">

            {/* Clean Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "all" ? "all" : "all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Challans</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {deliveryChallans.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "dispatch" ? "all" : "dispatch")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "dispatch"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Dispatches</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {activeDispatchesCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "approval" ? "all" : "approval")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "approval"
                    ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/25 ring-1 ring-purple-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Goods on Approval</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {goodsOnApprovalCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "unbilled" ? "all" : "unbilled")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "unbilled"
                    ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/25 ring-1 ring-amber-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Unbilled Challans</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {unbilledChallanCount}
                </div>
              </button>
            </div>

            {/* Delivery Challans Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredDeliveryChallans.length}
                        indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < filteredDeliveryChallans.length}
                        onChange={() => {
                          if (selectedRowIds.length === filteredDeliveryChallans.length) setSelectedRowIds([])
                          else setSelectedRowIds(filteredDeliveryChallans.map(s => s.id))
                        }}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3">CHALLAN DATE</TableHead>
                    <TableHead className="px-4 py-3">CHALLAN #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER / RECIPIENT</TableHead>
                    <TableHead className="px-4 py-3">PURPOSE (RULE 55)</TableHead>
                    <TableHead className="px-4 py-3">VEHICLE & TRANSPORTER</TableHead>
                    <TableHead className="px-4 py-3">DISPATCH GODOWN</TableHead>
                    <TableHead className="px-4 py-3 text-right">UNITS</TableHead>
                    <TableHead className="px-4 py-3 text-right">VALUATION</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeliveryChallans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                        <Truck className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No Delivery Challans found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateChallanMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Generate Delivery Challan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDeliveryChallans.map(challan => {
                      const isInvoiced = challan.status === "invoiced"
                      const isSelected = selectedRowIds.includes(challan.id)

                      const badgeConfig =
                        challan.challanType === "supply_on_approval"
                          ? { label: "Approval / Demo", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" }
                          : challan.challanType === "job_work"
                            ? { label: "Job Work", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" }
                            : { label: "Goods Dispatch", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" }

                      return (
                        <TableRow
                          key={challan.id}
                          onClick={() => setSelectedChallanId(challan.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                        >
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRowIds(prev => prev.includes(challan.id) ? prev.filter(x => x !== challan.id) : [...prev, challan.id])
                          }}>
                            <TableCheckbox checked={isSelected} onChange={() => { }} />
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {challan.date}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {challan.challanNo}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {challan.partyName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${badgeConfig.className}`}>
                              {badgeConfig.label}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5">
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">{challan.vehicleNo}</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[170px]">{challan.transporter}</div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            {challan.godownName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right">
                            <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {challan.totalUnits}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatINR(challan.goodsValue)}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${challan.status === "invoiced"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                : challan.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              }`}>
                              {challan.status.replace("_", " ")}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {!isInvoiced ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChallanToInvoice(challan.id)}
                                className="h-7 px-3 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                                title="Generate Tax Invoice from this Challan"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                Bill
                              </Button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                                Invoiced
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredDeliveryChallans.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Delivery Challans"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: TAX INVOICES (COMMERCIAL GST BILLING)             */}
        {/* ========================================================= */}
        {activeSubModule === "invoice" && (
          <div className="space-y-4">
            {/* Tax Invoices Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={selectedRowIds.length > 0 && selectedRowIds.length === filteredSalesDocs.length}
                        indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < filteredSalesDocs.length}
                        onChange={() => {
                          if (selectedRowIds.length === filteredSalesDocs.length) setSelectedRowIds([])
                          else setSelectedRowIds(filteredSalesDocs.map(s => s.id))
                        }}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">INVOICE #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER NAME</TableHead>
                    <TableHead className="px-4 py-3 text-center">PAYMENT STATUS</TableHead>
                    <TableHead className="px-4 py-3">DUE DATE</TableHead>
                    <TableHead className="px-4 py-3 text-right">INVOICE AMOUNT</TableHead>
                    <TableHead className="px-4 py-3 text-right">BALANCE DUE</TableHead>
                    <TableHead className="px-4 py-3 text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No Tax Invoices found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateInvoiceMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Create First Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSalesDocs.map(doc => {
                      const isPaid = doc.status === "paid" || doc.balanceAmount === 0
                      const isCancelled = doc.status === "cancelled"
                      const isSelected = selectedRowIds.includes(doc.id)

                      return (
                        <TableRow
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                        >
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRowIds(prev => prev.includes(doc.id) ? prev.filter(x => x !== doc.id) : [...prev, doc.id])
                          }}>
                            <TableCheckbox checked={isSelected} onChange={() => { }} />
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {doc.date}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {doc.docNo}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {doc.partyName}
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isCancelled
                                  ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                  : isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                                }`}
                            >
                              {isCancelled ? "Cancelled" : isPaid ? "Paid" : "Pending"}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            {doc.dueDate || doc.date}
                          </TableCell>

                          {(() => {
                            const partyForDoc = parties.find(p => p.id === doc.partyId || (p.name && doc.partyName && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))
                            const docSymbol = doc.currencySymbol || partyForDoc?.currencySymbol || (doc.currency === "USD" || partyForDoc?.currency === "USD" ? "$" : doc.currency === "EUR" ? "€" : "₹")
                            return (
                              <>
                                <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                                  {docSymbol}{docSymbol === "₹" ? formatINR(doc.grandTotal) : doc.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums text-rose-600 dark:text-rose-400">
                                  {doc.balanceAmount > 0 ? `${docSymbol}${docSymbol === "₹" ? formatINR(doc.balanceAmount) : doc.balanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                </TableCell>
                              </>
                            )
                          })()}

                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 relative">
                              {doc.balanceAmount > 0 && !isCancelled ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setActivePaymentPartyId(doc.partyId)
                                    setActivePaymentDocId(doc.id)
                                    setIsRecordPaymentMode(true)
                                  }}
                                  className="h-7 px-3 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/40"
                                >
                                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                                  Payment In
                                </Button>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                                  Settled
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (menuAnchor?.doc.id === doc.id) {
                                    setMenuAnchor(null)
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const estimatedHeight = 145
                                    const spaceBelow = window.innerHeight - rect.bottom
                                    const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight

                                    setMenuAnchor({
                                      doc,
                                      top: openUpward ? rect.top - estimatedHeight : rect.bottom + 4,
                                      right: Math.max(16, window.innerWidth - rect.right)
                                    })
                                  }
                                }}
                                className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors border ${
                                  menuAnchor?.doc.id === doc.id
                                    ? "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                }`}
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredSalesDocs.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Invoices"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: PAYMENT IN (PAYMENTS RECEIVED)                    */}
        {/* ========================================================= */}
        {activeSubModule === "payments_received" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">PAYMENT #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER NAME</TableHead>
                    <TableHead className="px-4 py-3">INVOICE #</TableHead>
                    <TableHead className="px-4 py-3">PAYMENT MODE</TableHead>
                    <TableHead className="px-4 py-3">DEPOSIT ACCOUNT</TableHead>
                    <TableHead className="px-4 py-3">REFERENCE #</TableHead>
                    <TableHead className="px-4 py-3 text-right">AMOUNT RECEIVED</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPaymentsIn.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        <CreditCard className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">No payments received yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsRecordPaymentMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                        >
                          Record First Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPaymentsIn.map(pmt => (
                      <TableRow
                        key={pmt.id}
                        onClick={() => setSelectedPaymentId(pmt.id)}
                        className="border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                          {pmt.date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {pmt.paymentNo}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                          {pmt.partyName}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {pmt.docNo || "Advance Settlement"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {pmt.paymentMode}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {pmt.depositAccount || "Default Bank"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-400 font-mono">
                          {pmt.referenceNo || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {pmt.currencySymbol && pmt.currencySymbol !== "₹" ? `${pmt.currencySymbol}${pmt.amount.toFixed(2)}` : formatINR(pmt.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                            Completed
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredPaymentsIn.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Payments Received"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: SALES RETURNS (PHYSICAL INWARD SLIPS)              */}
        {/* ========================================================= */}
        {activeSubModule === "sales_returns" && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter("all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Sales Returns</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {salesReturns.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "received" ? "all" : "received")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "received"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Received (In Stock)</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {formatINR(salesReturns.filter(r => r.status === "received").reduce((acc, r) => acc + r.grandTotal, 0))}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "pending" ? "all" : "pending")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "pending"
                    ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/25 ring-1 ring-amber-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending QC Inspection</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {salesReturns.filter(r => r.status === "pending").length}
                </div>
              </button>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Units Returned</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {salesReturns.reduce((sum, r) => sum + r.items.reduce((s, it) => s + it.qty, 0), 0)}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Filter:</span>
              <button
                onClick={() => { setViewFilter("all"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "all" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                All ({salesReturns.length})
              </button>
              <button
                onClick={() => { setViewFilter("received"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "received" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Received ({salesReturns.filter(r => r.status === "received").length})
              </button>
              <button
                onClick={() => { setViewFilter("pending"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "pending" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Pending QC ({salesReturns.filter(r => r.status === "pending").length})
              </button>
              <button
                onClick={() => { setViewFilter("draft"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "draft" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Draft ({salesReturns.filter(r => r.status === "draft").length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">RETURN SLIP #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER</TableHead>
                    <TableHead className="px-4 py-3">INVOICE REF</TableHead>
                    <TableHead className="px-4 py-3">RECEIVING GODOWN</TableHead>
                    <TableHead className="px-4 py-3">REASON</TableHead>
                    <TableHead className="px-4 py-3 text-right">RETURN VALUE</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-center">CREDIT NOTE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        No sales returns found matching your filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSalesReturns.map(sr => {
                      const g = godowns.find(gd => gd.id === sr.receivingGodownId)
                      return (
                        <TableRow
                          key={sr.id}
                          onClick={() => setSelectedReturnId(sr.id)}
                          className="border-b border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group transition-colors"
                        >
                          <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                            {sr.date}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {sr.returnNo}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                            {sr.customerName}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            {sr.originalInvoiceNo}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                            {g?.name || "Main Godown"}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 capitalize">
                            {sr.reason.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {(() => {
                              const srParty = parties.find(p => p.id === sr.customerId || (p.name && sr.customerName && p.name.trim().toLowerCase() === sr.customerName.trim().toLowerCase()))
                              const sym = sr.currencySymbol || srParty?.currencySymbol || (sr.currency === "USD" ? "$" : "₹")
                              return `${sym}${sym === "₹" ? formatINR(sr.grandTotal) : sr.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            })()}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${sr.status === "received" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : sr.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                              }`}>
                              {sr.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center">
                            {sr.creditNoteNo ? (
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {sr.creditNoteNo}
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setLinkedReturnIdForCreditNote(sr.id)
                                  setIsCreateCreditNoteMode(true)
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                + Gen Note
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredSalesReturns.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Sales Returns"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: CREDIT NOTES (GST SECTION 34)                      */}
        {/* ========================================================= */}
        {activeSubModule === "credit_notes" && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setViewFilter("all")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "all"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Credit Notes</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {creditNotes.length}
                </div>
              </button>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Credit Issued</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  ₹{formatINR(creditNotes.reduce((sum, cn) => sum + cn.grandTotal, 0))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewFilter(viewFilter === "open" ? "all" : "open")
                  setCurrentPage(1)
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${viewFilter === "open"
                    ? "border-sky-600 bg-sky-50/60 dark:bg-sky-950/25 ring-1 ring-sky-600/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Open Credits Available</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  ₹{formatINR(creditNotes.filter(cn => cn.status === "open").reduce((sum, cn) => sum + cn.grandTotal, 0))}
                </div>
              </button>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">GST Tax Liability Adjusted</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  ₹{formatINR(creditNotes.reduce((sum, cn) => sum + (cn.cgstTotal + cn.sgstTotal + cn.igstTotal), 0))}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Filter:</span>
              <button
                onClick={() => { setViewFilter("all"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "all" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                All ({creditNotes.length})
              </button>
              <button
                onClick={() => { setViewFilter("open"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "open" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Open ({creditNotes.filter(cn => cn.status === "open").length})
              </button>
              <button
                onClick={() => { setViewFilter("applied"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "applied" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Applied ({creditNotes.filter(cn => cn.status === "applied").length})
              </button>
              <button
                onClick={() => { setViewFilter("closed"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${viewFilter === "closed" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                Closed ({creditNotes.filter(cn => cn.status === "closed").length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="px-4 py-3">DATE</TableHead>
                    <TableHead className="px-4 py-3">CREDIT NOTE #</TableHead>
                    <TableHead className="px-4 py-3">CUSTOMER</TableHead>
                    <TableHead className="px-4 py-3">INVOICE REF</TableHead>
                    <TableHead className="px-4 py-3">SALES RETURN #</TableHead>
                    <TableHead className="px-4 py-3">REASON</TableHead>
                    <TableHead className="px-4 py-3">PLACE OF SUPPLY</TableHead>
                    <TableHead className="px-4 py-3 text-right">CREDIT VALUE</TableHead>
                    <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCreditNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        No credit notes found matching your filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCreditNotes.map(cn => (
                      <TableRow
                        key={cn.id}
                        onClick={() => setSelectedCreditNoteId(cn.id)}
                        className="border-b border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group transition-colors"
                      >
                        <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                          {cn.date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {cn.creditNoteNo}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                          {cn.customerName}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {cn.originalInvoiceNo}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {cn.salesReturnNo || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 capitalize">
                          {cn.reason.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {cn.placeOfSupply}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {(() => {
                            const cnParty = parties.find(p => p.id === cn.customerId || (p.name && cn.customerName && p.name.trim().toLowerCase() === cn.customerName.trim().toLowerCase()))
                            const sym = cn.currencySymbol || cnParty?.currencySymbol || (cn.currency === "USD" ? "$" : "₹")
                            return `${sym}${sym === "₹" ? formatINR(cn.grandTotal) : cn.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          })()}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${cn.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : cn.status === "applied" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                            {cn.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Pagination
                totalCount={filteredCreditNotes.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="Total Credit Notes"
              />
            </div>
          </div>
        )}

      </div>

      {/* Modal: Generate E-Way Bill */}
      {ewayModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Generate E-Way Bill (EWB-01)</h3>
                  <p className="text-xs text-slate-500">Invoice: {ewayModalDoc.docNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEwayModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEway} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient / Consignee
                </label>
                <input
                  type="text"
                  disabled
                  value={ewayModalDoc.partyName}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-04-AB-1092"
                  value={ewayVehicleNo}
                  onChange={(e) => setEwayVehicleNo(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Approx Distance (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={ewayDistance}
                    onChange={(e) => setEwayDistance(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transporter ID
                  </label>
                  <input
                    type="text"
                    placeholder="TRANS-IN-9821"
                    value={ewayTransporterId}
                    onChange={(e) => setEwayTransporterId(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Invoice Total:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">₹{formatINR(ewayModalDoc.grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>GSP Provider:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Masters India (Active)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEwayModalDoc(null)}
                  className="h-8 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Generate E-Way Bill
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Menu for Invoices (Simple & Clean) */}
      {menuAnchor && (
        <>
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={() => setMenuAnchor(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenuAnchor(null)
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${menuAnchor.top}px`,
              right: `${menuAnchor.right}px`
            }}
            className="w-48 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1 z-50 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Generate E-Way Bill */}
            <button
              type="button"
              onClick={() => {
                const targetDoc = menuAnchor.doc
                setMenuAnchor(null)
                handleTriggerEway(targetDoc)
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Truck className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>Generate E-Way Bill</span>
            </button>

            {/* Generate E-Invoice */}
            <button
              type="button"
              onClick={() => {
                const targetDoc = menuAnchor.doc
                setMenuAnchor(null)
                handleTriggerEInvoice(targetDoc)
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>Generate E-Invoice</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            {/* View Details */}
            <button
              type="button"
              onClick={() => {
                const docId = menuAnchor.doc.id
                setMenuAnchor(null)
                setSelectedDocId(docId)
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>View Details</span>
            </button>

            {/* Print Invoice */}
            <button
              type="button"
              onClick={() => {
                const docId = menuAnchor.doc.id
                setMenuAnchor(null)
                setSelectedDocId(docId)
                setTimeout(() => {
                  window.print()
                }, 150)
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>Print Invoice</span>
            </button>
          </div>
        </>
      )}

      {/* GSP Connection Drawer */}
      <GspConnectDrawer
        isOpen={isGspDrawerOpen}
        onClose={() => setIsGspDrawerOpen(false)}
      />
    </div>
  )
}

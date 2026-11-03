"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  FileText,
  Send,
  X, 
  Search, 
  Settings, 
  Calendar, 
  ChevronDown, 
  ScanLine, 
  Calculator, 
  GripVertical, 
  Image as ImageIcon, 
  PlusCircle, 
  HelpCircle, 
  Trash2,
  Check,
  AlertCircle,
  CreditCard,
  Sliders,
  Plus,
  Layers,
  AlertTriangle,
  Info
} from "lucide-react"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { SelectBatchModal } from "@/components/modals/SelectBatchModal"
import { cn } from "@/lib/utils"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { Badge } from "@/components/ui/badge"
import { AdditionalChargesSection, AdditionalChargeItem } from "@/components/common/AdditionalChargesSection"
import { getPlaceOfSupplyOptions, isInterStateTransaction, getGstRateOptions, getStateNameFromCode } from "@/lib/gstConstants"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"
import { FieldInfo } from "@/components/ui/field-info"

const calculateDueDateFromTerms = (baseDateStr: string, terms: string): string => {
  try {
    const base = new Date(baseDateStr)
    if (isNaN(base.getTime())) return baseDateStr
    if (terms === "Net 15") base.setDate(base.getDate() + 15)
    else if (terms === "Net 30") base.setDate(base.getDate() + 30)
    else if (terms === "Net 45") base.setDate(base.getDate() + 45)
    else if (terms === "Net 60") base.setDate(base.getDate() + 60)
    else if (terms === "Due end of the month") {
      base.setMonth(base.getMonth() + 1, 0)
    }
    return base.toISOString().split("T")[0]
  } catch {
    return baseDateStr
  }
}

interface NewInvoiceFormProps {
  onSave: (invoiceData: any) => void
  onCancel: () => void
}

export function NewInvoiceForm({ onSave, onCancel }: NewInvoiceFormProps) {
  const { 
    parties, 
    items, 
    godowns, 
    activeGodownId, 
    business, 
    gstSettings, 
    documentSettings, 
    tdsRates, 
    tcsRates, 
    taxGroups, 
    termsTemplates, 
    currencies, 
    salesDocs, 
    payments,
    formNotesTerms,
    documentCustomFields,
    formCustomColumns
  } = useApp()

  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = useMemo(
    () => (formCustomColumns?.invoice || []).filter(c => c.isEnabled !== false),
    [formCustomColumns]
  )

  // Custom Fields (form-wise)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const invoiceCustomFields = (documentCustomFields?.invoice || []).filter(f => f.isEnabled !== false)

  // Form Fields
  const [customerId, setCustomerId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [partyGstin, setPartyGstin] = useState("")
  const [placeOfSupply, setPlaceOfSupply] = useState(business.stateCode || "27")
  const [invoiceNo, setInvoiceNo] = useState("INV-000002")
  const [orderNumber, setOrderNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("2026-10-14")
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt")
  const [dueDate, setDueDate] = useState("2026-10-14")
  const [salesperson, setSalesperson] = useState("")
  const [godownId, setGodownId] = useState(activeGodownId || godowns[0]?.id || "godown-1")
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Multi-Currency State (auto-inherited from Customer)
  const [currency, setCurrency] = useState("INR")
  const [currencySymbol, setCurrencySymbol] = useState("₹")
  const [exchangeRate, setExchangeRate] = useState<number>(1)

  const availableCurrencies = (currencies && currencies.length > 0)
    ? currencies.filter(c => c.isActive !== false)
    : [
        { id: "c-inr", code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 1 },
        { id: "c-usd", code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 83.5 },
        { id: "c-eur", code: "EUR", name: "Euro", symbol: "€", exchangeRate: 90.2 },
        { id: "c-aed", code: "AED", name: "UAE Dirham", symbol: "AED", exchangeRate: 22.7 },
        { id: "c-gbp", code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 105.4 }
      ]

  const updateLinesCurrency = (newCurr: string, newRate: number) => {
    setLines(prev => prev.map(l => {
      const it = items.find(i => i.id === l.itemId)
      if (!it) return l
      const isWholesale = Boolean(!it.hasBatch && it.enableWholesale && (Number(l.qty) || 1) >= (it.wholesaleMinQty || 1))
      const hasMrp = Boolean(it.enableMrp && it.mrp)
      const baseRate = hasMrp ? it.mrp : isWholesale ? (it.wholesalePrice || it.salePrice || 0) : (it.salePrice || 0)
      const converted = newCurr === "INR" || !newRate || newRate <= 0
        ? baseRate
        : Number((baseRate / newRate).toFixed(2))
      return { ...l, rate: converted }
    }))
  }

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr)
    const found = availableCurrencies.find(c => c.code === newCurr)
    const newRate = found?.exchangeRate || (newCurr === "INR" ? 1 : 84.10)
    setExchangeRate(newRate)
    const newSym = found?.symbol || (newCurr === "USD" ? "$" : newCurr === "EUR" ? "€" : newCurr === "AED" ? "د.إ" : newCurr === "GBP" ? "£" : "₹")
    setCurrencySymbol(newSym)
    updateLinesCurrency(newCurr, newRate)
  }

  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate)
    updateLinesCurrency(currency, newRate)
  }

  // Line items state
  const [lines, setLines] = useState<Array<{
    itemId: string
    qty: number
    rate: number
    purchaseCost?: number
    discount: number
    discountType?: "percent" | "amount"
    gstRate?: number
    customColumns?: Record<string, string>
    batchNo?: string
    manufacturingDate?: string
    expiryDate?: string
  }>>([
    { itemId: "", qty: 1, rate: 0, discount: 0, discountType: "percent", customColumns: {} }
  ])

  // Batch Selection Modal state
  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean
    lineIndex: number | null
  }>({
    isOpen: false,
    lineIndex: null
  })

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  // Calculation adjustments
  const [discountPercent, setDiscountPercent] = useState<number | string>("")
  const [discountType, setDiscountType] = useState<"%" | "₹">("%")

  // GST Composition Scheme Status
  const isComposition = Boolean(business?.isCompositionScheme || gstSettings?.isCompositionScheme)

  // Withholding Tax (TDS / TCS) settings & state
  const isTcsEnabled = Boolean(gstSettings?.enableTcs)
  const isTdsEnabled = Boolean(gstSettings?.enableTds)
  const isWithholdingEnabled = isTcsEnabled || isTdsEnabled

  const [withholdingType, setWithholdingType] = useState<"TDS" | "TCS">(() => {
    if (gstSettings?.enableTds) return "TDS"
    if (gstSettings?.enableTcs) return "TCS"
    return "TDS"
  })
  const [selectedWithholdingTax, setSelectedWithholdingTax] = useState("")

  // Auto-sync withholding type if one is disabled
  useEffect(() => {
    if (!isTdsEnabled && isTcsEnabled && withholdingType === "TDS") {
      setWithholdingType("TCS")
      setSelectedWithholdingTax("")
    } else if (!isTcsEnabled && isTdsEnabled && withholdingType === "TCS") {
      setWithholdingType("TDS")
      setSelectedWithholdingTax("")
    } else if (!isWithholdingEnabled) {
      setSelectedWithholdingTax("")
    }
  }, [isTdsEnabled, isTcsEnabled, isWithholdingEnabled, withholdingType])

  const [hasAdditionalCharges, setHasAdditionalCharges] = useState(false)
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeItem[]>([])
  const [manualRoundOff, setManualRoundOff] = useState<string | null>(null)

  // Additional sections
  const [customerNotes, setCustomerNotes] = useState(() => formNotesTerms?.invoice?.notes || "Thanks for your business.")
  const [termsAndConditions, setTermsAndConditions] = useState(() => formNotesTerms?.invoice?.terms || "Goods once sold will not be taken back or exchanged. Payment is due within standard terms.")
  const [isCredit, setIsCredit] = useState(false)
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash" | "bank" | "credit">("upi")
  const [hasAdvance, setHasAdvance] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState<number | string>("")
  const [advancePaymentMode, setAdvancePaymentMode] = useState<"bank" | "cash" | "upi" | "cheque">("bank")
  const [errorMsg, setErrorMsg] = useState("")

  // Auto-sync notes and terms if updated from Document Settings Drawer
  useEffect(() => {
    if (formNotesTerms?.invoice) {
      if (formNotesTerms.invoice.notes) setCustomerNotes(formNotesTerms.invoice.notes)
      if (formNotesTerms.invoice.terms) setTermsAndConditions(formNotesTerms.invoice.terms)
    }
  }, [formNotesTerms?.invoice?.notes, formNotesTerms?.invoice?.terms])

  // Apply default terms template if available
  useEffect(() => {
    if (termsTemplates && termsTemplates.length > 0) {
      const defaultTemplate = termsTemplates.find(
        (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes("invoice")) && t.isDefault
      )
      if (defaultTemplate) {
        setTermsAndConditions(defaultTemplate.content)
      }
    }
  }, [termsTemplates])

  // Barcode Scanner Modal State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)


  const handlePartySelect = (name: string) => {
    setCustomerName(name)
    const party = parties.find(p => p.name?.trim().toLowerCase() === name?.trim().toLowerCase() || p.id === name)
    if (party) {
      setCustomerId(party.id)
      setPartyGstin(party.gstin || "")
      if (party.stateCode) {
        setPlaceOfSupply(party.stateCode)
      } else if (party.gstin && party.gstin.length >= 2) {
        setPlaceOfSupply(party.gstin.substring(0, 2))
      }
      // Inherit currency from Customer profile
      const partyCurr = party.currency || "INR"
      const foundCurr = availableCurrencies.find(c => c.code === partyCurr)
      const partySym = party.currencySymbol || foundCurr?.symbol || (partyCurr === "USD" ? "$" : partyCurr === "EUR" ? "€" : partyCurr === "AED" ? "د.إ" : partyCurr === "GBP" ? "£" : "₹")
      const partyRate = foundCurr?.exchangeRate || (partyCurr === "INR" ? 1 : 84.10)
      setCurrency(partyCurr)
      setCurrencySymbol(partySym)
      setExchangeRate(partyRate)
      updateLinesCurrency(partyCurr, partyRate)
      if (party.paymentTerms) {
        setPaymentTerms(party.paymentTerms)
        setDueDate(calculateDueDateFromTerms(invoiceDate, party.paymentTerms))
        setIsCredit(true)
        setPaymentMode("credit")
      }
    } else {
      setCustomerId("")
      setPartyGstin("")
      setCurrency("INR")
      setCurrencySymbol("₹")
      setExchangeRate(1)
      updateLinesCurrency("INR", 1)
    }
  }

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      { itemId: "", qty: 1, rate: 0, discount: 0 }
    ])
  }

  const handleBulkAdd = () => {
    setIsBulkModalOpen(true)
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const newLines = selectedList.map(({ item, qty }) => {
        const validQty = Math.max(1, Number(qty) || 1)
        const isWholesale = Boolean(!item.hasBatch && item.enableWholesale && validQty >= (item.wholesaleMinQty || 1))
        const hasMrp = Boolean(item.enableMrp && item.mrp)
        const baseRate = hasMrp ? item.mrp : isWholesale ? (item.wholesalePrice || item.salePrice || 0) : (item.salePrice || 0)
        const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
        const discount = hasMrp
          ? (isWholesale ? (item.discountOnMrpForWholesale ?? 0) : (item.discountOnMrp ?? 0))
          : (isWholesale ? (item.wholesaleDiscount || 0) : (item.salesDiscount || 0))
        const discountType = hasMrp
          ? (isWholesale ? (item.discountOnMrpForWholesaleType || "percent") : (item.discountOnMrpType || "percent"))
          : (isWholesale ? (item.wholesaleDiscountType || "percent") : (item.salesDiscountType || "percent"))
        return {
          itemId: item.id,
          qty: validQty,
          rate,
          discount,
          discountType
        }
      })
      return [...cleanPrev, ...newLines]
    })
    setIsBulkModalOpen(false)
  }

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) {
      setLines([{ itemId: "", qty: 1, rate: 0, discount: 0 }])
      return
    }
    setLines(lines.filter((_, i) => i !== idx))
  }

  const handleUpdateLine = (
    idx: number, 
    updates: Partial<{ 
      itemId: string
      qty: number
      rate: number
      purchaseCost?: number
      discount: number
      discountType: "percent" | "amount"
      gstRate?: number
      customColumns?: Record<string, string>
      batchNo?: string
      manufacturingDate?: string
      expiryDate?: string
    }>
  ) => {
    let triggeredBatchModal = false
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, ...updates }
      const activeItemId = updates.itemId !== undefined ? updates.itemId : l.itemId
      const activeQty = updates.qty !== undefined ? updates.qty : l.qty
      const found = items.find(it => it.id === activeItemId)

      if (found) {
        if (updates.itemId) {
          // If product changes, reset batch allocation
          updated.batchNo = undefined
          updated.manufacturingDate = undefined
          updated.expiryDate = undefined
          updated.purchaseCost = found.purchasePrice
          if (found.hasBatch) {
            triggeredBatchModal = true
          }
          const isWholesale = Boolean(!found.hasBatch && found.enableWholesale && (activeQty || 1) >= (found.wholesaleMinQty || 1))
          const hasMrp = Boolean(found.enableMrp && found.mrp)
          const baseRate = hasMrp ? found.mrp : isWholesale ? (found.wholesalePrice || found.salePrice || 0) : (found.salePrice || 0)
          updated.rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
          updated.discount = hasMrp
            ? (isWholesale ? (found.discountOnMrpForWholesale ?? 0) : (found.discountOnMrp ?? 0))
            : (isWholesale ? (found.wholesaleDiscount || 0) : (found.salesDiscount || 0))
          updated.discountType = hasMrp
            ? (isWholesale ? (found.discountOnMrpForWholesaleType || "percent") : (found.discountOnMrpType || "percent"))
            : (isWholesale ? (found.wholesaleDiscountType || "percent") : (found.salesDiscountType || "percent"))
          updated.gstRate = found.gstRate ?? 18
        } else if (updates.qty !== undefined && !found.hasBatch && found.enableWholesale && found.wholesaleMinQty) {
          const nowMeets = (activeQty || 0) >= found.wholesaleMinQty
          const wasMeets = (l.qty || 0) >= found.wholesaleMinQty
          if (nowMeets !== wasMeets) {
            const hasMrp = Boolean(found.enableMrp && found.mrp)
            const baseRate = hasMrp ? found.mrp : nowMeets ? (found.wholesalePrice || found.salePrice || 0) : (found.salePrice || 0)
            updated.rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
            updated.discount = hasMrp
              ? (nowMeets ? (found.discountOnMrpForWholesale ?? 0) : (found.discountOnMrp ?? 0))
              : (nowMeets ? (found.wholesaleDiscount || 0) : (found.salesDiscount || 0))
            updated.discountType = hasMrp
              ? (nowMeets ? (found.discountOnMrpForWholesaleType || "percent") : (found.discountOnMrpType || "percent"))
              : (nowMeets ? (found.wholesaleDiscountType || "percent") : (found.salesDiscountType || "percent"))
          }
        }
      }
      return updated
    }))

    if (triggeredBatchModal) {
      setBatchModalState({ isOpen: true, lineIndex: idx })
    }
  }

  const handleBatchSelected = (selected: {
    batchNo: string
    manufacturingDate: string
    expiryDate: string
    allocatedQty: number
    salePrice?: number
    purchasePrice?: number
    costPrice?: number
  }) => {
    if (batchModalState.lineIndex === null) return
    const idx = batchModalState.lineIndex
    const updates: any = {
      batchNo: selected.batchNo,
      manufacturingDate: selected.manufacturingDate,
      expiryDate: selected.expiryDate,
      qty: selected.allocatedQty
    }
    if (selected.salePrice !== undefined && selected.salePrice > 0) {
      updates.rate = currency !== "INR" && exchangeRate > 0
        ? Number((selected.salePrice / exchangeRate).toFixed(2))
        : selected.salePrice
    }
    if (selected.purchasePrice !== undefined && selected.purchasePrice > 0) {
      updates.purchaseCost = selected.purchasePrice
    } else if (selected.costPrice !== undefined && selected.costPrice > 0) {
      updates.purchaseCost = selected.costPrice
    }
    handleUpdateLine(idx, updates)
    setBatchModalState({ isOpen: false, lineIndex: null })
  }

  const handleUpdateLineCustomColumn = (idx: number, columnId: string, val: string) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      return {
        ...l,
        customColumns: {
          ...(l.customColumns || {}),
          [columnId]: val
        }
      }
    }))
  }

  // Inter-state check (Place of Supply vs Business State Code)
  // When enablePlaceOfSupply is disabled in settings, default to intra-state (CGST + SGST)
  const isInterState = Boolean(
    gstSettings?.enablePlaceOfSupply && 
    isInterStateTransaction(placeOfSupply, business.stateCode || "27")
  )

  // Calculate lines
  const calculatedLines = lines.map(line => {
    const itm = items.find(i => i.id === line.itemId)
    const isWholesale = Boolean(!itm?.hasBatch && itm?.enableWholesale && (line.qty || 0) >= (itm?.wholesaleMinQty || 1))
    const lineSubtotal = (line.qty || 0) * (line.rate || 0)
    const lineDiscountAmount = line.discountType === "amount"
      ? Math.min(lineSubtotal, (line.discount || 0) * (line.qty || 1))
      : lineSubtotal * ((line.discount || 0) / 100)
    const taxableAmount = Math.max(0, lineSubtotal - lineDiscountAmount)
    const rawGstRate = line.gstRate !== undefined ? line.gstRate : (itm?.gstRate ?? 18)
    const gstRate = (!gstSettings?.enableGst || isComposition) ? 0 : rawGstRate

    // Assess tax based on MRP if item has calculateTaxOnMrp enabled
    const taxBase = (itm?.calculateTaxOnMrp && itm?.mrp)
      ? (line.qty || 0) * itm.mrp
      : taxableAmount
    const taxAmount = (taxBase * gstRate) / 100
    const cgst = isInterState ? 0 : taxAmount / 2
    const sgst = isInterState ? 0 : taxAmount / 2
    const igst = isInterState ? taxAmount : 0
    const total = taxableAmount + taxAmount

    return {
      itemId: line.itemId,
      name: itm?.name || "",
      code: itm?.code || "",
      unit: itm?.unit || "pcs",
      qty: line.qty || 0,
      rate: line.rate || 0,
      purchaseCost: line.purchaseCost ?? itm?.purchasePrice ?? 0,
      discount: line.discount || 0,
      discountType: line.discountType,
      customColumns: line.customColumns || {},
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst,
      gstRate,
      total,
      isWholesale,
      batchNo: line.batchNo,
      manufacturingDate: line.manufacturingDate,
      expiryDate: line.expiryDate
    }
  })

  // Subtotal before global discount
  const subTotal = calculatedLines.reduce((sum, l) => sum + l.taxableAmount, 0)

  // Global discount
  const numericDiscount = Number(discountPercent) || 0
  const globalDiscountAmount = discountType === "%" 
    ? (subTotal * numericDiscount) / 100 
    : numericDiscount

  const taxableAfterDiscount = Math.max(0, subTotal - globalDiscountAmount)

  // Proportional GST on total invoice
  const discountFactor = subTotal > 0 ? (taxableAfterDiscount / subTotal) : 1
  const lineTaxSum = calculatedLines.reduce((sum, l) => sum + l.taxAmount, 0)
  const totalGst = (!gstSettings?.enableGst || isComposition) ? 0 : (lineTaxSum * discountFactor)
  const cgst = isInterState ? 0 : totalGst / 2
  const sgst = isInterState ? 0 : totalGst / 2
  const igst = isInterState ? totalGst : 0

  // Withholding Tax (TDS/TCS) - strictly respect settings
  const isCurrentTypeActive = (withholdingType === "TDS" && isTdsEnabled) || (withholdingType === "TCS" && isTcsEnabled)
  const withholdingRate = (isCurrentTypeActive && selectedWithholdingTax) ? Number(selectedWithholdingTax) : 0
  const withholdingAmount = (taxableAfterDiscount * withholdingRate) / 100

  // Additional Charges
  const totalAdditionalCharges = hasAdditionalCharges
    ? additionalCharges.reduce((acc, c) => acc + (parseFloat(String(c.amount)) || 0), 0)
    : 0

  // Grand Total & Round Off (TDS reduces invoice receivable; TCS increases invoice total)
  const withholdingAdjustment = isCurrentTypeActive 
    ? (withholdingType === "TDS" ? -withholdingAmount : withholdingAmount) 
    : 0
  const rawGrandTotal = Math.max(0, taxableAfterDiscount + totalGst + withholdingAdjustment + totalAdditionalCharges)
  const autoRoundOff = Number((Math.round(rawGrandTotal) - rawGrandTotal).toFixed(2))
  const roundOff = manualRoundOff !== null ? (Number(manualRoundOff) || 0) : autoRoundOff
  const grandTotal = Number((rawGrandTotal + roundOff).toFixed(2))

  // Advance Received calculation
  const numAdvance = hasAdvance ? (Number(advanceAmount) || 0) : 0
  const balanceDue = isCredit 
    ? (hasAdvance ? Math.max(0, grandTotal - numAdvance) : grandTotal)
    : (hasAdvance ? Math.max(0, grandTotal - numAdvance) : 0)

  // Customer Credit Limit & Available Credit Info
  const selectedParty = parties.find(p => p.name?.trim().toLowerCase() === customerName?.trim().toLowerCase() || p.id === customerName)
  const partyCreditLimit = selectedParty?.creditLimit || 100000
  const partyCurrentBalance = selectedParty?.balance || 0
  const partyUnpaidCredit = salesDocs
    .filter(s => (s.partyId === selectedParty?.id || s.partyName === selectedParty?.name))
    .reduce((acc, s) => {
      if (s.status === "paid") return acc
      const linkedP = payments.filter(pmt => pmt.docId === s.id || pmt.docNo === s.docNo)
      const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
      const totalPaid = Math.max(s.paidAmount || 0, paidFromPayments)
      const bal = s.balanceAmount !== undefined ? s.balanceAmount : Math.max(0, s.grandTotal - totalPaid)
      if (bal <= 0) return acc
      if (s.isCredit || s.paymentMode === "credit" || s.status === "partial" || s.status === "pending") {
        return acc + bal
      }
      return acc
    }, 0)
  const usedCredit = partyUnpaidCredit
  const availableCredit = Math.max(0, partyCreditLimit - usedCredit)

  // Net credit portion of this invoice:
  // Any amount paid in advance is received immediately, so it is strictly excluded from credit limit deduction
  const effectiveInvoiceCredit = isCredit 
    ? (hasAdvance ? Math.max(0, grandTotal - numAdvance) : grandTotal)
    : 0
  const isCreditLimitExceeded = isCredit && effectiveInvoiceCredit > availableCredit

  const handleSubmit = (actionType: "draft" | "send" = "send") => {
    setErrorMsg("")
    if (!customerName.trim()) {
      setErrorMsg("Please select or enter a Customer Name.")
      return
    }

    const validLines = calculatedLines.filter(l => l.itemId !== "")
    if (validLines.length === 0) {
      setErrorMsg("Please select at least one item for the invoice.")
      return
    }

    const missingBatch = validLines.find(l => {
      const itm = items.find(i => i.id === l.itemId)
      return itm?.hasBatch && !l.batchNo
    })
    if (missingBatch) {
      setErrorMsg(`Please select a batch for product "${missingBatch.name}".`)
      return
    }

    const finalPaidAmount = actionType === "draft"
      ? 0
      : isCredit
        ? (hasAdvance ? Math.min(grandTotal, numAdvance) : 0)
        : (hasAdvance ? Math.min(grandTotal, numAdvance) : grandTotal)

    const finalStatus = actionType === "draft"
      ? "draft"
      : finalPaidAmount >= grandTotal && grandTotal > 0
        ? "paid"
        : finalPaidAmount > 0
          ? "partial"
          : "pending"

    const validCharges = hasAdditionalCharges
      ? additionalCharges
          .filter(c => c.name.trim() || Number(c.amount) !== 0)
          .map(c => ({ id: c.id, name: c.name.trim() || "Additional Charge", amount: parseFloat(String(c.amount)) || 0 }))
      : []

    const payload = {
      partyId: customerId || selectedParty?.id,
      partyName: customerName,
      partyGstin,
      partyStateCode: placeOfSupply,
      placeOfSupply,
      docNo: invoiceNo,
      orderNumber,
      date: invoiceDate,
      dueDate,
      paymentTerms,
      isCredit,
      creditTerms: paymentTerms,
      godownId,
      salesperson,
      currency,
      currencySymbol,
      exchangeRate,
      items: validLines,
      subtotal: subTotal,
      discountAmount: globalDiscountAmount,
      taxTotal: totalGst,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      roundOff,
      adjustment: totalAdditionalCharges,
      adjustmentLabel: validCharges[0]?.name || "Additional Charges",
      additionalCharges: validCharges,
      withholdingType: isCurrentTypeActive && withholdingAmount > 0 ? withholdingType : undefined,
      withholdingRate: isCurrentTypeActive && withholdingAmount > 0 ? withholdingRate : undefined,
      withholdingAmount: isCurrentTypeActive && withholdingAmount > 0 ? withholdingAmount : undefined,
      grandTotal,
      paidAmount: finalPaidAmount,
      balanceAmount: Math.max(0, grandTotal - finalPaidAmount),
      paymentMode: isCredit ? "credit" : (hasAdvance ? advancePaymentMode : paymentMode),
      notes: customerNotes || (isComposition ? "Composition taxable person, not eligible to collect tax on supplies." : ""),
      isBillOfSupply: isComposition,
      isComposition: isComposition,
      customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      status: finalStatus
    }

    onSave(payload)
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      
      {/* 1. Header (Sticky Top) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isComposition ? "New Bill of Supply" : "Add Invoice"}
          </h1>
          {isComposition && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Composition Scheme (Section 10)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Document Settings Drawer Button */}
          <button
            type="button"
            onClick={() => setIsDocSettingsOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Configure document fields & visibility"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Document Settings</span>
          </button>

          {/* Button 1: Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </button>

          {/* Button 2: Save as Draft */}
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Save as Draft</span>
          </button>

          {/* Button 3: Save and Send (Primary Blue) */}
          <button
            type="button"
            onClick={() => handleSubmit("send")}
            className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Save and Send</span>
          </button>
        </div>
      </div>

      {/* 2. Main Form Body */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit("send"); }} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-6xl px-8 py-6 space-y-7">
        
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {isComposition && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium shadow-2xs">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Statutory Requirement (Rule 5):</strong> Composition taxable person, not eligible to collect tax on supplies. Customer GST is strictly 0%. This document is generated as a <strong>Bill of Supply</strong> and reports to Form CMP-08.
            </span>
          </div>
        )}

        {/* Row 1: Customer Name* and Place of Supply (Conditional on enablePlaceOfSupply) */}
        <div className={cn("grid gap-8 items-start", (documentSettings.showPlaceOfSupply !== false && gstSettings?.enablePlaceOfSupply) ? "grid-cols-1 md:grid-cols-2" : "max-w-xl")}>
          <div>
            <label className="flex items-center text-xs font-semibold text-rose-500 mb-1.5">
              <span>Customer Name*</span>
              <FieldInfo content="Select the registered buyer or customer party. Their GSTIN and state automatically configure the tax breakdown." title="Customer Party" />
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  searchable
                  allowCustomValue
                  searchPlaceholder="Search customer by name, GSTIN..."
                  value={customerName}
                  onValueChange={(val) => handlePartySelect(val)}
                  placeholder="Please select a customer name"
                  className="w-full h-9 text-xs font-medium"
                  options={parties.map(p => ({
                    value: p.name,
                    label: `${p.name}${p.currency && p.currency !== "INR" ? ` [${p.currency} - ${p.currencySymbol || "$"}]` : ""}`,
                    description: p.gstin ? `GSTIN: ${p.gstin}${p.state ? ` • ${p.state}` : ""}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                  }))}
                />
              </div>

              <button
                type="button"
                className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 transition-colors shadow-2xs cursor-pointer"
                title="Search Customer"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {documentSettings.showPlaceOfSupply !== false && gstSettings?.enablePlaceOfSupply && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Place of Supply*</span>
                  <FieldInfo content="State where goods or services are delivered. Determines intra-state (CGST + SGST) vs inter-state (IGST) taxation." title="Place of Supply" />
                </label>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isInterState 
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                )}>
                  {isInterState ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}
                </span>
              </div>
              <Select
                searchable
                value={placeOfSupply}
                onValueChange={(val) => setPlaceOfSupply(val)}
                placeholder="Select Place of Supply"
                className="w-full h-9 text-xs font-medium"
                options={getPlaceOfSupplyOptions(business.stateCode || "27")}
              />
            </div>
          )}
        </div>

        {/* Multi-Currency & Billing Currency Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Invoice Currency:
            </span>
            <div className="w-56">
              <Select
                value={currency}
                onValueChange={handleCurrencyChange}
                className="h-7 text-xs font-semibold bg-white dark:bg-slate-800"
                options={availableCurrencies.map(c => ({
                  value: c.code,
                  label: `${c.code} (${c.symbol}) - ${c.name}`
                }))}
              />
            </div>
            {currency !== "INR" && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                • Billed in {currency} ({currencySymbol})
              </span>
            )}
          </div>
          {currency !== "INR" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Exchange Rate: 1 {currency} =</span>
              <Input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => handleExchangeRateChange(Number(e.target.value) || 1)}
                className="w-20 h-7 text-xs font-semibold tabular-nums text-right bg-white dark:bg-slate-900"
              />
              <span className="text-slate-500 font-semibold">INR</span>
            </div>
          )}
        </div>

        {/* Row 2: Invoice#* and Order Number */}
        <div className={cn("grid gap-8 items-start", documentSettings.showOrderNumber !== false ? "grid-cols-1 md:grid-cols-2" : "max-w-xl")}>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="flex items-center text-xs font-semibold text-rose-500">
                <span>Invoice#*</span>
                <FieldInfo content="Mandatory unique sequential invoice identifier per financial year under GST Rule 46." title="Tax Invoice Number" />
              </label>
              <button type="button" title="Configure Invoice Prefix">
                <Settings className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600 cursor-pointer" />
              </button>
            </div>
            <Input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="h-9 text-xs font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          {documentSettings.showOrderNumber !== false && (
            <div>
              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Order Number</span>
                <FieldInfo content="Customer's purchase order (PO) or reference number printed on this invoice for reconciliation." title="Purchase Order Reference" />
              </label>
              <Input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Row 3: Invoice Date* and Terms + Due Date */}
        <div className={cn("grid gap-8 items-start", documentSettings.showPaymentTerms !== false ? "grid-cols-1 md:grid-cols-2" : "max-w-xl")}>
          <div>
            <label className="flex items-center text-xs font-semibold text-rose-500 mb-1.5">
              <span>Invoice Date*</span>
              <FieldInfo content="Date of invoice issue or supply, determining the tax filing period in GSTR-1 and GSTR-3B." title="Invoice Issue Date" />
            </label>
            <div className="relative">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  const newDate = e.target.value
                  setInvoiceDate(newDate)
                  setDueDate(calculateDueDateFromTerms(newDate, paymentTerms))
                }}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {documentSettings.showPaymentTerms !== false && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Terms</span>
                    <FieldInfo content="Agreed customer payment timeline (e.g., Net 30, Due on Receipt), which automatically computes the due date." title="Payment Credit Terms" />
                  </label>
                  <button type="button" title="Configure Payment Terms">
                    <Settings className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <Select
                  value={paymentTerms}
                  onValueChange={(val) => {
                    setPaymentTerms(val)
                    setDueDate(calculateDueDateFromTerms(invoiceDate, val))
                  }}
                  className="w-full h-9 text-xs"
                  options={[
                    { value: "Due on Receipt", label: "Due on Receipt" },
                    { value: "Net 15", label: "Net 15" },
                    { value: "Net 30", label: "Net 30" },
                    { value: "Net 45", label: "Net 45" },
                    { value: "Net 60", label: "Net 60" },
                    { value: "Due end of the month", label: "Due end of the month" },
                  ]}
                />
              </div>

              <div>
                <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Due Date</span>
                  <FieldInfo content="Deadline date by which customer payment must be received before the invoice is flagged as overdue." title="Payment Due Date" />
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 4: Salesperson */}
        {documentSettings.showSalesperson && (
          <div className="max-w-md">
            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Salesperson</span>
              <FieldInfo content="The sales representative or agent assigned to this invoice for sales tracking and commission reports." title="Sales Agent" />
            </label>
            <Select
              value={salesperson}
              onValueChange={(val) => setSalesperson(val)}
              placeholder="Select or Add Salesperson"
              className="w-full h-9 text-xs"
              options={[
                { value: "", label: "Select or Add Salesperson" },
                { value: "Aditya Verma", label: "Aditya Verma (Sales Rep)" },
                { value: "Rahul Sharma", label: "Rahul Sharma (Account Manager)" },
                { value: "Pooja Patel", label: "Pooja Patel (Counter Specialist)" },
              ]}
            />
          </div>
        )}

        {/* Form Custom Fields Section (Configured via Document Settings) */}
        {invoiceCustomFields.length > 0 && (
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Additional Information
                </h3>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-1.5 py-0.5 rounded">
                  {invoiceCustomFields.length} custom field{invoiceCustomFields.length > 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDocSettingsOpen(true)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Edit in Document Settings
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {invoiceCustomFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{field.name}</span>
                    {field.printOnPaper && (
                      <span className="ml-1 text-[10px] text-indigo-500 font-normal">
                        (PDF)
                      </span>
                    )}
                  </label>

                  {field.type === "select" ? (
                    <Select
                      value={customFieldValues[field.name] || ""}
                      onValueChange={(val) => setCustomFieldValues(prev => ({ ...prev, [field.name]: val }))}
                      options={(field.options || []).map(opt => ({ value: opt, label: opt }))}
                      placeholder={`Select ${field.name}...`}
                      className="w-full h-9 text-xs"
                    />
                  ) : field.type === "date" ? (
                    <Input
                      type="date"
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                    />
                  ) : field.type === "number" ? (
                    <Input
                      type="number"
                      placeholder={`Enter ${field.name.toLowerCase()}...`}
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <Input
                      type="text"
                      placeholder={`Enter ${field.name.toLowerCase()}...`}
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Item Details Table */}
        <div className="pt-2">
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-[#f4f7fa] dark:bg-slate-900 divide-x divide-slate-200 dark:divide-slate-800">
                  <TableHead className="w-10 px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer shadow-2xs hover:scale-105 inline-flex items-center justify-center"
                      title="Open Barcode Scanner (or enter item code)"
                      aria-label="Scan Barcode / Enter Item Code"
                    >
                      <ScanLine className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    ITEM DETAILS
                  </TableHead>
                  <TableHead className="w-28 px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    QUANTITY
                  </TableHead>
                  <TableHead className="w-32 px-3 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>RATE ({currencySymbol})</span>
                      <Calculator className="h-3.5 w-3.5 text-slate-400 inline" />
                    </div>
                  </TableHead>
                  {documentSettings.showDiscount !== false && (
                    <TableHead className="w-28 px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      DISCOUNT
                    </TableHead>
                  )}
                  {documentSettings.showHsn !== false && gstSettings?.enableGst && (
                    <TableHead className="w-28 px-2 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      GST %
                    </TableHead>
                  )}
                  <TableHead className="w-32 px-4 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    AMOUNT ({currencySymbol})
                  </TableHead>
                  {activeCustomColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      className="w-28 px-2 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      <span className="truncate block max-w-[100px]" title={col.name}>
                        {col.name}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-10 px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsAddColumnModalOpen(true)}
                      className="p-1 rounded text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer shadow-2xs hover:scale-110 inline-flex items-center justify-center"
                      title="Add Custom Product Column (Max 3)"
                      aria-label="Add Custom Product Column"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody ref={tbodyRef}>
                {lines.map((line, idx) => {
                  const itm = items.find(i => i.id === line.itemId)
                  const calc = calculatedLines[idx]
                  return (
                    <TableRow 
                      key={idx} 
                      className={cn(
                        "group border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 transition-all duration-150 ease-out",
                        activeDragIndex === idx
                          ? "bg-blue-50/90 dark:bg-blue-950/70 shadow-md ring-2 ring-blue-500/40 z-20 scale-[1.003]"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
                      )}
                    >
                      {/* Drag Grip Handle */}
                      <TableCell className="w-10 px-2 py-3 text-center align-middle">
                        <div
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          className={cn(
                            "p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-grab active:cursor-grabbing inline-flex items-center justify-center transition-all select-none touch-none",
                            activeDragIndex === idx && "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 cursor-grabbing scale-110 shadow-xs"
                          )}
                          title="Click and drag to smoothly reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      </TableCell>

                      {/* Item Selector with Image Thumbnail */}
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400">
                            {(itm?.images?.[0] || itm?.image) ? (
                              <img
                                src={itm.images?.[0] || itm.image}
                                alt={itm.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4" />
                            )}
                          </div>

                          <div className="flex-1">
                            <Select
                              searchable
                              searchPlaceholder="Search item by name, code, barcode, SKU..."
                              value={line.itemId}
                              onValueChange={(val) => handleUpdateLine(idx, { itemId: val })}
                              placeholder="Type or click to select an item."
                              size="sm"
                              className="w-full h-8 text-xs font-medium"
                              options={[
                                { value: "", label: "Type or click to select an item." },
                                ...items.map(it => ({
                                  value: it.id,
                                  label: it.name,
                                  description: `Code: ${it.itemCode || it.barcode || it.code} • SKU: ${it.code} • Rate: ₹${it.salePrice.toFixed(2)} • Stock: ${it.currentStock ?? 0} ${it.unit}`
                                }))
                              ]}
                            />
                            {line.itemId && itm && (
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                                <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{itm.code || "N/A"}</span></span>
                                <span>•</span>
                                <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{itm.stockByGodown[godownId] ?? itm.currentStock ?? 0} {itm.unit}</strong></span>
                                {!itm.hasBatch && calc?.isWholesale && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="blue" className="text-[9px] py-0 px-1.5 h-4 font-semibold">
                                      Wholesale (MOQ ≥ {itm.wholesaleMinQty})
                                    </Badge>
                                  </>
                                )}
                                {itm.hasBatch && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                      Batch Pricing (Wholesale Inactive)
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {line.itemId && itm && itm.hasBatch && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {line.batchNo ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                                      <Layers className="h-3 w-3" />
                                      <span>Batch: {line.batchNo}</span>
                                      {line.expiryDate && <span>• Exp: {line.expiryDate}</span>}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setBatchModalState({ isOpen: true, lineIndex: idx })}
                                      className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                      Change
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setBatchModalState({ isOpen: true, lineIndex: idx })}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 cursor-pointer"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Select Batch (Required)</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="px-3 py-3 text-center">
                        <Input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => handleUpdateLine(idx, { qty: Number(e.target.value) || 0 })}
                          className="h-8 text-right text-xs w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2.5 font-medium tabular-nums"
                        />
                      </TableCell>

                      {/* Rate */}
                      <TableCell className="px-3 py-3 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.rate}
                          onChange={(e) => handleUpdateLine(idx, { rate: Number(e.target.value) || 0 })}
                          className="h-8 text-right text-xs w-full tabular-nums font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2.5"
                        />
                      </TableCell>

                      {/* Discount % or ₹ */}
                      {documentSettings.showDiscount !== false && (
                        <TableCell className="px-2 py-3 text-center">
                          <div className="flex items-center rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 focus-within:border-blue-600 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateLine(idx, { 
                                discountType: line.discountType === "amount" ? "percent" : "amount" 
                              })}
                              className="px-1.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none transition-colors"
                              title={`Click to toggle between % and ${currencySymbol}`}
                            >
                              {line.discountType === "amount" ? currencySymbol : "%"}
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={line.discountType === "amount" ? undefined : 100}
                              step={line.discountType === "amount" ? "1" : "0.5"}
                              value={line.discount !== undefined ? line.discount : ""}
                              placeholder="0"
                              onChange={(e) => handleUpdateLine(idx, { 
                                discount: line.discountType === "amount" 
                                  ? Math.max(0, Number(e.target.value) || 0) 
                                  : Math.min(100, Math.max(0, Number(e.target.value) || 0)) 
                              })}
                              className="h-8 text-center text-xs w-full tabular-nums font-medium bg-transparent focus:outline-none px-1"
                            />
                          </div>
                        </TableCell>
                      )}

                      {/* GST Slab */}
                      {documentSettings.showHsn !== false && gstSettings?.enableGst && (
                        <TableCell className="w-28 px-1.5 py-3 text-center">
                          {isComposition ? (
                            <span 
                              className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500" 
                              title="Composition dealers cannot charge GST (0%)"
                            >
                              0% (Exempt)
                            </span>
                          ) : (
                            <Select
                              value={String(line.gstRate !== undefined ? line.gstRate : (itm?.gstRate ?? 18))}
                              onValueChange={(val) => handleUpdateLine(idx, { gstRate: Number(val) })}
                              size="xs"
                              className="h-8 w-full text-center text-xs font-semibold tabular-nums border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                              options={getGstRateOptions(gstSettings?.enableGst, taxGroups)}
                            />
                          )}
                        </TableCell>
                      )}

                      {/* Amount */}
                      <TableCell className="px-4 py-3 text-right tabular-nums text-xs font-bold text-slate-900 dark:text-white">
                        {calc ? calc.taxableAmount.toFixed(2) : "0.00"}
                      </TableCell>

                      {/* Custom Columns */}
                      {activeCustomColumns.map((col) => (
                        <TableCell key={col.id} className="w-28 px-1.5 py-3 text-center">
                          <Input
                            type="text"
                            value={line.customColumns?.[col.id] || ""}
                            onChange={(e) => handleUpdateLineCustomColumn(idx, col.id, e.target.value)}
                            placeholder={col.name}
                            className="h-8 text-center text-xs w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2 font-medium"
                          />
                        </TableCell>
                      ))}

                      {/* Delete */}
                      <TableCell className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Remove Line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Action buttons below table */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Add New Line Item</span>
            </button>

            {documentSettings.showBarcodeScan !== false && (
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
              >
                <ScanLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Barcode Scan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBulkAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Add Items in Bulk</span>
            </button>
          </div>
        </div>

        {/* SECTION: Calculation & Summary Block on Right */}
        <div className="flex flex-col md:flex-row justify-between gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          
          {/* Notes on Left */}
          <div className="flex-1 max-w-md space-y-4 text-xs">
            {documentSettings.showCustomerNotes !== false && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Customer Notes</span>
                    <FieldInfo content="Personalized message or instructions printed on the customer's invoice copy." title="Customer Notes" />
                  </label>
                  <NotesPresetSelector
                    documentType="invoice"
                    onSelect={(note) => setCustomerNotes(note)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            )}

            {documentSettings.showTermsConditions !== false && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Terms & Conditions</span>
                    <FieldInfo content="Standard business terms, return policies, payment late fees, and legal jurisdiction printed at the footer." title="Terms & Conditions" />
                  </label>
                  <TermsPresetSelector
                    documentType="invoice"
                    onSelect={(terms) => setTermsAndConditions(terms)}
                  />
                </div>
                <textarea
                  rows={3}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* Right Summary Grid (Pixel-exact match to Zoho screenshot) */}
          <div className="w-full md:w-[420px] space-y-3.5 text-xs">
            
            {/* 1. Sub Total */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Sub Total
              </span>
              <span className="font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                {subTotal.toFixed(2)}
              </span>
            </div>

            {/* 2. Discount */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">
                Discount
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="h-7 w-20 text-right text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700"
                />
                <Select
                  value={discountType}
                  onValueChange={(val) => setDiscountType(val as any)}
                  size="xs"
                  className="h-7 w-12 px-1 text-xs"
                  options={[
                    { value: "%", label: "%" },
                    { value: "₹", label: currencySymbol },
                  ]}
                />
              </div>
              <span className="font-semibold text-sm tabular-nums text-slate-900 dark:text-white w-20 text-right">
                {globalDiscountAmount.toFixed(2)}
              </span>
            </div>

            {/* 3. TDS / TCS (Only shown if at least one is enabled in GST Settings) */}
            {isWithholdingEnabled && documentSettings.showWithholdingTax !== false && (
              <div className="flex items-center justify-between gap-3">
                {isTdsEnabled && isTcsEnabled ? (
                  <Select
                    value={withholdingType}
                    onValueChange={(val) => {
                      setWithholdingType(val as "TDS" | "TCS")
                      setSelectedWithholdingTax("")
                    }}
                    size="xs"
                    className="h-7 w-20 px-2 text-xs"
                    options={[
                      { value: "TDS", label: "TDS" },
                      { value: "TCS", label: "TCS" },
                    ]}
                  />
                ) : (
                  <div className="h-7 w-20 px-2 flex items-center justify-center text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {isTdsEnabled ? "TDS" : "TCS"}
                  </div>
                )}

                <div className="flex-1">
                  <Select
                    value={selectedWithholdingTax}
                    onValueChange={(val) => setSelectedWithholdingTax(val)}
                    size="xs"
                    className="w-full h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                    options={[
                      { value: "", label: withholdingType === "TDS" ? "Select TDS Rate" : "Select TCS Rate" },
                      ...((withholdingType === "TDS" ? tdsRates : tcsRates) || []).map((item) => ({
                        value: String(item.rate),
                        label: `${item.rate}% - ${item.name}${item.section ? ` (Sec ${item.section})` : ""}`,
                      })),
                    ]}
                  />
                </div>

                <span className="font-semibold text-sm tabular-nums text-slate-900 dark:text-white w-20 text-right">
                  {withholdingType === "TDS" && withholdingAmount > 0 ? `-${withholdingAmount.toFixed(2)}` : withholdingAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Additional Charges Section (Max 6) */}
            {documentSettings.showAdditionalCharges !== false && (
              <AdditionalChargesSection
                enabled={hasAdditionalCharges}
                onEnabledChange={setHasAdditionalCharges}
                charges={additionalCharges}
                onChange={setAdditionalCharges}
                totalCalculatedAmount={totalAdditionalCharges}
              />
            )}

            {/* Tax Details Breakdown Row */}
            {gstSettings?.enableGst && totalGst > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {isInterState ? (
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>IGST (Inter-state)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">Integrated Tax</span>
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">+{igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>CGST (Central Tax)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">Central Tax</span>
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">+{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>SGST (State Tax)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">State Tax</span>
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">+{sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Round off - Clean input without duplicate text */}
            {documentSettings.showRoundOff !== false && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                  Round Off
                </span>

                <div className="flex items-center gap-1.5 ml-auto">
                  {manualRoundOff !== null && (
                    <button
                      type="button"
                      onClick={() => setManualRoundOff(null)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      title="Reset to automatic calculation"
                    >
                      Reset
                    </button>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={manualRoundOff !== null ? manualRoundOff : (autoRoundOff !== 0 ? autoRoundOff.toFixed(2) : "0.00")}
                    onChange={(e) => setManualRoundOff(e.target.value)}
                    className="h-7 w-24 text-right text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    title="Auto-calculated round off. Click to edit, or click 'Reset' to restore auto calculation."
                  />
                </div>
              </div>
            )}

            {/* Sale on Credit Section with Switch Toggle */}
            {documentSettings.showCreditToggle !== false && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Payment Type:</span>
                    <FieldInfo content="Choose 'Credit Sale' if the customer will pay at a later date against their credit limit, or 'Paid Now' if immediate payment is received." title="Payment Settlement Type" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="saleInvoiceType"
                        checked={isCredit}
                        onChange={() => {
                          setIsCredit(true)
                          setPaymentMode("credit")
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span>Credit Sale (Customer pays later / Unpaid)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="saleInvoiceType"
                        checked={!isCredit}
                        onChange={() => {
                          setIsCredit(false)
                          setPaymentMode("upi")
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span>Paid Now (Cash / UPI / Bank)</span>
                    </label>
                  </div>
                </div>

                {/* Dynamic Customer Credit Status Callout */}
                {isCredit && selectedParty && (
                  <div className={cn(
                    "p-2.5 rounded-lg border text-xs space-y-1.5 animate-in fade-in duration-150",
                    isCreditLimitExceeded 
                      ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
                      : "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200"
                  )}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Customer Available Credit:</span>
                      <span className="tabular-nums font-bold">
                        {currencySymbol}{availableCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-80">
                      <span>Credit Limit: {currencySymbol}{partyCreditLimit.toLocaleString("en-IN")}</span>
                      <span>Current Balance: {currencySymbol}{partyCurrentBalance.toLocaleString("en-IN")}</span>
                    </div>
                    {hasAdvance && numAdvance > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                        <span>Advance Received (Excluded from Credit):</span>
                        <span className="tabular-nums font-semibold">-{currencySymbol}{numAdvance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-0.5 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>Net Credit for this Invoice:</span>
                      <span className="tabular-nums font-bold">{currencySymbol}{effectiveInvoiceCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    {isCreditLimitExceeded && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 pt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>Warning: Net credit exceeds available credit by {currencySymbol}{(effectiveInvoiceCredit - availableCredit).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Immediate Payment Mode when Credit is OFF */}
                {!isCredit && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 text-[11px] font-medium">Payment Mode:</span>
                    <div className="w-32">
                      <Select
                        value={paymentMode}
                        onValueChange={(val) => setPaymentMode(val as any)}
                        size="xs"
                        className="h-7 text-xs font-medium"
                        options={[
                          { value: "upi", label: "UPI" },
                          { value: "cash", label: "Cash" },
                          { value: "bank", label: "Bank Transfer" },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advance Received Section with Switch Toggle */}
            {documentSettings.showAdvancePayment !== false && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hasAdvance}
                      onCheckedChange={(checked) => {
                        setHasAdvance(checked)
                        if (!checked) setAdvanceAmount("")
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isCredit ? "Partial Down Payment / Advance?" : "Advance Received?"}
                    </span>
                  </div>
                  {hasAdvance && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                      numAdvance >= grandTotal && grandTotal > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}>
                      {numAdvance >= grandTotal && grandTotal > 0 ? "Full Paid" : "Partial Payment"}
                    </span>
                  )}
                </div>

                {hasAdvance && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Payment Mode
                      </label>
                      <Select
                        value={advancePaymentMode}
                        onValueChange={(val) => setAdvancePaymentMode(val as any)}
                        size="xs"
                        className="w-full h-8 text-xs font-medium"
                        options={[
                          { value: "bank", label: "Bank Transfer" },
                          { value: "cash", label: "Cash" },
                          { value: "upi", label: "UPI" },
                          { value: "cheque", label: "Cheque" },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Amount Received ({currencySymbol})*
                      </label>
                      <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                        <span className="inline-flex items-center px-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 focus:outline-none font-semibold text-right tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr className="border-slate-200 dark:border-slate-800 my-2" />

            {/* 5. Total */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Total ( {currencySymbol} )
              </span>
              <span className="font-bold text-lg tabular-nums text-slate-900 dark:text-white">
                {currencySymbol}{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Balance Due */}
            {hasAdvance && numAdvance > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">
                  Balance Due
                </span>
                <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {currencySymbol}{balanceDue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        </div>

      </form>

      {/* Bulk Add Items Modal */}
      <BulkAddLineItemsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAddItems={handleBulkAddItems}
        rateType="sale"
      />

      {/* Barcode Scanner & Item Code Entry Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onAddProducts={handleBulkAddItems}
        rateType="sale"
        godownId={godownId}
      />

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="invoice"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="invoice"
      />

      {/* Select Batch Modal */}
      {batchModalState.lineIndex !== null && (
        <SelectBatchModal
          isOpen={batchModalState.isOpen}
          onClose={() => setBatchModalState({ isOpen: false, lineIndex: null })}
          item={items.find(it => it.id === lines[batchModalState.lineIndex!]?.itemId) || null}
          godownId={godownId}
          currentBatchNo={lines[batchModalState.lineIndex!]?.batchNo}
          currentQty={lines[batchModalState.lineIndex!]?.qty || 1}
          onSelectBatch={handleBatchSelected}
        />
      )}
    </div>
  )
}

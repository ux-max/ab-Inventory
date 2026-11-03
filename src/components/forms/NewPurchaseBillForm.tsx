"use client"

import React, { useState, useEffect, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { PurchaseDocument } from "@/types/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  ArrowLeft, 
  Save, 
  X, 
  Trash2, 
  PlusCircle, 
  FileText, 
  ShoppingBag, 
  Building2, 
  Warehouse, 
  Calendar, 
  HelpCircle,
  Receipt,
  Info,
  Check,
  Image as ImageIcon,
  GripVertical,
  ScanLine,
  CreditCard,
  Sliders,
  Plus,
  Layers,
  AlertTriangle
} from "lucide-react"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { SelectBatchModal } from "@/components/modals/SelectBatchModal"
import { Badge } from "@/components/ui/badge"
import { formatINR, cn } from "@/lib/utils"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { AdditionalChargesSection, AdditionalChargeItem } from "@/components/common/AdditionalChargesSection"
import { getPlaceOfSupplyOptions, isInterStateTransaction, getGstRateOptions } from "@/lib/gstConstants"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewPurchaseBillFormProps {
  initialBill?: PurchaseDocument
  title?: string
  onCancel: () => void
  onSuccess: (docNo?: string) => void
}

export function NewPurchaseBillForm({ initialBill, title, onCancel, onSuccess }: NewPurchaseBillFormProps) {
  const { parties, items, godowns, activeGodownId, business, createPurchaseBill, updatePurchaseBill, gstSettings, documentSettings, taxGroups, tdsRates, tcsRates, termsTemplates, currencies, purchaseDocs, payments, formCustomColumns } = useApp()

  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = (formCustomColumns?.bill || []).filter(c => c.isEnabled !== false)

  // Filter vendor parties
  const supplierParties = parties.filter(p => p.type === "supplier" || p.type === "both")

  // Form State
  const [vendorId, setVendorId] = useState(initialBill?.partyId || "")
  const [vendorName, setVendorName] = useState(initialBill?.partyName || "")
  const [vendorGstin, setVendorGstin] = useState(initialBill?.partyGstin || "")
  const [vendorStateCode, setVendorStateCode] = useState(initialBill?.partyStateCode || "27")

  // Multi-Currency State (auto-inherited from Vendor)
  const [billCurrency, setBillCurrency] = useState(initialBill?.currency || "INR")
  const [billCurrencySymbol, setBillCurrencySymbol] = useState(initialBill?.currencySymbol || "₹")
  const [exchangeRate, setExchangeRate] = useState<number>(initialBill?.exchangeRate || 1)

  const availableCurrencies = (currencies && currencies.length > 0)
    ? currencies.filter(c => c.isActive !== false)
    : [
        { id: "c-inr", code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 1 },
        { id: "c-usd", code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 84.10 },
        { id: "c-eur", code: "EUR", name: "Euro", symbol: "€", exchangeRate: 91.25 },
        { id: "c-aed", code: "AED", name: "UAE Dirham", symbol: "AED", exchangeRate: 22.90 },
        { id: "c-gbp", code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 109.40 }
      ]

  const updateLinesCurrency = (newCurr: string, newRate: number) => {
    setLines(prev => prev.map(l => {
      const it = items.find(i => i.id === l.itemId)
      if (!it) return l
      const baseRate = it.purchasePrice || 0
      const converted = newCurr === "INR" || !newRate || newRate <= 0
        ? baseRate
        : Number((baseRate / newRate).toFixed(2))
      return { ...l, rate: converted }
    }))
  }

  const handleCurrencyChange = (newCurr: string) => {
    setBillCurrency(newCurr)
    const found = availableCurrencies.find(c => c.code === newCurr)
    const newRate = found?.exchangeRate || (newCurr === "INR" ? 1 : 84.10)
    setExchangeRate(newRate)
    const newSym = found?.symbol || (newCurr === "USD" ? "$" : newCurr === "EUR" ? "€" : newCurr === "AED" ? "د.إ" : newCurr === "GBP" ? "£" : "₹")
    setBillCurrencySymbol(newSym)
    updateLinesCurrency(newCurr, newRate)
  }

  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate)
    updateLinesCurrency(billCurrency, newRate)
  }

  const formatCurrency = (amt: number) => {
    if (billCurrency === "INR" || billCurrencySymbol === "₹") {
      return `₹${formatINR(amt)}`
    }
    return `${billCurrencySymbol}${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Vendor Bill Reference (Mandatory for Indian GST)
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState(initialBill?.vendorInvoiceNo || "")
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState(
    initialBill?.vendorInvoiceDate || new Date().toISOString().split("T")[0]
  )

  // Internal Bill Entry
  const [billNo, setBillNo] = useState(initialBill?.docNo || "")
  const [billDate, setBillDate] = useState(initialBill?.date || new Date().toISOString().split("T")[0])
  const [paymentTerms, setPaymentTerms] = useState(initialBill?.paymentTerms || "Net 30")
  const [dueDate, setDueDate] = useState(initialBill?.dueDate || "")
  const [isCredit, setIsCredit] = useState<boolean>(
    initialBill?.isCredit ?? (initialBill ? initialBill.paymentMode === "credit" || (initialBill.paidAmount || 0) < initialBill.grandTotal : false)
  )
  const [godownId, setGodownId] = useState(initialBill?.godownId || activeGodownId || godowns[0]?.id || "godown-1")

  // GST & ITC Configurations
  const [isItcEligible, setIsItcEligible] = useState<boolean>(
    initialBill ? initialBill.itcEligibility !== "ineligible" : true
  )
  const [itcCategory, setItcCategory] = useState<"inputs" | "capital_goods" | "services">(
    initialBill?.itcEligibility && initialBill.itcEligibility !== "ineligible" 
      ? initialBill.itcEligibility 
      : "inputs"
  )
  const [isRcm, setIsRcm] = useState<boolean>(initialBill?.isRcm || false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Line items state
  const [lines, setLines] = useState<Array<{
    itemId: string
    name: string
    sku: string
    hsn: string
    qty: number
    unit: string
    rate: number
    discountPercent: number
    gstRate: number
    batchNo: string
    manufacturingDate?: string
    expiryDate?: string
    customColumns?: Record<string, string>
  }>>(() => {
    if (initialBill && initialBill.items.length > 0) {
      return initialBill.items.map(it => {
        const catalogItem = items.find(i => i.id === it.itemId)
        return {
          itemId: it.itemId,
          name: it.name,
          sku: catalogItem?.code || "",
          hsn: it.hsn || catalogItem?.hsn || "290512",
          qty: it.qty,
          unit: it.unit || catalogItem?.unit || "LTR",
          rate: it.rate,
          discountPercent: it.discountPercent || 0,
          gstRate: it.gstRate !== undefined ? it.gstRate : (catalogItem?.gstRate ?? 18),
          batchNo: it.batchNo || "",
          manufacturingDate: (it as any).manufacturingDate || undefined,
          expiryDate: (it as any).expiryDate || undefined,
          customColumns: (it as any).customColumns || {}
        }
      })
    }
    const defaultItem = items[0]
    return [{
      itemId: defaultItem?.id || "",
      name: defaultItem?.name || "",
      sku: defaultItem?.code || "",
      hsn: defaultItem?.hsn || "290512",
      qty: 10,
      unit: defaultItem?.unit || "LTR",
      rate: defaultItem?.purchasePrice || 120,
      discountPercent: 0,
      gstRate: defaultItem?.gstRate ?? 18,
      batchNo: "",
      customColumns: {}
    }]
  })

  // Inward Batch Selection Modal state
  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean
    lineIndex: number | null
  }>({
    isOpen: false,
    lineIndex: null
  })

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
    const line = lines[idx]
    if (!line) return

    setLines(prev => {
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        batchNo: selected.batchNo,
        manufacturingDate: selected.manufacturingDate,
        expiryDate: selected.expiryDate,
        qty: selected.allocatedQty > 0 ? selected.allocatedQty : updated[idx].qty,
        rate: selected.purchasePrice && selected.purchasePrice > 0 ? selected.purchasePrice : updated[idx].rate
      }
      return updated
    })

    setBatchModalState({ isOpen: false, lineIndex: null })
  }

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  // Payment Settlement & Adjustments
  const [hasPayment, setHasPayment] = useState<boolean>(
    Boolean(initialBill && (initialBill.status === "posted" || (initialBill.paidAmount || 0) > 0))
  )
  const [paidAmountInput, setPaidAmountInput] = useState<number | string>(
    initialBill?.paidAmount !== undefined && initialBill.paidAmount > 0 ? initialBill.paidAmount : ""
  )
  const [hasAdditionalCharges, setHasAdditionalCharges] = useState(
    Boolean(initialBill?.additionalCharges?.length || initialBill?.adjustment)
  )
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeItem[]>(
    initialBill?.additionalCharges?.map((c, idx) => ({ id: c.id || String(idx), name: c.name, amount: c.amount })) ||
    (initialBill?.adjustment ? [{ id: "c-1", name: initialBill.adjustmentLabel || "Freight & Shipping", amount: initialBill.adjustment }] : [])
  )

  // GST Settings convenience booleans
  const isGstEnabled = Boolean(gstSettings?.enableGst)
  const isHsnEnabled = Boolean(gstSettings?.enableHsnSac)
  const isPlaceOfSupplyEnabled = Boolean(gstSettings?.enablePlaceOfSupply)
  const isItcOptionEnabled = isGstEnabled && (gstSettings?.enableItc !== false)
  const isRcmOptionEnabled = isGstEnabled && (gstSettings?.enableRcm !== false)
  const effectiveIsRcm = isRcmOptionEnabled && isRcm

  // Withholding Tax (TDS / TCS) settings & state
  const isTcsEnabled = Boolean(gstSettings?.enableTcs)
  const isTdsEnabled = Boolean(gstSettings?.enableTds)
  const isWithholdingEnabled = isTcsEnabled || isTdsEnabled

  const [withholdingType, setWithholdingType] = useState<"TDS" | "TCS">(() => {
    if (initialBill?.withholdingType) return initialBill.withholdingType
    if (gstSettings?.enableTds) return "TDS"
    if (gstSettings?.enableTcs) return "TCS"
    return "TDS"
  })
  const [selectedWithholdingTax, setSelectedWithholdingTax] = useState(
    initialBill?.withholdingRate ? String(initialBill.withholdingRate) : ""
  )

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

  const [manualRoundOff, setManualRoundOff] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<"bank" | "cash" | "upi" | "cheque" | "credit">(
    (initialBill?.paymentMode as any) || "bank"
  )
  const [notes, setNotes] = useState(initialBill?.notes || "")
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialBill?.termsAndConditions || "1. Goods received subject to inspection and quality check at receiving warehouse.\n2. Payment subject to reconciliation with GSTR-2B ITC reflection."
  )
  const [errorMsg, setErrorMsg] = useState("")

  // Apply default purchase bill terms template
  useEffect(() => {
    if (!initialBill && termsTemplates && termsTemplates.length > 0) {
      const defaultTemplate = termsTemplates.find(
        (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes("purchase_bill")) && t.isDefault
      )
      if (defaultTemplate) {
        setTermsAndConditions(defaultTemplate.content)
      }
    }
  }, [termsTemplates, initialBill])

  // Auto-calculate Due Date based on Terms
  useEffect(() => {
    if (!dueDate) {
      const bDate = new Date(billDate)
      if (paymentTerms === "Net 15") bDate.setDate(bDate.getDate() + 15)
      else if (paymentTerms === "Net 30") bDate.setDate(bDate.getDate() + 30)
      else if (paymentTerms === "Net 60") bDate.setDate(bDate.getDate() + 60)
      setDueDate(bDate.toISOString().split("T")[0])
    }
  }, [billDate, paymentTerms, dueDate])

  const handleVendorSelect = (name: string) => {
    setVendorName(name)
    const party = parties.find(p => p.id === name || (p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase()))
    if (party) {
      setVendorId(party.id)
      setVendorGstin(party.gstin || "")
      setVendorStateCode(party.stateCode || (party.gstin ? party.gstin.substring(0, 2) : "27"))
      // Inherit currency from Vendor profile
      const partyCurr = party.currency || "INR"
      const foundCurr = availableCurrencies.find(c => c.code === partyCurr)
      const partySym = party.currencySymbol || foundCurr?.symbol || (partyCurr === "USD" ? "$" : partyCurr === "EUR" ? "€" : partyCurr === "AED" ? "د.إ" : partyCurr === "GBP" ? "£" : "₹")
      const partyRate = foundCurr?.exchangeRate || (partyCurr === "INR" ? 1 : 84.10)
      setBillCurrency(partyCurr)
      setBillCurrencySymbol(partySym)
      setExchangeRate(partyRate)
      updateLinesCurrency(partyCurr, partyRate)
    } else {
      setVendorId("")
      setVendorGstin("")
      setVendorStateCode("27")
      setBillCurrency("INR")
      setBillCurrencySymbol("₹")
      setExchangeRate(1)
      updateLinesCurrency("INR", 1)
    }
  }

  const handleAddLine = () => {
    const defaultItem = items.find(i => !lines.some(l => l.itemId === i.id)) || items[0]
    const baseRate = defaultItem?.purchasePrice || 100
    const convertedRate = billCurrency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
    const nextIdx = lines.length
    setLines(prev => [
      ...prev,
      {
        itemId: defaultItem?.id || "",
        name: defaultItem?.name || "",
        sku: defaultItem?.code || "",
        hsn: defaultItem?.hsn || "290512",
        qty: 1,
        unit: defaultItem?.unit || "LTR",
        rate: convertedRate,
        discountPercent: 0,
        gstRate: defaultItem?.gstRate ?? 18,
        batchNo: "",
        customColumns: {}
      }
    ])
    if (defaultItem?.hasBatch) {
      setTimeout(() => {
        setBatchModalState({ isOpen: true, lineIndex: nextIdx })
      }, 50)
    }
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      // Remove any initial empty or blank row
      const cleanPrev = prev.filter(l => l.itemId !== "" && l.name !== "")
      const newLines = selectedList.map(({ item, qty }) => {
        const baseRate = item.purchasePrice || 100
        const rate = billCurrency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
        return {
          itemId: item.id,
          name: item.name,
          sku: item.code || "",
          hsn: item.hsn || "290512",
          qty: Math.max(1, Number(qty) || 1),
          unit: item.unit || "LTR",
          rate,
          discountPercent: item.purchaseDiscount || 0,
          gstRate: item.gstRate ?? 18,
          batchNo: "",
          customColumns: {}
        }
      })
      return [...cleanPrev, ...newLines]
    })
    setIsBulkModalOpen(false)
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

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) {
      setErrorMsg("A purchase bill must have at least one line item.")
      return
    }
    setLines(lines.filter((_, i) => i !== idx))
  }

  // Barcode Scanner Modal State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  const handleUpdateLine = (idx: number, updates: Partial<typeof lines[0]>) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== idx) return line
      const updated = { ...line, ...updates }
      if (updates.itemId) {
        const found = items.find(it => it.id === updates.itemId)
        if (found) {
          const baseRate = found.purchasePrice || 100
          const rate = billCurrency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
          updated.name = found.name
          updated.sku = found.code
          updated.hsn = found.hsn || "290512"
          updated.unit = found.unit || "LTR"
          updated.rate = rate
          updated.discountPercent = found.purchaseDiscount || 0
          updated.gstRate = found.gstRate ?? 18
          updated.batchNo = ""
          updated.manufacturingDate = undefined
          updated.expiryDate = undefined

          if (found.hasBatch) {
            setTimeout(() => {
              setBatchModalState({ isOpen: true, lineIndex: idx })
            }, 50)
          }
        }
      }
      return updated
    }))
  }

  // Inter-state check (Vendor GSTIN/State vs Business State)
  const isInterState = Boolean(
    gstSettings?.enablePlaceOfSupply &&
    vendorStateCode && business.stateCode && 
    isInterStateTransaction(vendorStateCode, business.stateCode || "27")
  )

  // Calculations
  const calculatedLines = lines.map(line => {
    const rawTotal = (line.qty || 0) * (line.rate || 0)
    const discAmount = (line as any).discountType === "amount"
      ? Math.min(rawTotal, (line.discountPercent || 0) * (line.qty || 1))
      : (rawTotal * (line.discountPercent || 0)) / 100
    const taxableAmount = Math.max(0, rawTotal - discAmount)
    const rawGstPct = line.gstRate !== undefined ? line.gstRate : 0
    const gstPct = !gstSettings?.enableGst ? 0 : rawGstPct
    const taxAmount = (taxableAmount * gstPct) / 100
    const cgst = isInterState ? 0 : taxAmount / 2
    const sgst = isInterState ? 0 : taxAmount / 2
    const igst = isInterState ? taxAmount : 0
    // Under RCM: The vendor invoice does not charge tax, so the line amount payable to vendor is taxableAmount.
    // If not RCM (normal forward charge), it is taxableAmount + taxAmount.
    const total = effectiveIsRcm ? taxableAmount : (taxableAmount + taxAmount)

    return {
      ...line,
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst,
      total
    }
  })

  const totalAdditionalCharges = hasAdditionalCharges
    ? additionalCharges.reduce((acc, c) => acc + (parseFloat(String(c.amount)) || 0), 0)
    : 0

  const subtotal = calculatedLines.reduce((acc, l) => acc + l.taxableAmount, 0)
  const totalTax = calculatedLines.reduce((acc, l) => acc + l.taxAmount, 0)
  const cgstTotal = isInterState ? 0 : totalTax / 2
  const sgstTotal = isInterState ? 0 : totalTax / 2
  const igstTotal = isInterState ? totalTax : 0

  // Withholding Tax (TDS/TCS) - strictly respect settings
  const isCurrentTypeActive = (withholdingType === "TDS" && isTdsEnabled) || (withholdingType === "TCS" && isTcsEnabled)
  const withholdingRate = (isCurrentTypeActive && selectedWithholdingTax) ? Number(selectedWithholdingTax) : 0
  const withholdingAmount = (subtotal * withholdingRate) / 100

  // Under RCM: Vendor Bill Total = Subtotal + withholdingAdjustment + additionalCharges
  // Under Forward Charge: Vendor Bill Total = Subtotal + totalTax + withholdingAdjustment + additionalCharges
  // TDS deducted decreases payment to vendor; TCS collected increases payment to vendor
  const withholdingAdjustment = isCurrentTypeActive 
    ? (withholdingType === "TDS" ? -withholdingAmount : withholdingAmount) 
    : 0
  const rawGrandTotal = Math.max(0, (effectiveIsRcm ? subtotal : (subtotal + totalTax)) + withholdingAdjustment + totalAdditionalCharges)
  const autoRoundOff = Number((Math.round(rawGrandTotal) - rawGrandTotal).toFixed(2))
  const roundOff = manualRoundOff !== null ? (Number(manualRoundOff) || 0) : autoRoundOff
  const roundedGrandTotal = Number((rawGrandTotal + roundOff).toFixed(2))

  // Advance / Payment Paid calculation
  const numPaid = hasPayment ? (Number(paidAmountInput) || 0) : 0
  const balancePayable = Math.max(0, roundedGrandTotal - numPaid)

  // Vendor Credit Limit & Available Credit calculation
  const selectedVendor = parties.find(p => p.id === vendorId || (p.name && p.name.trim().toLowerCase() === vendorName.trim().toLowerCase()))
  const vendorCreditLimit = selectedVendor?.creditLimit || 100000
  const vendorPayableBalance = selectedVendor?.balance ? (selectedVendor.balance < 0 ? Math.abs(selectedVendor.balance) : 0) : 0
  const vendorUnpaidCredit = purchaseDocs
    .filter(b => (b.partyId === selectedVendor?.id || b.partyName === selectedVendor?.name))
    .reduce((acc, b) => {
      if (b.status === "posted" && (b.paidAmount || 0) >= b.grandTotal) return acc
      const linkedP = payments.filter(pmt => pmt.docId === b.id || pmt.docNo === b.docNo)
      const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
      const totalPaid = Math.max(b.paidAmount || 0, paidFromPayments)
      const bal = Math.max(0, b.grandTotal - totalPaid)
      if (bal <= 0) return acc
      if (b.isCredit || b.paymentMode === "credit" || b.status === "pending" || b.status === "posted") {
        return acc + bal
      }
      return acc
    }, 0)
  const vendorAvailableCredit = Math.max(0, vendorCreditLimit - vendorUnpaidCredit)
  const effectiveBillCredit = isCredit ? (hasPayment ? Math.max(0, roundedGrandTotal - numPaid) : roundedGrandTotal) : 0
  const isVendorCreditExceeded = isCredit && effectiveBillCredit > vendorAvailableCredit

  const handleSubmit = (actionType: "post" | "draft" = "post") => {
    setErrorMsg("")

    if (!vendorName.trim()) {
      setErrorMsg("Please select or specify a Supplier/Vendor.")
      return
    }

    if (!vendorInvoiceNo.trim()) {
      setErrorMsg("Vendor's Original Invoice No. is mandatory for GST input tax credit.")
      return
    }

    const validLines = calculatedLines.filter(l => l.itemId && l.qty > 0)
    if (validLines.length === 0) {
      setErrorMsg("Please include at least one valid item with quantity greater than zero.")
      return
    }

    // Validate batches for items that have batch tracking enabled
    const missingBatch = validLines.find(l => {
      const itm = items.find(i => i.id === l.itemId)
      return itm?.hasBatch && !l.batchNo?.trim()
    })
    if (missingBatch) {
      setErrorMsg(`Please select or create an inward batch for "${missingBatch.name}".`)
      return
    }

    const validCharges = hasAdditionalCharges
      ? additionalCharges
          .filter(c => c.name.trim() || Number(c.amount) !== 0)
          .map(c => ({ id: c.id, name: c.name.trim() || "Additional Charge", amount: parseFloat(String(c.amount)) || 0 }))
      : []

    const billPayload: Omit<PurchaseDocument, "id" | "docNo" | "date" | "createdBy"> & { docNo?: string; date?: string } = {
      docNo: billNo.trim() || undefined,
      type: "bill",
      date: billDate,
      vendorInvoiceNo: vendorInvoiceNo.trim(),
      vendorInvoiceDate,
      paymentTerms,
      partyId: vendorId || `pty-vendor-${Date.now()}`,
      partyName: vendorName.trim(),
      partyGstin: vendorGstin.trim() || undefined,
      partyStateCode: vendorStateCode,
      godownId,
      godownName: godowns.find(g => g.id === godownId)?.name || "Main Warehouse",
      currency: billCurrency,
      currencySymbol: billCurrencySymbol,
      exchangeRate,
      items: validLines.map(l => ({
        itemId: l.itemId,
        name: l.name,
        hsn: l.hsn,
        qty: l.qty,
        unit: l.unit,
        rate: l.rate,
        discountPercent: l.discountPercent,
        taxableAmount: l.taxableAmount,
        gstRate: l.gstRate,
        cgst: l.cgst,
        sgst: l.sgst,
        igst: l.igst,
        total: l.total,
        batchNo: l.batchNo || undefined,
        manufacturingDate: (l as any).manufacturingDate || undefined,
        expiryDate: (l as any).expiryDate || undefined
      })),
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      adjustment: totalAdditionalCharges,
      adjustmentLabel: validCharges[0]?.name || "Additional Charges",
      additionalCharges: validCharges,
      withholdingType: isCurrentTypeActive && withholdingAmount > 0 ? withholdingType : undefined,
      withholdingRate: isCurrentTypeActive && withholdingAmount > 0 ? withholdingRate : undefined,
      withholdingAmount: isCurrentTypeActive && withholdingAmount > 0 ? withholdingAmount : undefined,
      grandTotal: roundedGrandTotal,
      paidAmount: actionType === "draft" ? 0 : hasPayment ? numPaid : isCredit ? 0 : roundedGrandTotal,
      status: actionType === "draft" ? "pending" : (hasPayment && balancePayable === 0) ? "posted" : isCredit ? "pending" : "posted",
      paymentMode: isCredit ? "credit" : (hasPayment ? paymentMode : "bank"),
      isCredit: isCredit,
      creditTerms: paymentTerms,
      dueDate: dueDate || (paymentTerms === "Due on Receipt" ? billDate : undefined),
      itcEligibility: isItcOptionEnabled && isItcEligible ? itcCategory : "ineligible",
      isRcm: effectiveIsRcm,
      notes: notes.trim() || undefined,
      termsAndConditions: termsAndConditions.trim() || undefined
    }

    if (initialBill && initialBill.id) {
      const res = updatePurchaseBill(initialBill.id, billPayload)
      if (res.success) {
        onSuccess(initialBill.docNo)
      } else {
        setErrorMsg(res.message)
      }
    } else {
      const res = createPurchaseBill(billPayload)
      if (res.success) {
        onSuccess(res.docNo)
      } else {
        setErrorMsg(res.message)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Form Header matching AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Bills"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {title || (initialBill?.id ? `Edit Purchase Bill (${initialBill.docNo})` : "New Purchase Bill")}
            </h1>
            {initialBill && !initialBill.id && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 uppercase tracking-wide">
                Reorder
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDocSettingsOpen(true)}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
            title="Configure document visible fields & toggles"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Document Settings</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Save as Draft</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit("post")}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas matching AddItemForm */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit("post"); }} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">
        
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700">✕</button>
          </div>
        )}

        {/* SECTION 1: Supplier & Bill Reference */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Vendor Name (7 cols) */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                Vendor / Supplier Name*
              </label>
              <Select
                searchable
                allowCustomValue
                searchPlaceholder="Search vendor by name, GSTIN..."
                value={vendorName}
                onValueChange={handleVendorSelect}
                placeholder="Select or search vendor..."
                className="w-full h-9 text-xs"
                options={supplierParties.map(p => ({
                  value: p.name,
                  label: p.name,
                  description: p.gstin ? `GSTIN: ${p.gstin} • State: ${p.state || p.stateCode || "27"}` : (p.phone ? `Phone: ${p.phone}` : "Unregistered Supplier")
                }))}
              />
              {gstSettings?.enablePlaceOfSupply && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Supplier State / Place of Supply
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {isInterState ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)"}
                    </span>
                  </div>
                  <Select
                    searchable
                    value={vendorStateCode}
                    onValueChange={(val) => setVendorStateCode(val)}
                    options={getPlaceOfSupplyOptions(business.stateCode || "27")}
                    className="w-full h-8 text-xs font-medium"
                  />
                </div>
              )}
              {vendorGstin && !gstSettings?.enablePlaceOfSupply && (
                <p className="text-[11px] text-slate-500">
                  GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{vendorGstin}</span>
                </p>
              )}
            </div>

            {/* Vendor's Invoice No & Date on Right (5 cols) */}
            <div className="md:col-span-5 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Vendor's Invoice#*
                </label>
                <Input
                  type="text"
                  placeholder="e.g. INV-9041"
                  value={vendorInvoiceNo}
                  onChange={(e) => setVendorInvoiceNo(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Invoice Date
                </label>
                <Input
                  type="date"
                  value={vendorInvoiceDate}
                  onChange={(e) => setVendorInvoiceDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Multi-Currency & Billing Currency Bar */}
          <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs gap-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Purchase Bill Currency:
              </span>
              <div className="w-56">
                <Select
                  value={billCurrency}
                  onValueChange={handleCurrencyChange}
                  className="h-7 text-xs font-semibold bg-white dark:bg-slate-800"
                  options={availableCurrencies.map(c => ({
                    value: c.code,
                    label: `${c.code} (${c.symbol}) - ${c.name}`
                  }))}
                />
              </div>
              {billCurrency !== "INR" && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  • Billed in {billCurrency} ({billCurrencySymbol})
                </span>
              )}
            </div>
            {billCurrency !== "INR" && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Exchange Rate: 1 {billCurrency} =</span>
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

          {/* Row 2: Bill Entry Date, Terms & Due Date, Receiving Warehouse */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            <div>
              <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                Bill Entry Date*
              </label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            {documentSettings.showPaymentTerms !== false && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Terms & Due Date
                </label>
                <div className="flex gap-2">
                  <Select
                    value={paymentTerms}
                    onValueChange={(val) => {
                      setPaymentTerms(val)
                      const bDate = new Date(billDate)
                      if (val === "Due on Receipt") setDueDate(billDate)
                      else if (val === "Net 15") bDate.setDate(bDate.getDate() + 15)
                      else if (val === "Net 30") bDate.setDate(bDate.getDate() + 30)
                      else if (val === "Net 60") bDate.setDate(bDate.getDate() + 60)
                      setDueDate(bDate.toISOString().split("T")[0])
                    }}
                    className="w-28 h-9 text-xs"
                    options={[
                      { value: "Due on Receipt", label: "Due on Receipt" },
                      { value: "Net 15", label: "Net 15 Days" },
                      { value: "Net 30", label: "Net 30 Days" },
                      { value: "Net 60", label: "Net 60 Days" },
                    ]}
                  />
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Warehouse className="h-3.5 w-3.5 text-blue-600" />
                <span>Receiving Warehouse (Godown)*</span>
              </label>
              <Select
                value={godownId}
                onValueChange={(val) => setGodownId(val)}
                options={godowns.map(g => ({
                  value: g.id,
                  label: g.address ? `${g.name} (${g.address})` : g.name
                }))}
                className="w-full h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Divider matching AddItemForm */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* SECTION 2: Purchased Items & Rates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Item Table
              </span>
              <p className="text-[11px] text-slate-500">
                Purchased goods will be added to the stock of the selected warehouse
              </p>
            </div>
            {documentSettings.showPlaceOfSupply !== false && isGstEnabled && isPlaceOfSupplyEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-medium">
                  Place of Supply: <span className="font-semibold text-slate-700 dark:text-slate-300">{isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}</span>
                </span>
              </div>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto bg-white dark:bg-slate-900 shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8fafc] dark:bg-slate-900 text-[11px] border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
                  <TableHead className="w-10 px-1 py-2 text-center">
                    {documentSettings.showBarcodeScan !== false ? (
                      <button
                        type="button"
                        onClick={() => setIsBarcodeModalOpen(true)}
                        className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer shadow-2xs hover:scale-105 inline-flex items-center justify-center"
                        title="Open Barcode Scanner (or enter item code)"
                        aria-label="Scan Barcode / Enter Item Code"
                      >
                        <ScanLine className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-slate-400 font-bold">#</span>
                    )}
                  </TableHead>
                  <TableHead className="min-w-[240px] px-3 py-2.5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    ITEM & DESCRIPTION
                  </TableHead>
                  {documentSettings.showHsn !== false && isGstEnabled && isHsnEnabled && (
                    <TableHead className="w-24 px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">HSN/SAC</TableHead>
                  )}
                  <TableHead className="w-32 px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">QUANTITY</TableHead>
                  <TableHead className="w-28 px-2 py-2.5 text-right text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">COST RATE ({billCurrencySymbol})</TableHead>
                  {documentSettings.showDiscount !== false && (
                    <TableHead className="w-24 px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">DISCOUNT</TableHead>
                  )}
                  {isGstEnabled && (
                    <TableHead className="w-24 px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">GST %</TableHead>
                  )}
                  <TableHead className="w-32 px-3 py-2.5 text-right text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">AMOUNT ({billCurrencySymbol})</TableHead>
                  {activeCustomColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      className="w-28 px-2 py-2.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      <span className="truncate block max-w-[100px]" title={col.name}>
                        {col.name}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-10 px-1 py-2.5 text-center">
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
                {calculatedLines.map((line, idx) => {
                  const itm = items.find(i => i.id === line.itemId)
                  const currentStockInGodown = itm?.stockByGodown[godownId] || 0

                  return (
                    <TableRow 
                      key={idx} 
                      className={cn(
                        "text-xs border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 transition-all duration-150 ease-out",
                        activeDragIndex === idx
                          ? "bg-blue-50/90 dark:bg-blue-950/70 shadow-md ring-2 ring-blue-500/40 z-20 scale-[1.003]"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {/* Drag Grip Handle */}
                      <TableCell className="w-10 px-2 py-2.5 text-center align-middle">
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

                      {/* Item Selector */}
                      <TableCell className="px-3 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 mt-0.5">
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
                          <div className="flex-1 min-w-0">
                            <Select
                              searchable
                              searchPlaceholder="Search product by name, code, barcode, or SKU..."
                              value={line.itemId}
                              onValueChange={(val) => {
                                handleUpdateLine(idx, { itemId: val })
                              }}
                              options={items.map(it => ({
                                value: it.id,
                                label: it.name,
                                description: `Code: ${it.itemCode || it.barcode || it.code} • SKU: ${it.code} • Rate: ₹${it.purchasePrice || 0} • Stock: ${it.stockByGodown[godownId] || 0} ${it.unit}`
                              }))}
                              size="sm"
                              className="h-8 text-xs font-semibold w-full"
                              placeholder="Select an item..."
                            />
                            {line.itemId && (
                              <div className="flex flex-col gap-1 mt-1.5">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                  <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{line.sku || "N/A"}</span></span>
                                  <span>•</span>
                                  <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{currentStockInGodown} {line.unit}</strong></span>
                                </div>

                                {itm?.hasBatch && (
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    {line.batchNo ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                                          <Layers className="h-3 w-3" />
                                          <span>Inward Batch: {line.batchNo}</span>
                                          {line.expiryDate && <span> • Exp: {line.expiryDate}</span>}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setBatchModalState({ isOpen: true, lineIndex: idx })}
                                          className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                          Change Batch
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setBatchModalState({ isOpen: true, lineIndex: idx })}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 cursor-pointer"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Select / Create Inward Batch (Required)</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* HSN */}
                      {documentSettings.showHsn !== false && isGstEnabled && isHsnEnabled && (
                        <TableCell className="px-2 py-2.5 align-top pt-2.5">
                          <Input
                            type="text"
                            value={line.hsn}
                            onChange={(e) => handleUpdateLine(idx, { hsn: e.target.value })}
                            placeholder="HSN"
                            className="h-8 w-full text-center text-xs font-mono font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:border-blue-600"
                          />
                        </TableCell>
                      )}

                      {/* Quantity with integrated Unit */}
                      <TableCell className="px-2 py-2.5 align-top pt-2.5">
                        <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 shadow-2xs">
                          <input
                            type="number"
                            min="1"
                            value={line.qty || ""}
                            onChange={(e) => handleUpdateLine(idx, { qty: Math.max(0, Number(e.target.value)) })}
                            placeholder="1"
                            className="h-8 w-full text-right px-2 text-xs font-bold tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 uppercase shrink-0 py-1.5 select-none">
                            {line.unit || "UNIT"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Purchase Rate */}
                      <TableCell className="px-2 py-2.5 align-top pt-2.5">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.rate || ""}
                          onChange={(e) => handleUpdateLine(idx, { rate: Math.max(0, Number(e.target.value)) })}
                          placeholder="0.00"
                          className="h-8 w-full text-right text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </TableCell>

                      {/* Discount % or ₹ */}
                      {documentSettings.showDiscount !== false && (
                        <TableCell className="px-2 py-2.5 align-top pt-2.5">
                          <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateLine(idx, { 
                                discountType: (line as any).discountType === "amount" ? "percent" : "amount" 
                              } as any)}
                              className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none transition-colors"
                              title="Click to toggle between % and ₹"
                            >
                              {(line as any).discountType === "amount" ? "₹" : "%"}
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={(line as any).discountType === "amount" ? undefined : 100}
                              step={(line as any).discountType === "amount" ? "1" : "0.5"}
                              value={line.discountPercent || ""}
                              onChange={(e) => handleUpdateLine(idx, { 
                                discountPercent: (line as any).discountType === "amount" 
                                  ? Math.max(0, Number(e.target.value)) 
                                  : Math.min(100, Math.max(0, Number(e.target.value))) 
                              })}
                              placeholder="0"
                              className="h-8 w-full text-right text-xs font-semibold tabular-nums bg-transparent focus:outline-none px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </TableCell>
                      )}

                      {/* GST Slab */}
                      {isGstEnabled && (
                        <TableCell className="px-2 py-2.5 align-top pt-2.5">
                          <Select
                            value={String(line.gstRate)}
                            onValueChange={(val) => handleUpdateLine(idx, { gstRate: Number(val) })}
                            size="xs"
                            className="h-8 w-full text-xs font-semibold text-center"
                            options={getGstRateOptions(gstSettings?.enableGst, taxGroups)}
                          />
                        </TableCell>
                      )}

                      {/* Total Amount (with Taxable subtext) */}
                      <TableCell className="px-3 py-2.5 align-top pt-2.5 text-right font-medium">
                        <div className="font-bold tabular-nums text-slate-900 dark:text-white text-xs">
                          {billCurrencySymbol}{line.total.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
                          Taxable: {billCurrencySymbol}{line.taxableAmount.toFixed(2)}
                        </div>
                        {effectiveIsRcm && (
                          <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Excl. RCM
                          </span>
                        )}
                      </TableCell>

                      {/* Custom Columns */}
                      {activeCustomColumns.map((col) => (
                        <TableCell key={col.id} className="w-28 px-1.5 py-2.5 align-top pt-2.5 text-center">
                          <Input
                            type="text"
                            value={line.customColumns?.[col.id] || ""}
                            onChange={(e) => handleUpdateLineCustomColumn(idx, col.id, e.target.value)}
                            placeholder={col.name}
                            className="h-8 text-center text-xs w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2 font-medium"
                          />
                        </TableCell>
                      ))}

                      {/* Delete Action */}
                      <TableCell className="w-10 px-1 py-2.5 align-top pt-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add New Line Item</span>
              </button>

              {documentSettings.showBarcodeScan !== false && (
                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Scan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Items in Bulk</span>
              </button>
            </div>

            {isGstEnabled && (
              <span className="text-[11px] text-slate-400">
                {effectiveIsRcm
                  ? `Reverse Charge (RCM) active: Tax of ₹${totalTax.toFixed(2)} is self-assessed & payable directly to Govt.`
                  : `Tax rates will be calculated as ${isInterState ? "IGST (Inter-state)" : "CGST 50% + SGST 50% (Intra-state)"}`
                }
              </span>
            )}
          </div>
        </div>

        {/* Divider matching AddItemForm */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* SECTION 3: GST Classification & ITC (Conditional on GST and ITC/RCM settings) */}
        {isGstEnabled && (isItcOptionEnabled || isRcmOptionEnabled) && (
          <div className={cn(
            "grid gap-8 items-start",
            isItcOptionEnabled && isRcmOptionEnabled ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            
            {/* Left Column: ITC Eligibility with Switch Toggle */}
            {isItcOptionEnabled && (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                    Input Tax Credit (ITC) Eligibility
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Determines whether ITC is claimed in GSTR-3B Table 4
                  </p>
                </div>

                <div className={`p-3 rounded-md border transition-all ${
                  isItcEligible 
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20" 
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          Claim Input Tax Credit (ITC)?
                        </p>
                        {isItcEligible ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                            ELIGIBLE • {itcCategory.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                            INELIGIBLE (NO ITC)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isItcEligible 
                          ? "ITC will be claimed in GSTR-3B Table 4. Select classification category below:"
                          : "No ITC claimed • Blocked under Section 17(5) or exempt purchase (₹0 ITC)"
                        }
                      </p>
                    </div>

                    <Switch
                      checked={isItcEligible}
                      onCheckedChange={setIsItcEligible}
                    />
                  </div>

                  {isItcEligible && (
                    <div className="grid grid-cols-3 gap-2 text-xs pt-3 mt-3 border-t border-emerald-200/80 dark:border-emerald-900/50">
                      {[
                        { id: "inputs", label: "Inputs (Raw Materials)" },
                        { id: "capital_goods", label: "Capital Goods" },
                        { id: "services", label: "Input Services" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setItcCategory(opt.id as any)}
                          className={`py-2 px-2.5 rounded-md border text-center text-xs transition-all cursor-pointer ${
                            itcCategory === opt.id
                              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600 font-semibold shadow-xs"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Column: Reverse Charge Mechanism (RCM) */}
            {isRcmOptionEnabled && (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                    Reverse Charge Mechanism (RCM)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Applicable for unregistered vendors or specified services (GTA, legal)
                  </p>
                </div>

                <div className={`p-3 rounded-md border transition-all ${
                  isRcm 
                    ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" 
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                } flex items-center justify-between`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        Subject to Reverse Charge?
                      </p>
                      {isRcm && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          RCM Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isRcm 
                        ? `GST is payable directly to Govt. Vendor invoice amount: ₹${subtotal.toFixed(2)}`
                        : "Tax is paid to vendor as normal forward charge"
                      }
                    </p>
                  </div>

                  <Switch
                    checked={isRcm}
                    onCheckedChange={setIsRcm}
                  />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Divider matching AddItemForm */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* SECTION 4: Payment Terms & Summary Grid matching NewInvoiceForm / AddItemForm */}
        <div className="flex flex-col md:flex-row justify-between gap-8 pt-2">
          
          {/* Left Column: Settlement Terms & Notes (max-w-md) */}
          <div className="flex-1 max-w-md space-y-4 text-xs">

            {documentSettings.showCustomerNotes !== false && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Remarks / Transporter / LR Reference
                  </label>
                  <NotesPresetSelector
                    documentType="bill"
                    onSelect={(content) => setNotes(content)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received via Transport, LR No: 994182"
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}

            {documentSettings.showTermsConditions !== false && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Terms & Conditions
                  </label>
                  <TermsPresetSelector
                    documentType="purchase_bill"
                    onSelect={(terms) => setTermsAndConditions(terms)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* Right Summary Grid (matching NewInvoiceForm exact layout) */}
          <div className="w-full md:w-[400px] space-y-3 text-xs">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Summary & Taxes
              </span>
              {effectiveIsRcm && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  RCM Bill
                </span>
              )}
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Taxable Subtotal:
              </span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Tax rows — only when GST is enabled */}
            {isGstEnabled && (
              <>
                {!isInterState ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {effectiveIsRcm ? "CGST (RCM - Self Payable):" : "CGST (Central Tax):"}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(cgstTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {effectiveIsRcm ? "SGST (RCM - Self Payable):" : "SGST (State Tax):"}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(sgstTotal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {effectiveIsRcm ? "IGST (RCM - Self Payable):" : "IGST (Integrated Tax):"}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(igstTotal)}
                    </span>
                  </div>
                )}

                {/* ITC Claimable Feedback in Summary */}
                {isItcOptionEnabled && (
                  <div className={`flex items-center justify-between text-xs py-1 px-2 rounded border ${
                    !isItcEligible || totalTax === 0
                      ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
                      : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                  }`}>
                    <span className="font-medium">ITC Claimable:</span>
                    <span className="font-bold tabular-nums">
                      {!isItcEligible 
                        ? "₹0.00 (Ineligible u/s 17(5))" 
                        : totalTax === 0
                        ? "₹0.00 (0% Tax / Exempt)"
                        : `${formatCurrency(totalTax)} (${itcCategory.replace("_", " ").toUpperCase()})`
                      }
                    </span>
                  </div>
                )}

                {/* RCM Callout Pill */}
                {effectiveIsRcm && (
                  <div className="p-2.5 rounded-md bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
                    <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>RCM Tax (Payable to Govt):</span>
                      </span>
                      <span className="tabular-nums font-bold">{formatCurrency(totalTax)}</span>
                    </div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-tight">
                      Excluded from vendor balance. Pay directly via Electronic Cash Ledger on GST portal.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Withholding Tax (TDS/TCS) - strictly respect settings */}
            {documentSettings.showWithholdingTax !== false && isWithholdingEnabled && (
              <div className="flex items-center justify-between gap-3 py-1">
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

                <span className="font-semibold text-xs tabular-nums text-slate-900 dark:text-white w-20 text-right">
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

            {/* Buy on Credit (Vendor Credit) Switch Toggle */}
            {documentSettings.showCreditToggle !== false && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isCredit}
                      onCheckedChange={(checked) => {
                        setIsCredit(checked)
                        if (checked) {
                          setPaymentMode("credit")
                          if (paymentTerms === "Due on Receipt") {
                            setPaymentTerms("Net 30")
                            const bDate = new Date(billDate)
                            bDate.setDate(bDate.getDate() + 30)
                            setDueDate(bDate.toISOString().split("T")[0])
                          }
                        } else {
                          setPaymentMode("bank")
                        }
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                        Buy on Credit (Vendor Credit)?
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isCredit ? "Record as payable liability (Pay vendor later)" : "Immediate settlement from bank / cash"}
                      </span>
                    </div>
                  </div>

                  {isCredit && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 text-[10px] font-bold uppercase tracking-wider">
                      Vendor Credit ({paymentTerms})
                    </Badge>
                  )}
                </div>

                {/* Dynamic Vendor Credit Status Callout */}
                {isCredit && selectedVendor && (
                  <div className={cn(
                    "p-2.5 rounded-lg border text-xs space-y-1.5 animate-in fade-in duration-150",
                    isVendorCreditExceeded 
                      ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
                      : "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200"
                  )}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Vendor Available Credit:</span>
                      <span className="tabular-nums font-bold">
                        {billCurrencySymbol}{vendorAvailableCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-80">
                      <span>Credit Limit: {billCurrencySymbol}{vendorCreditLimit.toLocaleString("en-IN")}</span>
                      <span>Current Payable: {billCurrencySymbol}{vendorPayableBalance.toLocaleString("en-IN")}</span>
                    </div>
                    {hasPayment && numPaid > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                        <span>Paid Immediately (Excluded from Credit):</span>
                        <span className="tabular-nums font-semibold">-{billCurrencySymbol}{numPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-0.5 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>Net Credit for this Bill:</span>
                      <span className="tabular-nums font-bold">{billCurrencySymbol}{effectiveBillCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    {isVendorCreditExceeded && (
                      <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        ⚠️ Note: Net credit requested ({billCurrencySymbol}{effectiveBillCredit.toFixed(2)}) exceeds vendor available credit headroom.
                      </div>
                    )}
                  </div>
                )}

                {/* Immediate Settlement Mode when Credit is OFF */}
                {!isCredit && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 text-[11px] font-medium">Settlement Mode:</span>
                    <div className="w-32">
                      <Select
                        value={paymentMode}
                        onValueChange={(val) => setPaymentMode(val as any)}
                        size="xs"
                        className="h-7 text-xs font-medium"
                        options={[
                          { value: "bank", label: "Bank Transfer" },
                          { value: "cash", label: "Cash" },
                          { value: "upi", label: "UPI" },
                          { value: "cheque", label: "Cheque" },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advance / Immediate Payment Section with Switch Toggle */}
            {documentSettings.showAdvancePayment !== false && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hasPayment}
                      onCheckedChange={(checked) => {
                        setHasPayment(checked)
                        if (!checked) {
                          setPaidAmountInput("")
                        } else {
                          if (!paidAmountInput) setPaidAmountInput(roundedGrandTotal)
                        }
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isCredit ? "Partial Advance Payment Paid?" : "Advance Payment Paid?"}
                    </span>
                  </div>
                  {hasPayment && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                      numPaid >= roundedGrandTotal && roundedGrandTotal > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}>
                      {numPaid >= roundedGrandTotal && roundedGrandTotal > 0 ? "Full Paid" : "Partial Advance"}
                    </span>
                  )}
                </div>

                {hasPayment && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Payment Mode
                      </label>
                      <Select
                        value={paymentMode}
                        onValueChange={(val) => setPaymentMode(val as any)}
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
                        Amount Paid ({billCurrencySymbol})*
                      </label>
                      <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                        <span className="inline-flex items-center px-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                          {billCurrencySymbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={paidAmountInput}
                          onChange={(e) => setPaidAmountInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 focus:outline-none font-semibold text-right tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Net Bill Amount */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {effectiveIsRcm ? "Net Bill (Payable to Vendor):" : "Net Bill Amount:"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {effectiveIsRcm ? "Tax excluded under RCM" : "Inclusive of all taxes"}
                </span>
              </div>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                {formatCurrency(roundedGrandTotal)}
              </span>
            </div>

            {/* Balance Payable to Vendor */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Balance Payable to Vendor:</span>
              <span className={`font-bold text-sm tabular-nums ${balancePayable > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {formatCurrency(balancePayable)}
              </span>
            </div>

          </div>

        </div>

        </div>
      </form>

      {/* Inward Batch Selection Modal */}
      {batchModalState.lineIndex !== null && (
        <SelectBatchModal
          isOpen={batchModalState.isOpen}
          onClose={() => setBatchModalState({ isOpen: false, lineIndex: null })}
          item={items.find(it => it.id === lines[batchModalState.lineIndex!]?.itemId) || null}
          godownId={godownId}
          currentBatchNo={lines[batchModalState.lineIndex!]?.batchNo}
          currentQty={lines[batchModalState.lineIndex!]?.qty || 1}
          mode="purchase"
          onSelectBatch={handleBatchSelected}
        />
      )}

      {/* Bulk Add Items Modal */}
      <BulkAddLineItemsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAddItems={handleBulkAddItems}
        rateType="purchase"
      />

      {/* Barcode Scanner & Item Code Entry Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onAddProducts={handleBulkAddItems}
        rateType="purchase"
        godownId={godownId}
      />

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="bill"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="bill"
      />
    </div>
  )
}

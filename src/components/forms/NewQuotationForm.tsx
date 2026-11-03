"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  Save,
  X, 
  ArrowLeft,
  Trash2,
  Plus,
  PlusCircle,
  HelpCircle,
  Image as ImageIcon,
  GripVertical,
  ScanLine,
  Sliders
} from "lucide-react"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { QuotationStatus } from "@/types/inventory"
import { formatINR, cn } from "@/lib/utils"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { AdditionalChargesSection, AdditionalChargeItem } from "@/components/common/AdditionalChargesSection"
import { getPlaceOfSupplyOptions, isInterStateTransaction, getGstRateOptions } from "@/lib/gstConstants"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewQuotationFormProps {
  onCancel: () => void
  onSuccess: (quotationNo?: string) => void
}

export function NewQuotationForm({ onCancel, onSuccess }: NewQuotationFormProps) {
  const { parties, items, godowns, activeGodownId, createQuotation, quotations, business, gstSettings, documentSettings, tdsRates, tcsRates, taxGroups, termsTemplates, currencies, formCustomColumns } = useApp()

  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = (formCustomColumns?.quotation || []).filter(c => c.isEnabled !== false)

  // Form Fields
  const [customerName, setCustomerName] = useState("")
  const [partyGstin, setPartyGstin] = useState("")
  const [partyStateCode, setPartyStateCode] = useState("27")
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0])
  const [validTillDate, setValidTillDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [godownId, setGodownId] = useState(activeGodownId || godowns[0]?.id || "godown-1")
  const [status, setStatus] = useState<QuotationStatus>("sent")
  const [notes, setNotes] = useState("Rates valid till specified expiry date. Delivery within 3 days of PO receipt.")
  const [terms, setTerms] = useState("1. Payment: 30 days credit from invoice date.\n2. Prices are inclusive of packaging.\n3. Goods once sold will not be returned unless damaged in transit.")
  const [hasAdditionalCharges, setHasAdditionalCharges] = useState(false)
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeItem[]>([])
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [currency, setCurrency] = useState("INR")
  const [currencySymbol, setCurrencySymbol] = useState("₹")
  const [exchangeRate, setExchangeRate] = useState<number>(1)

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

  const formatCurrency = (amt: number) => {
    if (currency === "INR" || currencySymbol === "₹") {
      return `₹${formatINR(amt)}`
    }
    return `${currencySymbol}${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Apply default quotation terms template
  useEffect(() => {
    if (termsTemplates && termsTemplates.length > 0) {
      const defaultTemplate = termsTemplates.find(
        (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes("quotation")) && t.isDefault
      )
      if (defaultTemplate) {
        setTerms(defaultTemplate.content)
      }
    }
  }, [termsTemplates])

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
  const [errorMsg, setErrorMsg] = useState("")

  // Line items state
  const [lines, setLines] = useState<Array<{
    itemId: string
    qty: number
    rate: number
    discount: number
    discountType?: "percent" | "amount"
    gstRate?: number
    customColumns?: Record<string, string>
  }>>([
    { itemId: items[0]?.id || "", qty: 10, rate: items[0]?.salePrice || 100, discount: 0, discountType: "percent", gstRate: items[0]?.gstRate || 18, customColumns: {} }
  ])
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  const handlePartySelect = (name: string) => {
    setCustomerName(name)
    const party = parties.find(p => p.name?.trim().toLowerCase() === name?.trim().toLowerCase() || p.id === name)
    if (party) {
      setPartyGstin(party.gstin || "")
      setPartyStateCode(party.stateCode || "27")
      const partyCurr = party.currency || "INR"
      const foundCurr = availableCurrencies.find(c => c.code === partyCurr)
      const partySym = party.currencySymbol || foundCurr?.symbol || (partyCurr === "USD" ? "$" : partyCurr === "EUR" ? "€" : partyCurr === "AED" ? "د.إ" : partyCurr === "GBP" ? "£" : "₹")
      const partyRate = foundCurr?.exchangeRate || (partyCurr === "INR" ? 1 : 84.10)
      setCurrency(partyCurr)
      setCurrencySymbol(partySym)
      setExchangeRate(partyRate)
      updateLinesCurrency(partyCurr, partyRate)
    } else {
      setCurrency("INR")
      setCurrencySymbol("₹")
      setExchangeRate(1)
      updateLinesCurrency("INR", 1)
    }
  }

  const handleAddLine = () => {
    const unselectedItem = items.find(it => !lines.some(l => l.itemId === it.id)) || items[0]
    const baseRate = unselectedItem?.salePrice || 0
    const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
    setLines(prev => [
      ...prev,
      { itemId: unselectedItem?.id || "", qty: 1, rate, discount: 0, gstRate: unselectedItem?.gstRate || 18, customColumns: {} }
    ])
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const newLines = selectedList.map(({ item, qty }) => {
        const baseRate = item.salePrice || 0
        const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
        return {
          itemId: item.id,
          qty: Math.max(1, Number(qty) || 1),
          rate,
          discount: 0,
          gstRate: item.gstRate || 18,
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
    if (lines.length === 1) return
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  const handleLineChange = (index: number, field: string, value: any) => {
    setLines(prev => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }

      if (field === "itemId") {
        const it = items.find(i => i.id === value)
        if (it) {
          const isWholesale = Boolean(!it.hasBatch && it.enableWholesale && (Number(current.qty) || 1) >= (it.wholesaleMinQty || 1))
          const hasMrp = Boolean(it.enableMrp && it.mrp)
          const baseRate = hasMrp ? it.mrp : isWholesale ? (it.wholesalePrice || it.salePrice || 0) : (it.salePrice || 0)
          current.rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
          current.discount = hasMrp
            ? (isWholesale ? (it.discountOnMrpForWholesale ?? 0) : (it.discountOnMrp ?? 0))
            : (isWholesale ? (it.wholesaleDiscount || 0) : (it.salesDiscount || 0))
          current.discountType = hasMrp
            ? (isWholesale ? (it.discountOnMrpForWholesaleType || "percent") : (it.discountOnMrpType || "percent"))
            : (isWholesale ? (it.wholesaleDiscountType || "percent") : (it.salesDiscountType || "percent"))
          current.gstRate = it.gstRate || 18
        }
      } else if (field === "qty") {
        const it = items.find(i => i.id === current.itemId)
        if (it && !it.hasBatch && it.enableWholesale && it.wholesaleMinQty) {
          const nowMeets = (Number(value) || 0) >= it.wholesaleMinQty
          const wasMeets = (Number(updated[index].qty) || 0) >= it.wholesaleMinQty
          if (nowMeets !== wasMeets) {
            const hasMrp = Boolean(it.enableMrp && it.mrp)
            const baseRate = hasMrp ? it.mrp : nowMeets ? (it.wholesalePrice || it.salePrice || 0) : (it.salePrice || 0)
            current.rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
            current.discount = hasMrp
              ? (nowMeets ? (it.discountOnMrpForWholesale ?? 0) : (it.discountOnMrp ?? 0))
              : (nowMeets ? (it.wholesaleDiscount || 0) : (it.salesDiscount || 0))
            current.discountType = hasMrp
              ? (nowMeets ? (it.discountOnMrpForWholesaleType || "percent") : (it.discountOnMrpType || "percent"))
              : (nowMeets ? (it.wholesaleDiscountType || "percent") : (it.salesDiscountType || "percent"))
          }
        }
      }
      updated[index] = current
      return updated
    })
  }

  // Calculations
  const isInterState = Boolean(
    gstSettings?.enablePlaceOfSupply && 
    isInterStateTransaction(partyStateCode, business.stateCode || "27")
  )

  const calculatedLines = lines.map(line => {
    const it = items.find(i => i.id === line.itemId)
    const qty = Number(line.qty) || 0
    const rate = Number(line.rate) || 0
    const discount = Number(line.discount) || 0
    const gross = qty * rate
    const lineDiscountAmount = line.discountType === "amount"
      ? Math.min(gross, discount * (qty || 1))
      : (gross * discount) / 100
    const taxable = Math.max(0, gross - lineDiscountAmount)
    const rawGstRate = line.gstRate !== undefined ? line.gstRate : (it?.gstRate || 18)
    const gstRate = !gstSettings?.enableGst ? 0 : rawGstRate

    // Assess tax based on MRP if item has calculateTaxOnMrp enabled
    const taxBase = (it?.calculateTaxOnMrp && it?.mrp) ? qty * it.mrp : taxable
    const tax = (taxBase * gstRate) / 100
    const total = taxable + tax

    const cgst = isInterState ? 0 : tax / 2
    const sgst = isInterState ? 0 : tax / 2
    const igst = isInterState ? tax : 0

    return {
      itemId: line.itemId,
      name: it?.name || "Item",
      hsn: it?.hsn || "",
      qty,
      unit: it?.unit || "PCS",
      rate,
      discountPercent: discount,
      gstRate,
      customColumns: line.customColumns || {},
      taxableAmount: taxable,
      cgst,
      sgst,
      igst,
      total
    }
  })

  const subtotal = calculatedLines.reduce((sum, l) => sum + l.taxableAmount, 0)
  const taxTotal = calculatedLines.reduce((sum, l) => sum + (l.cgst + l.sgst + l.igst), 0)
  const cgstTotal = calculatedLines.reduce((sum, l) => sum + l.cgst, 0)
  const sgstTotal = calculatedLines.reduce((sum, l) => sum + l.sgst, 0)
  const igstTotal = calculatedLines.reduce((sum, l) => sum + l.igst, 0)
  const totalAdditionalCharges = hasAdditionalCharges
    ? additionalCharges.reduce((acc, c) => acc + (parseFloat(String(c.amount)) || 0), 0)
    : 0

  // Withholding Tax (TDS/TCS) - strictly respect settings
  const isCurrentTypeActive = (withholdingType === "TDS" && isTdsEnabled) || (withholdingType === "TCS" && isTcsEnabled)
  const withholdingRate = (isCurrentTypeActive && selectedWithholdingTax) ? Number(selectedWithholdingTax) : 0
  const withholdingAmount = (subtotal * withholdingRate) / 100

  // Grand Total & Round Off (TDS reduces receivable; TCS increases total)
  const withholdingAdjustment = isCurrentTypeActive 
    ? (withholdingType === "TDS" ? -withholdingAmount : withholdingAmount) 
    : 0
  const rawGrandTotal = Math.max(0, subtotal + taxTotal + withholdingAdjustment + totalAdditionalCharges)
  const autoRoundOff = Number((Math.round(rawGrandTotal) - rawGrandTotal).toFixed(2))
  const roundOff = manualRoundOff !== null ? (Number(manualRoundOff) || 0) : autoRoundOff
  const roundedGrandTotal = Number((rawGrandTotal + roundOff).toFixed(2))

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg("")
    if (!customerName.trim()) {
      setErrorMsg("Please select or specify a customer / prospect name.")
      return
    }

    if (lines.length === 0 || lines.some(l => l.qty <= 0)) {
      setErrorMsg("Please ensure all line items have a valid quantity greater than 0.")
      return
    }

    const matchedParty = parties.find(p => p.name === customerName)
    const godownObj = godowns.find(g => g.id === godownId) || godowns[0]

    const validCharges = hasAdditionalCharges
      ? additionalCharges
          .filter(c => c.name.trim() || Number(c.amount) !== 0)
          .map(c => ({ id: c.id, name: c.name.trim() || "Additional Charge", amount: parseFloat(String(c.amount)) || 0 }))
      : []

    const res = createQuotation({
      date: quotationDate,
      validTillDate: validTillDate,
      partyId: matchedParty?.id || `lead-${Date.now()}`,
      partyName: customerName,
      partyGstin: partyGstin.trim() || undefined,
      partyStateCode: partyStateCode,
      godownId: godownId,
      godownName: godownObj?.name || "Main Warehouse",
      items: calculatedLines,
      subtotal,
      taxTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      adjustment: totalAdditionalCharges,
      adjustmentLabel: validCharges[0]?.name || "Additional Charges",
      additionalCharges: validCharges,
      withholdingType: isCurrentTypeActive && withholdingAmount > 0 ? withholdingType : undefined,
      withholdingRate: isCurrentTypeActive && withholdingAmount > 0 ? withholdingRate : undefined,
      withholdingAmount: isCurrentTypeActive && withholdingAmount > 0 ? withholdingAmount : undefined,
      roundOff,
      currency,
      currencySymbol,
      exchangeRate,
      grandTotal: roundedGrandTotal,
      status: status,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined
    })

    if (res.success) {
      onSuccess(res.quotationNo)
    } else {
      setErrorMsg(res.message)
    }
  }

  const nextQuotationNumberPreview = `QT-26-00${quotations.length + 10}`

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Standard Sticky Form Header matching AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Quotations"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              New Quotation / Estimate
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {nextQuotationNumberPreview}
            </span>
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
            onClick={handleSave}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Quotation</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas matching AddItemForm */}
      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">
          
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700">✕</button>
            </div>
          )}

          {/* SECTION 1: Customer & Commercial Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Customer & Commercial Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Customer / Prospect Name*
                </label>
                <Select
                  searchable
                  allowCustomValue
                  searchPlaceholder="Search customer by name, GSTIN..."
                  placeholder="Select or enter customer name..."
                  value={customerName}
                  onValueChange={(val) => handlePartySelect(val)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                  options={parties.map(p => ({
                    value: p.name,
                    label: `${p.name}${p.currency && p.currency !== "INR" ? ` [${p.currency} - ${p.currencySymbol || "$"}]` : ""}`,
                    description: p.gstin ? `GSTIN: ${p.gstin}${p.state ? ` • ${p.state}` : ""}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer GSTIN (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="27AAACM..."
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value)}
                  className="h-9 text-xs font-mono border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                />
              </div>

              {documentSettings.showPlaceOfSupply !== false && gstSettings?.enablePlaceOfSupply && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Place of Supply
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {isInterState ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)"}
                    </span>
                  </div>
                  <Select
                    searchable
                    value={partyStateCode}
                    onValueChange={(val) => setPartyStateCode(val)}
                    options={getPlaceOfSupplyOptions(business.stateCode || "27")}
                    className="w-full h-9 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Quotation Date
                </label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Valid Till (Expiry Date)*
                </label>
                <Input
                  type="date"
                  value={validTillDate}
                  onChange={(e) => setValidTillDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900 font-medium text-blue-600 dark:text-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Source Godown
                </label>
                <Select
                  value={godownId}
                  onValueChange={(val) => setGodownId(val)}
                  options={godowns.map(g => ({ value: g.id, label: g.name }))}
                  className="w-full h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Initial Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as QuotationStatus)}
                  options={[
                    { value: "sent", label: "Sent to Client" },
                    { value: "draft", label: "Draft Proposal" },
                    { value: "accepted", label: "Accepted / Approved" },
                  ]}
                  className="w-full h-9 text-xs font-semibold text-blue-600"
                />
              </div>
            </div>

            {/* Multi-Currency & Billing Currency Bar */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs gap-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Quotation Currency:
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
                    • Quoted in {currency} ({currencySymbol})
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
          </div>

          {/* SECTION 2: Quotation Line Items */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Quotation Items & Proposed Rates
              </h2>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
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
                    <TableHead className="min-w-[220px] text-[11px] h-9 px-3 font-bold text-slate-700 dark:text-slate-300 uppercase">
                      ITEM DETAILS
                    </TableHead>
                    {documentSettings.showHsn !== false && (
                      <TableHead className="w-20 text-center text-[11px] h-9 px-2 font-bold text-slate-700 dark:text-slate-300 uppercase">HSN/SAC</TableHead>
                    )}
                    <TableHead className="w-24 text-center text-[11px] h-9 px-2 font-bold text-slate-700 dark:text-slate-300 uppercase">QTY</TableHead>
                    <TableHead className="w-28 text-right text-[11px] h-9 px-2 font-bold text-slate-700 dark:text-slate-300 uppercase">RATE ({currencySymbol})</TableHead>
                    {documentSettings.showDiscount !== false && (
                      <TableHead className="w-28 text-center text-[11px] h-9 px-2 font-bold text-slate-700 dark:text-slate-300 uppercase">DISCOUNT</TableHead>
                    )}
                    <TableHead className="w-20 text-center text-[11px] h-9 px-2 font-bold text-slate-700 dark:text-slate-300 uppercase">GST %</TableHead>
                    <TableHead className="w-28 text-right text-[11px] h-9 px-3 font-bold text-slate-700 dark:text-slate-300 uppercase">AMOUNT ({currencySymbol})</TableHead>
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
                    <TableHead className="w-10 text-center text-[11px] h-9 px-1">
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
                    const it = items.find(i => i.id === line.itemId)
                    const calc = calculatedLines[idx]

                    return (
                      <TableRow 
                        key={idx} 
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 transition-all duration-150 ease-out",
                          activeDragIndex === idx
                            ? "bg-blue-50/90 dark:bg-blue-950/70 shadow-md ring-2 ring-blue-500/40 z-20 scale-[1.003]"
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                        )}
                      >
                        {/* Drag Grip Handle */}
                        <TableCell className="w-10 px-2 py-2 text-center align-middle">
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
                        <TableCell className="px-3 py-2">
                          <div className="flex items-start gap-2.5">
                            <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 mt-0.5">
                              {(it?.images?.[0] || it?.image) ? (
                                <img
                                  src={it.images?.[0] || it.image}
                                  alt={it.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Select
                                searchable
                                searchPlaceholder="Search product by name, code, barcode, SKU..."
                                value={line.itemId}
                                onValueChange={(val) => handleLineChange(idx, "itemId", val)}
                                placeholder="Select Item..."
                                size="sm"
                                className="w-full h-8 text-xs font-medium"
                                options={[
                                  { value: "", label: "Select Item..." },
                                  ...items.map(i => ({
                                    value: i.id,
                                    label: i.name,
                                    description: `Code: ${i.itemCode || i.barcode || i.code} • SKU: ${i.code} • Rate: ₹${i.salePrice} • Stock: ${i.currentStock} ${i.unit}`
                                  }))
                                ]}
                              />
                              {line.itemId && it && (
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                  <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{it.code || "N/A"}</span></span>
                                  <span>•</span>
                                  <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{it.stockByGodown[godownId] ?? it.currentStock ?? 0} {it.unit}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {documentSettings.showHsn !== false && (
                          <TableCell className="text-center text-xs font-mono text-slate-500 px-2 py-2">
                            {it?.hsn || "—"}
                          </TableCell>
                        )}
                        <TableCell className="px-2 py-2 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) => handleLineChange(idx, "qty", Math.max(1, parseInt(e.target.value) || 0))}
                            className="h-8 text-center text-xs w-full px-2 font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) => handleLineChange(idx, "rate", parseFloat(e.target.value) || 0)}
                            className="h-8 text-right text-xs w-full px-2.5 font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                        {documentSettings.showDiscount !== false && (
                          <TableCell className="px-2 py-2 text-center">
                            <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 focus-within:border-blue-600 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleLineChange(idx, "discountType", line.discountType === "amount" ? "percent" : "amount")}
                                className="px-1.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none transition-colors"
                                title={`Click to toggle between % and ${currencySymbol}`}
                              >
                                {line.discountType === "amount" ? currencySymbol : "%"}
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={line.discountType === "amount" ? undefined : 100}
                                value={line.discount}
                                onChange={(e) => handleLineChange(idx, "discount", line.discountType === "amount" ? Math.max(0, parseFloat(e.target.value) || 0) : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                className="h-8 text-center text-xs w-full px-1 font-semibold tabular-nums bg-transparent focus:outline-none"
                              />
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="px-1.5 py-2 text-center">
                          <Select
                            value={String(line.gstRate !== undefined ? line.gstRate : (it?.gstRate || 18))}
                            onValueChange={(val) => handleLineChange(idx, "gstRate", Number(val))}
                            size="xs"
                            className="h-8 w-24 text-center text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md"
                            options={getGstRateOptions(gstSettings?.enableGst, taxGroups)}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-900 dark:text-white tabular-nums px-3 py-2">
                          {currencySymbol}{calc?.total.toFixed(2) || "0.00"}
                        </TableCell>
                        {activeCustomColumns.map((col) => (
                          <TableCell key={col.id} className="w-28 px-1.5 py-2 text-center">
                            <Input
                              type="text"
                              value={line.customColumns?.[col.id] || ""}
                              onChange={(e) => handleUpdateLineCustomColumn(idx, col.id, e.target.value)}
                              placeholder={col.name}
                              className="h-8 text-center text-xs w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2 font-medium"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center px-1 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length === 1}
                            className="text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors p-1"
                            title="Remove row"
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

            {/* Bottom action buttons */}
            <div className="flex items-center gap-3 pt-1">
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
          </div>

          {/* SECTION 3: Notes & Financial Calculation Summary */}
          <div className="pt-2 flex flex-col md:flex-row justify-between gap-8 items-start">
            <div className="flex-1 w-full max-w-md space-y-4">
              {documentSettings.showCustomerNotes !== false && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Commercial Notes (Printed on Quotation)
                    </label>
                    <NotesPresetSelector
                      documentType="quotation"
                      onSelect={(content) => setNotes(content)}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special notes or dispatch commitments..."
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}

              {documentSettings.showTermsConditions !== false && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Terms & Conditions
                    </label>
                    <TermsPresetSelector
                      documentType="quotation"
                      onSelect={(content) => setTerms(content)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Payment terms, delivery timeline..."
                    className="w-full text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>

            <div className="w-full md:w-88 space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {cgstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>CGST Output (Intra-state):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(cgstTotal)}
                  </span>
                </div>
              )}

              {sgstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>SGST Output (Intra-state):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(sgstTotal)}
                  </span>
                </div>
              )}

              {igstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>IGST Output (Inter-state):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(igstTotal)}
                  </span>
                </div>
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
                <div className="flex items-center justify-between gap-3 py-1">
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
                      className="h-7 w-24 text-right text-xs font-semibold tabular-nums border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      title="Auto-calculated round off. Click to edit, or click 'Reset' to restore auto calculation."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-blue-600 dark:text-blue-400">
                <span>Estimated Grand Total:</span>
                <span className="tabular-nums text-base">
                  {formatCurrency(roundedGrandTotal)}
                </span>
              </div>
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
        documentType="quotation"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="quotation"
      />
    </div>
  )
}

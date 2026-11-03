"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Save,
  X,
  ArrowLeft,
  Trash2,
  Plus,
  PlusCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  Warehouse,
  Image as ImageIcon,
  GripVertical,
  ScanLine,
  Sliders
} from "lucide-react"
import { PurchaseReturnReason, PurchaseReturnStatus, ReturnItemLine } from "@/types/inventory"
import { formatINR, cn } from "@/lib/utils"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { getGstRateOptions } from "@/lib/gstConstants"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewPurchaseReturnFormProps {
  onCancel: () => void
  onSuccess: (returnNo?: string) => void
  initialBillId?: string
}

export function NewPurchaseReturnForm({ onCancel, onSuccess, initialBillId }: NewPurchaseReturnFormProps) {
  const { parties, items, godowns, activeGodownId, purchaseDocs, createPurchaseReturn, gstSettings, taxGroups, tdsRates, tcsRates, currencies, documentSettings, formCustomColumns } = useApp()
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = (formCustomColumns?.purchase_return || []).filter(c => c.isEnabled !== false)

  const linkedBill = initialBillId ? purchaseDocs.find(b => b.id === initialBillId) : undefined

  // Multi-Currency State
  const [currency, setCurrency] = useState<string>(linkedBill?.currency || "INR")
  const [currencySymbol, setCurrencySymbol] = useState<string>(linkedBill?.currencySymbol || "₹")
  const [exchangeRate, setExchangeRate] = useState<number>(linkedBill?.exchangeRate || 1)

  const availableCurrencies = (currencies && currencies.length > 0)
    ? currencies.filter(c => c.isActive !== false)
    : [
      { id: "c-inr", code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 1 },
      { id: "c-usd", code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 84.10 },
      { id: "c-eur", code: "EUR", name: "Euro", symbol: "€", exchangeRate: 91.25 },
      { id: "c-aed", code: "AED", name: "UAE Dirham", symbol: "AED", exchangeRate: 22.90 },
      { id: "c-gbp", code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 109.40 }
    ]

  // Form Fields
  const [vendorId, setVendorId] = useState<string>(linkedBill ? linkedBill.partyId : "")
  const [vendorName, setVendorName] = useState<string>(linkedBill ? linkedBill.partyName : "")
  const [vendorGstin, setVendorGstin] = useState<string>(linkedBill ? linkedBill.partyGstin || "" : "")
  const [vendorStateCode, setVendorStateCode] = useState<string>("27")
  const [originalBillId, setOriginalBillId] = useState<string>(linkedBill ? linkedBill.id : "")
  const [originalBillNo, setOriginalBillNo] = useState<string>(linkedBill ? linkedBill.docNo : "")
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [dispatchGodownId, setDispatchGodownId] = useState<string>(
    linkedBill ? linkedBill.godownId : (activeGodownId || godowns[0]?.id || "godown-1")
  )
  const [transporter, setTransporter] = useState<string>("SpeedEx Express Cargo (MH-04-TR-9182)")
  const [lrNumber, setLrNumber] = useState<string>("LR-99281")
  const [reason, setReason] = useState<PurchaseReturnReason>("quality_inspection_rejected")
  const [status, setStatus] = useState<PurchaseReturnStatus>("dispatched")
  const [notes, setNotes] = useState<string>(
    linkedBill ? `Return dispatched against Bill ${linkedBill.docNo}` : "Rejected goods returned to vendor after inspection."
  )
  const [isRcm, setIsRcm] = useState<boolean>(Boolean(linkedBill?.isRcm))
  const [errorMsg, setErrorMsg] = useState("")
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  // GST & RCM Options
  const isGstEnabled = Boolean(gstSettings?.enableGst)
  const isRcmOptionEnabled = isGstEnabled && (gstSettings?.enableRcm !== false)
  const effectiveIsRcm = isRcmOptionEnabled && isRcm

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



  // Line items state
  const [lines, setLines] = useState<Array<{
    itemId: string
    name: string
    code: string
    hsn: string
    qty: number
    rate: number
    gstRate: number
    condition: "resalable" | "damaged" | "expired"
    customColumns?: Record<string, string>
  }>>(() => {
    if (linkedBill && linkedBill.items.length > 0) {
      return linkedBill.items.map(it => ({
        itemId: it.itemId,
        name: it.name,
        code: (it as any).code || items.find(i => i.id === it.itemId)?.code || "",
        hsn: it.hsn || "8471",
        qty: it.qty,
        rate: it.rate,
        gstRate: it.gstRate,
        condition: "damaged",
        customColumns: (it as any).customColumns || {}
      }))
    }
    const firstItem = items[0]
    return [{
      itemId: firstItem?.id || "",
      name: firstItem?.name || "Item",
      code: firstItem?.code || "",
      hsn: firstItem?.hsn || "8471",
      qty: 1,
      rate: firstItem?.purchasePrice || 80,
      gstRate: firstItem?.gstRate ?? 18,
      condition: "damaged",
      customColumns: {}
    }]
  })

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

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  // Vendor parties
  const vendorParties = parties.filter(p => p.type === "supplier" || p.type === "both")

  const handleVendorSelect = (name: string) => {
    setVendorName(name)
    const party = parties.find(p => p.name === name)
    if (party) {
      setVendorId(party.id)
      setVendorGstin(party.gstin || "")
      setVendorStateCode(party.stateCode || "27")
      const partyCurr = party.currency || "INR"
      const foundCurr = availableCurrencies.find(c => c.code === partyCurr)
      const partySym = party.currencySymbol || foundCurr?.symbol || (partyCurr === "USD" ? "$" : partyCurr === "EUR" ? "€" : partyCurr === "AED" ? "د.إ" : partyCurr === "GBP" ? "£" : "₹")
      const partyRate = foundCurr?.exchangeRate || (partyCurr === "INR" ? 1 : 84.10)
      setCurrency(partyCurr)
      setCurrencySymbol(partySym)
      setExchangeRate(partyRate)
      updateLinesCurrency(partyCurr, partyRate)
    } else {
      setVendorId("")
      setVendorGstin("")
      setCurrency("INR")
      setCurrencySymbol("₹")
      setExchangeRate(1)
      updateLinesCurrency("INR", 1)
    }
  }

  const handleBillSelect = (billId: string) => {
    setOriginalBillId(billId)
    const bill = purchaseDocs.find(b => b.id === billId)
    if (bill) {
      setOriginalBillNo(bill.docNo)
      setVendorId(bill.partyId)
      setVendorName(bill.partyName)
      setVendorGstin(bill.partyGstin || "")
      setDispatchGodownId(bill.godownId)
      setIsRcm(Boolean(bill.isRcm))

      if (bill.currency) {
        setCurrency(bill.currency)
        setCurrencySymbol(bill.currencySymbol || (bill.currency === "INR" ? "₹" : "$"))
        setExchangeRate(bill.exchangeRate || 1)
      }

      if (bill.items && bill.items.length > 0) {
        setLines(bill.items.map(it => ({
          itemId: it.itemId,
          name: it.name,
          code: (it as any).code || items.find(i => i.id === it.itemId)?.code || "",
          hsn: it.hsn || "8471",
          qty: it.qty,
          rate: it.rate,
          gstRate: it.gstRate,
          condition: "damaged"
        })))
      }
    }
  }

  const handleAddLine = () => {
    const unselected = items.find(it => !lines.some(l => l.itemId === it.id)) || items[0]
    const baseRate = unselected?.purchasePrice || 0
    const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
    setLines(prev => [
      ...prev,
      {
        itemId: unselected?.id || "",
        name: unselected?.name || "Item",
        code: unselected?.code || "",
        hsn: unselected?.hsn || "8471",
        qty: 1,
        rate,
        gstRate: unselected?.gstRate ?? 18,
        condition: "damaged",
        customColumns: {}
      }
    ])
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const newLines = selectedList.map(({ item, qty }) => {
        const baseRate = item.purchasePrice || 0
        const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
        return {
          itemId: item.id,
          name: item.name || "Item",
          code: item.code || "",
          hsn: item.hsn || "8471",
          qty: Math.max(1, Number(qty) || 1),
          rate,
          gstRate: item.gstRate ?? 18,
          condition: "damaged" as const,
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
          const baseRate = it.purchasePrice || 0
          const rate = currency !== "INR" && exchangeRate > 0 ? Number((baseRate / exchangeRate).toFixed(2)) : baseRate
          current.name = it.name
          current.code = it.code || ""
          current.hsn = it.hsn || "8471"
          current.rate = rate
          current.gstRate = it.gstRate ?? 18
        }
      }
      updated[index] = current
      return updated
    })
  }

  // Calculations
  const calculatedLines: ReturnItemLine[] = lines.map(line => {
    const qty = Number(line.qty) || 0
    const rate = Number(line.rate) || 0
    const taxable = qty * rate
    const rawGstRate = line.gstRate !== undefined ? line.gstRate : 18
    const gstRate = !gstSettings?.enableGst ? 0 : rawGstRate
    const tax = (taxable * gstRate) / 100

    const isInterState = vendorStateCode !== "27"
    const cgst = isInterState ? 0 : tax / 2
    const sgst = isInterState ? 0 : tax / 2
    const igst = isInterState ? tax : 0

    return {
      itemId: line.itemId,
      name: line.name,
      code: line.code,
      hsn: line.hsn,
      qty,
      rate,
      gstRate,
      customColumns: line.customColumns || {},
      amount: taxable,
      cgst,
      sgst,
      igst,
      total: effectiveIsRcm ? taxable : (taxable + tax),
      condition: line.condition
    }
  })

  const subtotal = calculatedLines.reduce((acc, l) => acc + l.amount, 0)
  const cgstTotal = calculatedLines.reduce((acc, l) => acc + l.cgst, 0)
  const sgstTotal = calculatedLines.reduce((acc, l) => acc + l.sgst, 0)
  const igstTotal = calculatedLines.reduce((acc, l) => acc + l.igst, 0)
  const totalTax = cgstTotal + sgstTotal + igstTotal

  // Withholding Tax (TDS/TCS) - strictly respect settings
  const isCurrentTypeActive = (withholdingType === "TDS" && isTdsEnabled) || (withholdingType === "TCS" && isTcsEnabled)
  const withholdingRate = (isCurrentTypeActive && selectedWithholdingTax) ? Number(selectedWithholdingTax) : 0
  const withholdingAmount = (subtotal * withholdingRate) / 100

  // Grand Total: under RCM, vendor debit excludes tax because vendor never collected tax
  const withholdingAdjustment = isCurrentTypeActive
    ? (withholdingType === "TDS" ? -withholdingAmount : withholdingAmount)
    : 0
  const grandTotal = Math.max(0, (effectiveIsRcm ? subtotal : (subtotal + totalTax)) + withholdingAdjustment)

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg("")

    if (!vendorName.trim()) {
      setErrorMsg("Please select or specify a Vendor.")
      return
    }

    if (calculatedLines.length === 0 || calculatedLines.some(l => l.qty <= 0)) {
      setErrorMsg("Please ensure all items have a valid return quantity greater than 0.")
      return
    }

    const res = createPurchaseReturn({
      date: returnDate,
      originalBillId: originalBillId || undefined,
      originalBillNo: originalBillNo || "DIRECT-BILL",
      vendorId: vendorId || "vendor-direct",
      vendorName: vendorName.trim(),
      vendorGstin: vendorGstin || undefined,
      dispatchGodownId: dispatchGodownId || godowns[0]?.id || "godown-1",
      transporter: transporter.trim() || undefined,
      lrNumber: lrNumber.trim() || undefined,
      reason,
      items: calculatedLines,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      withholdingType: isCurrentTypeActive && withholdingAmount > 0 ? withholdingType : undefined,
      withholdingRate: isCurrentTypeActive && withholdingAmount > 0 ? withholdingRate : undefined,
      withholdingAmount: isCurrentTypeActive && withholdingAmount > 0 ? withholdingAmount : undefined,
      grandTotal,
      isRcm: effectiveIsRcm,
      status,
      currency,
      currencySymbol,
      exchangeRate,
      notes: notes.trim() || undefined
    })

    if (res.success) {
      onSuccess(res.returnNo)
    } else {
      setErrorMsg(res.message || "Failed to create Purchase Return.")
    }
  }

  const selectedGodown = godowns.find(g => g.id === dispatchGodownId)

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">

      {/* 1. Standard Form Header matching AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Purchase Returns"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              New Purchase Return
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              PR-26-AUTO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDocSettingsOpen(true)}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
            title="Document Settings"
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
            <span>Save Purchase Return</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas matching AddItemForm */}
      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button type="button" onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700">✕</button>
            </div>
          )}

          {/* SECTION 1: Vendor & Bill Link */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Vendor & Original Bill Linkage
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Vendor / Supplier Name*
                </label>
                <Select
                  searchable
                  allowCustomValue
                  searchPlaceholder="Search vendor by name, GSTIN..."
                  placeholder="Select vendor..."
                  value={vendorName}
                  onValueChange={(val) => handleVendorSelect(val)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={vendorParties.map(p => ({
                    value: p.name,
                    label: p.name,
                    description: p.gstin ? `GSTIN: ${p.gstin} • ${p.state || "State"}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Original Purchase Bill (Optional)
                </label>
                <Select
                  searchable
                  placeholder="Link original Bill..."
                  value={originalBillId}
                  onValueChange={(val) => handleBillSelect(val)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={purchaseDocs
                    .filter(b => !vendorName || b.partyName.toLowerCase() === vendorName.toLowerCase())
                    .map(b => ({
                      value: b.id,
                      label: `${b.docNo} (${b.partyName})`,
                      description: `Date: ${b.date} • Total: ${formatINR(b.grandTotal)} • Items: ${b.items.length}`
                    }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Dispatch Date*
                </label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Dispatch Godown*
                </label>
                <Select
                  value={dispatchGodownId}
                  onValueChange={(val) => setDispatchGodownId(val)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={godowns.map(g => ({
                    value: g.id,
                    label: g.name,
                    description: g.address
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Transporter / Courier
                </label>
                <Input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="Transport name / vehicle..."
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  LR / Docket Number
                </label>
                <Input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="e.g. LR-98124"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Dispatch Status*
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as PurchaseReturnStatus)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={[
                    { value: "dispatched", label: "Dispatched (Auto Stock Outward)", description: "Stock deducted from godown" },
                    { value: "draft", label: "Draft Gate Pass", description: "Do not deduct stock yet" },
                    { value: "acknowledged", label: "Supplier Acknowledged", description: "Vendor confirmed receipt" }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Reason for Return*
                </label>
                <Select
                  value={reason}
                  onValueChange={(val) => setReason(val as PurchaseReturnReason)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={[
                    { value: "quality_inspection_rejected", label: "Quality Inspection Failed / QC Rejection" },
                    { value: "damaged_in_transit", label: "Damaged In Transit / Broken" },
                    { value: "defective_batch", label: "Defective Batch / Manufacturing Defect" },
                    { value: "wrong_specification", label: "Wrong Item / Spec Mismatch" },
                    { value: "supplier_rate_discrepancy", label: "Supplier Overcharge / Rate Discrepancy" },
                    { value: "other", label: "Other Commercial Reason" }
                  ]}
                />
              </div>

              {/* Inventory Impact Callout */}
              <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Warehouse className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>
                  <strong>Inventory Outward:</strong> {status === "dispatched"
                    ? `Quantities returned will be deducted from "${selectedGodown?.name || "Selected Godown"}".`
                    : "Stock will remain in inventory until marked 'Dispatched'."}
                </span>
              </div>
            </div>

            {/* RCM (Reverse Charge Mechanism) Section */}
            {isRcmOptionEnabled && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Reverse Charge Mechanism (RCM)
                    </span>
                    {effectiveIsRcm && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        RCM Return
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {effectiveIsRcm
                      ? `Vendor debit excludes GST (vendor was not paid tax). Self-assessed RCM tax of ${formatCurrency(totalTax)} will be reversed in GSTR-3B Table 3.1(d) & 4(B).`
                      : "Tax was charged by vendor under forward charge. Vendor debit includes GST."}
                  </p>
                </div>
                <Switch
                  checked={isRcm}
                  onCheckedChange={setIsRcm}
                />
              </div>
            )}

            {/* Multi-Currency & Billing Currency Bar */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs gap-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Purchase Return Currency:
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
          </div>

          {/* SECTION 2: Returned Line Items Table */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Dispatched Items & Condition
              </h2>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto bg-white dark:bg-slate-900 shadow-2xs">
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
                        <span className="text-[11px] font-bold text-slate-400">#</span>
                      )}
                    </TableHead>
                    <TableHead className="w-64 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ITEM & SPECIFICATION
                    </TableHead>
                    <TableHead className="w-36 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">CONDITION</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">QTY OUT</TableHead>
                    <TableHead className="w-28 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">PURCHASE RATE ({currencySymbol})</TableHead>
                    <TableHead className="w-28 px-2 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">GST %</TableHead>
                    <TableHead className="w-32 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">TOTAL ({currencySymbol})</TableHead>
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
                    <TableHead className="w-12 px-2 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                        <TableCell className="p-2">
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
                                value={line.itemId}
                                onValueChange={(val) => handleLineChange(idx, "itemId", val)}
                                className="w-full h-8 text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                options={items.map(it => ({
                                  value: it.id,
                                  label: it.name,
                                  description: `SKU: ${it.code || "-"} • Cost: ${formatINR(it.purchasePrice)} • HSN: ${it.hsn || "-"}`
                                }))}
                              />
                              {line.itemId && (() => {
                                const itemObj = items.find(i => i.id === line.itemId)
                                const stock = itemObj ? (itemObj.stockByGodown[dispatchGodownId] ?? itemObj.currentStock ?? 0) : 0
                                return itemObj ? (
                                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                    <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{itemObj.code || "N/A"}</span></span>
                                    <span>•</span>
                                    <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{stock} {itemObj.unit}</strong></span>
                                  </div>
                                ) : null
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={line.condition}
                            onValueChange={(val) => handleLineChange(idx, "condition", val)}
                            className="w-full h-8 text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            options={[
                              { value: "damaged", label: "Defective / Damaged" },
                              { value: "resalable", label: "Wrong Item (Intact)" },
                              { value: "expired", label: "Expired Stock" }
                            ]}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) => handleLineChange(idx, "qty", Math.max(1, Number(e.target.value)))}
                            className="h-8 text-xs text-right font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) => handleLineChange(idx, "rate", Math.max(0, Number(e.target.value)))}
                            className="h-8 text-xs text-right font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Select
                            value={String(line.gstRate !== undefined ? line.gstRate : 18)}
                            onValueChange={(val) => handleLineChange(idx, "gstRate", Number(val))}
                            size="xs"
                            className="h-8 w-24 mx-auto text-center text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md"
                            options={getGstRateOptions(gstSettings?.enableGst, taxGroups)}
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(calc?.total || 0)}
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
                        <TableCell className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={lines.length === 1}
                            onClick={() => handleRemoveLine(idx)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
            {documentSettings.showCustomerNotes !== false && (
              <div className="flex-1 w-full max-w-md space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Dispatch Remarks / Gate Pass Notes
                  </label>
                  <NotesPresetSelector
                    documentType="purchase_return"
                    onSelect={(content) => setNotes(content)}
                  />
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate pass number, driver contact, carton count, seal numbers..."
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}

            <div className="w-full md:w-80 space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {effectiveIsRcm ? (
                <div className="p-2.5 rounded-md bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] space-y-1">
                  <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-300">
                    <span>RCM Tax Reversal:</span>
                    <span className="tabular-nums">{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    RCM liability &amp; claimed ITC will be reversed in GSTR-3B. Vendor debit excludes GST.
                  </div>
                </div>
              ) : (
                <>
                  {cgstTotal > 0 && (
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>CGST:</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(cgstTotal)}</span>
                    </div>
                  )}
                  {sgstTotal > 0 && (
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>SGST:</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(sgstTotal)}</span>
                    </div>
                  )}
                  {igstTotal > 0 && (
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>IGST:</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(igstTotal)}</span>
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

                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white w-20 text-right">
                    {withholdingType === "TDS" && withholdingAmount > 0 ? `-${formatCurrency(withholdingAmount)}` : formatCurrency(withholdingAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-blue-600 dark:text-blue-400">
                <span>{effectiveIsRcm ? "Total Value (Vendor Debit):" : "Total Outward Value:"}</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                A Debit Note can be generated with 1-click once this Purchase Return is saved.
              </p>
            </div>
          </div>

        </div>
      </form>

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
        godownId={dispatchGodownId}
      />

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="purchase_return"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="purchase_return"
      />
    </div>
  )
}

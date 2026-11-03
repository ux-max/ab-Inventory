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
  FileText,
  AlertCircle,
  Warehouse,
  Image as ImageIcon,
  GripVertical,
  ScanLine,
  Sliders
} from "lucide-react"
import { DebitNoteReason, DebitNoteStatus, ReturnItemLine } from "@/types/inventory"
import { formatINR, cn } from "@/lib/utils"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { getPlaceOfSupplyOptions, isInterStateTransaction, getGstRateOptions } from "@/lib/gstConstants"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewDebitNoteFormProps {
  onCancel: () => void
  onSuccess: (debitNoteNo?: string) => void
  initialPurchaseReturnId?: string
  initialBillId?: string
}

export function NewDebitNoteForm({
  onCancel,
  onSuccess,
  initialPurchaseReturnId,
  initialBillId
}: NewDebitNoteFormProps) {
  const { parties, items, godowns, activeGodownId, purchaseDocs, purchaseReturns, createDebitNote, business, gstSettings, taxGroups, tdsRates, tcsRates, termsTemplates, currencies, documentSettings, formCustomColumns } = useApp()
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = (formCustomColumns?.debit_note || []).filter(c => c.isEnabled !== false)

  const linkedReturn = initialPurchaseReturnId ? purchaseReturns.find(r => r.id === initialPurchaseReturnId) : undefined
  const linkedBill = initialBillId ? purchaseDocs.find(b => b.id === initialBillId) : undefined

  // Multi-Currency State
  const [currency, setCurrency] = useState<string>(
    linkedReturn?.currency || linkedBill?.currency || "INR"
  )
  const [currencySymbol, setCurrencySymbol] = useState<string>(
    linkedReturn?.currencySymbol || linkedBill?.currencySymbol || "₹"
  )
  const [exchangeRate, setExchangeRate] = useState<number>(
    linkedReturn?.exchangeRate || linkedBill?.exchangeRate || 1
  )

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
  const [vendorId, setVendorId] = useState<string>(
    linkedReturn?.vendorId || linkedBill?.partyId || ""
  )
  const [vendorName, setVendorName] = useState<string>(
    linkedReturn?.vendorName || linkedBill?.partyName || ""
  )
  const [vendorGstin, setVendorGstin] = useState<string>(
    linkedReturn?.vendorGstin || linkedBill?.partyGstin || ""
  )
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("27-Maharashtra")
  const [originalBillId, setOriginalBillId] = useState<string>(
    linkedReturn?.originalBillId || linkedBill?.id || ""
  )
  const [originalBillNo, setOriginalBillNo] = useState<string>(
    linkedReturn?.originalBillNo || linkedBill?.docNo || ""
  )
  const [purchaseReturnId, setPurchaseReturnId] = useState<string>(linkedReturn?.id || "")
  const [purchaseReturnNo, setPurchaseReturnNo] = useState<string>(linkedReturn?.returnNo || "")

  const [debitNoteDate, setDebitNoteDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [reason, setReason] = useState<DebitNoteReason>(
    linkedReturn ? "purchase_return" : "quality_rejection"
  )
  const [status, setStatus] = useState<DebitNoteStatus>("open")

  // If linked to physical purchase return, stock was already dispatched.
  const [deductFromInventory, setDeductFromInventory] = useState<boolean>(!linkedReturn)
  const [godownId, setGodownId] = useState<string>(activeGodownId || godowns[0]?.id || "godown-1")

  const [notes, setNotes] = useState<string>(
    linkedReturn
      ? `Debit Note issued against Purchase Return ${linkedReturn.returnNo} for Bill ${linkedReturn.originalBillNo}`
      : linkedBill
        ? `Debit Note issued against Bill ${linkedBill.docNo}`
        : "Debit adjustment / supplier reversal as per GST Section 34."
  )
  const [terms, setTerms] = useState<string>(
    "1. Debit amount will be adjusted against upcoming supplier payments.\n2. ITC has been reversed in accordance with CGST Rules, 2017.\n3. Discrepancy acknowledged as per statutory commercial agreement."
  )
  const [isRcm, setIsRcm] = useState<boolean>(Boolean(linkedReturn?.isRcm || linkedBill?.isRcm))
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
    customColumns?: Record<string, string>
  }>>(() => {
    if (linkedReturn && linkedReturn.items.length > 0) {
      return linkedReturn.items.map(it => ({
        itemId: it.itemId,
        name: it.name,
        code: it.code || "",
        hsn: it.hsn || "8471",
        qty: it.qty,
        rate: it.rate,
        gstRate: it.gstRate,
        customColumns: {}
      }))
    }
    if (linkedBill && linkedBill.items.length > 0) {
      return linkedBill.items.map(it => ({
        itemId: it.itemId,
        name: it.name,
        code: (it as any).code || items.find(i => i.id === it.itemId)?.code || "",
        hsn: it.hsn || "8471",
        qty: it.qty,
        rate: it.rate,
        gstRate: it.gstRate,
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

  // Vendor options
  const vendorParties = parties.filter(p => p.type === "supplier" || p.type === "both")

  const handleVendorSelect = (name: string) => {
    setVendorName(name)
    const party = parties.find(p => p.name === name)
    if (party) {
      setVendorId(party.id)
      setVendorGstin(party.gstin || "")
      if (party.stateCode) {
        setPlaceOfSupply(`${party.stateCode}-${party.state || "Maharashtra"}`)
      }
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
      setGodownId(bill.godownId)
      setIsRcm(Boolean(bill.isRcm))

      if (bill.currency) {
        setCurrency(bill.currency)
        setCurrencySymbol(bill.currencySymbol || (bill.currency === "INR" ? "₹" : "$"))
        setExchangeRate(bill.exchangeRate || 1)
      }

      if (bill.items && bill.items.length > 0 && !linkedReturn) {
        setLines(bill.items.map(it => ({
          itemId: it.itemId,
          name: it.name,
          code: (it as any).code || items.find(i => i.id === it.itemId)?.code || "",
          hsn: it.hsn || "8471",
          qty: it.qty,
          rate: it.rate,
          gstRate: it.gstRate
        })))
      }
    }
  }

  const handleReturnSelect = (prId: string) => {
    setPurchaseReturnId(prId)
    const pr = purchaseReturns.find(r => r.id === prId)
    if (pr) {
      setPurchaseReturnNo(pr.returnNo)
      setOriginalBillId(pr.originalBillId || "")
      setOriginalBillNo(pr.originalBillNo || "")
      setVendorId(pr.vendorId)
      setVendorName(pr.vendorName)
      setVendorGstin(pr.vendorGstin || "")
      setGodownId(pr.dispatchGodownId)
      setDeductFromInventory(false) // already dispatched
      setReason("purchase_return")
      setIsRcm(Boolean(pr.isRcm))

      if (pr.currency) {
        setCurrency(pr.currency)
        setCurrencySymbol(pr.currencySymbol || (pr.currency === "INR" ? "₹" : "$"))
        setExchangeRate(pr.exchangeRate || 1)
      }

      if (pr.items && pr.items.length > 0) {
        setLines(pr.items.map(it => ({
          itemId: it.itemId,
          name: it.name,
          code: it.code || "",
          hsn: it.hsn || "8471",
          qty: it.qty,
          rate: it.rate,
          gstRate: it.gstRate
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
  const isInterState = Boolean(
    gstSettings?.enablePlaceOfSupply &&
    isInterStateTransaction(placeOfSupply, business.stateCode || "27")
  )

  const calculatedLines: ReturnItemLine[] = lines.map(line => {
    const qty = Number(line.qty) || 0
    const rate = Number(line.rate) || 0
    const taxable = qty * rate
    const rawGstRate = line.gstRate !== undefined ? line.gstRate : 18
    const gstRate = !gstSettings?.enableGst ? 0 : rawGstRate
    const tax = (taxable * gstRate) / 100

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
      total: effectiveIsRcm ? taxable : (taxable + tax)
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

  // Grand Total (under RCM: vendor debit excludes tax because vendor never collected tax)
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
      setErrorMsg("Please ensure all items have a quantity greater than 0.")
      return
    }

    const res = createDebitNote({
      date: debitNoteDate,
      originalBillId: originalBillId || undefined,
      originalBillNo: originalBillNo || "DIRECT-BILL",
      purchaseReturnId: purchaseReturnId || undefined,
      purchaseReturnNo: purchaseReturnNo || undefined,
      vendorId: vendorId || "vendor-direct",
      vendorName: vendorName.trim(),
      vendorGstin: vendorGstin || undefined,
      placeOfSupply,
      reason,
      deductFromInventory,
      godownId: deductFromInventory ? godownId : undefined,
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
      notes: notes.trim(),
      terms: terms.trim()
    })

    if (res.success) {
      onSuccess(res.debitNoteNo)
    } else {
      setErrorMsg(res.message || "Failed to create Debit Note.")
    }
  }

  const selectedGodown = godowns.find(g => g.id === godownId)

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">

      {/* 1. Standard Form Header matching AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Debit Notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              New GST Debit Note
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              DN-26-AUTO
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
            <span>Save Debit Note</span>
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

          {/* SECTION 1: Vendor & Document Link */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Vendor & Reference Document
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Vendor Name*
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
                    description: p.gstin ? `GSTIN: ${p.gstin} • State: ${p.state || "Maharashtra"}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Original Purchase Bill Reference*
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
                      description: `Date: ${b.date} • Total: ${formatINR(b.grandTotal)}`
                    }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Linked Purchase Return (Optional)
                </label>
                <Select
                  searchable
                  placeholder="Select Purchase Return slip..."
                  value={purchaseReturnId}
                  onValueChange={(val) => handleReturnSelect(val)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={purchaseReturns
                    .filter(r => !vendorName || r.vendorName.toLowerCase() === vendorName.toLowerCase())
                    .map(r => ({
                      value: r.id,
                      label: `${r.returnNo} (${r.vendorName})`,
                      description: `Date: ${r.date} • Value: ${formatINR(r.grandTotal)}`
                    }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Debit Note Date*
                </label>
                <Input
                  type="date"
                  value={debitNoteDate}
                  onChange={(e) => setDebitNoteDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>

              {documentSettings.showPlaceOfSupply !== false && gstSettings?.enablePlaceOfSupply && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      Place of Supply*
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {isInterState ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)"}
                    </span>
                  </div>
                  <Select
                    searchable
                    value={placeOfSupply}
                    onValueChange={(val) => setPlaceOfSupply(val)}
                    className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                    options={getPlaceOfSupplyOptions(business.stateCode || "27")}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Statutory GST Reason*
                </label>
                <Select
                  value={reason}
                  onValueChange={(val) => setReason(val as DebitNoteReason)}
                  className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                  options={[
                    { value: "purchase_return", label: "01 - Purchase Return" },
                    { value: "damaged_in_transit", label: "02 - Damaged in Transit" },
                    { value: "supplier_overcharge", label: "03 - Supplier Overcharge / Price Discrepancy" },
                    { value: "quality_rejection", label: "04 - Quality Rejection" },
                    { value: "volume_rebate", label: "05 - Volume / Annual Rebate Claim" },
                    { value: "other", label: "06 - Other Reasons" }
                  ]}
                />
              </div>
            </div>

            {/* Inventory toggle */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deductFromInventory"
                    checked={deductFromInventory}
                    onChange={(e) => setDeductFromInventory(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="deductFromInventory" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Deduct Physical Inventory from Godown
                  </label>
                </div>
                {purchaseReturnId && (
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    Linked to Purchase Return (Stock already deducted)
                  </span>
                )}
              </div>

              {deductFromInventory && (
                <div className="flex items-center gap-4 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Deduct from Godown:</span>
                  <div className="w-72">
                    <Select
                      value={godownId}
                      onValueChange={(val) => setGodownId(val)}
                      className="w-full h-8 text-xs font-medium border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                      options={godowns.map(g => ({
                        value: g.id,
                        label: g.name,
                        description: g.address
                      }))}
                    />
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    - Items will be deducted from {selectedGodown?.name} stock.
                  </span>
                </div>
              )}
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
                        RCM Debit Note
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
                  Debit Note Currency:
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

          {/* SECTION 2: Line Items Table */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Debit Line Items
              </h2>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
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
                    <TableHead className="w-72 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      ITEM & DESCRIPTION
                    </TableHead>
                    {documentSettings.showHsn !== false && (
                      <TableHead className="w-24 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">HSN/SAC</TableHead>
                    )}
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">QTY</TableHead>
                    <TableHead className="w-28 px-3 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">RATE ({currencySymbol})</TableHead>
                    <TableHead className="w-28 px-2 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">GST %</TableHead>
                    <TableHead className="w-32 px-3 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">TOTAL ({currencySymbol})</TableHead>
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
                    <TableHead className="w-12 px-2 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
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
                                const stock = itemObj ? (itemObj.stockByGodown[activeGodownId] ?? itemObj.currentStock ?? 0) : 0
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
                        {documentSettings.showHsn !== false && (
                          <TableCell className="p-2">
                            <Input
                              type="text"
                              value={line.hsn}
                              onChange={(e) => handleLineChange(idx, "hsn", e.target.value)}
                              className="h-8 text-xs tabular-nums border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </TableCell>
                        )}
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
            <div className="flex-1 w-full max-w-md space-y-4">
              {documentSettings.showCustomerNotes !== false && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Remarks / Purpose of Debit Note
                    </label>
                    <NotesPresetSelector
                      documentType="debit_note"
                      onSelect={(content) => setNotes(content)}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for issuance, reference details..."
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}

              {documentSettings.showTermsConditions !== false && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Terms & Conditions
                    </label>
                    <TermsPresetSelector
                      documentType="debit_note"
                      onSelect={(t) => setTerms(t)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Commercial terms..."
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>

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
                    Self-assessed RCM tax will be reversed in GSTR-3B Table 3.1(d) &amp; 4(B). Vendor debit excludes GST.
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
                    {withholdingType === "TDS" && withholdingAmount > 0 ? `-${withholdingAmount.toFixed(2)}` : withholdingAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-blue-600 dark:text-blue-400">
                <span>{effectiveIsRcm ? "Net Debit Note (Vendor Amount):" : "Net Debit Note Value:"}</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="p-2.5 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 mt-2">
                <strong>Statutory Reversal:</strong> {effectiveIsRcm ? "GSTR-3B Table 3.1(d) RCM liability reduction & Table 4(B) ITC reversal." : "GSTR-3B Table 4(B) ITC reduction."}
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
        documentType="debit_note"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="debit_note"
      />
    </div>
  )
}

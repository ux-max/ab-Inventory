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
  ChevronDown,
  HelpCircle,
  Plus,
  PlusCircle,
  Image as ImageIcon,
  GripVertical,
  ScanLine,
  Sliders
} from "lucide-react"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { AddCustomColumnModal } from "@/components/modals/AddCustomColumnModal"
import { ChallanType, InvoiceItem } from "@/types/inventory"
import { formatINR, cn } from "@/lib/utils"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { getPlaceOfSupplyOptions, isInterStateTransaction, getGstRateOptions } from "@/lib/gstConstants"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewDeliveryChallanFormProps {
  onCancel: () => void
  onSuccess: (challanNo?: string) => void
  initialLinkedOrderId?: string
}

export function NewDeliveryChallanForm({ onCancel, onSuccess, initialLinkedOrderId }: NewDeliveryChallanFormProps) {
  const { parties, items, godowns, activeGodownId, createDeliveryChallan, deliveryChallans, salesOrders, gstSettings, documentSettings, tdsRates, tcsRates, taxGroups, business, termsTemplates, formNotesTerms, formCustomColumns } = useApp()

  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Custom Item Columns (Max 3)
  const activeCustomColumns = (formCustomColumns?.challan || []).filter(c => c.isEnabled !== false)

  const linkedOrder = initialLinkedOrderId ? salesOrders.find(o => o.id === initialLinkedOrderId) : undefined

  // Form Fields
  const [partyName, setPartyName] = useState(linkedOrder ? linkedOrder.partyName : "")
  const [partyGstin, setPartyGstin] = useState(linkedOrder ? linkedOrder.partyGstin || "" : "")
  const [partyStateCode, setPartyStateCode] = useState(
    linkedOrder?.partyStateCode || parties.find(p => p.name === linkedOrder?.partyName)?.stateCode || business?.stateCode || "27"
  )
  const [partyAddress, setPartyAddress] = useState(
    parties.find(p => p.name === linkedOrder?.partyName)?.address || "Factory / Clinic Goods Gate, Industrial Area"
  )
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split("T")[0])
  const [challanType, setChallanType] = useState<ChallanType>("goods_dispatch")
  const [vehicleNo, setVehicleNo] = useState("MH-04-AB-8291")
  const [transporter, setTransporter] = useState("V-Trans Logistics (LR: VT-88219)")
  const [godownId, setGodownId] = useState(linkedOrder ? linkedOrder.godownId : (activeGodownId || godowns[0]?.id || "godown-1"))
  const [notes, setNotes] = useState(
    linkedOrder
      ? `Dispatched against Sales Order ${linkedOrder.orderNo}`
      : "Goods transport under Rule 55 of CGST Rules, 2017. Stock physically dispatched."
  )
  const [terms, setTerms] = useState(
    "1. Goods dispatched under Rule 55 of CGST Rules, 2017 without sale.\n2. Receiver to inspect quantities and verify seals upon delivery.\n3. Discrepancies must be endorsed on duplicate challan copy."
  )
  const [errorMsg, setErrorMsg] = useState("")

  // Apply default challan terms template
  useEffect(() => {
    if (termsTemplates && termsTemplates.length > 0) {
      const defaultTemplate = termsTemplates.find(
        (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes("challan")) && t.isDefault
      )
      if (defaultTemplate) {
        setTerms(defaultTemplate.content)
      }
    }
  }, [termsTemplates])

  // Auto-sync notes and terms if changed in Document Settings Drawer or preset configured
  useEffect(() => {
    if (formNotesTerms?.challan) {
      if (!linkedOrder && formNotesTerms.challan.notes) {
        setNotes(formNotesTerms.challan.notes)
      }
      if (formNotesTerms.challan.terms) {
        setTerms(formNotesTerms.challan.terms)
      }
    }
  }, [formNotesTerms?.challan?.notes, formNotesTerms?.challan?.terms])

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
    qty: number
    rate: number
    gstRate?: number
    customColumns?: Record<string, string>
  }>>(
    linkedOrder
      ? linkedOrder.items.map(it => ({ itemId: it.itemId, qty: it.qty, rate: it.rate, gstRate: it.gstRate, customColumns: {} }))
      : [{ itemId: items[0]?.id || "", qty: 10, rate: items[0]?.salePrice || 100, gstRate: items[0]?.gstRate || 18, customColumns: {} }]
  )
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  const handlePartySelect = (name: string) => {
    setPartyName(name)
    const party = parties.find(p => p.name?.trim().toLowerCase() === name?.trim().toLowerCase() || p.id === name)
    if (party) {
      setPartyGstin(party.gstin || "")
      setPartyAddress(party.address || "")
      if (party.stateCode) setPartyStateCode(party.stateCode)
    }
  }

  const handleAddLine = () => {
    const unselected = items.find(it => !lines.some(l => l.itemId === it.id)) || items[0]
    setLines(prev => [
      ...prev,
      { itemId: unselected?.id || "", qty: 1, rate: unselected?.salePrice || 0, gstRate: unselected?.gstRate || 18, customColumns: {} }
    ])
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const newLines = selectedList.map(({ item, qty }) => ({
        itemId: item.id,
        qty: Math.max(1, Number(qty) || 1),
        rate: item.salePrice || 0,
        gstRate: item.gstRate || 18,
        customColumns: {}
      }))
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
          current.rate = it.salePrice || 0
          current.gstRate = it.gstRate || 18
        }
      }
      updated[index] = current
      return updated
    })
  }

  // Inter-state GST calculation
  const isInterState = Boolean(
    gstSettings?.enablePlaceOfSupply &&
    isInterStateTransaction(partyStateCode, business?.stateCode || "27")
  )

  const calculatedLines: InvoiceItem[] = lines.map(line => {
    const it = items.find(i => i.id === line.itemId)
    const qty = Number(line.qty) || 0
    const rate = Number(line.rate) || 0
    const taxable = qty * rate
    const rawGstRate = line.gstRate !== undefined ? line.gstRate : (it?.gstRate || 18)
    const gstRate = !gstSettings?.enableGst ? 0 : rawGstRate
    const tax = (taxable * gstRate) / 100
    const total = taxable + tax

    const cgst = isInterState ? 0 : tax / 2
    const sgst = isInterState ? 0 : tax / 2
    const igst = isInterState ? tax : 0

    return {
      itemId: line.itemId,
      name: it?.name || "Item",
      hsn: it?.hsn || "8471",
      qty,
      unit: it?.unit || "unit",
      rate,
      discountPercent: 0,
      gstRate,
      customColumns: line.customColumns || {},
      taxableAmount: taxable,
      cgst,
      sgst,
      igst,
      total,
      purchaseCost: it?.purchasePrice || 0
    }
  })

  const totalUnits = calculatedLines.reduce((acc, l) => acc + l.qty, 0)
  const taxableSubtotal = calculatedLines.reduce((acc, l) => acc + l.taxableAmount, 0)
  const cgstTotal = calculatedLines.reduce((acc, l) => acc + l.cgst, 0)
  const sgstTotal = calculatedLines.reduce((acc, l) => acc + l.sgst, 0)
  const igstTotal = calculatedLines.reduce((acc, l) => acc + l.igst, 0)
  const taxTotal = cgstTotal + sgstTotal + igstTotal
  const goodsValue = taxableSubtotal + taxTotal

  // Withholding Tax (TDS/TCS) - strictly respect settings
  const isCurrentTypeActive = (withholdingType === "TDS" && isTdsEnabled) || (withholdingType === "TCS" && isTcsEnabled)
  const withholdingRate = (isCurrentTypeActive && selectedWithholdingTax) ? Number(selectedWithholdingTax) : 0
  const withholdingAmount = (taxableSubtotal * withholdingRate) / 100
  const totalBeforeRoundOff = Math.max(0, goodsValue + (isCurrentTypeActive ? (withholdingType === "TDS" ? -withholdingAmount : withholdingAmount) : 0))

  // Round off
  const autoRoundOff = Math.round(totalBeforeRoundOff) - totalBeforeRoundOff
  const [manualRoundOff, setManualRoundOff] = useState<string | null>(null)
  const finalRoundOff = manualRoundOff !== null ? (parseFloat(manualRoundOff) || 0) : autoRoundOff
  const roundedGrandTotal = Math.max(0, totalBeforeRoundOff + finalRoundOff)

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!partyName) {
      setErrorMsg("Please select a recipient / customer.")
      return
    }
    if (!vehicleNo.trim()) {
      setErrorMsg("Vehicle Number is required for statutory Rule 55 transport.")
      return
    }

    const godown = godowns.find(g => g.id === godownId) || godowns[0]

    // Verify stock availability in godown
    for (const line of calculatedLines) {
      const targetItem = items.find(i => i.id === line.itemId)
      if (!targetItem) {
        setErrorMsg(`Item not found: ${line.name}`)
        return
      }
      const available = targetItem.stockByGodown[godownId] || 0
      if (available < line.qty) {
        setErrorMsg(
          `Cannot dispatch "${targetItem.name}": Insufficient stock in ${godown.name}. Available: ${available} ${targetItem.unit}, Requested: ${line.qty}`
        )
        return
      }
    }

    const party = parties.find(p => p.name === partyName) || parties[0]

    const result = createDeliveryChallan({
      date: challanDate,
      partyId: party.id,
      partyName: party.name,
      partyGstin: partyGstin || party.gstin,
      partyStateCode,
      partyAddress,
      challanType,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      transporter: transporter.trim(),
      godownId: godown.id,
      godownName: godown.name,
      items: calculatedLines,
      totalUnits,
      goodsValue: roundedGrandTotal,
      withholdingType: isCurrentTypeActive && withholdingAmount > 0 ? withholdingType : undefined,
      withholdingRate: isCurrentTypeActive && withholdingAmount > 0 ? withholdingRate : undefined,
      withholdingAmount: isCurrentTypeActive && withholdingAmount > 0 ? withholdingAmount : undefined,
      status: "in_transit",
      linkedOrderId: initialLinkedOrderId,
      notes: notes.trim(),
      terms: terms.trim() || undefined
    })

    if (result.success) {
      onSuccess(result.challanNo)
    } else {
      setErrorMsg(result.message)
    }
  }

  const nextChallanNumberPreview = `DC-26-00${deliveryChallans.length + 11}`

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Standard Form Header matching AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Delivery Challans"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              New Delivery Challan
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {nextChallanNumberPreview}
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
            <span>Dispatch & Save</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas matching AddItemForm */}
      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* SECTION 1: Logistics & Statutory Purpose (Rule 55) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Logistics & Statutory Purpose (Rule 55)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Challan Purpose*
                </label>
                <Select
                  value={challanType}
                  onValueChange={(val) => setChallanType(val as ChallanType)}
                  className="w-full h-9 text-xs font-medium"
                  options={[
                    { value: "goods_dispatch", label: "Goods Dispatch (Supply / Sale Outward)" },
                    { value: "supply_on_approval", label: "Supply on Approval (Demo / Returnable)" },
                    { value: "job_work", label: "Job Work / Processing (Section 143)" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Vehicle Number*
                </label>
                <Input
                  type="text"
                  placeholder="e.g. MH-04-AB-8291"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="h-9 text-xs font-mono uppercase border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Transporter / LR Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. V-Trans Logistics (LR: 99120)"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Dispatch Source Godown*
                </label>
                <Select
                  value={godownId}
                  onValueChange={(val) => setGodownId(val)}
                  className="w-full h-9 text-xs font-medium"
                  options={godowns.map(g => ({
                    value: g.id,
                    label: `${g.name} (${g.contactPerson})`
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Challan Date
                </label>
                <Input
                  type="date"
                  value={challanDate}
                  onChange={(e) => setChallanDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Linked Sales Order
                </label>
                <Input
                  type="text"
                  readOnly
                  value={linkedOrder ? linkedOrder.orderNo : "Direct Dispatch"}
                  className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Recipient Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Consignee & Destination
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Recipient / Customer Name*
                </label>
                <Select
                  searchable
                  allowCustomValue
                  searchPlaceholder="Search recipient by name, GSTIN..."
                  value={partyName}
                  onValueChange={(val) => handlePartySelect(val)}
                  placeholder="Select Recipient..."
                  className="w-full h-9 text-xs font-medium"
                  options={[
                    { value: "", label: "Select Recipient..." },
                    ...parties.map(p => ({
                      value: p.name,
                      label: p.name,
                      description: p.gstin ? `GSTIN: ${p.gstin}${p.state ? ` • ${p.state}` : ""}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                    }))
                  ]}
                />
              </div>

              {documentSettings.showPlaceOfSupply !== false && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Place of Supply
                  </label>
                  <Select
                    searchable
                    searchPlaceholder="Search state or code..."
                    value={partyStateCode}
                    onValueChange={(val) => setPartyStateCode(val)}
                    placeholder="Select Place of Supply..."
                    className="w-full h-9 text-xs font-medium"
                    options={getPlaceOfSupplyOptions()}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Dispatch Address
                </label>
                <Input
                  type="text"
                  placeholder="Delivery location address"
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Dispatched Items Table */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Goods Dispatched (Physical Stock Deduction)
              </h2>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
                    <TableHead className="w-10 px-2 py-2.5 text-center">
                      {documentSettings.showBarcodeScan !== false ? (
                        <button
                          type="button"
                          onClick={() => setIsBarcodeModalOpen(true)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Scan Barcode / Enter Item Code"
                        >
                          <ScanLine className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400 font-bold">#</span>
                      )}
                    </TableHead>
                    <TableHead className="min-w-[220px] text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">
                      DISPATCHED ITEM
                    </TableHead>
                    <TableHead className="w-24 text-center text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">GODOWN STOCK</TableHead>
                    <TableHead className="w-24 text-right text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">DISPATCH QTY</TableHead>
                    <TableHead className="w-24 text-right text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">RATE (₹)</TableHead>
                    <TableHead className="w-24 text-center text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">GST %</TableHead>
                    <TableHead className="w-28 text-right text-[11px] h-9 font-bold text-slate-700 dark:text-slate-300 uppercase">VALUATION (₹)</TableHead>
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
                    <TableHead className="w-10 text-center text-[11px] h-9">
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
                    const godownStock = it?.stockByGodown[godownId] || 0
                    const isInsufficient = godownStock < line.qty

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
                        <TableCell className="py-2">
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
                                searchPlaceholder="Search item by name, code, barcode, SKU..."
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
                                    description: `Code: ${i.itemCode || i.barcode || i.code} • SKU: ${i.code} • Stock: ${i.stockByGodown[godownId] || 0} ${i.unit}`
                                  }))
                                ]}
                              />
                              {line.itemId && it && (
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                  <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{it.code || "N/A"}</span></span>
                                  <span>•</span>
                                  <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{godownStock} {it.unit}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 text-xs font-semibold tabular-nums">
                          <span className={isInsufficient ? "text-rose-600 font-bold" : "text-emerald-700 font-medium"}>
                            {godownStock} {it?.unit || ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <Input
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) => handleLineChange(idx, "qty", parseFloat(e.target.value) || 0)}
                            className={`h-8 text-xs text-right font-bold tabular-nums border-slate-200 dark:border-slate-700 ${isInsufficient ? "border-rose-500 text-rose-600 focus:border-rose-500" : ""
                              }`}
                          />
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={line.rate}
                            onChange={(e) => handleLineChange(idx, "rate", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right tabular-nums font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-center">
                          <Select
                            value={String(line.gstRate !== undefined ? line.gstRate : (it?.gstRate || 18))}
                            onValueChange={(val) => handleLineChange(idx, "gstRate", Number(val))}
                            size="xs"
                            className="h-8 w-24 text-center text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md"
                            options={getGstRateOptions(gstSettings?.enableGst, taxGroups)}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-900 dark:text-white tabular-nums py-2">
                          ₹{calc?.total.toFixed(2) || "0.00"}
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
                        <TableCell className="text-center py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length === 1}
                            className="text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors"
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
                  <span>Scan Barcode</span>
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

          {/* SECTION 4: Notes & Totals */}
          <div className="pt-2 flex flex-col md:flex-row justify-between gap-8 items-start">
            <div className="flex-1 w-full max-w-md space-y-4">
              {documentSettings.showCustomerNotes !== false && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Driver Contact & Handling Instructions
                    </label>
                    <NotesPresetSelector
                      documentType="challan"
                      onSelect={(selectedNote) => setNotes(selectedNote)}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Driver phone number, seal number, delivery instructions..."
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}

              {documentSettings.showTermsConditions !== false && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Challan Terms & Conditions (Rule 55)
                    </label>
                    <TermsPresetSelector
                      documentType="challan"
                      onSelect={(selectedTerms) => setTerms(selectedTerms)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Transport conditions, inspection and seal terms..."
                    className="w-full text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>

            <div className="w-full md:w-88 space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Total Units Dispatched:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">{totalUnits} units</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatINR(taxableSubtotal)}</span>
              </div>

              {cgstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Estimated CGST (Central Tax):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatINR(cgstTotal)}
                  </span>
                </div>
              )}

              {sgstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Estimated SGST (State Tax):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatINR(sgstTotal)}
                  </span>
                </div>
              )}

              {igstTotal > 0 && (
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Estimated IGST (Integrated Tax):</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatINR(igstTotal)}
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

                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white w-20 text-right">
                    {withholdingType === "TDS" && withholdingAmount > 0 ? `-${withholdingAmount.toFixed(2)}` : withholdingAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Round off - Editable with Reset */}
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
                <span>Total Valuation:</span>
                <span className="tabular-nums">{formatINR(roundedGrandTotal)}</span>
              </div>
              <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 mt-2">
                <strong>GST Compliance:</strong> Goods transport under Rule 55 of CGST Rules, 2017.
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onAddProducts={handleBulkAddItems}
        rateType="sale"
      />

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="challan"
      />

      {/* Add Custom Column Modal */}
      <AddCustomColumnModal
        open={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
        docType="challan"
      />
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Send,
  X,
  ArrowLeft,
  Trash2,
  PlusCircle,
  Search,
  Settings,
  Calendar,
  GripVertical,
  FileText,
  ScanLine,
  Sliders
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"
import { TermsPresetSelector } from "@/components/common/TermsPresetSelector"
import { NotesPresetSelector } from "@/components/common/NotesPresetSelector"

interface NewJobWorkFormProps {
  onCancel: () => void
  onSuccess: (jobNo?: string) => void
}

export function NewJobWorkForm({ onCancel, onSuccess }: NewJobWorkFormProps) {
  const { parties, items, godowns, activeGodownId, jobWorks, createJobWork, termsTemplates, documentSettings } = useApp()
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)

  // Manufactured items with BOM
  const manufacturedItems = items.filter(i => i.isManufactured && i.bom && i.bom.length > 0)
  const defaultFinished = manufacturedItems[0] || items[0]

  // Form Fields
  const defaultVendor = parties.find(p => p.type === "supplier" || p.type === "both")
  const [workerName, setWorkerName] = useState(defaultVendor?.name || "Shree Ganesh Packaging & Bottling")
  const [partyGstin, setPartyGstin] = useState(defaultVendor?.gstin || "")
  const [partyAddress, setPartyAddress] = useState(defaultVendor?.address || "")

  const nextJobNumberPreview = `JW-2026-00${jobWorks.length + 15}`
  const [jobNo, setJobNo] = useState(nextJobNumberPreview)
  const [orderNumber, setOrderNumber] = useState("")
  const [challanDate, setChallanDate] = useState(() => new Date().toISOString().split("T")[0])
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 15)
    return d.toISOString().split("T")[0]
  })

  const [godownId, setGodownId] = useState(activeGodownId || godowns[0]?.id || "")
  const [vehicleNo, setVehicleNo] = useState("MH-04-JW-4412")
  const [transporter, setTransporter] = useState("Direct Factory Dispatch (Rule 55)")

  // Finished Good Target
  const [finishedItemId, setFinishedItemId] = useState(defaultFinished?.id || "")
  const [expectedQty, setExpectedQty] = useState(50)
  const [jobWorkCharges, setJobWorkCharges] = useState<number | string>(850)

  // Dispatched Raw Materials Lines
  const [lines, setLines] = useState<Array<{
    itemId: string
    qty: number
    rate: number
  }>>([])
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  const [customerNotes, setCustomerNotes] = useState("Raw materials dispatched for processing / job work. Finished goods to be returned along with delivery challan.")
  const [termsAndConditions, setTermsAndConditions] = useState("Inputs dispatched under Section 143 / Rule 55 of CGST Rules, 2017. Finished products must be returned within the statutory period.")
  const [errorMsg, setErrorMsg] = useState("")

  // Apply default challan terms template
  useEffect(() => {
    if (termsTemplates && termsTemplates.length > 0) {
      const defaultTemplate = termsTemplates.find(
        (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes("challan")) && t.isDefault
      )
      if (defaultTemplate) {
        setTermsAndConditions(defaultTemplate.content)
      }
    }
  }, [termsTemplates])

  // Auto-populate / Sync Raw Material Lines from BOM whenever Finished Item or Expected Qty changes
  useEffect(() => {
    const finished = items.find(i => i.id === finishedItemId)
    if (finished?.bom && finished.bom.length > 0) {
      const generated = finished.bom.map(b => {
        const raw = items.find(i => i.id === b.rawItemId)
        const unitRate = raw?.purchasePrice !== undefined ? raw.purchasePrice : (b.unitCost ?? 0)
        return {
          itemId: b.rawItemId,
          qty: (Number(b.qty) || 1) * (Number(expectedQty) || 1),
          rate: unitRate
        }
      })
      setLines(generated)
    } else if (lines.length === 0) {
      const firstRaw = items.find(i => !i.isManufactured) || items[0]
      if (firstRaw) {
        setLines([{ itemId: firstRaw.id, qty: 10, rate: firstRaw.purchasePrice || 0 }])
      }
    }
  }, [finishedItemId, expectedQty])

  const handlePartySelect = (name: string) => {
    setWorkerName(name)
    const party = parties.find(p => p.name === name)
    if (party) {
      setPartyGstin(party.gstin || "")
      setPartyAddress(party.address || "")
    }
  }

  const handleAddLine = () => {
    const unselected = items.find(it => !lines.some(l => l.itemId === it.id)) || items[0]
    setLines(prev => [
      ...prev,
      { itemId: unselected?.id || "", qty: 1, rate: unselected?.purchasePrice || 0 }
    ])
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const newLines = selectedList.map(({ item, qty }) => ({
        itemId: item.id,
        qty: Math.max(1, Number(qty) || 1),
        rate: item.purchasePrice || 0
      }))
      return [...cleanPrev, ...newLines]
    })
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
          current.rate = it.purchasePrice || 0
        }
      }
      updated[index] = current
      return updated
    })
  }

  // Stock Shortage Analysis per line
  const analyzedLines = lines.map(line => {
    const targetItem = items.find(i => i.id === line.itemId)
    const inGodown = targetItem?.stockByGodown[godownId] || 0
    const hasShortage = inGodown < line.qty
    const lineTotal = (Number(line.qty) || 0) * (Number(line.rate) || 0)

    return {
      ...line,
      item: targetItem,
      inGodown,
      hasShortage,
      lineTotal
    }
  })

  const hasAnyShortage = analyzedLines.some(l => l.hasShortage)
  const totalDispatchedValue = analyzedLines.reduce((acc, l) => acc + l.lineTotal, 0)
  const totalUnits = analyzedLines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0)
  const selectedFinished = items.find(i => i.id === finishedItemId)

  const handleSubmit = (actionType: "draft" | "dispatch" = "dispatch") => {
    setErrorMsg("")

    if (!workerName.trim()) {
      setErrorMsg("Please select a Job Worker / Subcontractor.")
      return
    }

    if (!vehicleNo.trim()) {
      setErrorMsg("Vehicle Number is required for transport under Rule 55.")
      return
    }

    if (actionType === "dispatch" && hasAnyShortage) {
      setErrorMsg("Cannot dispatch: Stock shortage detected in the selected godown for one or more raw materials.")
      return
    }

    const res = createJobWork({
      workerName: workerName.trim(),
      finishedItemId,
      expectedQty,
      godownId,
      jobWorkCharges: Number(jobWorkCharges) || 0,
      date: challanDate,
      vehicleNo: vehicleNo.trim(),
      transporter: transporter.trim(),
      expectedReturnDate,
      notes: customerNotes,
      termsAndConditions,
      partyGstin,
      partyAddress,
      customLines: lines.map(l => {
        const it = items.find(i => i.id === l.itemId)
        return {
          itemId: l.itemId,
          qty: Number(l.qty) || 0,
          rate: Number(l.rate) || 0,
          unit: it?.unit || "PCS"
        }
      })
    })

    if (!res.success) {
      setErrorMsg(res.message)
      return
    }

    onSuccess(res.jobNo || jobNo)
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">

      {/* 1. Header (Sticky Top) matching NewInvoiceForm */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to Manufacturing"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              New External Job Work Challan
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {jobNo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Button 0: Document Settings */}
          <button
            type="button"
            onClick={() => setIsDocSettingsOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Document Settings"
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

          {/* Button 3: Save and Dispatch */}
          <button
            type="button"
            onClick={() => handleSubmit("dispatch")}
            disabled={hasAnyShortage}
            className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Save and Dispatch</span>
          </button>
        </div>
      </div>

      {/* 2. Main Form Body matching NewInvoiceForm */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit("dispatch"); }} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-6xl px-8 py-6 space-y-7">

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Row 1: Job Worker Name* */}
          <div className="max-w-xl">
            <label className="block text-xs font-semibold text-rose-500 mb-1.5">
              Job Worker Name*
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  searchable
                  allowCustomValue
                  searchPlaceholder="Search job worker by name, GSTIN..."
                  value={workerName}
                  onValueChange={(val) => handlePartySelect(val)}
                  placeholder="Please select or enter job worker"
                  className="w-full h-9 text-xs font-medium"
                  options={parties.filter(p => p.type === "supplier" || p.type === "both").map(p => ({
                    value: p.name,
                    label: p.name,
                    description: p.gstin ? `GSTIN: ${p.gstin}${p.state ? ` • ${p.state}` : ""}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                  }))}
                />
              </div>

              <button
                type="button"
                className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 transition-colors shadow-2xs cursor-pointer"
                title="Search Job Worker"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Challan#* and Order / Reference Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-xs font-semibold text-rose-500">
                  Challan#*
                </label>
                <button type="button" title="Configure Challan Prefix">
                  <Settings className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600 cursor-pointer" />
                </button>
              </div>
              <Input
                type="text"
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                className="h-9 text-xs font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            {documentSettings.showOrderNumber !== false && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Order / Reference Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. PO-2026-0041 / Work Order Ref"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </div>

          {/* Row 3: Challan Date* and Expected Return Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                Challan Date*
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={challanDate}
                  onChange={(e) => setChallanDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9 tabular-nums"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Expected Completion Date
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9 tabular-nums"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 4: Finished Item to Produce* and Expected Output Qty* */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                Finished Item to Produce*
              </label>
              <Select
                searchable
                searchPlaceholder="Search finished manufacturing items..."
                value={finishedItemId}
                onValueChange={(val) => setFinishedItemId(val)}
                className="w-full h-9 text-xs font-semibold"
                options={manufacturedItems.map(m => ({
                  value: m.id,
                  label: m.name,
                  description: `SKU: ${m.code} • BOM: ${m.bom?.length || 0} Components`
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                  Expected Output Qty*
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={expectedQty}
                    onChange={(e) => setExpectedQty(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 text-xs font-bold tabular-nums border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs text-slate-500 font-medium lowercase shrink-0">
                    {selectedFinished?.unit || "units"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Processing Charges (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={jobWorkCharges}
                  onChange={(e) => setJobWorkCharges(e.target.value)}
                  className="h-9 text-xs tabular-nums font-semibold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Dispatch Godown* and Vehicle Number* */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                Dispatch Godown*
              </label>
              <Select
                value={godownId}
                onValueChange={(val) => setGodownId(val)}
                className="w-full h-9 text-xs"
                options={godowns.map(g => ({ value: g.id, label: g.name }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                  Vehicle Number*
                </label>
                <Input
                  type="text"
                  placeholder="e.g. MH-04-AB-8291"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="h-9 text-xs font-mono uppercase border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Transporter / LR#
                </label>
                <Input
                  type="text"
                  placeholder="e.g. V-Trans Logistics"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Item Details Table matching NewInvoiceForm exactly */}
          <div className="pt-2">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-[#f4f7fa] dark:bg-slate-900 divide-x divide-slate-200 dark:divide-slate-800">
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
                        <span className="text-[11px] font-bold text-slate-400">#</span>
                      )}
                    </TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      RAW MATERIAL COMPONENT
                    </TableHead>
                    <TableHead className="w-36 px-4 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      GODOWN STOCK
                    </TableHead>
                    <TableHead className="w-36 px-4 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      DISPATCH QUANTITY
                    </TableHead>
                    <TableHead className="w-36 px-4 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      RATE (₹)
                    </TableHead>
                    <TableHead className="w-36 px-4 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      AMOUNT (₹)
                    </TableHead>
                    <TableHead className="w-10 px-2 py-2.5 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyzedLines.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 hover:bg-slate-50/50">
                      {/* Drag handle */}
                      <TableCell className="px-2 py-3 text-center text-slate-400">
                        <GripVertical className="h-4 w-4 mx-auto opacity-40 cursor-grab" />
                      </TableCell>

                      {/* Raw Material Select */}
                      <TableCell className="px-4 py-3">
                        <Select
                          searchable
                          searchPlaceholder="Search or select raw material..."
                          value={row.itemId}
                          onValueChange={(val) => handleLineChange(idx, "itemId", val)}
                          className="w-full h-9 text-xs"
                          options={items.map(it => ({
                            value: it.id,
                            label: it.name,
                            description: `SKU: ${it.code} • Stock: ${it.currentStock} ${it.unit}`
                          }))}
                        />
                      </TableCell>

                      {/* Godown Stock with Shortage Warning */}
                      <TableCell className="px-4 py-3 text-center tabular-nums text-xs">
                        <span className={cn(
                          "font-semibold",
                          row.hasShortage ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {row.inGodown} {row.item?.unit || "units"}
                        </span>
                        {row.hasShortage && (
                          <div className="text-[10px] text-rose-500 font-bold tracking-tight">Shortage!</div>
                        )}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={row.qty}
                            onChange={(e) => handleLineChange(idx, "qty", Number(e.target.value) || 0)}
                            className={cn(
                              "h-9 w-24 text-center text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700",
                              row.hasShortage ? "border-rose-400 text-rose-600 focus:border-rose-600" : ""
                            )}
                          />
                          <span className="text-xs text-slate-400 lowercase shrink-0">
                            {row.item?.unit || "u"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Rate */}
                      <TableCell className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={row.rate}
                          onChange={(e) => handleLineChange(idx, "rate", Number(e.target.value) || 0)}
                          className="h-9 w-28 text-right text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 ml-auto"
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="px-4 py-3 text-right tabular-nums text-xs font-bold text-slate-900 dark:text-white">
                        {row.lineTotal.toFixed(2)}
                      </TableCell>

                      {/* Delete */}
                      <TableCell className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length === 1}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer disabled:opacity-30"
                          title="Remove Line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  <ScanLine className="h-4 w-4" />
                  <span>Scan Barcode</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION: Calculation & Summary Block on Right matching NewInvoiceForm */}
          <div className="flex flex-col md:flex-row justify-between gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">

            {/* Notes on Left */}
            <div className="flex-1 max-w-md space-y-4 text-xs">
              {documentSettings.showCustomerNotes !== false && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Customer / Contractor Notes
                    </label>
                    <NotesPresetSelector
                      documentType="challan"
                      onSelect={(content) => setCustomerNotes(content)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {documentSettings.showTermsConditions !== false && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Terms & Conditions (Rule 55 / Section 143)
                    </label>
                    <TermsPresetSelector
                      documentType="challan"
                      onSelect={(terms) => setTermsAndConditions(terms)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Right Summary Block matching NewInvoiceForm */}
            <div className="w-full md:w-96 space-y-3 bg-[#f8fafc] dark:bg-slate-900/60 p-5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">

              {/* 1. Target Finished Output */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-medium">Target Finished Output</span>
                <span className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[180px] text-right">
                  {expectedQty} {selectedFinished?.unit || "units"} of {selectedFinished?.name}
                </span>
              </div>

              {/* 2. Total Dispatched Raw Materials */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-medium">Raw Materials ({totalUnits.toFixed(0)} units)</span>
                <span className="font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                  ₹{totalDispatchedValue.toFixed(2)}
                </span>
              </div>

              {/* 3. Job Work Charges */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-medium">Job Work / Processing Charges</span>
                <span className="font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                  ₹{(Number(jobWorkCharges) || 0).toFixed(2)}
                </span>
              </div>

              <hr className="border-slate-200 dark:border-slate-800 my-2" />

              {/* 4. Total Valuation */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Total Challan Valuation ( ₹ )
                </span>
                <span className="font-bold text-lg tabular-nums text-slate-900 dark:text-white">
                  ₹{(totalDispatchedValue + (Number(jobWorkCharges) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onAddProducts={handleBulkAddItems}
        rateType="purchase"
      />

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="challan"
      />
    </div>
  )
}

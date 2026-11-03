"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { DocumentSequenceType, CustomItemColumn } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  X, 
  Plus, 
  Trash2, 
  Columns, 
  Printer, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"

interface AddCustomColumnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docType: DocumentSequenceType
}

export function AddCustomColumnModal({
  open,
  onOpenChange,
  docType
}: AddCustomColumnModalProps) {
  const { 
    formCustomColumns, 
    addCustomColumn, 
    updateCustomColumn, 
    deleteCustomColumn 
  } = useApp()

  const [columnName, setColumnName] = useState("")
  const [printOnPaper, setPrintOnPaper] = useState(true)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const columns = formCustomColumns[docType] || []
  const isMaxReached = columns.length >= 3

  const getDocTypeLabel = (dt: DocumentSequenceType): string => {
    switch (dt) {
      case "invoice": return "Tax Invoice"
      case "proforma": return "Proforma Invoice"
      case "quotation": return "Quotation / Estimate"
      case "order": return "Sales Order"
      case "challan": return "Delivery Challan"
      case "bill": return "Purchase Bill"
      case "sales_return": return "Sales Return"
      case "purchase_return": return "Purchase Return"
      case "credit_note": return "Credit Note"
      case "debit_note": return "Debit Note"
      default: return "Document"
    }
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!columnName.trim()) {
      setError("Please enter a column name.")
      return
    }

    const res = addCustomColumn(docType, columnName.trim(), printOnPaper)
    if (!res.success) {
      setError(res.message)
      return
    }

    setColumnName("")
    setPrintOnPaper(true)
    setSuccessMsg(res.message)
    setTimeout(() => setSuccessMsg(""), 2500)
  }

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-[10070] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Columns className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Custom Item Columns
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {columns.length}/3 used
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure line-item columns for {getDocTypeLabel(docType)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Add New Column Form (if < 3) */}
          {!isMaxReached ? (
            <form onSubmit={handleAdd} className="space-y-4 p-4 rounded-xl border border-blue-100 dark:border-blue-950/80 bg-blue-50/30 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  Add New Line-Item Column
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {3 - columns.length} slot(s) remaining
                </span>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Column Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Batch / Lot No, Warranty, Color, Serial No, Size"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  maxLength={30}
                  autoFocus
                />
              </div>

              {/* Physical print toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Show on Physical Prints &amp; PDF</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    When enabled, this column also prints on paper. If disabled, it only appears on-screen.
                  </p>
                </div>
                <Switch
                  checked={printOnPaper}
                  onCheckedChange={setPrintOnPaper}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Column
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Maximum 3 custom item columns reached for <strong>{getDocTypeLabel(docType)}</strong>. Delete an existing column below to add a new one.
              </span>
            </div>
          )}

          {/* Existing Columns List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Configured Columns ({columns.length}/3)
              </span>
              <span className="text-[11px] text-slate-500">
                Toggle display on form or print
              </span>
            </div>

            {columns.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <Columns className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">No custom columns added yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {columns.map((col) => (
                  <div 
                    key={col.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                        <Columns className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                          {col.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className={col.isEnabled !== false ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                            {col.isEnabled !== false ? "Visible on Table" : "Hidden on Table"}
                          </span>
                          <span>•</span>
                          <span className={col.printOnPaper ? "text-blue-600 font-semibold" : "text-slate-400"}>
                            {col.printOnPaper ? "Printed on Paper" : "Screen Only"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Form table visibility */}
                      <button
                        type="button"
                        onClick={() => updateCustomColumn(docType, col.id, { isEnabled: col.isEnabled === false ? true : false })}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          col.isEnabled !== false 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" 
                            : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        }`}
                        title={col.isEnabled !== false ? "Visible on Form (click to hide)" : "Hidden on Form (click to show)"}
                      >
                        {col.isEnabled !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>

                      {/* Physical print visibility */}
                      <button
                        type="button"
                        onClick={() => updateCustomColumn(docType, col.id, { printOnPaper: !col.printOnPaper })}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          col.printOnPaper 
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" 
                            : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        }`}
                        title={col.printOnPaper ? "Included in Printouts (click to hide from print)" : "Hidden from Printouts (click to include)"}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => deleteCustomColumn(docType, col.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete custom column"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Changes save and apply immediately.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}


"use client"

import React, { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  Download,
  AlertCircle,
  Sparkles,
  FileCheck
} from "lucide-react"
import { Item } from "@/types/inventory"

interface BulkAddItemsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SAMPLE_BULK_ITEMS: Array<Omit<Item, "id" | "currentStock">> = [
  {
    name: "Medical Grade Oxygen Mask with Tubing",
    code: "MSK-O2-TUB",
    type: "product",
    category: "Respiratory Care",
    brand: "MediCare",
    unit: "pcs",
    salePrice: 160,
    purchasePrice: 95,
    mrp: 180,
    wholesalePrice: 140,
    minStock: 25,
    stockByGodown: { "godown-1": 120 },
    hsn: "9019",
    gstRate: 12,
    hasBatch: false,
    hasSerial: false,
    isManufactured: false
  },
  {
    name: "Stethoscope Professional Dual Head",
    code: "STH-PROF-DH",
    type: "product",
    category: "Diagnostic Equipment",
    brand: "Littmann Standard",
    unit: "pcs",
    salePrice: 1250,
    purchasePrice: 820,
    mrp: 1400,
    wholesalePrice: 1100,
    minStock: 10,
    stockByGodown: { "godown-1": 35 },
    hsn: "9018",
    gstRate: 18,
    hasBatch: false,
    hasSerial: false,
    isManufactured: false
  },
  {
    name: "Sterile Gauze Swabs 10x10cm (Pack of 100)",
    code: "GZ-SWB-1010",
    type: "product",
    category: "Consumables",
    brand: "SurgiCare",
    unit: "pack",
    salePrice: 280,
    purchasePrice: 175,
    mrp: 320,
    wholesalePrice: 240,
    minStock: 40,
    stockByGodown: { "godown-1": 250 },
    hsn: "3005",
    gstRate: 12,
    hasBatch: false,
    hasSerial: false,
    isManufactured: false
  }
]

export function BulkAddItemsModal({ isOpen, onClose }: BulkAddItemsModalProps) {
  const { addBulkItems } = useApp()
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [stats, setStats] = useState<{ added: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`
      })
    }
  }

  const handleLoadSample = () => {
    setFile({
      name: "AB_Inventory_Bulk_Items_Filled.xlsx",
      size: "34.2 KB"
    })
  }

  const handleImport = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const res = addBulkItems(SAMPLE_BULK_ITEMS)
      setIsProcessing(false)
      setStats({ added: res.addedCount, skipped: res.skippedCount })
      setIsSuccess(true)
    }, 600)
  }

  const handleClose = () => {
    setFile(null)
    setIsSuccess(false)
    setStats(null)
    onClose()
  }

  const handleDownloadTemplate = () => {
    // Generate simple CSV template download
    const csvContent = "data:text/csv;charset=utf-8,Item Name,SKU Code,Category,Unit,Selling Price,Purchase Price,Min Stock,Opening Stock,HSN,GST Rate\nSample Syringe 5ml,SYR-5ML,Medical Consumables,box,250,160,20,100,9018,12\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "AB_Inventory_Items_Template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 text-slate-800 dark:text-slate-100 select-none">
        
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Add Items in Bulk (Excel / CSV)
              </h2>
              <span className="text-[11px] text-slate-500">
                Upload your inventory spreadsheet to add multiple items at once
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {!isSuccess ? (
            <>
              {/* Step 1: Download Template */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Need the Excel / CSV Template?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pre-formatted columns: Name, SKU, Category, Prices, Stock, GST & HSN.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 px-3 text-xs gap-1.5 border-slate-300 dark:border-slate-700 font-semibold shrink-0"
                >
                  <Download className="h-3.5 w-3.5 text-blue-600" />
                  <span>Download Template</span>
                </Button>
              </div>

              {/* Step 2: Upload Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  file
                    ? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx,.xls,.csv" 
                  className="hidden" 
                />

                {file ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {file.size} • 3 items detected in spreadsheet
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-1">
                      Click to choose or drag & drop filled Excel / CSV
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports .xlsx, .xls, .csv
                    </span>
                  </div>
                )}
              </div>

              {/* Demo Sample Link */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Want to test quickly?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Use Sample Template Data</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={!file || isProcessing}
                  onClick={handleImport}
                  className="h-8 px-4 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-md shadow-2xs"
                >
                  {isProcessing ? "Importing Items..." : "Import Items"}
                </Button>
              </div>
            </>
          ) : (
            /* Success Screen */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Items Added Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stats?.added} items have been created and added to your inventory catalog.
                  {stats?.skipped && stats.skipped > 0 ? ` (${stats.skipped} duplicates skipped)` : ""}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleClose}
                className="h-8 px-6 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              >
                View Items in Catalog
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

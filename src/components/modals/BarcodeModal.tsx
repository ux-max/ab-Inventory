"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Item } from "@/types/inventory"
import { Barcode128 } from "@/lib/barcodeGenerator"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Settings, 
  X, 
  Printer, 
  Edit3, 
  Barcode, 
  RotateCcw, 
  Check 
} from "lucide-react"

export type LabelVersion = 
  | "1 x 2" 
  | "1 x 4" 
  | "1 x 1" 
  | "1 x 3" 
  | "A4 (8 x 2)" 
  | "A4 40 Labels (10 x 4)" 
  | "A4 65 Lables (13 x 5)" 
  | "Square Label"

interface LabelVersionMeta {
  id: LabelVersion
  label: string
  cols: number
  rows: number
  total: number
  isA4?: boolean
  isSquare?: boolean
  description: string
}

const LABEL_VERSIONS: LabelVersionMeta[] = [
  { id: "1 x 2", label: "1 x 2", cols: 2, rows: 1, total: 2, description: "Roll sticker 2-across" },
  { id: "1 x 4", label: "1 x 4", cols: 4, rows: 1, total: 4, description: "Roll sticker 4-across" },
  { id: "1 x 1", label: "1 x 1", cols: 1, rows: 1, total: 1, description: "Single large sticker" },
  { id: "1 x 3", label: "1 x 3", cols: 3, rows: 1, total: 3, description: "Roll sticker 3-across" },
  { id: "A4 (8 x 2)", label: "A4 (8 x 2)", cols: 2, rows: 8, total: 16, isA4: true, description: "A4 Sheet 16 Labels" },
  { id: "A4 40 Labels (10 x 4)", label: "A4 40 Labels (10 x 4)", cols: 4, rows: 10, total: 40, isA4: true, description: "A4 Sheet 40 Labels" },
  { id: "A4 65 Lables (13 x 5)", label: "A4 65 Lables (13 x 5)", cols: 5, rows: 13, total: 65, isA4: true, description: "A4 Sheet 65 Labels" },
  { id: "Square Label", label: "Square Label", cols: 3, rows: 2, total: 6, isSquare: true, description: "Square barcode sticker" },
]

export interface BarcodeSettings {
  showProductName: boolean
  showCompanyName: boolean
  companyName: string
  showPrice: boolean
  pricePrefix: string
  showPackedDate: boolean
  showBatch: boolean
  batchNumber: string
  showCodeText: boolean
  barcodeHeight: "compact" | "normal" | "large"
  borderStyle: "none" | "solid" | "dashed"
}

export interface LabelOverrides {
  productName: string
  price: string
  pkdDate: string
  batchNo: string
  code: string
  copiesCount: number
}

function formatPkdDate(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0")
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
  const mon = months[d.getMonth()]
  const yr = String(d.getFullYear()).slice(-2)
  return `${day}-${mon}-${yr}`
}

const DEFAULT_SETTINGS: BarcodeSettings = {
  showProductName: true,
  showCompanyName: false,
  companyName: "AB INVENTORY",
  showPrice: true,
  pricePrefix: "MRP ₹",
  showPackedDate: true,
  showBatch: false,
  batchNumber: "B26-001",
  showCodeText: true,
  barcodeHeight: "normal",
  borderStyle: "solid"
}

interface BarcodeModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [activeTab, setActiveTab] = useState<LabelVersion>("1 x 2")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [settings, setSettings] = useState<BarcodeSettings>(DEFAULT_SETTINGS)

  // Label field overrides
  const [overrides, setOverrides] = useState<LabelOverrides>({
    productName: "",
    price: "",
    pkdDate: "",
    batchNo: "",
    code: "",
    copiesCount: 0
  })

  // Synchronize when item opens
  useEffect(() => {
    if (item && isOpen) {
      const displayPrice = item.mrp || item.salePrice || 0
      setOverrides({
        productName: item.name || "SAMPLE PRODUCT",
        price: displayPrice ? displayPrice.toFixed(2) : "100.00",
        pkdDate: formatPkdDate(new Date()),
        batchNo: item.batchDetails?.[0]?.batchNo || "B26-001",
        code: item.code || item.itemCode || item.barcode || "3515786537",
        copiesCount: 0
      })
    }
  }, [item, isOpen])

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const activeVersionMeta = useMemo(() => {
    return LABEL_VERSIONS.find(v => v.id === activeTab) || LABEL_VERSIONS[0]
  }, [activeTab])

  // Compute number of stickers to render
  const labelCount = overrides.copiesCount > 0 ? overrides.copiesCount : activeVersionMeta.total

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen || !item) return null

  const barcodeHeightPx = settings.barcodeHeight === "compact" ? 36 : settings.barcodeHeight === "large" ? 64 : 48

  const resolvedCode = overrides.code || item.code || item.itemCode || "ITEM-001"
  const resolvedName = (overrides.productName || item.name || "SAMPLE PRODUCT").toUpperCase()
  const resolvedPrice = overrides.price || (item.mrp || item.salePrice || 100).toFixed(2)
  const resolvedPkd = overrides.pkdDate || formatPkdDate(new Date())
  const resolvedBatch = overrides.batchNo || settings.batchNumber || "B26-001"

  return (
    <>
      {/* Print Stylesheet injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-print-canvas,
          #barcode-print-canvas * {
            visibility: visible !important;
          }
          #barcode-print-canvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .barcode-sticker-card {
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-color: #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            margin: 8mm;
            size: auto;
          }
        }
      `}</style>

      {/* Main Modal Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-900/60 backdrop-blur-xs select-none">
        
        {/* Modal Window Container - Light Theme with Ultra-Wide Width & Height */}
        <div className="relative w-[98vw] max-w-[1440px] h-[94vh] max-h-[920px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Bar */}
          <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <Barcode className="h-4.5 w-4.5" />
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Barcode
                </h2>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  Label Generator
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings Gear (Opens Drawer) */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Label & Barcode Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Versions Tab Bar */}
          <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 min-w-max">
              {LABEL_VERSIONS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? "text-blue-600 dark:text-blue-400 font-bold" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full shadow-xs" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview Canvas Workspace */}
          <div className="relative flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-100/90 dark:bg-slate-950/90 flex flex-col items-center">
            
            {/* Printable sticker canvas */}
            <div 
              id="barcode-print-canvas"
              className={`w-full mx-auto transition-all ${
                activeVersionMeta.isA4 
                  ? "max-w-4xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" 
                  : "max-w-[1360px]"
              }`}
            >
              <div 
                className={`grid gap-5 justify-items-center printable-document-sheet ${
                  activeTab === "1 x 2" ? "grid-cols-1 sm:grid-cols-2" :
                  activeTab === "1 x 4" ? "grid-cols-2 sm:grid-cols-4" :
                  activeTab === "1 x 1" ? "grid-cols-1 max-w-lg mx-auto" :
                  activeTab === "1 x 3" ? "grid-cols-1 sm:grid-cols-3" :
                  activeTab === "A4 (8 x 2)" ? "grid-cols-2 text-[10px]" :
                  activeTab === "A4 40 Labels (10 x 4)" ? "grid-cols-4 text-[9px]" :
                  activeTab === "A4 65 Lables (13 x 5)" ? "grid-cols-5 text-[8px]" :
                  "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {Array.from({ length: labelCount }).map((_, index) => (
                  <div
                    key={index}
                    className={`barcode-sticker-card w-full bg-white text-slate-950 rounded-md shadow-sm p-4 flex flex-col items-center justify-between text-center select-none transition-all hover:shadow-md ${
                      settings.borderStyle === "solid" ? "border border-slate-200" :
                      settings.borderStyle === "dashed" ? "border border-dashed border-slate-300" :
                      "border border-transparent"
                    } ${
                      activeVersionMeta.isSquare ? "aspect-square justify-center py-5" : "min-h-[175px]"
                    }`}
                  >
                    {/* Header info */}
                    <div className="w-full flex flex-col items-center gap-0.5 mb-1.5">
                      {settings.showCompanyName && (
                        <span className="text-[10px] font-bold text-slate-600 tracking-wider">
                          {settings.companyName || "AB INVENTORY"}
                        </span>
                      )}

                      {settings.showProductName && (
                        <h4 className="text-xs font-bold text-slate-950 leading-tight tracking-tight line-clamp-2 px-1">
                          {resolvedName}
                        </h4>
                      )}

                      {settings.showPrice && (
                        <div className="text-[11px] font-bold text-slate-900 mt-0.5">
                          {settings.pricePrefix} {resolvedPrice}
                        </div>
                      )}

                      {settings.showPackedDate && (
                        <div className="text-[10px] font-semibold text-slate-700 tracking-tight">
                          PKD ON: {resolvedPkd}
                        </div>
                      )}

                      {settings.showBatch && (
                        <div className="text-[9px] font-medium text-slate-600 tracking-tight">
                          BATCH: {resolvedBatch}
                        </div>
                      )}
                    </div>

                    {/* Barcode Graphic */}
                    <div className="w-full flex flex-col items-center justify-center my-1.5 px-1">
                      <div className="w-full max-w-[280px] flex justify-center">
                        <Barcode128 
                          value={resolvedCode} 
                          height={barcodeHeightPx} 
                          showText={false}
                          className="w-full h-auto text-black"
                        />
                      </div>

                      {/* Text below code */}
                      {settings.showCodeText && (
                        <div className="text-[11px] font-mono font-bold tracking-widest text-slate-950 mt-1.5">
                          {resolvedCode}
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Bar Controls */}
          <div className="h-16 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeVersionMeta.label}</span>
              <span>•</span>
              <span className="font-medium">{labelCount} {labelCount === 1 ? "Label" : "Labels"}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-500">{activeVersionMeta.description}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Edit Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 h-9 px-4 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Edit
              </Button>

              {/* Print Button */}
              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 text-xs font-semibold cursor-pointer shadow-xs shadow-blue-500/20"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Settings Slide-Out Drawer */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Label Settings"
        description="Configure visible content and barcode layout on printed labels."
        zIndex={10060}
      >
        <div className="p-6 space-y-6">
          
          {/* Visible Content Toggles */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visible Content
            </label>

            {/* Product Name */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Product Name</span>
                <p className="text-[11px] text-slate-500">Show item title on sticker</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showProductName}
                onChange={e => setSettings(prev => ({ ...prev, showProductName: e.target.checked }))}
                className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Company / Brand Name */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Company Name</span>
                  <p className="text-[11px] text-slate-500">Brand header at the top</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showCompanyName}
                  onChange={e => setSettings(prev => ({ ...prev, showCompanyName: e.target.checked }))}
                  className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              {settings.showCompanyName && (
                <Input
                  value={settings.companyName}
                  onChange={e => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Company / Brand Name"
                  className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                />
              )}
            </div>

            {/* Price / MRP */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">MRP / Rate</span>
                  <p className="text-[11px] text-slate-500">Print price with currency prefix</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPrice}
                  onChange={e => setSettings(prev => ({ ...prev, showPrice: e.target.checked }))}
                  className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              {settings.showPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 shrink-0">Prefix:</span>
                  <Input
                    value={settings.pricePrefix}
                    onChange={e => setSettings(prev => ({ ...prev, pricePrefix: e.target.value }))}
                    placeholder="MRP ₹"
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Packed Date (PKD ON) */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Packed Date (PKD ON)</span>
                <p className="text-[11px] text-slate-500">Packaging / manufacturing date</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showPackedDate}
                onChange={e => setSettings(prev => ({ ...prev, showPackedDate: e.target.checked }))}
                className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Batch Number */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Batch Number</span>
                  <p className="text-[11px] text-slate-500">Show batch or lot code</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showBatch}
                  onChange={e => setSettings(prev => ({ ...prev, showBatch: e.target.checked }))}
                  className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              {settings.showBatch && (
                <Input
                  value={settings.batchNumber}
                  onChange={e => setSettings(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="e.g. B26-001"
                  className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                />
              )}
            </div>

            {/* Human Readable Code under barcode */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Code Text Under Barcode</span>
                <p className="text-[11px] text-slate-500">Print alphanumeric SKU/barcode text</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showCodeText}
                onChange={e => setSettings(prev => ({ ...prev, showCodeText: e.target.checked }))}
                className="h-4 w-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Barcode Height & Density */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Density & Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["compact", "normal", "large"] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, barcodeHeight: size }))}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all capitalize cursor-pointer ${
                    settings.barcodeHeight === size
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Sticker Border Style */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sticker Border
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["none", "solid", "dashed"] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, borderStyle: b }))}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all capitalize cursor-pointer ${
                    settings.borderStyle === b
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="text-xs h-8 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Defaults
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
              className="text-xs h-8 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Done
            </Button>
          </div>

        </div>
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* Edit Overrides Dialog */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[10070] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100">
            
            {/* Edit Header */}
            <div className="h-12 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Customize Label Print
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Product Name
                </label>
                <Input
                  value={overrides.productName}
                  onChange={e => setOverrides(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Product Title"
                  className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Price / MRP (₹)
                  </label>
                  <Input
                    value={overrides.price}
                    onChange={e => setOverrides(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="100.00"
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Packed Date
                  </label>
                  <Input
                    value={overrides.pkdDate}
                    onChange={e => setOverrides(prev => ({ ...prev, pkdDate: e.target.value }))}
                    placeholder="29-OCT-26"
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Item Code / SKU
                  </label>
                  <Input
                    value={overrides.code}
                    onChange={e => setOverrides(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Barcode string"
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Batch Number
                  </label>
                  <Input
                    value={overrides.batchNo}
                    onChange={e => setOverrides(prev => ({ ...prev, batchNo: e.target.value }))}
                    placeholder="Batch No."
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Label Copies (0 for sheet default)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={overrides.copiesCount || ""}
                  onChange={e => setOverrides(prev => ({ ...prev, copiesCount: parseInt(e.target.value, 10) || 0 }))}
                  placeholder={`Default (${activeVersionMeta.total} labels)`}
                  className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Edit Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                Apply Changes
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

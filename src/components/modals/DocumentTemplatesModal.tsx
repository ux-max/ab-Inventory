"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { 
  X, 
  Check, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from "lucide-react"
import { PrintTheme, DocumentSequenceType } from "@/types/inventory"
import { cn } from "@/lib/utils"

interface DocumentTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDocType?: DocumentSequenceType
}

interface DocTab {
  id: DocumentSequenceType
  label: string
}

const DOC_TABS: DocTab[] = [
  { id: "invoice", label: "Invoices" },
  { id: "proforma", label: "Proforma" },
  { id: "bill", label: "Purchases" },
  { id: "quotation", label: "Quotations" },
  { id: "challan", label: "Delivery Challans" },
  { id: "order", label: "Sales Orders" },
]

interface TemplateDefinition {
  id: PrintTheme
  title: string
  subtitle: string
  accentColor: string
}

// 8 Official Themes configured in Print Settings (for Invoices)
const INVOICE_TEMPLATES_LIST: TemplateDefinition[] = [
  { id: "gst1", title: "GST 1", subtitle: "Standard Classic • Vyapar Default", accentColor: "#1e40af" },
  { id: "gst2", title: "GST 2", subtitle: "Modern Clean • Borderless Table", accentColor: "#4338ca" },
  { id: "gst3", title: "GST 3", subtitle: "Tax Detailed • Audit & CA Format", accentColor: "#047857" },
  { id: "gst4", title: "GST 4", subtitle: "Corporate Ribbon • Colored Banner", accentColor: "#be123c" },
  { id: "gst5", title: "GST 5", subtitle: "Compact Grid • Boxed Quadrants", accentColor: "#ea580c" },
  { id: "gst6", title: "GST 6", subtitle: "Tech Pro • Digital QR Header", accentColor: "#0f766e" },
  { id: "double_divine", title: "Double Divine", subtitle: "Dual-Tone Luxury • Vyapar Signature", accentColor: "#6d28d9" },
  { id: "french_elite", title: "French Elite", subtitle: "Boutique Editorial • Luxury Serif", accentColor: "#1e293b" },
]

// Templates for other documents (Purchases, Quotations, Challans, Orders, etc.) — genZ style removed
const OTHER_TEMPLATES_LIST: TemplateDefinition[] = [
  { id: "modern", title: "Modern", subtitle: "Amazon style clean band", accentColor: "#2563eb" },
  { id: "vintage", title: "Vintage", subtitle: "Tata classic traditional", accentColor: "#475569" },
  { id: "mrp_discount", title: "MRP + Discount", subtitle: "DMart retail savings", accentColor: "#059669" },
  { id: "elegant", title: "Elegant", subtitle: "Minimal monochrome", accentColor: "#0f172a" },
  { id: "service_template", title: "Service Template", subtitle: "Instagram pink banner", accentColor: "#db2777" },
  { id: "landscape", title: "Landscape Template", subtitle: "Wide horizontal table", accentColor: "#dc2626" },
  { id: "evergreen", title: "Evergreen", subtitle: "Unilever enterprise", accentColor: "#0284c7" },
  { id: "elegant_images", title: "Elegant with Images", subtitle: "Product photo cards", accentColor: "#4f46e5" },
  { id: "classic", title: "Classic", subtitle: "Samsung structured GST", accentColor: "#1d4ed8" },
  { id: "compact", title: "Compact", subtitle: "High density condensed", accentColor: "#ea580c" },
  { id: "bill_to_ship_to", title: "Bill To - Ship To", subtitle: "DHL dual party cards", accentColor: "#ca8a04" },
  { id: "legend", title: "Legend", subtitle: "Technical blueprint format", accentColor: "#334155" },
  { id: "service_template_2", title: "Service Template 2", subtitle: "Consulting timesheets", accentColor: "#16a34a" },
]

export const DocumentTemplatesModal: React.FC<DocumentTemplatesModalProps> = ({
  open,
  onOpenChange,
  initialDocType = "invoice"
}) => {
  const { printSettings, updatePrintSettings } = useApp()
  const [selectedDocType, setSelectedDocType] = useState<DocumentSequenceType>(initialDocType)
  const [selectedTheme, setSelectedTheme] = useState<PrintTheme>("gst1")
  const [savedSuccess, setSavedSuccess] = useState(false)

  const isInvoiceMode = selectedDocType === "invoice"
  const currentTemplates = isInvoiceMode ? INVOICE_TEMPLATES_LIST : OTHER_TEMPLATES_LIST

  // Sync state when opened or tab changed
  useEffect(() => {
    if (open) {
      const activeForDoc = printSettings.formThemes?.[selectedDocType] || (selectedDocType === "invoice" ? (printSettings.theme || "gst1") : "modern")
      const validList = selectedDocType === "invoice" ? INVOICE_TEMPLATES_LIST : OTHER_TEMPLATES_LIST
      const isValid = validList.some(t => t.id === activeForDoc)
      setSelectedTheme(isValid ? activeForDoc : validList[0].id)
      setSavedSuccess(false)
    }
  }, [open, selectedDocType, printSettings])

  useEffect(() => {
    if (initialDocType) {
      setSelectedDocType(initialDocType)
    }
  }, [initialDocType])

  if (!open) return null

  const handleTabChange = (tabId: DocumentSequenceType) => {
    setSelectedDocType(tabId)
    const activeForDoc = printSettings.formThemes?.[tabId] || (tabId === "invoice" ? (printSettings.theme || "gst1") : "modern")
    const validList = tabId === "invoice" ? INVOICE_TEMPLATES_LIST : OTHER_TEMPLATES_LIST
    const isValid = validList.some(t => t.id === activeForDoc)
    setSelectedTheme(isValid ? activeForDoc : validList[0].id)
  }

  const handleSelectTemplate = (id: PrintTheme) => {
    setSelectedTheme(id)
  }

  const handleSave = () => {
    updatePrintSettings({
      ...(selectedDocType === "invoice" ? { theme: selectedTheme } : {}),
      formThemes: {
        ...(printSettings.formThemes || {}),
        [selectedDocType]: selectedTheme
      }
    })
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onOpenChange(false)
    }, 450)
  }

  // Realistic miniature invoice renderer matching the visual style in Settings and Swipe Reference
  const renderTemplateMiniature = (id: PrintTheme, isSelected: boolean) => {
    switch (id) {
      // =====================================================================
      // 1. INVOICE THEMES (Settings > Print Options)
      // =====================================================================
      case "gst1":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-700 rounded p-1 flex flex-col justify-between text-[5.5px] select-none shadow-2xs font-sans">
            <div>
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-[6.5px]">ABC ENTERPRISE</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-[6px]">TAX INVOICE</span>
              </div>
              <div className="grid grid-cols-2 gap-0.5 border-b border-slate-300 dark:border-slate-700 py-0.5 text-[5px]">
                <div className="border border-slate-200 dark:border-slate-800 p-0.5 rounded-xs">Bill To: Apex Ltd</div>
                <div className="border border-slate-200 dark:border-slate-800 p-0.5 rounded-xs">Ship To: Warehouse 1</div>
              </div>
              <div className="space-y-0.5 py-0.5">
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-xs" />
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-300 dark:border-slate-700 pt-0.5 font-bold">
              <span className="text-slate-500">Bank: HDFC</span>
              <span className="text-blue-700 dark:text-blue-400 text-[6.5px]">₹23,416.00</span>
            </div>
          </div>
        )

      case "gst2":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded p-1.5 flex flex-col justify-between text-[5.5px] select-none shadow-2xs font-sans">
            <div>
              <div className="flex justify-between items-center pb-1">
                <span className="font-bold text-slate-900 dark:text-white text-[7px]">Apex Store</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[5px] font-bold">INV-0042</span>
              </div>
              <div className="h-1.5 w-full bg-indigo-50 dark:bg-indigo-950/60 rounded-xs my-0.5" />
              <div className="space-y-1 py-0.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Cotton Shirt</span><span>₹1,499</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Chino Trousers</span><span>₹2,199</span></div>
              </div>
            </div>
            <div className="flex justify-end pt-1 border-t border-indigo-100 dark:border-indigo-950">
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[6.5px]">₹3,698.00</span>
            </div>
          </div>
        )

      case "gst3":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/60 rounded p-1 flex flex-col justify-between text-[5px] select-none shadow-2xs font-sans">
            <div>
              <div className="flex justify-between border-b border-emerald-200 dark:border-emerald-900 pb-0.5">
                <span className="font-bold text-slate-900 dark:text-white text-[6.5px]">TAX INVOICE</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">GSTR-1 AUDIT</span>
              </div>
              <div className="grid grid-cols-5 gap-0.5 text-center font-bold text-white bg-emerald-700 py-0.5 my-0.5 rounded-2xs text-[4.5px]">
                <span>Item</span><span>HSN</span><span>Taxable</span><span>CGST</span><span>SGST</span>
              </div>
              <div className="space-y-0.5 text-[4.5px] text-center text-slate-600 dark:text-slate-400">
                <div className="grid grid-cols-5 gap-0.5 bg-slate-50 dark:bg-slate-800/50 py-0.2"><span>PCM</span><span>3004</span><span>12.5k</span><span>6%</span><span>6%</span></div>
                <div className="grid grid-cols-5 gap-0.5 bg-white dark:bg-slate-900 py-0.2"><span>AMX</span><span>3004</span><span>8.2k</span><span>6%</span><span>6%</span></div>
              </div>
            </div>
            <div className="border-t border-emerald-200 dark:border-emerald-900 pt-0.5 flex justify-between font-bold text-[6px]">
              <span className="text-slate-500">HSN Summary</span>
              <span className="text-emerald-700 dark:text-emerald-400">Total: ₹23,416</span>
            </div>
          </div>
        )

      case "gst4":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded overflow-hidden flex flex-col justify-between text-[5.5px] select-none shadow-2xs font-sans">
            <div>
              <div className="w-full bg-rose-700 text-white font-bold px-1.5 py-1 flex justify-between items-center text-[6.5px]">
                <span>TAX INVOICE</span>
                <span className="text-[5px] font-mono opacity-90">#INV-2026</span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="h-4 rounded border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 p-0.5 text-[4.5px]">Buyer Details</div>
                <div className="h-4 rounded border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 p-0.5 text-[4.5px]">Ship Details</div>
              </div>
              <div className="space-y-0.5 px-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="p-1 flex justify-end">
              <div className="px-1.5 py-0.5 bg-rose-700 text-white font-bold rounded text-[6.5px]">₹23,416.00</div>
            </div>
          </div>
        )

      case "gst5":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border-2 border-orange-400 dark:border-orange-800 rounded p-1 flex flex-col justify-between text-[5px] select-none shadow-2xs font-sans">
            <div>
              <div className="grid grid-cols-2 gap-0.5 border-b border-orange-300 dark:border-orange-800 pb-0.5">
                <div className="bg-orange-50 dark:bg-orange-950/50 p-0.5 font-bold text-orange-950 dark:text-orange-200">1. Seller Info</div>
                <div className="bg-orange-50 dark:bg-orange-950/50 p-0.5 font-bold text-orange-950 dark:text-orange-200">2. Invoice #042</div>
                <div className="bg-slate-50 dark:bg-slate-850 p-0.5">3. Buyer Info</div>
                <div className="bg-slate-50 dark:bg-slate-850 p-0.5">4. Ship-To</div>
              </div>
              <div className="space-y-0.5 py-0.5">
                <div className="h-1.5 w-full bg-orange-100/60 dark:bg-orange-950/30 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="border-t border-orange-300 dark:border-orange-800 pt-0.5 text-right font-bold text-orange-700 dark:text-orange-400 text-[6.5px]">
              TOTAL: ₹23,416
            </div>
          </div>
        )

      case "gst6":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-900 rounded p-1 flex flex-col justify-between text-[5px] select-none shadow-2xs font-sans">
            <div>
              <div className="flex justify-between items-start border-b border-teal-200 dark:border-teal-900 pb-0.5">
                <div>
                  <span className="font-mono font-bold text-teal-800 dark:text-teal-300 text-[6.5px]">DIGITAL INV</span>
                  <div className="text-[4px] text-slate-400 font-mono">IRN: 88f9...2a8b</div>
                </div>
                <div className="w-5 h-5 border border-teal-400 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 flex items-center justify-center font-bold text-[5px] text-teal-700 dark:text-teal-300">QR</div>
              </div>
              <div className="space-y-0.5 py-1">
                <div className="h-1.5 w-full bg-teal-900 text-white px-0.5 flex justify-between items-center text-[4.5px]">
                  <span>CODE 128</span><span>₹23,416</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="text-[5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold border-t border-teal-200 dark:border-teal-900 pt-0.5 flex items-center justify-between">
              <span>✓ SIGNED</span>
              <span className="text-[6.5px]">₹23,416</span>
            </div>
          </div>
        )

      case "double_divine":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-900 rounded overflow-hidden flex flex-col justify-between text-[5px] select-none shadow-2xs font-sans">
            <div>
              <div className="flex h-3 text-white">
                <div className="flex-1 px-1 bg-purple-700 flex items-center text-[5.5px] font-bold">Vyapar Divine</div>
                <div className="w-7 bg-slate-900 flex items-center justify-center text-[4.5px] font-bold">TAX INV</div>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="h-3.5 rounded border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20" />
                <div className="h-3.5 rounded border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20" />
              </div>
              <div className="space-y-0.5 px-1">
                <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-950/40 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="p-1 flex justify-end">
              <div className="border border-purple-700 text-purple-700 dark:text-purple-300 px-1 font-bold text-[6.5px] rounded-xs">₹23,416</div>
            </div>
          </div>
        )

      case "french_elite":
        return (
          <div className="w-full h-36 bg-[#faf9f6] dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded p-1 flex flex-col justify-between items-center text-center text-[5px] select-none shadow-2xs font-serif">
            <div className="w-full">
              <div className="text-[4.5px] uppercase tracking-widest text-slate-400">— Luxury Edition —</div>
              <div className="font-bold text-[7.5px] text-slate-900 dark:text-white tracking-widest my-0.5">MAISON & CIE</div>
              <div className="w-full border-t border-b border-slate-300 dark:border-slate-700 py-1 space-y-0.5">
                <div className="h-1 w-3/4 bg-slate-200 dark:bg-slate-800 mx-auto rounded-xs" />
                <div className="h-1 w-1/2 bg-slate-200 dark:bg-slate-800 mx-auto rounded-xs" />
              </div>
            </div>
            <div className="w-full border-t border-slate-300 dark:border-slate-700 pt-0.5 flex justify-between items-baseline font-bold text-slate-900 dark:text-white text-[6.5px]">
              <span className="italic font-normal">Montant Total</span>
              <span>₹23,416</span>
            </div>
          </div>
        )

      // =====================================================================
      // 2. OTHER DOCUMENT THEMES (Quotations, Orders, Challans, Purchases)
      // =====================================================================
      case "modern":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1">
                <div>
                  <div className="h-1.5 w-8 bg-blue-600 rounded-xs mb-0.5" />
                  <div className="h-1 w-12 bg-slate-300 dark:bg-slate-700 rounded-xs" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 tracking-tighter text-[7px]">amazon</div>
              </div>
              <div className="grid grid-cols-2 gap-1 py-1 text-slate-500 text-[5px]">
                <div className="h-1 w-10 bg-slate-200 dark:bg-slate-700 rounded-xs" />
                <div className="h-1 w-8 bg-slate-200 dark:bg-slate-700 rounded-xs ml-auto" />
              </div>
              <div className="space-y-0.5 border-t border-b border-slate-100 dark:border-slate-800 py-1">
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-xs" />
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="w-3.5 h-3.5 border border-slate-300 flex items-center justify-center text-[4px]">QR</div>
              <div className="h-2 w-10 bg-blue-600 rounded-xs" />
            </div>
          </div>
        )

      case "vintage":
        return (
          <div className="w-full h-36 bg-[#fbfbfa] dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-700 rounded p-1 flex flex-col justify-between text-[6px] select-none shadow-2xs font-serif">
            <div>
              <div className="text-center border-b border-slate-300 dark:border-slate-700 pb-0.5">
                <div className="font-bold text-slate-900 dark:text-white tracking-widest text-[7px]">TATA MOTORS</div>
                <div className="text-[5px] text-slate-500">EST. 1945 • REGISTERED TAX INVOICE</div>
              </div>
              <div className="grid grid-cols-2 border-b border-slate-300 dark:border-slate-700 py-0.5 text-[5px]">
                <div className="border-r border-slate-300 dark:border-slate-700 pr-1">Billed To: Party Details</div>
                <div className="pl-1">Inv No: 89410</div>
              </div>
              <div className="border border-slate-300 dark:border-slate-700 my-0.5 text-[5px]">
                <div className="bg-slate-200 dark:bg-slate-800 px-0.5 font-bold">Item Description</div>
                <div className="px-0.5 py-1 text-slate-600 space-y-0.5">
                  <div className="h-0.5 w-full bg-slate-300 dark:bg-slate-700" />
                  <div className="h-0.5 w-4/5 bg-slate-300 dark:bg-slate-700" />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-slate-300 dark:border-slate-700 pt-0.5">
              <div className="w-4 h-4 rounded-full border border-rose-500 text-rose-500 flex items-center justify-center text-[4px] rotate-[-12deg] font-bold">SEAL</div>
              <div className="text-right font-bold text-slate-900 dark:text-white text-[7px]">₹48,250</div>
            </div>
          </div>
        )

      case "mrp_discount":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex justify-between items-center pb-1 border-b border-emerald-100 dark:border-emerald-950">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[8px] tracking-tight">D'Mart</span>
                <span className="bg-emerald-600 text-white font-bold px-1 py-0.2 rounded text-[5px]">RETAIL BILL</span>
              </div>
              <div className="grid grid-cols-4 gap-0.5 bg-emerald-50 dark:bg-emerald-950/60 p-0.5 my-1 text-[5px] font-bold text-emerald-900 dark:text-emerald-300">
                <div>MRP</div>
                <div>DISC</div>
                <div>GST</div>
                <div className="text-right">NET</div>
              </div>
              <div className="space-y-1 text-[5px] text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span>₹250</span><span className="text-emerald-600">-15%</span><span>5%</span><span>₹212</span></div>
                <div className="flex justify-between"><span>₹180</span><span className="text-emerald-600">-10%</span><span>12%</span><span>₹162</span></div>
              </div>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-950/80 p-1 rounded flex justify-between items-center text-[6px] font-bold text-emerald-900 dark:text-emerald-200">
              <span>TOTAL SAVINGS: ₹56</span>
              <span className="text-[7px]">₹374.00</span>
            </div>
          </div>
        )

      case "elegant":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex justify-between items-center pb-1">
                <div className="font-black text-slate-950 dark:text-white tracking-widest text-[8px]">NIKE</div>
                <span className="text-slate-400 text-[5px] uppercase tracking-widest">INVOICE // 0842</span>
              </div>
              <div className="h-0.5 w-full bg-slate-950 dark:bg-white mb-2" />
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Air Max 270</span>
                  <span className="font-mono">₹14,995</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Standard Shipping</span>
                  <span>Free</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-1 flex justify-between items-baseline font-bold text-slate-950 dark:text-white text-[7px]">
              <span>TOTAL DUE</span>
              <span>₹14,995.00</span>
            </div>
          </div>
        )

      case "service_template":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/50 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 text-white p-1 rounded-xs flex justify-between items-center mb-1">
                <span className="font-bold text-[7px] flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                  Instagram Agency
                </span>
                <span className="text-[5px] bg-white/20 px-1 py-0.2 rounded font-mono">SER-2026</span>
              </div>
              <div className="text-[5px] text-slate-500 dark:text-slate-400 space-y-0.5 mb-1">
                <div className="h-1 w-16 bg-slate-200 dark:bg-slate-700 rounded-xs" />
                <div className="h-1 w-10 bg-slate-200 dark:bg-slate-700 rounded-xs" />
              </div>
              <div className="border border-pink-100 dark:border-pink-950 rounded-xs overflow-hidden text-[5px]">
                <div className="bg-pink-50 dark:bg-pink-950/60 text-pink-900 dark:text-pink-300 px-1 py-0.5 font-bold flex justify-between">
                  <span>Scope / Milestones</span>
                  <span>Amount</span>
                </div>
                <div className="p-1 space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Reel Production (4x)</span>
                    <span>₹24,000</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-pink-100 dark:border-pink-950">
              <div className="w-3.5 h-3.5 border border-slate-300 text-[4px] flex items-center justify-center">QR</div>
              <span className="font-bold text-pink-600 dark:text-pink-400 text-[7px]">₹28,320</span>
            </div>
          </div>
        )

      case "landscape":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900/50 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex items-center gap-1 border-b border-red-500 pb-0.5">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-xs" />
                <span className="font-bold text-slate-900 dark:text-white text-[7px]">REDLINE LOGISTICS (WIDE)</span>
              </div>
              <div className="grid grid-cols-6 gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 my-1 text-[4.5px] font-bold text-slate-700 dark:text-slate-300">
                <div>SR</div><div>ITEM</div><div>HSN</div><div>QTY</div><div>RATE</div><div>TOTAL</div>
              </div>
              <div className="grid grid-cols-6 gap-0.5 text-[4.5px] text-slate-600 dark:text-slate-400 border-b border-slate-100 pb-0.5">
                <div>1</div><div>Freight</div><div>9965</div><div>10</div><div>₹450</div><div>₹4,500</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[5px]">
              <span className="text-slate-400">Landscape Format 16:9</span>
              <span className="font-bold text-red-600 text-[7px]">₹4,500</span>
            </div>
          </div>
        )

      case "evergreen":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-900 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex items-center gap-1 border-b border-sky-200 dark:border-sky-800 pb-0.5">
                <div className="text-sky-700 dark:text-sky-400 font-bold text-[8px]">Unilever</div>
                <div className="text-[5px] text-slate-400 ml-auto font-mono">GSTIN / TAX INVOICE</div>
              </div>
              <div className="h-1 w-full bg-sky-100 dark:bg-sky-950 my-1 rounded-xs" />
              <div className="space-y-1 text-[5px] text-slate-600 dark:text-slate-400">
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xs" />
                <div className="h-1 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-xs" />
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-sky-100 pt-1">
              <div className="w-4 h-3 rounded-xs border border-sky-300 text-sky-600 text-[4px] flex items-center justify-center font-bold">BANK</div>
              <span className="font-bold text-sky-800 dark:text-sky-300 text-[7px]">₹12,400</span>
            </div>
          </div>
        )

      case "elegant_images":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex justify-between items-center border-b border-indigo-100 pb-0.5 mb-1">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 text-[7px]">LUXE CATALOGUE</span>
                <span className="text-[5px] text-indigo-500">IMAGES ON</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 border border-slate-100 dark:border-slate-800 p-0.5 rounded">
                  <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[4px] font-bold text-indigo-600">IMG</div>
                  <div className="flex-1 text-[5px]">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Sneakers Pro</div>
                    <div className="text-slate-400">Size UK 9</div>
                  </div>
                  <span className="font-bold text-[6px]">₹3,999</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1 border-t border-slate-100 text-[7px] font-bold text-indigo-600">
              ₹3,999.00
            </div>
          </div>
        )

      case "classic":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-900 rounded p-1 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/60 p-0.5 border-b border-blue-200 mb-0.5">
                <span className="font-bold text-blue-900 dark:text-blue-300 text-[7px]">SAMSUNG ELECTRONICS</span>
                <span className="font-bold text-[5px] text-blue-600">ORIGINAL</span>
              </div>
              <div className="grid grid-cols-2 gap-0.5 border border-slate-200 p-0.5 text-[5px] mb-0.5">
                <div>Consignee: Retailer</div>
                <div>Transport: By Road</div>
              </div>
              <div className="space-y-0.5">
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="border-t border-blue-200 pt-0.5 flex justify-between font-bold text-blue-900 dark:text-blue-200 text-[7px]">
              <span>TAX INVOICE TOTAL</span>
              <span>₹89,900</span>
            </div>
          </div>
        )

      case "compact":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-900 rounded p-1 flex flex-col justify-between text-[5.5px] select-none shadow-2xs">
            <div>
              <div className="bg-orange-500 text-white font-bold p-0.5 text-center text-[6.5px] rounded-xs mb-0.5">
                FAST COMPACT INVOICE
              </div>
              <div className="space-y-0.5 border border-orange-200 dark:border-orange-900 p-0.5 text-[4.5px]">
                <div className="flex justify-between border-b pb-0.2"><span>1. Paracetamol 650</span><span>₹320</span></div>
                <div className="flex justify-between border-b pb-0.2"><span>2. Azithromycin 500</span><span>₹580</span></div>
                <div className="flex justify-between border-b pb-0.2"><span>3. Amoxicillin 250</span><span>₹145</span></div>
                <div className="flex justify-between"><span>4. Vitamin C Chewable</span><span>₹90</span></div>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/60 p-0.5 flex justify-between font-bold text-orange-900 dark:text-orange-200 text-[6.5px]">
              <span>TOTAL (4 Items)</span>
              <span>₹1,135</span>
            </div>
          </div>
        )

      case "bill_to_ship_to":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900 rounded p-1 flex flex-col justify-between text-[5.5px] select-none shadow-2xs">
            <div>
              <div className="bg-amber-400 text-amber-950 font-bold p-0.5 text-center text-[7px] mb-0.5">
                EXPRESS DISPATCH & LOGISTICS
              </div>
              <div className="grid grid-cols-2 gap-0.5 my-0.5">
                <div className="border border-amber-300 dark:border-amber-800 p-0.5 rounded-xs bg-amber-50/50 dark:bg-amber-950/30 text-[5px]">
                  <div className="font-bold text-amber-900 dark:text-amber-300">BILL TO</div>
                  <div>Alpha Traders</div>
                </div>
                <div className="border border-amber-300 dark:border-amber-800 p-0.5 rounded-xs bg-amber-50/50 dark:bg-amber-950/30 text-[5px]">
                  <div className="font-bold text-amber-900 dark:text-amber-300">SHIP TO</div>
                  <div>Warehouse 4B</div>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 my-0.5" />
            </div>
            <div className="flex justify-between items-center text-[6.5px] font-bold text-amber-900 dark:text-amber-200 border-t border-amber-200 pt-0.5">
              <span>WAYBILL: #782910</span>
              <span>₹18,500</span>
            </div>
          </div>
        )

      case "legend":
        return (
          <div className="w-full h-36 bg-[#f8fafc] dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded p-1 flex flex-col justify-between text-[5.5px] select-none shadow-2xs">
            <div>
              <div className="border-b-2 border-slate-800 dark:border-slate-300 pb-0.5 flex justify-between items-center">
                <span className="font-bold tracking-wider text-[7px] text-slate-800 dark:text-slate-100">ENGINEERING SPEC</span>
                <span className="text-[5px] text-slate-500 font-mono">REV-3.2</span>
              </div>
              <div className="border border-slate-300 dark:border-slate-700 my-1 p-0.5 space-y-0.5 text-[4.5px]">
                <div className="flex justify-between"><span>Structural Beam 400mm</span><span>₹52,000</span></div>
                <div className="flex justify-between"><span>Fabrication Labour</span><span>₹14,500</span></div>
              </div>
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-0.5 flex justify-between font-bold text-[6.5px]">
              <span>CERTIFIED</span>
              <span>₹66,500</span>
            </div>
          </div>
        )

      case "service_template_2":
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900 rounded p-1.5 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div>
              <div className="flex items-center gap-1 border-b border-emerald-400 pb-0.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white text-[7px]">CONSULTING PARTNERS</span>
              </div>
              <div className="space-y-1 text-[5px] text-slate-600 dark:text-slate-300">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>Architecture Audit (16h)</span>
                  <span>₹32,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>Cloud Migration (24h)</span>
                  <span>₹48,000</span>
                </div>
              </div>
            </div>
            <div className="border-t border-emerald-200 pt-1 flex justify-between font-bold text-emerald-800 dark:text-emerald-300 text-[7px]">
              <span>TOTAL HRS: 40</span>
              <span>₹80,000</span>
            </div>
          </div>
        )

      default:
        return (
          <div className="w-full h-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 flex flex-col justify-between text-[6px] select-none shadow-2xs">
            <div className="h-2 w-12 bg-blue-600 rounded-xs" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-slate-100 rounded-xs" />
              <div className="h-1 w-3/4 bg-slate-100 rounded-xs" />
            </div>
            <div className="h-2 w-10 bg-slate-300 rounded-xs ml-auto" />
          </div>
        )
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[10060] bg-slate-950/60 backdrop-blur-xs flex flex-col justify-start overflow-hidden animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-h-[96vh] rounded-b-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. Header                                                 */}
        {/* ========================================================= */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer rounded"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Document Templates
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. Document Category Tabs                                 */}
        {/* ========================================================= */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 overflow-x-auto no-scrollbar shrink-0">
          {DOC_TABS.map(tab => {
            const isTabActive = selectedDocType === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                  isTabActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                {isTabActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* 4. Template Cards Grid                                    */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          <div className={cn(
            "grid gap-4",
            isInvoiceMode 
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 max-w-5xl" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
          )}>
            {currentTemplates.map(tmpl => {
              const isSelected = selectedTheme === tmpl.id
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`group relative rounded-xl transition-all cursor-pointer flex flex-col p-2 bg-white dark:bg-slate-900 border ${
                    isSelected
                      ? "ring-2 ring-blue-600 border-blue-600 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs"
                  }`}
                >
                  {/* Template Title & Checkmark Badge */}
                  <div className="flex items-center justify-between pb-1.5 px-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tmpl.title}
                    </span>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Template Miniature Preview */}
                  <div className="flex-1 flex items-center justify-center">
                    {renderTemplateMiniature(tmpl.id, isSelected)}
                  </div>

                  {/* Subtitle tag */}
                  <div className="pt-1.5 px-0.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="truncate">{tmpl.subtitle}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. Sticky Bottom Footer with Save & Cancel                */}
        {/* ========================================================= */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 bg-white dark:bg-slate-900 shrink-0 select-none">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="h-9 px-6 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Theme Applied!
              </span>
            ) : (
              "Save changes"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
          >
            Cancel
          </Button>
        </div>

      </div>
    </div>
  )
}

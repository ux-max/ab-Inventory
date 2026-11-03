"use client"

import React, { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Printer, 
  Palette, 
  Eye, 
  Sparkles, 
  Check, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  QrCode,
  ShieldCheck,
  Building2,
  FileText,
  User,
  Truck,
  FileCheck2,
  CheckCircle2,
  Hash,
  Calendar,
  CreditCard,
  Layers
} from "lucide-react"
import { PrintTheme, PrintSettings } from "@/types/inventory"
import { cn, formatINR } from "@/lib/utils"

interface ThemeDefinition {
  id: PrintTheme
  name: string
  subtitle: string
  tag: string
  description: string
  miniatureType: "classic_box" | "modern_clean" | "tax_detailed" | "banner_ribbon" | "compact_quad" | "tech_qr" | "double_divine" | "french_elite"
}

const THEMES_LIST: ThemeDefinition[] = [
  {
    id: "gst1",
    name: "GST 1",
    subtitle: "Standard Classic",
    tag: "Vyapar Default",
    description: "Full outer border, dual Bill-To/Ship-To boxes, traditional tabular grid with solid lines",
    miniatureType: "classic_box",
  },
  {
    id: "gst2",
    name: "GST 2",
    subtitle: "Modern Clean",
    tag: "Borderless Table",
    description: "Borderless table with alternating zebra rows, sleek metadata bar, and modern pill total",
    miniatureType: "modern_clean",
  },
  {
    id: "gst3",
    name: "GST 3",
    subtitle: "Tax Detailed",
    tag: "Audit & CA Format",
    description: "Detailed line-item tax columns (CGST %, CGST Amt, SGST %, SGST Amt) + HSN Summary table",
    miniatureType: "tax_detailed",
  },
  {
    id: "gst4",
    name: "GST 4",
    subtitle: "Corporate Ribbon",
    tag: "Colored Banner",
    description: "Prominent full-width colored header band, colored party headers, and high-impact total card",
    miniatureType: "banner_ribbon",
  },
  {
    id: "gst5",
    name: "GST 5",
    subtitle: "Compact Grid",
    tag: "Boxed Quadrants",
    description: "4-compartment boxed header (Seller, Invoice, Buyer, Consignee) and high-density item rows",
    miniatureType: "compact_quad",
  },
  {
    id: "gst6",
    name: "GST 6",
    subtitle: "Tech Pro",
    tag: "Digital QR Header",
    description: "Prominent top payment QR code, monospace metadata, and digital authenticity seal",
    miniatureType: "tech_qr",
  },
  {
    id: "double_divine",
    name: "Double Divine",
    subtitle: "Dual-Tone Luxury",
    tag: "Vyapar Signature",
    description: "Signature two-tone header band, rounded card containers, and double-bordered total box",
    miniatureType: "double_divine",
  },
  {
    id: "french_elite",
    name: "French Elite",
    subtitle: "Boutique Editorial",
    tag: "Luxury Serif",
    description: "Sophisticated serif typography, centered brand with ornamental rules, and airy hairline dividers",
    miniatureType: "french_elite",
  },
]

const COLOR_SWATCHES = [
  { name: "Navy Blue", hex: "#1e40af" },
  { name: "Royal Indigo", hex: "#4338ca" },
  { name: "Emerald", hex: "#047857" },
  { name: "Crimson", hex: "#be123c" },
  { name: "Teal Ocean", hex: "#0f766e" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Amber Wood", hex: "#b45309" },
  { name: "Slate Charcoal", hex: "#1e293b" },
]

export function PrintSettingsView() {
  const { printSettings, updatePrintSettings, business, customItemFields, standardTerms } = useApp()
  const [zoomLevel, setZoomLevel] = useState<number>(0.85)
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleThemeChange = (theme: PrintTheme) => {
    updatePrintSettings({ theme })
  }

  const handleColorChange = (color: string) => {
    updatePrintSettings({ primaryColor: color })
  }

  const handleToggle = (key: keyof PrintSettings) => {
    updatePrintSettings({ [key]: !printSettings[key] })
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const activeThemeMeta = THEMES_LIST.find((t) => t.id === printSettings.theme) || THEMES_LIST[0]
  const primaryColor = printSettings.primaryColor || "#1e40af"

  // Render miniature invoice previews inside the horizontal theme cards
  const renderMiniature = (type: ThemeDefinition["miniatureType"], isSelected: boolean) => {
    return (
      <div 
        className={cn(
          "w-full h-24 rounded bg-white dark:bg-slate-900 border p-1.5 flex flex-col justify-between overflow-hidden text-[6px] select-none shadow-2xs transition-all",
          isSelected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200 dark:border-slate-700"
        )}
      >
        {type === "classic_box" && (
          <div className="h-full border border-slate-400 p-1 flex flex-col justify-between">
            <div className="flex justify-between border-b border-slate-300 pb-0.5">
              <span className="font-bold text-slate-800">LOGO</span>
              <span className="font-bold" style={{ color: primaryColor }}>TAX INVOICE</span>
            </div>
            <div className="grid grid-cols-2 gap-0.5 border-b border-slate-300 py-0.5">
              <div className="border border-slate-200 p-0.5">Bill To</div>
              <div className="border border-slate-200 p-0.5">Ship To</div>
            </div>
            <div className="space-y-0.5 py-0.5">
              <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
              <div className="h-1.5 w-full bg-slate-100 rounded-xs" />
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-0.5 font-bold">
              <span>Bank</span>
              <span style={{ color: primaryColor }}>Total: ₹23k</span>
            </div>
          </div>
        )}

        {type === "modern_clean" && (
          <div className="h-full flex flex-col justify-between p-0.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Apex Store</span>
              <span className="px-1 py-0.2 rounded-full text-white text-[5px]" style={{ backgroundColor: primaryColor }}>INV-0042</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-xs my-0.5" />
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded-xs" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
              <div className="h-1.5 w-full bg-slate-50 rounded-xs" />
              <div className="h-1.5 w-full bg-slate-100 rounded-xs" />
            </div>
            <div className="flex justify-end pt-0.5">
              <span className="px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: primaryColor }}>₹23,416</span>
            </div>
          </div>
        )}

        {type === "tax_detailed" && (
          <div className="h-full flex flex-col justify-between p-0.5">
            <div className="flex justify-between border-b border-slate-300 pb-0.5">
              <span className="font-bold">TAX INVOICE</span>
              <span className="font-mono text-slate-500">GSTR-1</span>
            </div>
            <div className="text-[5px] grid grid-cols-5 gap-0.5 text-center font-bold text-white py-0.5" style={{ backgroundColor: primaryColor }}>
              <span>Item</span><span>HSN</span><span>Taxable</span><span>CGST</span><span>SGST</span>
            </div>
            <div className="space-y-0.5">
              <div className="h-1.5 w-full bg-slate-100 grid grid-cols-5 gap-0.5 text-[5px] text-center">
                <span>Pcm</span><span>3004</span><span>12.5k</span><span>6%</span><span>6%</span>
              </div>
            </div>
            <div className="border-t border-slate-300 text-[5px] flex justify-between font-bold">
              <span>HSN Summary</span>
              <span style={{ color: primaryColor }}>Total: ₹23,416</span>
            </div>
          </div>
        )}

        {type === "banner_ribbon" && (
          <div className="h-full flex flex-col justify-between">
            <div className="w-full text-white font-bold px-1 py-1 flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
              <span>TAX INVOICE</span>
              <span className="text-[5px]">#0042</span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-0.5">
              <div className="h-3 rounded-xs border border-blue-200 bg-blue-50/50 p-0.5">Buyer</div>
              <div className="h-3 rounded-xs border border-blue-200 bg-blue-50/50 p-0.5">Ship</div>
            </div>
            <div className="space-y-0.5 px-0.5">
              <div className="h-1.5 w-full border border-slate-200" />
              <div className="h-1.5 w-full border border-slate-200" />
            </div>
            <div className="p-0.5 flex justify-end">
              <div className="px-1 text-white font-bold rounded-xs" style={{ backgroundColor: primaryColor }}>₹23,416</div>
            </div>
          </div>
        )}

        {type === "compact_quad" && (
          <div className="h-full border border-slate-400 flex flex-col justify-between p-0.5">
            <div className="grid grid-cols-2 gap-0.5 border-b border-slate-300 pb-0.5">
              <div className="bg-slate-100 p-0.5">Seller</div>
              <div className="bg-slate-100 p-0.5">Invoice#</div>
              <div className="bg-slate-50 p-0.5">Buyer</div>
              <div className="bg-slate-50 p-0.5">Ship To</div>
            </div>
            <div className="space-y-0.5">
              <div className="h-1.5 w-full bg-slate-200" />
              <div className="h-1.5 w-full bg-slate-100" />
            </div>
            <div className="border-t border-slate-300 pt-0.5 text-right font-bold text-[6px]">
              TOTAL: ₹23,416
            </div>
          </div>
        )}

        {type === "tech_qr" && (
          <div className="h-full flex flex-col justify-between p-0.5 border border-slate-300">
            <div className="flex justify-between items-start border-b border-slate-200 pb-0.5">
              <div>
                <span className="font-mono font-bold">DIGITAL INV</span>
                <div className="text-[4px] text-slate-400">IRN: 88f9...2a</div>
              </div>
              <div className="w-4 h-4 border border-slate-400 bg-slate-100 flex items-center justify-center font-bold">QR</div>
            </div>
            <div className="space-y-0.5">
              <div className="h-1.5 w-full bg-slate-800 text-white px-0.5 flex justify-between">
                <span>ITEM</span><span>₹</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100" />
            </div>
            <div className="text-[5px] font-mono text-emerald-600 font-bold border-t border-slate-200 pt-0.5">
              ✓ DIGITALLY SIGNED
            </div>
          </div>
        )}

        {type === "double_divine" && (
          <div className="h-full flex flex-col justify-between">
            <div className="flex h-3 text-white">
              <div className="flex-1 px-1 flex items-center text-[5px] font-bold" style={{ backgroundColor: primaryColor }}>Apex Store</div>
              <div className="w-6 bg-slate-900 flex items-center justify-center text-[4px] font-bold">TAX INV</div>
            </div>
            <div className="grid grid-cols-2 gap-1 p-0.5">
              <div className="h-3 rounded-sm border border-slate-200 bg-slate-50" />
              <div className="h-3 rounded-sm border border-slate-200 bg-slate-50" />
            </div>
            <div className="space-y-0.5 px-0.5">
              <div className="h-1.5 w-full rounded-xs" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
              <div className="h-1.5 w-full bg-slate-100" />
            </div>
            <div className="p-0.5 flex justify-end">
              <div className="border border-double border-slate-800 px-1 font-bold text-[6px]">₹23,416</div>
            </div>
          </div>
        )}

        {type === "french_elite" && (
          <div className="h-full flex flex-col justify-between items-center text-center p-0.5 font-serif">
            <div className="text-[4px] uppercase tracking-widest text-slate-400">— Memo —</div>
            <div className="font-bold text-[7px] text-slate-800">Apex Store</div>
            <div className="w-full border-t border-b border-slate-300 py-0.5 space-y-0.5">
              <div className="h-1.5 w-full bg-slate-50" />
              <div className="h-1.5 w-full bg-slate-100" />
            </div>
            <div className="text-[5px] italic text-slate-600 font-serif">
              Total: INR 23,416.00
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Settings Sidebar */}
      <div className="w-96 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto p-5 space-y-6 shrink-0">
        
        {/* Section 1: Themes Carousel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Select Invoice Theme
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                8 authentic GST layouts with unique information styles
              </p>
            </div>
            
            {/* Scroll navigation arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Scroll Left"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Scroll Right"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Horizontal scroll track with snap cards */}
          <div 
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {THEMES_LIST.map((th) => {
              const isSelected = printSettings.theme === th.id
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleThemeChange(th.id)}
                  className={cn(
                    "snap-start shrink-0 w-44 p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between bg-white dark:bg-slate-900 shadow-2xs group relative",
                    isSelected 
                      ? "border-blue-600 ring-2 ring-blue-600/30 dark:border-blue-500" 
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                  )}
                >
                  {/* Miniature Blueprint */}
                  {renderMiniature(th.miniatureType, isSelected)}

                  {/* Card Meta */}
                  <div className="mt-2 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {th.name}
                      </span>
                      {isSelected ? (
                        <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {th.tag}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                      {th.subtitle}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Selected Theme:</span>
            <Badge className="bg-blue-600 text-white font-bold text-xs">
              {activeThemeMeta.name} — {activeThemeMeta.subtitle}
            </Badge>
          </div>
        </div>

        {/* Section 2: Accent Color Picker */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-blue-600" />
              Theme Accent Color
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                {primaryColor}
              </span>
              <div 
                className="w-4 h-4 rounded-full border border-slate-300 shadow-xs" 
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Palette Swatches */}
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  title={swatch.name}
                  onClick={() => handleColorChange(swatch.hex)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform flex items-center justify-center relative cursor-pointer",
                    primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                      ? "ring-2 ring-offset-2 ring-blue-600 scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {primaryColor.toLowerCase() === swatch.hex.toLowerCase() && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Custom Color:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#1e40af"
                  maxLength={7}
                  className="font-mono text-xs w-24 h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Print Layout & Visibility Toggles */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
            Invoice Elements Visibility
          </h2>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Company Logo</span>
              <Switch checked={printSettings.showLogo} onCheckedChange={() => handleToggle("showLogo")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Authorized Signature</span>
              <Switch checked={printSettings.showSignature} onCheckedChange={() => handleToggle("showSignature")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Bank Details & UPI QR</span>
              <Switch checked={printSettings.showBank} onCheckedChange={() => handleToggle("showBank")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show HSN / SAC Code Column</span>
              <Switch checked={printSettings.showHsn} onCheckedChange={() => handleToggle("showHsn")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Item Discounts</span>
              <Switch checked={printSettings.showDiscount} onCheckedChange={() => handleToggle("showDiscount")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Terms & Conditions</span>
              <Switch checked={printSettings.showTerms} onCheckedChange={() => handleToggle("showTerms")} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Show Configured Custom Fields</span>
              <Switch checked={printSettings.showCustomFields} onCheckedChange={() => handleToggle("showCustomFields")} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Live Interactive A4 Preview Panel */}
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-200/70 dark:bg-slate-950">
        {/* Preview Toolbar */}
        <div className="h-11 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-blue-600" />
              Live Interactive A4 Invoice Preview
            </span>
            <Badge variant="secondary" className="text-[10px] px-2 font-mono">
              Theme: {activeThemeMeta.name} ({activeThemeMeta.subtitle})
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.05))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((prev) => Math.min(1.2, prev + 0.05))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-7 text-xs gap-1 ml-2 text-slate-700 dark:text-slate-300"
            >
              <Printer className="h-3.5 w-3.5" /> Print Test
            </Button>
          </div>
        </div>

        {/* Preview Canvas Container */}
        <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="shadow-2xl rounded-sm transition-all"
          >
            {/* The Authentic A4 Document Sheet (794px x 1123px) */}
            <div 
              className={cn(
                "w-[794px] min-h-[1123px] bg-white text-slate-900 p-8 flex flex-col justify-between text-xs select-none",
                // Theme specific root wrapper styles
                printSettings.theme === "gst1" && "border-2 border-slate-900",
                printSettings.theme === "gst2" && "border border-slate-200 font-sans",
                printSettings.theme === "gst3" && "border-2 border-slate-800 font-sans",
                printSettings.theme === "gst4" && "border border-slate-300 font-sans",
                printSettings.theme === "gst5" && "border-2 border-slate-900 font-sans",
                printSettings.theme === "gst6" && "border border-slate-300 font-mono",
                printSettings.theme === "double_divine" && "border border-slate-200 font-sans",
                printSettings.theme === "french_elite" && "border border-slate-200 font-serif bg-[#fdfdfd]"
              )}
            >
              
              <div>
                {/* ========================================================================= */}
                {/* 1. GST 1: STANDARD CLASSIC VYAPAR FORMAT                                  */}
                {/* Full perimeter border, classical boxed header, dual 2-box party details   */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst1" && (
                  <div>
                    {/* Header: Classic Logo + Stacked Info + Boxed Document Title */}
                    <div className="border-b-2 border-slate-900 pb-3 mb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {printSettings.showLogo && business.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={business.logoUrl} alt="Logo" className="max-h-16 max-w-[120px] object-contain" />
                          ) : (
                            <div 
                              className="h-12 w-12 rounded flex items-center justify-center text-white font-black text-lg shrink-0"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {business.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h1 className="text-base font-black uppercase text-slate-900 leading-tight">
                              {business.name}
                            </h1>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {business.address}, {business.city}, {business.state} - {business.pincode}
                            </p>
                            <p className="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                              GSTIN: {business.gstin || "27AABCA1234F1Z5"} | Contact: {business.phone}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div 
                            className="text-lg font-black tracking-wider uppercase inline-block border-2 px-3 py-0.5 rounded-sm"
                            style={{ color: primaryColor, borderColor: primaryColor }}
                          >
                            TAX INVOICE
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1">ORIGINAL FOR RECIPIENT</div>
                          <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                            Invoice No: {business.invoicePrefix || "INV-"}2026-0042
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Invoice Date: 23-Oct-2026
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Party Details: Classic Boxed Dual Compartments */}
                    <div className="grid grid-cols-2 border border-slate-900 divide-x divide-slate-900 mb-4 text-xs">
                      <div className="p-2 space-y-0.5">
                        <div className="text-[10px] font-black uppercase text-slate-800 bg-slate-100 p-1 -m-2 mb-1 border-b border-slate-900">
                          DETAILS OF RECEIVER | BILLED TO:
                        </div>
                        <div className="font-bold text-slate-900 text-xs">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-slate-600 text-[11px]">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                        <div className="font-mono text-[11px] font-bold">GSTIN: 27AABCR9876Q1Z9</div>
                        <div className="text-[11px]">State: Maharashtra (State Code: 27)</div>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="text-[10px] font-black uppercase text-slate-800 bg-slate-100 p-1 -m-2 mb-1 border-b border-slate-900">
                          DETAILS OF CONSIGNEE | SHIPPED TO:
                        </div>
                        <div className="font-bold text-slate-900 text-xs">Reliance Life Sciences Warehouse</div>
                        <div className="text-slate-600 text-[11px]">Plot 14, Logistics Park, Mankoli, Bhiwandi - 421302</div>
                        <div className="font-mono text-[11px]">E-Way Bill: <strong>241289104231</strong></div>
                        <div className="text-[11px]">Vehicle No: <strong>MH-04-AB-1234</strong></div>
                      </div>
                    </div>

                    {/* Items Table: Classical Grid with Solid Cell Borders */}
                    <div className="border border-slate-900 mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 text-[10px] font-black uppercase border-b border-slate-900">
                            <th className="py-2 px-2 w-8 text-center border-r border-slate-900">#</th>
                            <th className="py-2 px-2 border-r border-slate-900">Item Description</th>
                            {printSettings.showHsn && <th className="py-2 px-2 w-16 text-center border-r border-slate-900">HSN</th>}
                            <th className="py-2 px-2 w-12 text-center border-r border-slate-900">Qty</th>
                            <th className="py-2 px-2 w-12 text-center border-r border-slate-900">Unit</th>
                            <th className="py-2 px-2 w-20 text-right border-r border-slate-900">Price/Unit</th>
                            {printSettings.showDiscount && <th className="py-2 px-2 w-14 text-right border-r border-slate-900">Disc</th>}
                            <th className="py-2 px-2 w-20 text-right border-r border-slate-900">Taxable</th>
                            <th className="py-2 px-2 w-24 text-right font-black">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-[11px]">
                          <tr>
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-mono">1</td>
                            <td className="py-2 px-2 border-r border-slate-800">
                              <div className="font-bold text-slate-900">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500">Box of 100 Strips | Batch: BT-2026A</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2 px-2 text-center border-r border-slate-800 font-mono">3004</td>}
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-bold">50</td>
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-medium">BOX</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">{formatINR(250)}</td>
                            {printSettings.showDiscount && <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">0%</td>}
                            <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">{formatINR(12500)}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold">{formatINR(14000)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-mono">2</td>
                            <td className="py-2 px-2 border-r border-slate-800">
                              <div className="font-bold text-slate-900">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500">Pack of 20 Bottles | Batch: AMX-88</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2 px-2 text-center border-r border-slate-800 font-mono">3004</td>}
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-bold">20</td>
                            <td className="py-2 px-2 text-center border-r border-slate-800 font-medium">PACK</td>
                            <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">{formatINR(420)}</td>
                            {printSettings.showDiscount && <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">5%</td>}
                            <td className="py-2 px-2 text-right border-r border-slate-800 font-mono">{formatINR(7980)}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Classic 2-Box Bottom Split (Bank + Terms on Left, Totals on Right) */}
                    <div className="grid grid-cols-2 border border-slate-900 divide-x divide-slate-900 mb-4">
                      {/* Left: Bank Details & Terms */}
                      <div className="p-3 space-y-3">
                        {(printSettings.showBank ?? true) && (
                          <div className="text-[11px] space-y-0.5">
                            <div className="font-bold uppercase text-slate-900 text-[10px] border-b border-slate-300 pb-0.5 mb-1">
                              BANK ACCOUNT DETAILS:
                            </div>
                            <div>Bank: <strong>{business.bankDetails?.bankName || "HDFC Bank"}</strong></div>
                            <div className="font-mono">Account No: <strong>{business.bankDetails?.accountNumber || "50200012345678"}</strong></div>
                            <div className="font-mono">IFSC Code: <strong>{business.bankDetails?.ifsc || "HDFC0001234"}</strong></div>
                            <div className="font-mono">Branch: <strong>Andheri East, Mumbai</strong></div>
                          </div>
                        )}

                        {printSettings.showTerms && (
                          <div className="text-[10px] text-slate-700 border-t border-slate-300 pt-2 space-y-0.5">
                            <div className="font-bold uppercase text-[9px] text-slate-800">TERMS & CONDITIONS:</div>
                            <p className="whitespace-pre-line text-slate-600">
                              {standardTerms.invoiceTerms || standardTerms.invoice || "1. Goods once sold will not be taken back without prior authorization.\n2. Payment is due within 30 days from the invoice date.\n3. Interest @ 18% per annum will be charged on overdue payments."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Totals with Heavy Line Separation */}
                      <div className="p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-700">
                          <span>Sub Total (Taxable Amount):</span>
                          <span className="font-mono font-semibold">{formatINR(20480)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>CGST (6% & 9%):</span>
                          <span className="font-mono">{formatINR(1468.2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>SGST (6% & 9%):</span>
                          <span className="font-mono">{formatINR(1468.2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Round Off:</span>
                          <span className="font-mono text-emerald-700">-₹0.40</span>
                        </div>
                        <div 
                          className="border-t-2 border-b-2 border-slate-900 py-1.5 flex justify-between items-center text-sm font-black"
                          style={{ color: primaryColor }}
                        >
                          <span className="uppercase">Grand Total:</span>
                          <span className="text-base font-mono">{formatINR(23416)}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium pt-1">
                          Amount in Words: INR Twenty Three Thousand Four Hundred Sixteen Only
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. GST 2: MODERN CLEAN BORDERLESS FORMAT                                  */}
                {/* Sleek rounded metadata strip, alternating zebra rows, modern badge total   */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst2" && (
                  <div>
                    {/* Header: Left Brand with accent, Right Floating Pill Tag */}
                    <div className="pb-4 mb-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-black tracking-tight" style={{ color: primaryColor }}>
                            {business.name}
                          </h1>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {business.address}, {business.city}, {business.state} - {business.pincode}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                            GSTIN: <strong>{business.gstin || "27AABCA1234F1Z5"}</strong> • Email: {business.email}
                          </p>
                        </div>

                        <div className="text-right">
                          <span 
                            className="px-3 py-1 rounded-full text-white font-bold text-xs uppercase tracking-wider inline-block shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            TAX INVOICE
                          </span>
                          <div className="font-mono text-sm font-bold text-slate-900 mt-2">
                            #{business.invoicePrefix || "INV-"}2026-0042
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Invoice Date: 23-Oct-2026
                          </div>
                        </div>
                      </div>

                      {/* Modern Metadata Pill Strip */}
                      <div className="mt-3 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] flex justify-between font-medium text-slate-700 dark:text-slate-300">
                        <span>Place of Supply: <strong>Maharashtra (27)</strong></span>
                        <span>Payment Terms: <strong>Net 30 Days</strong></span>
                        <span>Due Date: <strong>22-Nov-2026</strong></span>
                        <span>Reverse Charge: <strong>No</strong></span>
                      </div>
                    </div>

                    {/* Party Details: Modern Borderless Columns with Icon Badges */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <User className="h-3 w-3" /> Billed To (Customer):
                        </div>
                        <div className="font-bold text-slate-900 text-xs">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-[11px] text-slate-600">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                        <div className="text-[11px] font-mono font-semibold text-slate-800">GSTIN: 27AABCR9876Q1Z9</div>
                      </div>
                      <div className="space-y-1 border-l border-slate-200 pl-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Truck className="h-3 w-3" /> Shipping & Logistics:
                        </div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Destination:</span><strong>Bhiwandi Hub</strong></div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">E-Way Bill:</span><strong className="font-mono">241289104231</strong></div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Vehicle No:</span><strong className="font-mono">MH-04-AB-1234</strong></div>
                      </div>
                    </div>

                    {/* Items Table: Borderless Zebra Striped Table */}
                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-2 px-3 w-8">#</th>
                            <th className="py-2 px-3">Item Details</th>
                            {printSettings.showHsn && <th className="py-2 px-3 w-16 text-center">HSN</th>}
                            <th className="py-2 px-3 w-16 text-right">Quantity</th>
                            <th className="py-2 px-3 w-20 text-right">Unit Rate</th>
                            {printSettings.showDiscount && <th className="py-2 px-3 w-16 text-right">Discount</th>}
                            <th className="py-2 px-3 w-20 text-right">Taxable</th>
                            <th className="py-2 px-3 w-24 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">01</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500">Box of 100 Strips | Batch: BT-2026A</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2.5 px-3 text-center font-mono text-slate-600">3004</td>}
                            <td className="py-2.5 px-3 text-right font-bold">50 box</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(250)}</td>
                            {printSettings.showDiscount && <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>}
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(12500)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(14000)}</td>
                          </tr>
                          <tr className="bg-slate-50/60 hover:bg-slate-100/60">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">02</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500">Pack of 20 Bottles | Batch: AMX-88</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2.5 px-3 text-center font-mono text-slate-600">3004</td>}
                            <td className="py-2.5 px-3 text-right font-bold">20 pack</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(420)}</td>
                            {printSettings.showDiscount && <td className="py-2.5 px-3 text-right font-mono text-slate-600">5%</td>}
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(7980)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Section: Floating Modern Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Left: Modern Bank Box with UPI QR */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Bank Remittance
                          </div>
                          <Badge variant="outline" className="text-[9px] font-mono">Instant IMPS / UPI</Badge>
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <div>Bank: <strong>{business.bankDetails?.bankName || "HDFC Bank Ltd"}</strong></div>
                          <div className="font-mono">Account: <strong>{business.bankDetails?.accountNumber || "50200012345678"}</strong></div>
                          <div className="font-mono">IFSC: <strong>{business.bankDetails?.ifsc || "HDFC0001234"}</strong></div>
                        </div>
                        {printSettings.showTerms && (
                          <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                            Terms: Net 30 days. Payment due within agreed credit schedule.
                          </div>
                        )}
                      </div>

                      {/* Right: Modern Pill Grand Total Card */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Sub Total (Taxable):</span>
                          <span className="font-mono font-medium">{formatINR(20480)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>GST (CGST + SGST):</span>
                          <span className="font-mono font-medium">{formatINR(2936.4)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Round Off:</span>
                          <span className="font-mono text-emerald-600">-₹0.40</span>
                        </div>
                        <div 
                          className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black"
                          style={{ color: primaryColor }}
                        >
                          <span className="uppercase tracking-wide">Total Payable:</span>
                          <span className="text-xl font-mono font-black">{formatINR(23416)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic pt-1">
                          Amount in Words: INR Twenty Three Thousand Four Hundred Sixteen Only
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. GST 3: TAX DETAILED FORMAT (ITEM-WISE TAX SPLIT & HSN SUMMARY TABLE)   */}
                {/* Statutory Form GST INV-1 header, individual tax columns, HSN summary box */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst3" && (
                  <div>
                    {/* Header: Form GST INV-1 Statutory Header */}
                    <div className="border-b-2 border-slate-900 pb-3 mb-3">
                      <div className="flex justify-between items-center bg-slate-100 p-1.5 border border-slate-300 mb-2">
                        <span className="font-bold text-[10px]">FORM GST INV-1</span>
                        <span className="font-black text-xs uppercase tracking-wide" style={{ color: primaryColor }}>
                          TAX INVOICE (RULE 46 OF CGST RULES, 2017)
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">TRIPLICATE FOR SUPPLIER</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-base font-bold text-slate-900 uppercase">{business.name}</h2>
                          <div className="text-[11px] text-slate-600">{business.address}, {business.city}</div>
                          <div className="font-mono text-[11px] font-bold text-slate-800">
                            GSTIN: {business.gstin || "27AABCA1234F1Z5"} | State: Maharashtra (27)
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] space-y-0.5 border border-slate-300 p-2 bg-slate-50">
                          <div>Invoice No: <strong>{business.invoicePrefix || "INV-"}2026-0042</strong></div>
                          <div>Dated: <strong>23-Oct-2026</strong></div>
                          <div>Reverse Charge: <strong>No</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Party Details: Statutory Buyer vs Consignee Grid */}
                    <div className="grid grid-cols-2 border border-slate-800 divide-x divide-slate-800 mb-3 text-xs">
                      <div className="p-2 space-y-0.5">
                        <div className="font-bold text-[10px] uppercase text-slate-700">Details of Buyer (Billed To):</div>
                        <div className="font-bold text-slate-900">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-[11px] text-slate-600">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                        <div className="font-mono text-[11px] font-bold">GSTIN/UIN: 27AABCR9876Q1Z9</div>
                        <div className="text-[11px]">State Name: Maharashtra, Code: 27</div>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="font-bold text-[10px] uppercase text-slate-700">Details of Consignee (Shipped To):</div>
                        <div className="font-bold text-slate-900">Reliance Life Sciences Warehouse</div>
                        <div className="text-[11px] text-slate-600">Plot 14, Logistics Park, Mankoli, Bhiwandi - 421302</div>
                        <div className="font-mono text-[11px]">E-Way Bill: <strong>241289104231</strong></div>
                        <div className="text-[11px]">Vehicle Number: <strong>MH-04-AB-1234</strong></div>
                      </div>
                    </div>

                    {/* Table: Dedicated Item-wise Tax Columns */}
                    <div className="border border-slate-900 mb-3 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase text-center border-b border-slate-900">
                            <th className="py-1.5 px-1.5 w-7 border-r border-slate-700">#</th>
                            <th className="py-1.5 px-2 text-left border-r border-slate-700">Description of Goods</th>
                            <th className="py-1.5 px-1 w-12 border-r border-slate-700">HSN</th>
                            <th className="py-1.5 px-1 w-12 border-r border-slate-700">Qty</th>
                            <th className="py-1.5 px-2 w-16 border-r border-slate-700 text-right">Rate</th>
                            <th className="py-1.5 px-2 w-16 border-r border-slate-700 text-right">Taxable</th>
                            <th className="py-1.5 px-1 w-10 border-r border-slate-700 text-right">CGST%</th>
                            <th className="py-1.5 px-2 w-14 border-r border-slate-700 text-right">CGST</th>
                            <th className="py-1.5 px-1 w-10 border-r border-slate-700 text-right">SGST%</th>
                            <th className="py-1.5 px-2 w-14 border-r border-slate-700 text-right">SGST</th>
                            <th className="py-1.5 px-2 w-18 text-right font-black">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 text-[11px]">
                          <tr>
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-mono">01</td>
                            <td className="py-1.5 px-2 border-r border-slate-300">
                              <div className="font-bold text-slate-900">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500">Box of 100 Strips | Batch: BT-2026A</div>
                            </td>
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-mono">3004</td>
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-medium">50 box</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(250)}</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(12500)}</td>
                            <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono">6%</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(750)}</td>
                            <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono">6%</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(750)}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">{formatINR(14000)}</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-mono">02</td>
                            <td className="py-1.5 px-2 border-r border-slate-300">
                              <div className="font-bold text-slate-900">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500">Pack of 20 Bottles | Batch: AMX-88</div>
                            </td>
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-mono">3004</td>
                            <td className="py-1.5 px-1 text-center border-r border-slate-300 font-medium">20 pack</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(420)}</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(7980)}</td>
                            <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono">9%</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(718.2)}</td>
                            <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono">9%</td>
                            <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">{formatINR(718.2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* HSN/SAC Tax Slabs Summary Table (Signature GST 3 Feature) */}
                    <div className="border border-slate-800 mb-3">
                      <div className="bg-slate-100 px-2 py-1 font-bold text-[10px] uppercase border-b border-slate-800">
                        HSN / SAC Wise GST Tax Assessment Summary
                      </div>
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-center font-bold">
                            <th className="py-1 px-2 border-r border-slate-300">HSN/SAC</th>
                            <th className="py-1 px-2 border-r border-slate-300 text-right">Taxable Value</th>
                            <th className="py-1 px-1 border-r border-slate-300">CGST Rate</th>
                            <th className="py-1 px-2 border-r border-slate-300 text-right">CGST Amt</th>
                            <th className="py-1 px-1 border-r border-slate-300">SGST Rate</th>
                            <th className="py-1 px-2 border-r border-slate-300 text-right">SGST Amt</th>
                            <th className="py-1 px-2 text-right">Total Tax Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-center">
                          <tr>
                            <td className="py-1 px-2 border-r border-slate-200">3004</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(12500)}</td>
                            <td className="py-1 px-1 border-r border-slate-200">6.0%</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(750)}</td>
                            <td className="py-1 px-1 border-r border-slate-200">6.0%</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(750)}</td>
                            <td className="py-1 px-2 text-right font-bold">{formatINR(1500)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2 border-r border-slate-200">3004</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(7980)}</td>
                            <td className="py-1 px-1 border-r border-slate-200">9.0%</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(718.2)}</td>
                            <td className="py-1 px-1 border-r border-slate-200">9.0%</td>
                            <td className="py-1 px-2 text-right border-r border-slate-200">{formatINR(718.2)}</td>
                            <td className="py-1 px-2 text-right font-bold">{formatINR(1436.4)}</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold border-t border-slate-300">
                            <td className="py-1 px-2 border-r border-slate-300">Total:</td>
                            <td className="py-1 px-2 text-right border-r border-slate-300">{formatINR(20480)}</td>
                            <td className="py-1 px-1 border-r border-slate-300">—</td>
                            <td className="py-1 px-2 text-right border-r border-slate-300">{formatINR(1468.2)}</td>
                            <td className="py-1 px-1 border-r border-slate-300">—</td>
                            <td className="py-1 px-2 text-right border-r border-slate-300">{formatINR(1468.2)}</td>
                            <td className="py-1 px-2 text-right text-blue-700">{formatINR(2936.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: Settlement Card */}
                    <div className="border border-slate-800 p-2.5 flex justify-between items-center text-xs mb-3">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold">TOTAL INVOICE VALUE (IN WORDS):</div>
                        <div className="font-bold text-slate-900">INR Twenty Three Thousand Four Hundred Sixteen Only</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-bold mr-3">FINAL INVOICE TOTAL:</span>
                        <span className="text-base font-mono font-black" style={{ color: primaryColor }}>
                          {formatINR(23416)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. GST 4: CORPORATE RIBBON & STRUCTURED BOXED GRID FORMAT                 */}
                {/* Full-width colored banner, colored party bars, solid grid cells           */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst4" && (
                  <div>
                    {/* Header: Full-width Solid Colored Corporate Ribbon */}
                    <div className="mb-4 -mx-8 -mt-8">
                      <div 
                        className="px-8 py-4 text-white flex items-center justify-between shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <div>
                          <div className="text-[10px] tracking-widest uppercase opacity-80">CORPORATE TAX INVOICE</div>
                          <h1 className="text-2xl font-black uppercase tracking-wide leading-none mt-1">
                            {business.name}
                          </h1>
                          <div className="text-[11px] opacity-90 mt-1">
                            GSTIN: {business.gstin || "27AABCA1234F1Z5"} | State: Maharashtra (27)
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="px-2.5 py-0.5 rounded bg-white text-slate-900 font-bold text-xs inline-block mb-1 shadow-xs">
                            TAX INVOICE
                          </div>
                          <div className="text-sm font-bold">{business.invoicePrefix || "INV-"}2026-0042</div>
                          <div className="text-xs opacity-90">Dated: 23-Oct-2026</div>
                        </div>
                      </div>
                    </div>

                    {/* Party Details: Corporate Ribbon-Header Boxes */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="border border-slate-300 rounded-md overflow-hidden text-xs">
                        <div 
                          className="px-2.5 py-1 text-white text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Invoice To (Client):
                        </div>
                        <div className="p-2.5 space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs">Reliance Life Sciences Pvt Ltd</div>
                          <div className="text-slate-600 text-[11px]">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                          <div className="font-mono text-[11px] font-bold text-slate-800">GSTIN: 27AABCR9876Q1Z9</div>
                        </div>
                      </div>
                      <div className="border border-slate-300 rounded-md overflow-hidden text-xs">
                        <div className="px-2.5 py-1 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                          Deliver To (Consignee):
                        </div>
                        <div className="p-2.5 space-y-0.5 text-[11px]">
                          <div className="flex justify-between"><span className="text-slate-500">Destination:</span><strong>Bhiwandi Hub</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">E-Way Bill:</span><strong className="font-mono">241289104231</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Vehicle No:</span><strong className="font-mono">MH-04-AB-1234</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Table: Crisp Grid Boundaries around every cell */}
                    <div className="border border-slate-300 rounded-md overflow-hidden mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-2 px-2.5 w-8 border-r border-slate-700">#</th>
                            <th className="py-2 px-2.5 border-r border-slate-700">Description of Goods</th>
                            {printSettings.showHsn && <th className="py-2 px-2 w-16 text-center border-r border-slate-700">HSN</th>}
                            <th className="py-2 px-2 w-16 text-right border-r border-slate-700">Qty</th>
                            <th className="py-2 px-2 w-20 text-right border-r border-slate-700">Unit Price</th>
                            <th className="py-2 px-2 w-20 text-right border-r border-slate-700">Taxable</th>
                            <th className="py-2 px-2 w-24 text-right">Net Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 text-[11px]">
                          <tr className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-center">01</td>
                            <td className="py-2 px-2.5 border-r border-slate-300">
                              <div className="font-bold text-slate-900">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500">Box of 100 Strips | Batch: BT-2026A</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">3004</td>}
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-medium">50 box</td>
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(250)}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(12500)}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{formatINR(14000)}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/50">
                            <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-center">02</td>
                            <td className="py-2 px-2.5 border-r border-slate-300">
                              <div className="font-bold text-slate-900">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500">Pack of 20 Bottles | Batch: AMX-88</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">3004</td>}
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-medium">20 pack</td>
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(420)}</td>
                            <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(7980)}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: 3-Column Structured Corporate Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {/* Col 1: Remittance Details */}
                      <div className="border border-slate-300 rounded p-2.5 text-[11px] space-y-1 bg-slate-50">
                        <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-200 pb-0.5">
                          Remittance Wire Info
                        </div>
                        <div>Bank: <strong>{business.bankDetails?.bankName || "HDFC Bank Ltd"}</strong></div>
                        <div className="font-mono">A/C: <strong>{business.bankDetails?.accountNumber || "50200012345678"}</strong></div>
                        <div className="font-mono">IFSC: <strong>{business.bankDetails?.ifsc || "HDFC0001234"}</strong></div>
                      </div>

                      {/* Col 2: Terms Summary */}
                      <div className="border border-slate-300 rounded p-2.5 text-[10px] text-slate-600 bg-slate-50">
                        <div className="font-bold uppercase text-[9px] text-slate-700 border-b border-slate-200 pb-0.5 mb-1">
                          Commercial Terms
                        </div>
                        <p className="line-clamp-4 leading-tight">
                          {standardTerms.invoiceTerms || standardTerms.invoice || "Payment due within 30 days. Interest applicable on overdue amounts. Subject to Mumbai jurisdiction."}
                        </p>
                      </div>

                      {/* Col 3: Corporate Summary with Colored Banner Total */}
                      <div className="border border-slate-300 rounded overflow-hidden text-xs">
                        <div className="p-2 space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-mono">{formatINR(20480)}</span></div>
                          <div className="flex justify-between text-slate-600"><span>Total Tax:</span><span className="font-mono">{formatINR(2936.4)}</span></div>
                          <div className="flex justify-between text-slate-600"><span>Round Off:</span><span className="font-mono">-₹0.40</span></div>
                        </div>
                        <div 
                          className="px-2.5 py-1.5 text-white flex justify-between items-center font-bold text-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span className="uppercase tracking-wider">Amount Due:</span>
                          <span className="font-mono text-sm">{formatINR(23416)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 5. GST 5: SERVICE & DESCRIPTION-FOCUSED (4-QUADRANT BOXED MATRIX)          */}
                {/* 4-quadrant header, wide particulars column for scope/services/milestones  */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst5" && (
                  <div>
                    {/* Header: 4-Quadrant Boxed Matrix */}
                    <div className="border-2 border-slate-900 mb-4 divide-y-2 divide-slate-900 text-xs">
                      <div className="p-1 bg-slate-100 font-black text-center uppercase tracking-widest text-xs">
                        TAX INVOICE (SERVICE & PRODUCT FULFILLMENT)
                      </div>
                      <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
                        {/* Quad 1: Seller Details */}
                        <div className="p-2.5 space-y-0.5">
                          <div className="text-[10px] font-black uppercase text-slate-500">1. SUPPLIER / SERVICE PROVIDER:</div>
                          <div className="font-bold text-xs text-slate-900">{business.name}</div>
                          <div className="text-[11px] text-slate-600">{business.address}, {business.city}</div>
                          <div className="font-mono text-[11px] font-bold">GSTIN: {business.gstin || "27AABCA1234F1Z5"}</div>
                        </div>
                        {/* Quad 2: Invoice Info */}
                        <div className="p-2.5 space-y-0.5 font-mono text-[11px]">
                          <div className="text-[10px] font-black uppercase text-slate-500 font-sans">2. DOCUMENT IDENTIFIER:</div>
                          <div>Invoice No: <strong>{business.invoicePrefix || "INV-"}2026-0042</strong></div>
                          <div>Invoice Date: <strong>23-Oct-2026</strong></div>
                          <div>Place of Supply: <strong>27 - Maharashtra</strong></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
                        {/* Quad 3: Client Details */}
                        <div className="p-2.5 space-y-0.5">
                          <div className="text-[10px] font-black uppercase text-slate-500">3. CLIENT / BILLED ENTITY:</div>
                          <div className="font-bold text-xs text-slate-900">Reliance Life Sciences Pvt Ltd</div>
                          <div className="text-[11px] text-slate-600">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                          <div className="font-mono text-[11px] font-bold">GSTIN: 27AABCR9876Q1Z9</div>
                        </div>
                        {/* Quad 4: Project Site / Delivery */}
                        <div className="p-2.5 space-y-0.5 text-[11px]">
                          <div className="text-[10px] font-black uppercase text-slate-500">4. WORKSITE / DELIVERY LOCATION:</div>
                          <div>Site: <strong>Bhiwandi Central Facility</strong></div>
                          <div>Vehicle No: <strong className="font-mono">MH-04-AB-1234</strong></div>
                          <div>E-Way Bill: <strong className="font-mono">241289104231</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Table: Extra-Wide Description Column (55% width) */}
                    <div className="border border-slate-900 mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 text-[10px] font-black uppercase border-b border-slate-900">
                            <th className="py-2 px-2.5 w-8 text-center border-r border-slate-900">#</th>
                            <th className="py-2 px-2.5 w-72 border-r border-slate-900">Service Particulars & Detailed Specifications</th>
                            <th className="py-2 px-2 w-16 text-center border-r border-slate-900">SAC/HSN</th>
                            <th className="py-2 px-2 w-16 text-center border-r border-slate-900">Qty/Units</th>
                            <th className="py-2 px-2 w-20 text-right border-r border-slate-900">Rate (₹)</th>
                            <th className="py-2 px-2 w-24 text-right font-black">Net Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-[11px]">
                          <tr>
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-mono">1</td>
                            <td className="py-2.5 px-2.5 border-r border-slate-800">
                              <div className="font-bold text-slate-900">Pharmaceutical Formulation & Dispensing Services</div>
                              <div className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                                High-precision standard compounding, lot quality testing, certified cleanroom packaging, and cold-chain compliance. Batch ref: BT-2026A.
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-mono">9988</td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-medium">50 Units</td>
                            <td className="py-2.5 px-2 text-right border-r border-slate-800 font-mono">{formatINR(250)}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold">{formatINR(14000)}</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-mono">2</td>
                            <td className="py-2.5 px-2.5 border-r border-slate-800">
                              <div className="font-bold text-slate-900">Antibiotic Encapsulation & Lab Testing Assay</div>
                              <div className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                                Standard assay potency testing, dissolution verification, nitrogen flushed blister seals, and COA documentation. Batch: AMX-88.
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-mono">9988</td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-800 font-medium">20 Units</td>
                            <td className="py-2.5 px-2 text-right border-r border-slate-800 font-mono">{formatINR(420)}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: Milestone Settlement & Sign-off Block */}
                    <div className="grid grid-cols-2 border border-slate-900 divide-x border-slate-900 mb-4 text-xs">
                      <div className="p-3 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Service Terms & Remittance:</div>
                        <div className="text-[11px]">Bank: <strong>{business.bankDetails?.bankName || "HDFC Bank"}</strong> • A/C: <strong className="font-mono">{business.bankDetails?.accountNumber || "50200012345678"}</strong></div>
                        <div className="text-[10px] text-slate-500 italic pt-1">
                          Work executed as per scope agreement. Acceptance deemed within 7 business days of delivery.
                        </div>
                      </div>
                      <div className="p-3 text-right space-y-1">
                        <div className="text-slate-600 text-xs">Total Taxable Value: <strong className="font-mono">{formatINR(20480)}</strong></div>
                        <div className="text-slate-600 text-xs">Total GST (18% Avg): <strong className="font-mono">{formatINR(2936.4)}</strong></div>
                        <div className="text-base font-black pt-1" style={{ color: primaryColor }}>
                          Grand Total: <span className="font-mono">{formatINR(23416)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 6. GST 6: TECH PRO / DIGITAL E-INVOICE & DYNAMIC QR FORMAT                */}
                {/* Top dynamic QR code, 64-char IRN barcode simulation, digital cert badge   */}
                {/* ========================================================================= */}
                {printSettings.theme === "gst6" && (
                  <div>
                    {/* Top IRN / E-Invoice Digital Authentication Header */}
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-4 bg-slate-50/70 font-mono text-[10px] space-y-1">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          GOVERNMENT E-INVOICE PORTAL VALIDATED (NIC / GSTN)
                        </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ACTIVE E-INVOICE
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[9px] pt-0.5">
                        <span className="truncate max-w-[420px]">
                          IRN: <strong>88f9b4c02187e14a298104df1e2891901a88b488ef991048bc028198f82910a4</strong>
                        </span>
                        <span>Ack No: <strong>122610482910</strong> | 23-Oct-2026</span>
                      </div>
                    </div>

                    {/* Main Tech Header: Left Identity, Right Big Scannable UPI QR Box */}
                    <div className="flex items-start justify-between border-b border-slate-300 pb-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                            TAX INVOICE
                          </span>
                          <span className="text-[10px] text-blue-600 font-bold font-mono">
                            B2B_REGULAR_SUPPLY
                          </span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                          {business.name}
                        </h1>
                        <p className="text-[11px] text-slate-500 font-mono">
                          GSTIN: {business.gstin || "27AABCA1234F1Z5"} | PAN: {business.pan || "AABCA1234F"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Invoice ID: <strong className="text-slate-800">{business.invoicePrefix || "INV-"}2026-0042</strong> | Dated: 23-10-2026
                        </p>
                      </div>

                      {/* Prominent Payment QR Header Box */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-300 bg-white shadow-xs">
                        <div className="text-right">
                          <div className="text-[9px] font-bold uppercase text-slate-500 font-mono">Dynamic UPI QR</div>
                          <div className="text-sm font-mono font-bold" style={{ color: primaryColor }}>₹23,416.00</div>
                          <div className="text-[9px] font-mono text-slate-400">{business.bankDetails?.upiId || "apex@okaxis"}</div>
                          <div className="text-[8px] text-emerald-600 font-bold mt-0.5">Scan with GPay / PhonePe</div>
                        </div>
                        <div className="h-14 w-14 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                          <QrCode className="h-11 w-11 text-slate-900" />
                        </div>
                      </div>
                    </div>

                    {/* Party Details: Tech Card with Verified Badge */}
                    <div className="grid grid-cols-2 gap-4 mb-4 font-mono text-xs">
                      <div className="p-3 rounded-lg border border-slate-300 bg-slate-50/50 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> RECIPIENT_ENTITY:
                        </div>
                        <div className="font-bold text-slate-900">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-[10px] text-slate-600">MIDC Rabale, Navi Mumbai, MH - 400701</div>
                        <div className="text-[11px] font-bold text-blue-700">GSTIN: 27AABCR9876Q1Z9 [VALID ✓]</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-300 bg-slate-50/50 space-y-0.5 text-[11px]">
                        <div className="text-[10px] font-bold uppercase text-slate-400">LOGISTICS_DISPATCH:</div>
                        <div>POS: <strong>27-MAHARASHTRA</strong></div>
                        <div>E-Way Bill: <strong className="text-slate-900">241289104231</strong></div>
                        <div>Vehicle No: <strong className="text-slate-900">MH-04-AB-1234</strong></div>
                      </div>
                    </div>

                    {/* Table: Monospace Tech Table */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 font-mono text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase">
                            <th className="py-2 px-2.5 w-8">#</th>
                            <th className="py-2 px-2.5">LINE_ITEM_DESCRIPTION</th>
                            <th className="py-2 px-2 text-center w-16">HSN</th>
                            <th className="py-2 px-2 text-right w-16">QTY</th>
                            <th className="py-2 px-2 text-right w-20">RATE</th>
                            <th className="py-2 px-2 text-right w-20">TAXABLE</th>
                            <th className="py-2 px-2.5 text-right w-24">NET_VAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          <tr>
                            <td className="py-2 px-2.5 text-slate-400">01</td>
                            <td className="py-2 px-2.5 font-sans">
                              <span className="font-bold text-slate-900">Paracetamol 500mg Tablets</span>
                              <span className="text-[10px] text-slate-500 font-mono block">BATCH: BT-2026A | EXP: 09/2028</span>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600">3004</td>
                            <td className="py-2 px-2 text-right font-bold">50.00</td>
                            <td className="py-2 px-2 text-right">{formatINR(250)}</td>
                            <td className="py-2 px-2 text-right">{formatINR(12500)}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">{formatINR(14000)}</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-2 px-2.5 text-slate-400">02</td>
                            <td className="py-2 px-2.5 font-sans">
                              <span className="font-bold text-slate-900">Amoxicillin 250mg Capsules</span>
                              <span className="text-[10px] text-slate-500 font-mono block">BATCH: AMX-88 | EXP: 11/2028</span>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600">3004</td>
                            <td className="py-2 px-2 text-right font-bold">20.00</td>
                            <td className="py-2 px-2 text-right">{formatINR(420)}</td>
                            <td className="py-2 px-2 text-right">{formatINR(7980)}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: Monospace Financial Summary Card */}
                    <div className="grid grid-cols-2 gap-4 mb-4 font-mono text-xs">
                      <div className="p-3 rounded-lg border border-slate-300 bg-slate-50/50 space-y-1 text-[11px]">
                        <div className="font-bold text-slate-800">DIGITAL_AUDIT_TRAIL:</div>
                        <div>Certified by: <strong>Apex Store Digital Signer v2.4</strong></div>
                        <div className="text-emerald-700 font-bold">SHA-256 Hash Verified ✓</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-300 bg-white space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600"><span>TAXABLE_TOTAL:</span><span>{formatINR(20480)}</span></div>
                        <div className="flex justify-between text-slate-600"><span>TOTAL_GST:</span><span>{formatINR(2936.4)}</span></div>
                        <div className="flex justify-between text-slate-600"><span>ROUND_OFF:</span><span>-₹0.40</span></div>
                        <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-sm text-slate-900">
                          <span>FINAL_AMOUNT:</span>
                          <span style={{ color: primaryColor }}>{formatINR(23416)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 7. DOUBLE DIVINE: VYAPAR FLAGSHIP SIGNATURE DUAL-TONE FORMAT              */}
                {/* Two-tone header bar, rounded card containers, double-bordered total box   */}
                {/* ========================================================================= */}
                {printSettings.theme === "double_divine" && (
                  <div>
                    {/* The Signature Double Divine Dual-Color Header Strip */}
                    <div className="flex h-12 rounded-t-xl overflow-hidden shadow-xs mb-3 text-white">
                      <div 
                        className="flex-1 px-4 flex items-center justify-between font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span className="text-sm uppercase tracking-wider font-black">
                          {business.name}
                        </span>
                        <span className="text-xs opacity-90 font-mono">
                          GSTIN: {business.gstin || "27AABCA1234F1Z5"}
                        </span>
                      </div>
                      <div className="w-52 bg-slate-900 px-4 flex items-center justify-center font-black tracking-widest text-xs uppercase">
                        TAX INVOICE
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 px-1 mb-4">
                      <span>{business.address}, {business.city}, {business.state}</span>
                      <span className="font-mono font-bold text-slate-800">
                        Invoice No: {business.invoicePrefix || "INV-"}2026-0042 • 23-Oct-2026
                      </span>
                    </div>

                    {/* Double Divine Rounded Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>
                          BILLED TO (CUSTOMER):
                        </div>
                        <div className="font-bold text-xs text-slate-900">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-[11px] text-slate-600">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                        <div className="font-mono text-[11px] font-bold text-slate-800">GSTIN: 27AABCR9876Q1Z9</div>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                          DISPATCH & LOGISTICS:
                        </div>
                        <div className="text-[11px] flex justify-between"><span className="text-slate-500">Destination:</span><strong>Bhiwandi Hub</strong></div>
                        <div className="text-[11px] flex justify-between"><span className="text-slate-500">E-Way Bill:</span><strong className="font-mono">241289104231</strong></div>
                        <div className="text-[11px] flex justify-between"><span className="text-slate-500">Vehicle No:</span><strong className="font-mono">MH-04-AB-1234</strong></div>
                      </div>
                    </div>

                    {/* Double Divine Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr 
                            className="text-white text-[11px] font-bold uppercase"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <th className="py-2.5 px-3 w-8">#</th>
                            <th className="py-2.5 px-3">Item Description</th>
                            {printSettings.showHsn && <th className="py-2.5 px-3 w-16 text-center">HSN</th>}
                            <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                            <th className="py-2.5 px-3 w-20 text-right">Rate</th>
                            {printSettings.showDiscount && <th className="py-2.5 px-3 w-16 text-right">Disc</th>}
                            <th className="py-2.5 px-3 w-20 text-right">Taxable</th>
                            <th className="py-2.5 px-3 w-24 text-right font-black">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">01</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500">Box of 100 Strips | Batch: BT-2026A</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2.5 px-3 text-center font-mono text-slate-600">3004</td>}
                            <td className="py-2.5 px-3 text-right font-bold">50 box</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(250)}</td>
                            {printSettings.showDiscount && <td className="py-2.5 px-3 text-right font-mono text-slate-400">0%</td>}
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(12500)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(14000)}</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">02</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500">Pack of 20 Bottles | Batch: AMX-88</div>
                            </td>
                            {printSettings.showHsn && <td className="py-2.5 px-3 text-center font-mono text-slate-600">3004</td>}
                            <td className="py-2.5 px-3 text-right font-bold">20 pack</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(420)}</td>
                            {printSettings.showDiscount && <td className="py-2.5 px-3 text-right font-mono text-slate-600">5%</td>}
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(7980)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Double Divine Signature Luxury Total Card with border-4 border-double */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Left: Decorative Bank Box */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                          OFFICIAL BANK & PAYMENT CHANNEL
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <div>Bank: <strong>{business.bankDetails?.bankName || "HDFC Bank"}</strong></div>
                          <div className="font-mono">Account No: <strong>{business.bankDetails?.accountNumber || "50200012345678"}</strong></div>
                          <div className="font-mono">IFSC Code: <strong>{business.bankDetails?.ifsc || "HDFC0001234"}</strong></div>
                        </div>
                      </div>

                      {/* Right: Signature Double-Bordered Luxury Box */}
                      <div 
                        className="p-3.5 rounded-xl border-4 border-double bg-slate-50/80 space-y-1.5"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Taxable Subtotal:</span>
                          <span className="font-mono font-semibold">{formatINR(20480)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Total GST (CGST+SGST):</span>
                          <span className="font-mono font-semibold">{formatINR(2936.4)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>Round Off:</span>
                          <span className="font-mono text-emerald-600">-₹0.40</span>
                        </div>
                        <div 
                          className="pt-2 border-t-2 flex justify-between items-center font-black"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          <span className="text-sm uppercase tracking-wide">Grand Total:</span>
                          <span className="text-lg font-mono">{formatINR(23416)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 italic pt-0.5">
                          INR Twenty Three Thousand Four Hundred Sixteen Only
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 8. FRENCH ELITE: BOUTIQUE LUXURY EDITORIAL FORMAT                          */}
                {/* Centered flourishes, luxury serif, borderless table, editorial totals     */}
                {/* ========================================================================= */}
                {printSettings.theme === "french_elite" && (
                  <div>
                    {/* Header: Centered Parisian Luxury Flourish */}
                    <div className="text-center pb-6 mb-6 border-b border-slate-300 font-serif">
                      <div className="text-[10px] tracking-[0.35em] uppercase text-slate-400 font-medium">
                        — Commercial Billing Memo —
                      </div>
                      <h1 className="text-3xl font-normal tracking-wide text-slate-900 mt-1">
                        {business.name}
                      </h1>
                      <div className="text-xs text-slate-500 italic mt-1 font-serif">
                        {business.address}, {business.city}, {business.state}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wider">
                        GSTIN: {business.gstin || "27AABCA1234F1Z5"}
                      </div>

                      <div className="flex justify-between items-center text-xs font-sans mt-4 pt-3 border-t border-slate-200 text-slate-600">
                        <span>Invoice Ref: <strong className="font-mono text-slate-900">{business.invoicePrefix || "INV-"}2026-0042</strong></span>
                        <span className="font-serif italic text-sm" style={{ color: primaryColor }}>Original For Recipient</span>
                        <span>Dated: <strong>23rd October 2026</strong></span>
                      </div>
                    </div>

                    {/* Party Details: Editorial Minimalist Layout */}
                    <div className="grid grid-cols-2 gap-6 mb-5 font-serif text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-sans">Client / Billed To</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">Reliance Life Sciences Pvt Ltd</div>
                        <div className="text-slate-600 text-[11px] mt-0.5">R-282, TTC Industrial Area, MIDC Rabale, Navi Mumbai</div>
                        <div className="font-mono text-[10px] text-slate-500 font-sans mt-1">GSTIN: 27AABCR9876Q1Z9</div>
                      </div>
                      <div className="text-right font-sans">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Consignee & Supply</div>
                        <div className="text-[11px] text-slate-700 mt-0.5">Place of Supply: <strong>Maharashtra (27)</strong></div>
                        <div className="text-[11px] text-slate-700">Vehicle No: <strong className="font-mono">MH-04-AB-1234</strong></div>
                        <div className="text-[11px] text-slate-700">Due Date: <strong>07-Nov-2026</strong></div>
                      </div>
                    </div>

                    {/* Table: Delicate Hairline Editorial Table */}
                    <div className="mb-5">
                      <table className="w-full text-left text-xs font-sans border-b border-slate-300">
                        <thead>
                          <tr className="border-t border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-800">
                            <th className="py-2.5 px-2 w-8">#</th>
                            <th className="py-2.5 px-2">Item & Description</th>
                            {printSettings.showHsn && <th className="py-2.5 px-2 w-20 text-center">HSN</th>}
                            <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                            <th className="py-2.5 px-2 w-20 text-right">Unit Rate</th>
                            <th className="py-2.5 px-2 w-20 text-right">Taxable</th>
                            <th className="py-2.5 px-2 w-20 text-right">GST</th>
                            <th className="py-2.5 px-2 w-24 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="py-3 px-2 font-serif text-slate-400">1.</td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-slate-900 font-serif text-sm">Paracetamol 500mg Tablets</div>
                              <div className="text-[10px] text-slate-500 italic font-serif">Box of 100 Strips • Batch BT-2026A</div>
                            </td>
                            {printSettings.showHsn && <td className="py-3 px-2 font-mono text-center text-slate-500">3004</td>}
                            <td className="py-3 px-2 text-center font-medium">50 box</td>
                            <td className="py-3 px-2 text-right font-mono">{formatINR(250)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatINR(12500)}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-500">12%</td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{formatINR(14000)}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 font-serif text-slate-400">2.</td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-slate-900 font-serif text-sm">Amoxicillin 250mg Capsules</div>
                              <div className="text-[10px] text-slate-500 italic font-serif">Pack of 20 Bottles • Batch AMX-88</div>
                            </td>
                            {printSettings.showHsn && <td className="py-3 px-2 font-mono text-center text-slate-500">3004</td>}
                            <td className="py-3 px-2 text-center font-medium">20 pack</td>
                            <td className="py-3 px-2 text-right font-mono">{formatINR(420)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatINR(7980)}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-500">18%</td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{formatINR(9416.4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom: French Elite Editorial Summary */}
                    <div className="flex justify-end mb-4">
                      <div className="w-80 p-4 bg-white border-t-2 border-b-2 border-slate-900 space-y-1.5 font-serif">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Taxable Value:</span>
                          <span className="font-mono">{formatINR(20480)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Tax Assessment:</span>
                          <span className="font-mono">{formatINR(2936.4)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Adjustment:</span>
                          <span className="font-mono">-₹0.40</span>
                        </div>
                        <div 
                          className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-base font-bold"
                          style={{ color: primaryColor }}
                        >
                          <span className="tracking-wide">Total Payable:</span>
                          <span className="text-xl font-mono">{formatINR(23416)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 italic pt-1 font-serif">
                          Twenty Three Thousand Four Hundred Sixteen Rupees Only
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== GLOBAL TERMS & CONDITIONS ==================== */}
                {printSettings.showTerms && printSettings.theme !== "gst1" && (
                  <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-600 space-y-1">
                    <div className="font-bold uppercase tracking-wider text-slate-500">Terms & Conditions:</div>
                    <p className="leading-relaxed whitespace-pre-line text-slate-500">
                      {standardTerms.invoiceTerms || standardTerms.invoice || "1. Goods once sold will not be taken back or exchanged.\n2. Payment terms 30 days from date of invoice.\n3. Subject to local jurisdiction only."}
                    </p>
                  </div>
                )}
              </div>

              {/* ==================== BOTTOM FOOTER / SIGNATORY ==================== */}
              <div className="border-t border-slate-200 pt-4 flex items-end justify-between text-xs mt-4">
                <div className="text-[10px] text-slate-400">
                  {printSettings.theme === "gst6" ? (
                    <span className="font-mono text-emerald-700 flex items-center gap-1 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Digitally Validated Cryptographic e-Invoice
                    </span>
                  ) : printSettings.theme === "french_elite" ? (
                    <span className="italic font-serif text-slate-400 text-xs">
                      Thank you for your valued patronage.
                    </span>
                  ) : (
                    "This is a computer-generated tax invoice. No physical seal required."
                  )}
                </div>

                {printSettings.showSignature && (
                  <div className="text-center space-y-1">
                    {business.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.signatureUrl} alt="Signature" className="max-h-12 mx-auto object-contain" />
                    ) : (
                      <div className="h-10 border-b border-dashed border-slate-300 w-36 mx-auto" />
                    )}
                    <div className="font-bold text-slate-800 text-[11px]">
                      For {business.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Authorized Signatory
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

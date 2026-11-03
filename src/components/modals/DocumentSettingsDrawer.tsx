"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { 
  DocumentSettings, 
  DEFAULT_DOCUMENT_SETTINGS, 
  DocumentSequenceType, 
  ItemFieldToggles, 
  FormCustomFieldDocType,
  FormPrintSettings,
  DEFAULT_FORM_PRINT_SETTINGS_BASE,
  DEFAULT_FORM_PRINT_SETTINGS_MAP
} from "@/types/inventory"
import { DocumentPrefixSuffixDrawer } from "./DocumentPrefixSuffixDrawer"
import { DocumentTemplatesModal } from "./DocumentTemplatesModal"
import { DocumentCustomFieldsDrawer } from "./DocumentCustomFieldsDrawer"
import { DocumentNotesTermsDrawer } from "./DocumentNotesTermsDrawer"
import { AddCustomColumnModal } from "./AddCustomColumnModal"
import { 
  X, 
  Search, 
  FileText, 
  Sliders, 
  Hash, 
  Check, 
  RotateCcw, 
  Heart, 
  Layers, 
  FileCheck2, 
  Building2, 
  QrCode, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Package,
  Plus,
  Printer,
  Columns,
  Trash2
} from "lucide-react"

interface DocumentSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType?: DocumentSequenceType | "item" | "note" | "purchase_bill" | "general" | string
}

interface SettingOptionConfig {
  key: keyof DocumentSettings
  title: string
  description: string
  category: "general" | "items" | "summary" | "compliance"
}

interface ItemSettingOptionConfig {
  key: keyof ItemFieldToggles
  title: string
  description: string
  category: "identification" | "pricing" | "inventory" | "details"
}

const ITEM_SETTING_OPTIONS: ItemSettingOptionConfig[] = [
  // Identification & Classification
  {
    key: "barcode",
    title: "Item Code / Barcode",
    description: "Custom alphanumeric barcode and 1D/2D barcode generation button.",
    category: "identification"
  },
  {
    key: "sku",
    title: "SKU (Stock Keeping Unit)",
    description: "Internal warehouse SKU identifier for sorting, picking and stock lookup.",
    category: "identification"
  },
  {
    key: "category",
    title: "Category & Grouping",
    description: "Classification category dropdown and custom category creator.",
    category: "identification"
  },
  {
    key: "hsn",
    title: "HSN / SAC Code & Tax Rate",
    description: "Official Indian GST classification code and tax slab percentage selector.",
    category: "identification"
  },
  {
    key: "images",
    title: "Product Images & Media Gallery",
    description: "Multi-image drag-and-drop file uploader and gallery thumbnails.",
    category: "identification"
  },

  // Pricing & Commercial
  {
    key: "wholesale",
    title: "Wholesale Information",
    description: "Tiered bulk wholesale pricing and minimum order quantity thresholds.",
    category: "pricing"
  },
  {
    key: "mrp",
    title: "Maximum Retail Price (MRP)",
    description: "Consumer retail price ceiling and tax assessment price fields.",
    category: "pricing"
  },
  {
    key: "purchasePrice",
    title: "Purchase & Cost Information",
    description: "Cost of goods sold (COGS), supplier account, and vendor procurement rate.",
    category: "pricing"
  },
  {
    key: "description",
    title: "Sales & Purchase Descriptions",
    description: "Multi-line specification textareas automatically printed on invoices.",
    category: "details"
  },

  // Inventory & Operations
  {
    key: "inventoryTracking",
    title: "Track Inventory & Stock Tab",
    description: "Opening stock quantities, reorder points, and godown warehouse allocations.",
    category: "inventory"
  },
  {
    key: "batchTracking",
    title: "Batch & Expiry Date Tracking",
    description: "Pharma/food lot batch tracking with manufacturing and expiry dates.",
    category: "inventory"
  },
  {
    key: "manufacturing",
    title: "Manufacturing & BOM Tab",
    description: "Bill of materials recipe builder, raw material inputs, and job work.",
    category: "inventory"
  }
]

const SETTING_OPTIONS: SettingOptionConfig[] = [
  // General Header details
  {
    key: "showOrderNumber",
    title: "Show Order / PO Number",
    description: "Customer purchase order or internal reference number on header.",
    category: "general"
  },
  {
    key: "showPaymentTerms",
    title: "Show Due Date & Terms",
    description: "Agreed credit terms (e.g., Net 30) and calculated due date.",
    category: "general"
  },
  {
    key: "showPlaceOfSupply",
    title: "Show Place of Supply",
    description: "Destination state determining CGST/SGST vs IGST taxation.",
    category: "general"
  },
  {
    key: "showSalesperson",
    title: "Show Salesperson",
    description: "Assign sales representative or field agent on transaction.",
    category: "general"
  },

  // Item details table
  {
    key: "showItemDescription",
    title: "Show Product Description",
    description: "Additional multi-line item descriptions under product titles.",
    category: "items"
  },
  {
    key: "showDiscount",
    title: "Show Item Discounts",
    description: "Percentage and amount discount columns on line items.",
    category: "items"
  },
  {
    key: "showHsn",
    title: "Show HSN / SAC Code",
    description: "Tax classification code column on line items.",
    category: "items"
  },
  {
    key: "showBarcodeScan",
    title: "Show Barcode Scan Action",
    description: "Quick camera barcode scanner and code lookup button.",
    category: "items"
  },

  // Totals & Calculations
  {
    key: "showRoundOff",
    title: "Show Round Off",
    description: "Mathematical fractional rounding adjustment on grand total.",
    category: "summary"
  },
  {
    key: "showAdditionalCharges",
    title: "Show Additional Charges",
    description: "Packaging, freight, courier, and delivery adjustments.",
    category: "summary"
  },
  {
    key: "showCreditToggle",
    title: "Show Sale on Credit",
    description: "Toggle between immediate payment and party ledger credit.",
    category: "summary"
  },
  {
    key: "showAdvancePayment",
    title: "Show Advance Payment",
    description: "Record advance payments or deposits collected on creation.",
    category: "summary"
  },
  {
    key: "showWithholdingTax",
    title: "Show TDS / TCS Withholding",
    description: "Income tax deduction and collection at source sections.",
    category: "summary"
  },

  // Footer & Compliance
  {
    key: "showCustomerNotes",
    title: "Show Customer Notes",
    description: "Personalized remarks and instructions to the party.",
    category: "compliance"
  },
  {
    key: "showTermsConditions",
    title: "Show Terms & Conditions",
    description: "Standard business legal terms, return policy, and jurisdiction.",
    category: "compliance"
  },
  {
    key: "showLogo",
    title: "Show Company Logo",
    description: "Display organization brand logo on document copies.",
    category: "compliance"
  },
  {
    key: "showSignature",
    title: "Show Authorized Signature",
    description: "Official signatory stamp and sign-off box at footer.",
    category: "compliance"
  },
  {
    key: "showBankDetails",
    title: "Show Bank Details & UPI QR",
    description: "Bank account numbers, IFSC code, and dynamic UPI QR code.",
    category: "compliance"
  }
]

interface PrintSettingOptionConfig {
  key: keyof FormPrintSettings
  title: string
  description: string
  category: "header" | "meta" | "items" | "totals" | "footer"
}

const FORM_PRINT_SETTING_OPTIONS: PrintSettingOptionConfig[] = [
  // Header & Brand
  {
    key: "showLogo",
    title: "Show Company Logo on Print",
    description: "Print organization brand logo on the paper document header.",
    category: "header"
  },
  {
    key: "showBusinessContact",
    title: "Show Business Phone & Email",
    description: "Print official contact phone, email, and website on header.",
    category: "header"
  },
  {
    key: "showGstin",
    title: "Show GSTIN & State Code",
    description: "Print statutory 15-digit GSTIN and state identification number on paper copy.",
    category: "header"
  },
  {
    key: "showDispatchAddress",
    title: "Show Dispatch / Warehouse Location",
    description: "Print warehouse godown name and physical dispatch address on printout.",
    category: "header"
  },

  // Document & Party Meta
  {
    key: "showOrderNumber",
    title: "Show Order / PO Reference",
    description: "Print buyer purchase order number and PO reference date on document header.",
    category: "meta"
  },
  {
    key: "showDueDateAndTerms",
    title: "Show Due Date & Credit Terms",
    description: "Print agreed payment terms and statutory payment due date on paper print.",
    category: "meta"
  },
  {
    key: "showPlaceOfSupply",
    title: "Show Place of Supply",
    description: "Print destination state name and 2-digit GST state code on paper invoice.",
    category: "meta"
  },
  {
    key: "showSalesperson",
    title: "Show Salesperson / Agent",
    description: "Print field agent or sales representative name on physical printout.",
    category: "meta"
  },
  {
    key: "showEwayBill",
    title: "Show E-Way Bill Number",
    description: "Print 12-digit statutory e-way bill number on the physical document.",
    category: "meta"
  },
  {
    key: "showCustomerGstin",
    title: "Show Customer GSTIN",
    description: "Print recipient tax registration number in Bill-To section.",
    category: "meta"
  },
  {
    key: "showShippingAddress",
    title: "Show Shipping / Consignee Address",
    description: "Print separate Ship-To consignee address box for physical delivery.",
    category: "meta"
  },

  // Line Items & Columns
  {
    key: "showProductDescription",
    title: "Show Product Description",
    description: "Print secondary multi-line item description below product name.",
    category: "items"
  },
  {
    key: "showHsnSac",
    title: "Show HSN / SAC Code Column",
    description: "Print HSN / SAC 4 to 8 digit classification column on line items.",
    category: "items"
  },
  {
    key: "showItemDiscount",
    title: "Show Item Discount Column",
    description: "Print discount percentage and amount columns on line items.",
    category: "items"
  },
  {
    key: "showUnit",
    title: "Show Unit of Measurement (UOM)",
    description: "Print unit abbreviation (pcs, kg, box) next to dispatch quantity.",
    category: "items"
  },
  {
    key: "showTaxRate",
    title: "Show Tax Rate Column",
    description: "Print GST tax percentage rate column on item table.",
    category: "items"
  },

  // Financials & Totals
  {
    key: "showTaxBreakdown",
    title: "Show Detailed Tax Breakdown",
    description: "Print itemized CGST, SGST, and IGST tax values in totals section.",
    category: "totals"
  },
  {
    key: "showAdditionalCharges",
    title: "Show Additional Charges",
    description: "Print delivery, courier, freight, and packaging charges on paper copy.",
    category: "totals"
  },
  {
    key: "showRoundOff",
    title: "Show Round Off Adjustment",
    description: "Print mathematical round-off fractional adjustment on grand total.",
    category: "totals"
  },
  {
    key: "showAmountInWords",
    title: "Show Amount in Words",
    description: "Print total invoice amount formatted in words (Indian Rupee format).",
    category: "totals"
  },

  // Footer & Authorizations
  {
    key: "showBankDetails",
    title: "Show Bank Details & UPI QR",
    description: "Print bank account, IFSC code, and instant UPI QR code on paper copy.",
    category: "footer"
  },
  {
    key: "showTermsConditions",
    title: "Show Terms & Conditions",
    description: "Print legal declaration, warranty terms, and dispute jurisdiction at footer.",
    category: "footer"
  },
  {
    key: "showCustomerNotes",
    title: "Show Notes / Special Instructions",
    description: "Print customer notes, handling instructions, or transport remarks on paper.",
    category: "footer"
  },
  {
    key: "showAuthorizedSignature",
    title: "Show Authorized Signatory Box",
    description: "Print company stamp and authorized signatory signature block at bottom.",
    category: "footer"
  },
  {
    key: "showReceiverSignature",
    title: "Show Receiver's Stamp & Signature",
    description: "Print receiver acknowledgement box with stamp line for physical delivery.",
    category: "footer"
  },
]

export const DocumentSettingsDrawer: React.FC<DocumentSettingsDrawerProps> = ({
  open,
  onOpenChange,
  documentType = "general"
}) => {
  const isItemMode = documentType === "item"
  const { 
    documentSettings, 
    updateDocumentSettings, 
    printSettings, 
    business, 
    standardTerms,
    prefixSuffixSettings,
    itemFieldToggles,
    updateItemFieldToggles,
    customItemFields,
    documentCustomFields,
    formNotesTerms,
    formPrintSettings,
    updateFormPrintSettings,
    resetFormPrintSettings,
    formCustomColumns,
    updateCustomColumn,
    deleteCustomColumn
  } = useApp()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"display" | "custom_fields" | "print_settings">("display")
  const [localSettings, setLocalSettings] = useState<DocumentSettings>(documentSettings)
  const [localItemSettings, setLocalItemSettings] = useState<ItemFieldToggles>(itemFieldToggles)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Sub-modal states
  const [isPrefixSuffixOpen, setIsPrefixSuffixOpen] = useState(false)
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false)
  const [isNotesTermsOpen, setIsNotesTermsOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Map documentType to DocumentSequenceType
  const mappedDocType = useMemo<DocumentSequenceType>(() => {
    switch (documentType) {
      case "bill":
      case "purchase_bill":
        return "bill"
      case "order":
        return "order"
      case "challan":
        return "challan"
      case "quotation":
        return "quotation"
      case "proforma":
        return "proforma"
      case "sales_return":
        return "sales_return"
      case "purchase_return":
        return "purchase_return"
      case "credit_note":
        return "credit_note"
      case "debit_note":
        return "debit_note"
      case "note":
        return "credit_note"
      case "invoice":
      default:
        return "invoice"
    }
  }, [documentType])

  const currentFormKey: FormCustomFieldDocType = isItemMode ? "item" : mappedDocType

  const currentFormLabel = useMemo(() => {
    switch (currentFormKey) {
      case "invoice": return "Invoice"
      case "proforma": return "Proforma Invoice"
      case "quotation": return "Quotation"
      case "order": return "Sales Order"
      case "challan": return "Delivery Challan"
      case "bill": return "Purchase Bill"
      case "sales_return": return "Sales Return"
      case "purchase_return": return "Purchase Return"
      case "credit_note": return "Credit Note"
      case "debit_note": return "Debit Note"
      case "item": return "Item Master"
      default: return "Document"
    }
  }, [currentFormKey])

  const formCustomFields = useMemo(() => {
    return documentCustomFields?.[currentFormKey] || []
  }, [documentCustomFields, currentFormKey])

  const currentCustomColumns = useMemo(() => {
    return formCustomColumns?.[mappedDocType] || []
  }, [formCustomColumns, mappedDocType])

  // Get active default prefix for mappedDocType
  const currentPrefixDisplay = useMemo(() => {
    if (isItemMode) return "ITEM-"
    const list = prefixSuffixSettings?.[mappedDocType]?.prefixes || []
    const def = list.find(p => p.isDefault)
    if (def) return def.value
    if (mappedDocType === "invoice") return business?.invoicePrefix || "INV-"
    if (mappedDocType === "bill") return business?.billPrefix || "BILL-"
    if (mappedDocType === "order") return business?.orderPrefix || "SO-"
    if (mappedDocType === "challan") return business?.challanPrefix || "DC-"
    if (mappedDocType === "quotation") return business?.quotationPrefix || "QT-"
    return "INV-"
  }, [prefixSuffixSettings, mappedDocType, business, isItemMode])

  // Get active theme name for mappedDocType
  const currentThemeDisplay = useMemo(() => {
    const themeKey = printSettings?.formThemes?.[mappedDocType] || (mappedDocType === "invoice" ? (printSettings?.theme || "gst1") : "modern")
    switch (themeKey) {
      case "gst1": return "GST 1"
      case "gst2": return "GST 2"
      case "gst3": return "GST 3"
      case "gst4": return "GST 4"
      case "gst5": return "GST 5"
      case "gst6": return "GST 6"
      case "double_divine": return "Double Divine"
      case "french_elite": return "French Elite"
      case "mrp_discount": return "MRP + Discount"
      case "service_template": return "Service Template"
      case "service_template_2": return "Service Template 2"
      case "bill_to_ship_to": return "Bill To - Ship To"
      case "elegant_images": return "Elegant with Images"
      default: return themeKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }
  }, [printSettings, mappedDocType])

  const currentDocPrintSettings = useMemo(() => {
    return formPrintSettings?.[mappedDocType] || DEFAULT_FORM_PRINT_SETTINGS_MAP[mappedDocType] || DEFAULT_FORM_PRINT_SETTINGS_BASE
  }, [formPrintSettings, mappedDocType])

  const [localPrintSettings, setLocalPrintSettings] = useState<FormPrintSettings>(() => {
    return formPrintSettings?.[mappedDocType] || DEFAULT_FORM_PRINT_SETTINGS_MAP[mappedDocType] || DEFAULT_FORM_PRINT_SETTINGS_BASE
  })

  // Keep local state in sync when opened
  React.useEffect(() => {
    if (open) {
      setLocalSettings(documentSettings)
      setLocalItemSettings(itemFieldToggles)
      setLocalPrintSettings(currentDocPrintSettings)
      setSavedSuccess(false)
      if (isItemMode && activeTab === "print_settings") {
        setActiveTab("display")
      }
    }
  }, [open, documentSettings, itemFieldToggles, currentDocPrintSettings, isItemMode, activeTab])

  const handleToggle = (key: keyof DocumentSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleItemToggle = (key: keyof ItemFieldToggles) => {
    setLocalItemSettings(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }))
  }

  const handlePrintToggle = (key: keyof FormPrintSettings) => {
    setLocalPrintSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleResetPrintDefaults = () => {
    const def = DEFAULT_FORM_PRINT_SETTINGS_MAP[mappedDocType] || DEFAULT_FORM_PRINT_SETTINGS_BASE
    setLocalPrintSettings({ ...def })
  }

  const handleSave = () => {
    if (isItemMode) {
      updateItemFieldToggles(localItemSettings)
    } else {
      updateDocumentSettings(localSettings)
      updateFormPrintSettings(mappedDocType, localPrintSettings)
    }
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onOpenChange(false)
    }, 400)
  }

  const handleResetDefaults = () => {
    if (isItemMode) {
      setLocalItemSettings({
        wholesale: true,
        mrp: true,
        barcode: true,
        hsn: true,
        purchasePrice: true,
        sku: true,
        category: true,
        images: true,
        description: true,
        inventoryTracking: true,
        batchTracking: true,
        serialTracking: true,
        manufacturing: true
      })
    } else {
      setLocalSettings(DEFAULT_DOCUMENT_SETTINGS)
    }
  }

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return SETTING_OPTIONS
    const q = searchQuery.toLowerCase()
    return SETTING_OPTIONS.filter(opt => 
      opt.title.toLowerCase().includes(q) || 
      opt.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const filteredItemOptions = useMemo(() => {
    if (!searchQuery.trim()) return ITEM_SETTING_OPTIONS
    const q = searchQuery.toLowerCase()
    return ITEM_SETTING_OPTIONS.filter(opt => 
      opt.title.toLowerCase().includes(q) || 
      opt.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const filteredPrintOptions = useMemo(() => {
    if (!searchQuery.trim()) return FORM_PRINT_SETTING_OPTIONS
    const q = searchQuery.toLowerCase()
    return FORM_PRINT_SETTING_OPTIONS.filter(opt => 
      opt.title.toLowerCase().includes(q) || 
      opt.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Custom header matching the reference screenshot
  const customHeader = (
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="p-1.5 -ml-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Settings"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Document settings
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-8.5 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-all cursor-pointer"
        >
          {savedSuccess ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Saved!
            </span>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        header={customHeader}
        hideCloseButton
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl"
        zIndex={10050}
      >
        <div className="space-y-6 text-slate-800 dark:text-slate-200">
        
        {/* ========================================================= */}
        {/* 1. Quick Actions Section (4 Cards matching Swipe UI)     */}
        {/* ========================================================= */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            Quick actions
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Invoice Templates */}
            <div 
              onClick={() => setIsTemplatesModalOpen(true)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Heart className="h-4 w-4 fill-rose-500/20" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Document templates
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Theme: {currentThemeDisplay}
                </p>
              </div>
            </div>

            {/* Card 2: Custom fields */}
            <div 
              onClick={() => setIsCustomFieldsOpen(true)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Custom fields
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {formCustomFields.length} / 6 active for {currentFormLabel}
                </p>
              </div>
            </div>

            {/* Card 3: Prefixes / suffixes */}
            <div 
              onClick={() => setIsPrefixSuffixOpen(true)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Hash className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Prefixes / suffixes
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Prefix: {currentPrefixDisplay}
                </p>
              </div>
            </div>

            {/* Card 4: Notes and terms */}
            <div 
              onClick={() => setIsNotesTermsOpen(true)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Notes and terms
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Configured for {currentFormLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Customization Pills Bar                                */}
        {/* ========================================================= */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Customization
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("display")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                activeTab === "display"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold shadow-2xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              Display
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("custom_fields")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                activeTab === "custom_fields"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold shadow-2xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              Custom Fields ({formCustomFields.length}/6)
            </button>

            {!isItemMode && (
              <button
                type="button"
                onClick={() => setActiveTab("print_settings")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                  activeTab === "print_settings"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                }`}
              >
                Print Settings
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. Display Settings View                                  */}
        {/* ========================================================= */}
        {activeTab === "display" && (
          <div className="space-y-4 pt-1">
            {/* Display Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isItemMode ? "Item Fields & Controls" : "Display"}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {isItemMode 
                    ? "Control which fields, pricing sections, and tracking options appear on your item form." 
                    : "Control which columns, sections, and fields appear on your forms and documents."}
                </span>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={isItemMode ? "Search item fields..." : "Search settings..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Custom Line Item Table Columns (Max 3) */}
            {!isItemMode && (
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/70 bg-blue-50/20 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Columns className="h-3.5 w-3.5 text-blue-600" />
                      <span>Custom Product Columns ({currentCustomColumns.length}/3)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add, show or hide custom columns in the line items table for {currentFormLabel}.
                    </p>
                  </div>
                  {currentCustomColumns.length < 3 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddColumnModalOpen(true)}
                      className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Column</span>
                    </Button>
                  )}
                </div>

                {currentCustomColumns.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">No custom columns added yet. Click &ldquo;Add Column&rdquo; to add up to 3 custom columns.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {currentCustomColumns.map((col) => (
                      <div
                        key={col.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {col.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {col.printOnPaper ? "Printed on Paper & PDF" : "Screen only"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={col.isEnabled !== false}
                            onCheckedChange={() => updateCustomColumn(mappedDocType, col.id, { isEnabled: col.isEnabled === false ? true : false })}
                          />
                          <button
                            type="button"
                            onClick={() => deleteCustomColumn(mappedDocType, col.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete column"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General Section Heading */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {isItemMode ? `Item Form Fields (${filteredItemOptions.length})` : `General Options (${filteredOptions.length})`}
              </span>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </button>
            </div>

            {/* 2-Column Responsive Switches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {isItemMode ? (
                filteredItemOptions.map((opt) => {
                  const isChecked = localItemSettings[opt.key] !== false
                  return (
                    <div
                      key={opt.key}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5 pr-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer select-none">
                          {opt.title}
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {opt.description}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => handleItemToggle(opt.key)}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                filteredOptions.map((opt) => {
                  const isChecked = localSettings[opt.key] !== false
                  return (
                    <div
                      key={opt.key}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5 pr-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer select-none">
                          {opt.title}
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {opt.description}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(opt.key)}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Custom Fields view */}
        {activeTab === "custom_fields" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  Custom {currentFormLabel} Fields
                </h3>
                <span className="text-[11px] text-slate-500">
                  Custom fields configured for {currentFormLabel} ({formCustomFields.length} of 6 used).
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCustomFieldsOpen(true)}
                className="h-8 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-xs transition-all cursor-pointer gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Manage Fields</span>
              </Button>
            </div>

            <div className="space-y-3">
              {formCustomFields.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500">No custom fields created for {currentFormLabel} yet.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomFieldsOpen(true)}
                    className="text-xs mt-2"
                  >
                    + Add first custom field
                  </Button>
                </div>
              ) : (
                formCustomFields.map(field => (
                  <div key={field.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{field.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          {field.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {field.printOnPaper ? "Printed on PDF / Paper" : "Internal catalog view only"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${field.isEnabled !== false ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900" : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                        {field.isEnabled !== false ? "Active" : "Disabled"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomFieldsOpen(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-2 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Physical Paper Print Settings View (Form-wise) */}
        {!isItemMode && activeTab === "print_settings" && (
          <div className="space-y-4 pt-1">
            {/* Print Settings Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Physical Paper Print Settings
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {currentFormLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose what to show or hide on physical paper prints &amp; PDF copies. Your digital on-screen invoices and documents remain completely unaffected.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search print fields..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Custom Product Columns Physical Print Toggles */}
            {currentCustomColumns.length > 0 && (
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/70 bg-blue-50/20 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      <span>Custom Columns Physical Print Settings ({currentCustomColumns.length}/3)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enable or disable printing each custom column on physical paper copies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {currentCustomColumns.map((col) => (
                    <div
                      key={col.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 pr-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          Print &ldquo;{col.name}&rdquo; Column
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {col.printOnPaper ? "Included on paper prints" : "Hidden on paper prints"}
                        </span>
                      </div>
                      <Switch
                        checked={col.printOnPaper}
                        onCheckedChange={() => updateCustomColumn(mappedDocType, col.id, { printOnPaper: !col.printOnPaper })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Section Heading & Reset */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Paper Print Elements ({filteredPrintOptions.length})
                </span>
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Paper Prints Only
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetPrintDefaults}
                className="text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Print Defaults
              </button>
            </div>

            {/* 2-Column Responsive Switches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {filteredPrintOptions.map((opt) => {
                const isChecked = localPrintSettings[opt.key] !== false
                return (
                  <div
                    key={opt.key}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5 pr-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer select-none">
                        {opt.title}
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {opt.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => handlePrintToggle(opt.key)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </Drawer>

    {/* Prefixes & Suffixes Drawer matching Reference */}
    <DocumentPrefixSuffixDrawer
      open={isPrefixSuffixOpen}
      onOpenChange={setIsPrefixSuffixOpen}
      initialDocType={mappedDocType}
    />

    {/* Top-down Screen for Document Templates matching Reference */}
    <DocumentTemplatesModal
      open={isTemplatesModalOpen}
      onOpenChange={setIsTemplatesModalOpen}
      initialDocType={mappedDocType}
    />

    {/* Custom Fields Drawer */}
    <DocumentCustomFieldsDrawer
      open={isCustomFieldsOpen}
      onOpenChange={setIsCustomFieldsOpen}
      initialDocType={currentFormKey}
    />

    {/* Notes and Terms Drawer */}
    <DocumentNotesTermsDrawer
      open={isNotesTermsOpen}
      onOpenChange={setIsNotesTermsOpen}
      initialDocType={mappedDocType}
    />

    {/* Add Custom Column Modal */}
    <AddCustomColumnModal
      open={isAddColumnModalOpen}
      onOpenChange={setIsAddColumnModalOpen}
      docType={mappedDocType}
    />
  </>
  )
}

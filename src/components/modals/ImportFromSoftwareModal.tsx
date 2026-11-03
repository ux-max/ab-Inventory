"use client"

import React, { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Download,
  FileText,
  Sparkles
} from "lucide-react"
import { Item } from "@/types/inventory"

interface ImportFromSoftwareModalProps {
  isOpen: boolean
  onClose: () => void
}

type SoftwareKey = "vyapar" | "zoho" | "mybillbook" | "tally"

interface SoftwareOption {
  key: SoftwareKey
  name: string
  subtitle: string
  fileFormats: string[]
  exportGuide: string
  color: string
  badgeColor: string
}

const SOFTWARE_OPTIONS: SoftwareOption[] = [
  {
    key: "vyapar",
    name: "Vyapar",
    subtitle: "GST Billing & Accounting App",
    fileFormats: [".xlsx", ".xls", ".csv"],
    exportGuide: "Open Vyapar > Reports > Item Report by Party or Item Stock Summary > Click 'Export to Excel'.",
    color: "#ED1A3B",
    badgeColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
  },
  {
    key: "zoho",
    name: "Zoho Books / Inventory",
    subtitle: "Cloud ERP & Inventory Management",
    fileFormats: [".csv", ".xlsx", ".tsv"],
    exportGuide: "Open Zoho > Items > Click 3 dots (Hamburger menu) on top right > Choose 'Export Items as CSV/XLSX'.",
    color: "#1B74E4",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
  },
  {
    key: "mybillbook",
    name: "myBillBook",
    subtitle: "Small Business Invoicing & Stock",
    fileFormats: [".xlsx", ".xls", ".csv"],
    exportGuide: "Open myBillBook > Items > Bulk Actions > Export Item List to Excel (.xlsx).",
    color: "#EA580C",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
  },
  {
    key: "tally",
    name: "TallyPrime / Tally.ERP 9",
    subtitle: "Enterprise Accounting & Stock Master",
    fileFormats: [".xml", ".xlsx", ".csv"],
    exportGuide: "In Tally Gateway > Chart of Accounts > Stock Items > Press Alt+E (Export) > Select Excel or XML Spreadsheet format.",
    color: "#ED1C24",
    badgeColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
  }
]

// Sample extracted items per software to allow realistic test without external files
const MOCK_EXTRACTED_ITEMS: Record<SoftwareKey, Array<Omit<Item, "id" | "currentStock">>> = {
  vyapar: [
    {
      name: "Surgical Examination Gloves (Box of 100)",
      code: "GLV-SURG-100",
      type: "product",
      category: "Medical Supplies",
      brand: "MediGlove",
      unit: "box",
      salePrice: 420,
      purchasePrice: 290,
      mrp: 450,
      wholesalePrice: 380,
      minStock: 20,
      stockByGodown: { "godown-1": 150 },
      hsn: "4015",
      gstRate: 12,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Digital Blood Pressure Monitor",
      code: "MED-BPM-DIGI",
      type: "product",
      category: "Diagnostic Equipment",
      brand: "Omron Standard",
      unit: "pcs",
      salePrice: 1850,
      purchasePrice: 1250,
      mrp: 2100,
      wholesalePrice: 1650,
      minStock: 10,
      stockByGodown: { "godown-1": 45 },
      hsn: "9018",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Alcohol Swabs Prep Pads (100 Pcs)",
      code: "SWB-ALC-100",
      type: "product",
      category: "Consumables",
      brand: "CarePlast",
      unit: "box",
      salePrice: 120,
      purchasePrice: 75,
      mrp: 140,
      wholesalePrice: 95,
      minStock: 50,
      stockByGodown: { "godown-1": 300 },
      hsn: "3005",
      gstRate: 12,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    }
  ],
  zoho: [
    {
      name: "Thermal Barcode Label Rolls (50x25mm)",
      code: "LBL-THM-5025",
      type: "product",
      category: "Packaging & Stationery",
      brand: "Apex Pack",
      unit: "roll",
      salePrice: 180,
      purchasePrice: 110,
      mrp: 200,
      wholesalePrice: 150,
      minStock: 30,
      stockByGodown: { "godown-1": 240 },
      hsn: "4821",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Industrial Barcode Scanner 2D QR Wireless",
      code: "SCN-2D-WLS",
      type: "product",
      category: "Hardware",
      brand: "Honeywell Grade",
      unit: "pcs",
      salePrice: 3200,
      purchasePrice: 2200,
      mrp: 3600,
      wholesalePrice: 2800,
      minStock: 5,
      stockByGodown: { "godown-1": 25 },
      hsn: "8471",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Receipt Paper Roll 80mm High Density",
      code: "PPR-80MM-HD",
      type: "product",
      category: "Packaging & Stationery",
      brand: "Apex Pack",
      unit: "roll",
      salePrice: 65,
      purchasePrice: 38,
      mrp: 75,
      wholesalePrice: 50,
      minStock: 100,
      stockByGodown: { "godown-1": 500 },
      hsn: "4802",
      gstRate: 12,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    }
  ],
  mybillbook: [
    {
      name: "N95 Respirator Face Mask (Pack of 50)",
      code: "MSK-N95-PK50",
      type: "product",
      category: "Safety & PPE",
      brand: "SafeShield",
      unit: "pack",
      salePrice: 650,
      purchasePrice: 420,
      mrp: 750,
      wholesalePrice: 550,
      minStock: 25,
      stockByGodown: { "godown-1": 180 },
      hsn: "6307",
      gstRate: 5,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Surface Disinfectant Spray 500ml",
      code: "DSF-SPR-500",
      type: "product",
      category: "Sanitization",
      brand: "SterilMax",
      unit: "btl",
      salePrice: 220,
      purchasePrice: 140,
      mrp: 250,
      wholesalePrice: 180,
      minStock: 40,
      stockByGodown: { "godown-1": 200 },
      hsn: "3808",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    }
  ],
  tally: [
    {
      name: "Stainless Steel Surgical Tray 12x8",
      code: "TRY-SS-128",
      type: "product",
      category: "Hospital Furniture",
      brand: "SurgiSteel",
      unit: "pcs",
      salePrice: 550,
      purchasePrice: 360,
      mrp: 620,
      wholesalePrice: 480,
      minStock: 15,
      stockByGodown: { "godown-1": 60 },
      hsn: "7324",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "Infrared Forehead Thermometer Gun",
      code: "THM-IR-GUN",
      type: "product",
      category: "Diagnostic Equipment",
      brand: "ThermoScan",
      unit: "pcs",
      salePrice: 1450,
      purchasePrice: 950,
      mrp: 1650,
      wholesalePrice: 1250,
      minStock: 10,
      stockByGodown: { "godown-1": 40 },
      hsn: "9025",
      gstRate: 18,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    },
    {
      name: "ECG Gel Conductive 250ml",
      code: "GEL-ECG-250",
      type: "product",
      category: "Medical Consumables",
      brand: "CardioGel",
      unit: "btl",
      salePrice: 110,
      purchasePrice: 65,
      mrp: 130,
      wholesalePrice: 85,
      minStock: 30,
      stockByGodown: { "godown-1": 120 },
      hsn: "3006",
      gstRate: 12,
      hasBatch: false,
      hasSerial: false,
      isManufactured: false
    }
  ]
}

export function ImportFromSoftwareModal({ isOpen, onClose }: ImportFromSoftwareModalProps) {
  const { addBulkItems } = useApp()
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareKey | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const activeSoftwareConfig = SOFTWARE_OPTIONS.find(s => s.key === selectedSoftware)

  const handleSelectSoftware = (key: SoftwareKey) => {
    setSelectedSoftware(key)
  }

  const handleNextToStep2 = () => {
    if (!selectedSoftware) return
    setStep(2)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      })
    }
  }

  const handleLoadDemoFile = () => {
    if (!selectedSoftware) return
    const ext = selectedSoftware === "tally" ? "xml" : "xlsx"
    setUploadedFile({
      name: `${selectedSoftware.toUpperCase()}_Item_Master_Export.${ext}`,
      size: "42.8 KB"
    })
  }

  const handleExecuteImport = () => {
    if (!selectedSoftware) return
    setIsImporting(true)

    // Simulate file parsing & validation
    setTimeout(() => {
      const itemsToImport = MOCK_EXTRACTED_ITEMS[selectedSoftware] || []
      const res = addBulkItems(itemsToImport)
      setIsImporting(false)
      setImportResult({
        added: res.addedCount,
        skipped: res.skippedCount
      })
      setStep(3)
    }, 700)
  }

  const handleResetAndClose = () => {
    setSelectedSoftware(null)
    setStep(1)
    setUploadedFile(null)
    setImportResult(null)
    onClose()
  }

  // Original Brand Logo Renderers (100% Authentic Brand Assets)
  const renderSoftwareLogo = (key: SoftwareKey, size: "sm" | "md" | "lg" = "md") => {
    const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-11 w-11" : "h-10 w-10"

    switch (key) {
      case "vyapar":
        // Official Vyapar 3-Color Origami Ribbon "V" Emblem (Red, Orange, Golden Yellow)
        return (
          <div className={`${dim} rounded-xl bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center border border-slate-200/90 dark:border-slate-700 shadow-xs shrink-0 overflow-hidden`}>
            <svg viewBox="0 0 137 117" className="h-full w-full object-contain">
              {/* Crimson Red Primary Fold */}
              <path 
                d="M43.78.14,7.55.2A7.55,7.55,0,0,0,.44,10.27L20,44a11.37,11.37,0,0,0,8.87,4.26l16.52,0a7.71,7.71,0,0,1,6.7,11.55L43.82,74.08a11.3,11.3,0,0,0-.71,9.81l19.6,33.82A7.55,7.55,0,0,0,75,116.55L93,85.14Z" 
                fill="#ED1A3B" 
              />
              {/* Orange Center Accent */}
              <polygon 
                points="117.56 42.52 92.95 0.06 43.78 0.14 93.04 85.14 117.56 42.52" 
                fill="#F79F1F" 
              />
              {/* Golden Yellow Top Fold */}
              <path 
                d="M128.94,0,93,.06l24.61,42.46,17.94-31.2A7.56,7.56,0,0,0,128.94,0Z" 
                fill="#FFC312" 
              />
            </svg>
          </div>
        )

      case "zoho":
        // Official Zoho 4-Color Block Monogram (Z in Red, O in Green, H in Blue, O in Yellow)
        return (
          <div className={`${dim} rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200/90 dark:border-slate-700 shadow-xs shrink-0 overflow-hidden`}>
            <svg viewBox="0 0 44 44" className="h-full w-full object-contain">
              {/* Red Z Block */}
              <rect x="2" y="2" width="18" height="18" rx="4" fill="#E42528" />
              <path d="M7 6.5H15L9.5 13H15V15H7L12.5 8.5H7V6.5Z" fill="white" />
              {/* Green O Block */}
              <rect x="24" y="2" width="18" height="18" rx="4" fill="#089949" />
              <ellipse cx="33" cy="11" rx="4.5" ry="5" fill="none" stroke="white" strokeWidth="2.8" />
              {/* Blue H Block */}
              <rect x="2" y="24" width="18" height="18" rx="4" fill="#1B74E4" />
              <path d="M7 28.5H9.5V31.5H12.5V28.5H15V37.5H12.5V34H9.5V37.5H7V28.5Z" fill="white" />
              {/* Yellow O Block */}
              <rect x="24" y="24" width="18" height="18" rx="4" fill="#F7B218" />
              <ellipse cx="33" cy="33" rx="4.5" ry="5" fill="none" stroke="white" strokeWidth="2.8" />
            </svg>
          </div>
        )

      case "mybillbook":
        // Official myBillBook Dual Overlapping Warm-Orange Geometric Paper-Plane Emblem
        return (
          <div className={`${dim} rounded-xl bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center border border-slate-200/90 dark:border-slate-700 shadow-xs shrink-0 overflow-hidden`}>
            <svg viewBox="0 0 19 20" fill="none" className="h-full w-full object-contain">
              {/* Foreground Warm Peach/Orange Paper Plane */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M10.9732 8.662L8.9225 16.4333C8.83802 16.7427 8.51775 16.9255 8.20669 16.8416C8.11184 16.8164 8.02544 16.7679 7.95478 16.7004L2.09081 10.9511C1.86386 10.7263 1.86271 10.3616 2.08889 10.1362C2.08966 10.1358 2.09004 10.135 2.09081 10.1346C2.16378 10.0591 2.25709 10.0057 2.35924 9.98202L10.2704 7.97147C10.5807 7.89212 10.8967 8.07753 10.9766 8.38579C10.9766 8.38617 10.9766 8.38655 10.977 8.38732C10.9962 8.47812 10.9951 8.57197 10.9732 8.662Z" 
                fill="#F89B62" 
              />
              {/* Background Deep Rust Orange Fold */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M16.2144 3.4697L13.1004 15.2545C13.0175 15.5624 12.7003 15.7463 12.3896 15.6665C12.299 15.641 12.216 15.5941 12.1477 15.5292L3.23076 6.78883C3.0038 6.56412 3.00303 6.1994 3.22922 5.97393L3.23076 5.9724C3.30641 5.89991 3.39857 5.84765 3.49957 5.8198L15.5155 2.76773C15.8254 2.69257 16.1395 2.87722 16.2225 3.18357C16.2421 3.27819 16.2394 3.37623 16.2144 3.4697Z" 
                fill="#EA580C" 
              />
              {/* Shadow Overlay */}
              <path 
                opacity="0.2" 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M9.79402 13.2403L5.6543 9.12381L10.2625 7.97928C10.5724 7.89993 10.8889 8.08534 10.9687 8.3936C10.9687 8.3936 10.9691 8.39437 10.9691 8.39513C10.9922 8.48783 10.9922 8.58474 10.9691 8.67744L9.79402 13.2403Z" 
                fill="#353452" 
              />
            </svg>
          </div>
        )

      case "tally":
        // Official Tally Cursive Script & 3D Red Shadow Flourish from Tally Solutions
        return (
          <div className={`${dim} rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200/90 dark:border-slate-700 shadow-xs shrink-0 overflow-hidden`}>
            <svg viewBox="12 0 46 22" fill="none" className="h-full w-full object-contain">
              {/* Red 3D Shadow Flourish */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M28.4481 11.0741C28.9912 10.6929 30.1607 9.28859 30.2235 9.16818C30.307 9.02783 30.5367 8.787 30.2652 8.5463C29.9937 8.30561 29.7848 8.44596 29.4925 8.58644C29.2001 8.72693 27.8632 9.72998 27.362 10.1312C26.8816 10.5124 25.6493 11.5957 25.6493 11.5957C25.6493 11.5957 24.981 12.1775 25.2106 12.4785C25.4614 12.7594 25.6703 12.659 26.0462 12.5588C26.4012 12.4584 27.905 11.4553 28.4481 11.0741ZM55.9765 18.0758C56.1646 18.1561 56.6241 18.2764 56.5823 18.7177C56.5823 18.7177 56.1646 19.5805 56.0184 19.6407C55.8513 19.7208 55.5589 19.7208 54.8905 19.46C54.2431 19.1993 51.2562 18.4369 50.4416 18.2764C49.648 18.1159 47.8099 17.8149 47.8099 17.8149C47.8099 17.8149 47.5802 17.6746 47.2043 18.2563C46.8282 18.8582 45.6377 20.5634 45.6377 20.5634C45.6377 20.5634 45.5542 20.8043 45.3453 20.8043C45.1155 20.8043 44.1549 20.7441 43.7997 20.5434C43.4237 20.3428 43.3402 20.3629 43.5491 19.9817C43.7789 19.6005 44.6143 17.9554 44.9694 17.6143C45.3035 17.2934 44.7396 17.3736 44.5516 17.3335C44.3845 17.2934 40.7712 17.1127 39.7059 17.1328C38.6616 17.1529 34.9021 17.1529 33.5654 17.2332C32.2286 17.3134 27.3411 17.7748 26.0462 17.9755C24.7512 18.1961 19.5295 18.9384 18.8193 19.0789C18.1093 19.2193 16.7099 19.4801 16.7099 19.4801C16.7099 19.4801 16.0206 19.6407 15.3104 19.3398C14.6211 19.0186 13.5142 18.5774 14.4541 18.2764C15.4149 17.9755 20.0309 17.0525 21.4721 16.852C22.9131 16.6314 27.4037 15.9893 29.3044 15.8891C31.2051 15.7887 36.2805 15.5079 38.2021 15.5079C40.1028 15.528 42.7554 15.6482 43.8832 15.7486C45.0112 15.8289 45.7631 15.8891 45.9719 15.9091C46.2017 15.9493 46.2226 15.7887 46.4315 15.528C46.6612 15.2671 47.3714 14.3443 47.3714 14.3443C47.3714 14.3443 47.601 13.9832 47.1415 14.2841C46.703 14.585 45.9719 14.605 45.5959 14.264C45.2409 13.9029 45.0738 13.602 44.9068 13.7223C44.7396 13.8226 44.0504 14.1436 43.6952 14.264C43.3193 14.4043 41.732 14.7656 40.7921 14.1235C39.8313 13.4615 39.8104 13.2208 39.685 12.8997C39.5598 12.5988 39.497 12.6189 39.1838 12.8196C38.8705 13.0201 37.8053 13.5418 37.4084 13.7223C37.0115 13.8828 36.7191 14.0434 36.0926 13.9832C35.4869 13.943 34.7977 13.7624 34.5052 13.2609C34.2337 12.7593 34.1919 12.3982 33.8578 12.6189C33.5235 12.8597 31.7899 13.8628 30.871 14.1235C29.9311 14.4043 29.7013 14.5248 29.1792 14.4244C28.636 14.3443 28.0721 14.1235 27.8632 13.8025C27.6545 13.4816 27.6335 13.4013 27.3828 13.5819C27.1531 13.7825 26.4848 14.2841 25.9835 14.2439C25.4823 14.1837 24.1872 13.8628 23.477 12.5588C22.767 11.2346 23.2683 10.6929 23.9157 10.0309C24.5423 9.38894 25.6703 8.42589 25.6703 8.42589C25.6703 8.42589 27.0696 7.38269 27.55 7.16207C28.0304 6.94131 28.7823 6.49992 29.2627 6.45978C29.764 6.41978 30.4532 6.47985 31.1425 7.02158C31.8317 7.56332 32.2286 8.16512 32.3121 8.36568C32.3957 8.58644 32.6881 9.38894 32.2077 9.93054C31.7064 10.4723 30.307 11.7762 30.307 11.7762C30.307 11.7762 29.764 12.0973 30.0146 12.4785C30.2652 12.8798 31.1843 12.2377 31.4975 12.0371C31.7899 11.8164 33.3983 10.4522 33.8995 9.99074C34.3799 9.50936 37.5128 6.45978 37.8053 6.17895C38.0768 5.89811 40.6667 3.31013 41.0427 3.0693C41.4186 2.82861 41.5649 2.64812 42.2542 2.78847C42.9643 2.92895 43.382 3.16965 43.382 3.16965C43.382 3.16965 44.113 3.45062 43.5282 3.91194C42.9433 4.35332 40.9801 5.99846 40.4997 6.51999C39.9983 7.02158 38.5781 8.44596 38.1186 8.96762C37.6591 9.48929 36.385 11.0339 36.1761 11.335C35.9672 11.6359 35.8629 11.9569 36.1761 12.1775C36.4894 12.3782 37.0324 12.1574 37.6173 11.676C38.2021 11.2146 39.8939 9.72998 40.4997 9.14811C41.1053 8.5463 44.3428 5.45672 44.6353 5.19596C44.9275 4.95527 46.4315 3.75152 46.4315 3.75152C46.4315 3.75152 46.6195 3.49062 47.058 3.49062C47.4967 3.49062 47.9353 3.5709 48.2068 3.67124C48.4783 3.79166 48.9587 4.07249 48.9587 4.07249C48.9587 4.07249 49.272 4.21298 48.7498 4.59402C48.2277 4.9752 45.5542 7.10186 44.8232 7.88429C44.0921 8.66672 42.6301 10.2716 42.087 11.0139C41.544 11.7562 41.168 12.0773 41.5857 12.5787C42.0035 13.0603 42.5048 12.9599 42.7554 12.8798C43.0061 12.7794 43.8415 12.1975 44.4471 11.5757C45.0529 10.9538 46.9536 8.92748 47.1415 8.68679C47.3504 8.44596 48.0397 7.7438 48.0397 7.7438C48.0397 7.7438 48.1859 7.46297 48.5827 7.46297C48.9796 7.46297 49.2302 7.52318 49.6271 7.60346C50.0239 7.6836 50.8803 7.86422 50.3999 8.34575C49.8986 8.8472 48.729 10.051 48.4783 10.3519C48.2277 10.6529 47.2251 11.7562 47.0371 12.0773C46.8491 12.4183 46.5985 12.7794 46.8491 12.9398C47.1208 13.1004 47.7473 12.8798 48.3948 12.5185C49.0213 12.1775 49.9613 11.5757 50.7758 10.8334C51.5905 10.1112 52.9063 8.90741 52.9063 8.90741C52.9063 8.90741 53.136 8.42589 54.0759 8.62658C55.0157 8.8472 55.2455 8.96762 55.2455 8.96762C55.2455 8.96762 55.9765 9.16817 55.4961 9.58949C55.0157 10.0309 53.3867 11.4954 52.76 12.0773C52.1335 12.6791 50.2328 14.6251 49.8986 15.0063C49.5644 15.3875 48.6663 16.2502 49.0422 16.2902C49.4182 16.3303 52.2379 16.8721 52.9063 17.0525C53.5747 17.2332 55.7887 17.9755 55.9765 18.0758ZM23.9366 2.66805C23.9366 2.66805 23.1429 2.54777 22.2447 2.64812C21.3467 2.74833 18.6104 3.0293 18.0674 3.24992C17.5454 3.47069 17.1694 2.96909 16.9605 2.74833C16.7307 2.54777 16.2086 2.00604 16.2086 2.00604C16.2086 2.00604 15.9371 1.68507 16.4175 1.56479C16.9187 1.46444 19.6966 0.982914 20.5739 0.902636C21.4511 0.822499 25.691 0.581665 26.8189 0.581665C27.926 0.601735 31.8527 0.80243 32.8761 1.08326C32.8761 1.08326 33.085 1.02305 33.2939 1.52465C33.5026 2.04618 33.4609 2.50763 33.4609 2.50763C33.4609 2.50763 33.6698 2.86874 32.9387 2.82861C32.2286 2.7684 31.038 2.70819 30.2235 2.66805C29.4298 2.60798 27.4873 2.46749 27.1948 2.48756C26.9233 2.50763 26.8398 2.48756 26.6727 2.70819C26.5057 2.94902 25.7329 3.93201 25.5449 4.19291C25.3569 4.4336 24.5423 5.47679 23.8531 6.41978C23.1638 7.34256 22.2866 8.50616 21.5137 9.72998C20.7618 10.9538 20.0518 12.0773 19.7594 12.5988C19.4669 13.1004 19.3416 13.4214 19.2997 13.5418C19.2371 13.6621 19.1745 13.8628 18.8403 13.8828C18.4852 13.9029 16.8561 13.8427 16.8561 13.8427C16.8561 13.8427 16.1668 13.9029 16.5846 13.1405C17.0022 12.3581 17.9422 10.8133 18.3389 10.2115C18.7358 9.60956 20.7618 6.82103 21.1587 6.29936C21.5347 5.79777 23.9366 2.66805 23.9366 2.66805Z" 
                fill="#ED1C24" 
              />
              {/* Black Script Tally Character Forms */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M28.2225 10.4725C28.7655 10.0913 29.935 8.687 29.9976 8.56658C30.0813 8.4463 30.311 8.20547 30.0396 7.94456C29.768 7.70387 29.5591 7.84436 29.2667 7.9847C28.9744 8.12519 27.6375 9.14831 27.1363 9.52949C26.6559 9.91067 25.4236 10.9941 25.4236 10.9941C25.4236 10.9941 24.7552 11.5759 24.9851 11.8768C25.2147 12.1777 25.4444 12.0574 25.7996 11.9571C26.1757 11.8569 27.6584 10.8537 28.2225 10.4725ZM26.5933 0H26.2477C24.7786 0.0190802 21.1521 0.227408 20.3481 0.301043C19.4709 0.381321 16.6929 0.862849 16.1918 0.983124C15.6905 1.10354 15.9829 1.40444 15.9829 1.40444C15.9829 1.40444 16.505 1.94604 16.7348 2.1668C16.9437 2.36736 17.3196 2.88902 17.8419 2.66826C18.3847 2.42757 21.121 2.1668 22.0191 2.04653C22.9172 1.94604 23.69 2.06645 23.69 2.06645C23.69 2.06645 21.3089 5.19617 20.933 5.7177C20.5361 6.21929 18.5101 9.02804 18.1132 9.60977C17.7165 10.2117 16.7766 11.7766 16.3379 12.5388C15.9203 13.3012 16.6303 13.2612 16.6303 13.2612C16.6303 13.2612 18.2595 13.3011 18.6145 13.3011C18.9487 13.2812 19.0114 13.0605 19.0531 12.94C19.1159 12.8196 19.2411 12.4988 19.5336 11.9972C19.8259 11.4957 20.5152 10.3721 21.2882 9.14831C22.0608 7.9245 22.938 6.74096 23.6273 5.81818C24.3165 4.89527 25.1312 3.83201 25.3192 3.59117C25.5071 3.35048 26.28 2.34743 26.447 2.12652C26.6142 1.88583 26.6768 1.9059 26.9693 1.88583C27.2615 1.8659 29.204 2.00625 29.9976 2.06645C30.8123 2.12652 31.982 2.1668 32.713 2.22701C33.4439 2.28722 33.2352 1.9059 33.2352 1.9059C33.2352 1.9059 33.2769 1.44458 33.068 0.942985C32.8383 0.42146 32.6503 0.501739 32.6503 0.501739C31.606 0.200696 27.7002 0 26.5933 0ZM55.7509 17.4741C55.918 17.5744 56.3984 17.6948 56.3356 18.1161C56.3356 18.1161 55.9389 18.9787 55.7717 19.059C55.6047 19.1192 55.3124 19.1192 54.6648 18.8583C54.0172 18.5977 51.0305 17.8352 50.2159 17.6948C49.4223 17.5343 47.5842 17.2133 47.5842 17.2133C47.5842 17.2133 47.3545 17.0728 46.9786 17.6748C46.5816 18.2565 45.412 19.9618 45.412 19.9618C45.412 19.9618 45.3285 20.2025 45.1197 20.2025C44.8898 20.2025 43.9291 20.1425 43.574 19.9418C43.198 19.7611 43.1145 19.7812 43.3234 19.3801C43.5532 18.9988 44.3885 17.3536 44.7227 17.0126C45.0778 16.6918 44.5138 16.7719 44.3259 16.7318C44.1379 16.7117 40.5455 16.5111 39.4804 16.5312C38.4151 16.5513 34.6764 16.5513 33.3396 16.6316C32.0028 16.7318 27.0945 17.1733 25.7996 17.3939C24.5045 17.5945 19.3038 18.3568 18.5938 18.4972C17.8836 18.6377 16.4842 18.8785 16.4842 18.8785C16.4842 18.8785 15.774 19.059 15.0847 18.738C14.3956 18.417 13.2886 17.9757 14.2285 17.6948C15.1891 17.3939 19.805 16.471 21.2462 16.2504C22.6874 16.0497 27.1781 15.3877 29.0787 15.2873C30.9586 15.1871 36.055 14.9061 37.9764 14.9262C39.8771 14.9463 42.5296 15.0667 43.6576 15.1468C44.7855 15.2271 45.5374 15.2873 45.7463 15.3275C45.976 15.3676 45.9969 15.207 46.2056 14.9463C46.4356 14.6855 47.1456 13.7425 47.1456 13.7425C47.1456 13.7425 47.3755 13.4016 46.9158 13.7025C46.4564 13.9834 45.7254 14.0034 45.3703 13.6623C44.9944 13.3012 44.8481 13.0203 44.681 13.1205C44.5138 13.221 43.8246 13.5621 43.4486 13.6823C43.0936 13.8027 41.5062 14.1639 40.5662 13.5219C39.6056 12.8798 39.5847 12.6192 39.4593 12.3182C39.3341 11.9972 39.2713 12.0173 38.9581 12.2178C38.6448 12.4386 37.5795 12.94 37.1828 13.1205C36.7859 13.3011 36.4935 13.4416 35.867 13.4016C35.2611 13.3414 34.5719 13.1608 34.2795 12.6592C33.9871 12.1576 33.9662 11.7966 33.6319 12.0373C33.2978 12.258 31.5642 13.2812 30.6452 13.542C29.7054 13.8027 29.4755 13.9232 28.9535 13.8429C28.4104 13.7425 27.8255 13.5219 27.6375 13.2009C27.4287 12.8798 27.3869 12.7997 27.1572 13.0002C26.9276 13.1807 26.259 13.7025 25.7577 13.6423C25.2356 13.5821 23.9406 13.2812 23.2305 11.9571C22.5203 10.6531 23.0426 10.0913 23.6692 9.44936C24.3165 8.78734 25.4444 7.82429 25.4444 7.82429C25.4444 7.82429 26.8439 6.80117 27.3243 6.56033C27.8045 6.33971 28.5357 5.89832 29.037 5.85818C29.5174 5.83811 30.2276 5.87839 30.9169 6.41999C31.606 6.96158 31.982 7.56339 32.0864 7.78415C32.17 7.9847 32.4624 8.78734 31.9611 9.32894C31.4808 9.87067 30.0813 11.1746 30.0813 11.1746C30.0813 11.1746 29.5174 11.5157 29.7889 11.8968C30.0396 12.278 30.9586 11.6562 31.2509 11.4355C31.5642 11.2348 33.1726 9.85046 33.6739 9.38915C34.1542 8.90762 37.2871 5.85818 37.5588 5.59742C37.8303 5.31645 40.4202 2.70854 40.817 2.4677C41.1929 2.22701 41.3392 2.04653 42.0283 2.18673C42.7176 2.32722 43.1354 2.56805 43.1354 2.56805C43.1354 2.56805 43.8665 2.84888 43.2817 3.31034C42.7176 3.7718 40.7542 5.41679 40.2739 5.91839C39.7726 6.41999 38.3524 7.84436 37.8929 8.36588C37.4334 8.88755 36.1383 10.4323 35.9504 10.7332C35.7416 11.0341 35.637 11.3753 35.9504 11.5759C36.2637 11.7966 36.8069 11.5558 37.3916 11.0943C37.9764 10.6128 39.6683 9.14831 40.2739 8.54651C40.8588 7.94456 44.1171 4.85513 44.4095 4.61444C44.7018 4.35353 46.2056 3.14979 46.2056 3.14979C46.2056 3.14979 46.3936 2.88902 46.8323 2.88902C47.2709 2.88902 47.7096 2.96916 47.9811 3.08958C48.2526 3.18992 48.7331 3.49097 48.7331 3.49097C48.7331 3.49097 49.0463 3.61124 48.5241 3.99242C48.0018 4.3736 45.3077 6.50012 44.5766 7.28255C43.8665 8.06498 42.4043 9.69005 41.8404 10.4123C41.2975 11.1546 40.9422 11.4957 41.3601 11.9771C41.7777 12.4786 42.2791 12.3583 42.5296 12.278C42.7804 12.1979 43.6158 11.5959 44.2216 10.9739C44.8272 10.3721 46.7279 8.34581 46.9158 8.08519C47.1249 7.84436 47.8139 7.14207 47.8139 7.14207C47.8139 7.14207 47.9602 6.86124 48.357 6.86124C48.7537 6.86124 49.0045 6.92144 49.4013 7.00172C49.7982 7.10207 50.6546 7.26248 50.1742 7.76408C49.673 8.24561 48.5032 9.44936 48.2526 9.75026C48.0018 10.0512 46.9995 11.1546 46.8115 11.4957C46.6236 11.8166 46.3728 12.1979 46.6235 12.3382C46.8741 12.4988 47.5216 12.278 48.1481 11.9171C48.7957 11.5759 49.7356 10.9739 50.5501 10.2517C51.3648 9.50956 52.6806 8.32589 52.6806 8.32589C52.6806 8.32589 52.8893 7.82429 53.8503 8.04491C54.7902 8.24561 55.0198 8.36588 55.0198 8.36588C55.0198 8.36588 55.7509 8.56658 55.2704 9.00797C54.7902 9.44936 53.161 10.8938 52.5343 11.4957C51.9078 12.0775 50.007 14.0234 49.673 14.4047C49.3387 14.8058 48.4406 15.6484 48.8165 15.6886C49.1925 15.7287 52.0121 16.2904 52.6806 16.471C53.349 16.6316 55.563 17.3939 55.7509 17.4741Z" 
                fill="#ED1C24" 
              />
              {/* Black Script Tally Character Forms */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M28.2225 10.4725C28.7655 10.0913 29.935 8.687 29.9976 8.56658C30.0813 8.4463 30.311 8.20547 30.0396 7.94456C29.768 7.70387 29.5591 7.84436 29.2667 7.9847C28.9744 8.12519 27.6375 9.14831 27.1363 9.52949C26.6559 9.91067 25.4236 10.9941 25.4236 10.9941C25.4236 10.9941 24.7552 11.5759 24.9851 11.8768C25.2147 12.1777 25.4444 12.0574 25.7996 11.9571C26.1757 11.8569 27.6584 10.8537 28.2225 10.4725ZM26.5933 0H26.2477C24.7786 0.0190802 21.1521 0.227408 20.3481 0.301043C19.4709 0.381321 16.6929 0.862849 16.1918 0.983124C15.6905 1.10354 15.9829 1.40444 15.9829 1.40444C15.9829 1.40444 16.505 1.94604 16.7348 2.1668C16.9437 2.36736 17.3196 2.88902 17.8419 2.66826C18.3847 2.42757 21.121 2.1668 22.0191 2.04653C22.9172 1.94604 23.69 2.06645 23.69 2.06645C23.69 2.06645 21.3089 5.19617 20.933 5.7177C20.5361 6.21929 18.5101 9.02804 18.1132 9.60977C17.7165 10.2117 16.7766 11.7766 16.3379 12.5388C15.9203 13.3012 16.6303 13.2612 16.6303 13.2612C16.6303 13.2612 18.2595 13.3011 18.6145 13.3011C18.9487 13.2812 19.0114 13.0605 19.0531 12.94C19.1159 12.8196 19.2411 12.4988 19.5336 11.9972C19.8259 11.4957 20.5152 10.3721 21.2882 9.14831C22.0608 7.9245 22.938 6.74096 23.6273 5.81818C24.3165 4.89527 25.1312 3.83201 25.3192 3.59117C25.5071 3.35048 26.28 2.34743 26.447 2.12652C26.6142 1.88583 26.6768 1.9059 26.9693 1.88583C27.2615 1.8659 29.204 2.00625 29.9976 2.06645C30.8123 2.12652 31.982 2.1668 32.713 2.22701C33.4439 2.28722 33.2352 1.9059 33.2352 1.9059C33.2352 1.9059 33.2769 1.44458 33.068 0.942985C32.8383 0.42146 32.6503 0.501739 32.6503 0.501739C31.606 0.200696 27.7002 0 26.5933 0ZM55.7509 17.4741C55.918 17.5744 56.3984 17.6948 56.3356 18.1161C56.3356 18.1161 55.9389 18.9787 55.7717 19.059C55.6047 19.1192 55.3124 19.1192 54.6648 18.8583C54.0172 18.5977 51.0305 17.8352 50.2159 17.6948C49.4223 17.5343 47.5842 17.2133 47.5842 17.2133C47.5842 17.2133 47.3545 17.0728 46.9786 17.6748C46.5816 18.2565 45.412 19.9618 45.412 19.9618C45.412 19.9618 45.3285 20.2025 45.1197 20.2025C44.8898 20.2025 43.9291 20.1425 43.574 19.9418C43.198 19.7611 43.1145 19.7812 43.3234 19.3801C43.5532 18.9988 44.3885 17.3536 44.7227 17.0126C45.0778 16.6918 44.5138 16.7719 44.3259 16.7318C44.1379 16.7117 40.5455 16.5111 39.4804 16.5312C38.4151 16.5513 34.6764 16.5513 33.3396 16.6316C32.0028 16.7318 27.0945 17.1733 25.7996 17.3939C24.5045 17.5945 19.3038 18.3568 18.5938 18.4972C17.8836 18.6377 16.4842 18.8785 16.4842 18.8785C16.4842 18.8785 15.774 19.059 15.0847 18.738C14.3956 18.417 13.2886 17.9757 14.2285 17.6948C15.1891 17.3939 19.805 16.471 21.2462 16.2504C22.6874 16.0497 27.1781 15.3877 29.0787 15.2873C30.9586 15.1871 36.055 14.9061 37.9764 14.9262C39.8771 14.9463 42.5296 15.0667 43.6576 15.1468C44.7855 15.2271 45.5374 15.2873 45.7463 15.3275C45.976 15.3676 45.9969 15.207 46.2056 14.9463C46.4356 14.6855 47.1456 13.7425 47.1456 13.7425C47.1456 13.7425 47.3755 13.4016 46.9158 13.7025C46.4564 13.9834 45.7254 14.0034 45.3703 13.6623C44.9944 13.3012 44.8481 13.0203 44.681 13.1205C44.5138 13.221 43.8246 13.5621 43.4486 13.6823C43.0936 13.8027 41.5062 14.1639 40.5662 13.5219C39.6056 12.8798 39.5847 12.6192 39.4593 12.3182C39.3341 11.9972 39.2713 12.0173 38.9581 12.2178C38.6448 12.4386 37.5795 12.94 37.1828 13.1205C36.7859 13.3011 36.4935 13.4416 35.867 13.4016C35.2611 13.3414 34.5719 13.1608 34.2795 12.6592C33.9871 12.1576 33.9662 11.7966 33.6319 12.0373C33.2978 12.258 31.5642 13.2812 30.6452 13.542C29.7054 13.8027 29.4755 13.9232 28.9535 13.8429C28.4104 13.7425 27.8255 13.5219 27.6375 13.2009C27.4287 12.8798 27.3869 12.7997 27.1572 13.0002C26.9276 13.1807 26.259 13.7025 25.7577 13.6423C25.2356 13.5821 23.9406 13.2812 23.2305 11.9571C22.5203 10.6531 23.0426 10.0913 23.6692 9.44936C24.3165 8.78734 25.4444 7.82429 25.4444 7.82429C25.4444 7.82429 26.8439 6.80117 27.3243 6.56033C27.8045 6.33971 28.5357 5.89832 29.037 5.85818C29.5174 5.83811 30.2276 5.87839 30.9169 6.41999C31.606 6.96158 31.982 7.56339 32.0864 7.78415C32.17 7.9847 32.4624 8.78734 31.9611 9.32894C31.4808 9.87067 30.0813 11.1746 30.0813 11.1746C30.0813 11.1746 29.5174 11.5157 29.7889 11.8968C30.0396 12.278 30.9586 11.6562 31.2509 11.4355C31.5642 11.2348 33.1726 9.85046 33.6739 9.38915C34.1542 8.90762 37.2871 5.85818 37.5588 5.59742C37.8303 5.31645 40.4202 2.70854 40.817 2.4677C41.1929 2.22701 41.3392 2.04653 42.0283 2.18673C42.7176 2.32722 43.1354 2.56805 43.1354 2.56805C43.1354 2.56805 43.8665 2.84888 43.2817 3.31034C42.7176 3.7718 40.7542 5.41679 40.2739 5.91839C39.7726 6.41999 38.3524 7.84436 37.8929 8.36588C37.4334 8.88755 36.1383 10.4323 35.9504 10.7332C35.7416 11.0341 35.637 11.3753 35.9504 11.5759C36.2637 11.7966 36.8069 11.5558 37.3916 11.0943C37.9764 10.6128 39.6683 9.14831 40.2739 8.54651C40.8588 7.94456 44.1171 4.85513 44.4095 4.61444C44.7018 4.35353 46.2056 3.14979 46.2056 3.14979C46.2056 3.14979 46.3936 2.88902 46.8323 2.88902C47.2709 2.88902 47.7096 2.96916 47.9811 3.08958C48.2526 3.18992 48.7331 3.49097 48.7331 3.49097C48.7331 3.49097 49.0463 3.61124 48.5241 3.99242C48.0018 4.3736 45.3077 6.50012 44.5766 7.28255C43.8665 8.06498 42.4043 9.69005 41.8404 10.4123C41.2975 11.1546 40.9422 11.4957 41.3601 11.9771C41.7777 12.4786 42.2791 12.3583 42.5296 12.278C42.7804 12.1979 43.6158 11.5959 44.2216 10.9739C44.8272 10.3721 46.7279 8.34581 46.9158 8.08519C47.1249 7.84436 47.8139 7.14207 47.8139 7.14207C47.8139 7.14207 47.9602 6.86124 48.357 6.86124C48.7537 6.86124 49.0045 6.92144 49.4013 7.00172C49.7982 7.10207 50.6546 7.26248 50.1742 7.76408C49.673 8.24561 48.5032 9.44936 48.2526 9.75026C48.0018 10.0512 46.9995 11.1546 46.8115 11.4957C46.6236 11.8166 46.3728 12.1979 46.6235 12.3382C46.8741 12.4988 47.5216 12.278 48.1481 11.9171C48.7957 11.5759 49.7356 10.9739 50.5501 10.2517C51.3648 9.50956 52.6806 8.32589 52.6806 8.32589C52.6806 8.32589 52.8893 7.82429 53.8503 8.04491C54.7902 8.24561 55.0198 8.36588 55.0198 8.36588C55.0198 8.36588 55.7509 8.56658 55.2704 9.00797C54.7902 9.44936 53.161 10.8938 52.5343 11.4957C51.9078 12.0775 50.007 14.0234 49.673 14.4047C49.3387 14.8058 48.4406 15.6484 48.8165 15.6886C49.1925 15.7287 52.0121 16.2904 52.6806 16.471C53.349 16.6316 55.563 17.3939 55.7509 17.4741Z" 
                fill="#1E293B" 
                className="dark:fill-slate-100" 
              />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Minimal Modal Box */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 text-slate-800 dark:text-slate-100 select-none">
        
        {/* Modal Top Bar */}
        <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {step === 1 && "Import Items from Other Software"}
                {step === 2 && `Upload ${activeSoftwareConfig?.name} Export`}
                {step === 3 && "Import Complete"}
              </h2>
              <span className="text-[11px] text-slate-500">
                {step === 1 && "Select the software you are migrating from"}
                {step === 2 && `Step 2 of 2: Upload Excel / CSV file exported from ${activeSoftwareConfig?.name}`}
                {step === 3 && "Items added to your inventory"}
              </span>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">

          {/* ======================================================== */}
          {/* STEP 1: Select Software with Original Logos */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Select your existing billing or ERP software. We will automatically map item names, SKU codes, categories, tax rates, and opening stock:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOFTWARE_OPTIONS.map((software) => {
                  const isSelected = selectedSoftware === software.key
                  return (
                    <div
                      key={software.key}
                      onClick={() => handleSelectSoftware(software.key)}
                      className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs ring-2 ring-blue-500/10"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Original Brand Logo */}
                      {renderSoftwareLogo(software.key, "md")}

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {software.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {software.subtitle}
                        </p>
                        
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {software.fileFormats.map(fmt => (
                            <span 
                              key={fmt} 
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {fmt}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Radio Selection Dot */}
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Step 1 Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAndClose}
                  className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>

                {/* Next Button only active when option is selected */}
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedSoftware}
                  onClick={handleNextToStep2}
                  className="h-8 px-4 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-md shadow-2xs transition-all"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: File Upload with Guidance & Preview */}
          {/* ======================================================== */}
          {step === 2 && activeSoftwareConfig && (
            <div className="space-y-4 text-xs">
              
              {/* Selected Software Header Pill */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  {renderSoftwareLogo(activeSoftwareConfig.key, "sm")}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      {activeSoftwareConfig.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Auto-mapper ready for {activeSoftwareConfig.name} format
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setUploadedFile(null)
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Change
                </button>
              </div>

              {/* How to export guide banner */}
              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                <div className="font-semibold text-[11px] mb-0.5 flex items-center gap-1.5">
                  <span>How to export from {activeSoftwareConfig.name}:</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {activeSoftwareConfig.exportGuide}
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  uploadedFile
                    ? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx,.xls,.csv,.xml" 
                  className="hidden" 
                />

                {uploadedFile ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      File Size: {uploadedFile.size} • Format Verified
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="mt-2 text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Upload different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-1">
                      Click to choose or drag & drop {activeSoftwareConfig.name} file
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports {activeSoftwareConfig.fileFormats.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Sample / Demo Auto-Fill Shortcut */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                <span>Want to test without an export file?</span>
                <button
                  type="button"
                  onClick={handleLoadDemoFile}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Use Sample {activeSoftwareConfig.name} Data</span>
                </button>
              </div>

              {/* Preview of items detected if file loaded */}
              {uploadedFile && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Items Ready to Import ({MOCK_EXTRACTED_ITEMS[activeSoftwareConfig.key]?.length || 0} items)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Ready to Add
                    </Badge>
                  </div>

                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                    {(MOCK_EXTRACTED_ITEMS[activeSoftwareConfig.key] || []).map((it, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                            {it.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            SKU: {it.code} • {it.category} • GST {it.gstRate}%
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            ₹{it.salePrice}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Opening: {it.stockByGodown?.["godown-1"] || 0} {it.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-8 px-3 text-xs gap-1 border-slate-200 dark:border-slate-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={!uploadedFile || isImporting}
                  onClick={handleExecuteImport}
                  className="h-8 px-4 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-md shadow-2xs"
                >
                  {isImporting ? (
                    <span>Importing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        Import {MOCK_EXTRACTED_ITEMS[activeSoftwareConfig.key]?.length || 0} Items
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Success Screen */}
          {/* ======================================================== */}
          {step === 3 && activeSoftwareConfig && importResult && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Items Imported Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {importResult.added} item{importResult.added === 1 ? "" : "s"} from {activeSoftwareConfig.name} have been added to your inventory catalog.
                  {importResult.skipped > 0 && ` (${importResult.skipped} duplicate items were skipped).`}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-xs text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeSoftwareConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items Added:</span>
                  <span className="font-bold text-emerald-600">{importResult.added} Items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stock Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Main Warehouse</span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleResetAndClose}
                className="h-8 px-6 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs mt-2"
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

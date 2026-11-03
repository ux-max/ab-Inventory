"use client"

import React, { useState, useMemo, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Save,
  X,
  UploadCloud,
  Info,
  HelpCircle,
  Check,
  Star,
  Eye,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Plus,
  PlusCircle,
  Trash2,
  Edit3,
  Factory,
  Package,
  Warehouse,
  Sparkles,
  GripVertical,
  Image as ImageIcon,
  Calculator,
  AlertCircle,
  AlertTriangle,
  Search,
  Sliders
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"
import { cn, formatINR } from "@/lib/utils"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Item, ItemBatch } from "@/types/inventory"
import { FieldInfo } from "@/components/ui/field-info"
import { HsnSacDirectoryModal } from "@/components/modals/HsnSacDirectoryModal"
import { HsnSacItem } from "@/lib/gstConstants"
import { DocumentSettingsDrawer } from "@/components/modals/DocumentSettingsDrawer"

interface AddItemFormProps {
  onSave: (itemData: any) => void
  onCancel: () => void
  itemToEdit?: Item | null
}

export function AddItemForm({ onSave, onCancel, itemToEdit }: AddItemFormProps) {
  const isEditing = Boolean(itemToEdit)
  const {
    godowns,
    activeGodownId,
    parties,
    items,
    addItem,
    updateItem,
    gstSettings,
    taxGroups,
    itemFieldToggles,
    customItemFields,
    categories,
    units,
    addCategory,
    addUnit
  } = useApp()
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(itemToEdit?.customFields || {})
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false)

  // Modals for adding custom Unit & Category
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false)
  const [newUnitInput, setNewUnitInput] = useState("")
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState("")

  // Tab Navigation State
  type ItemFormTab = "info" | "inventory" | "bom"
  const [activeTab, setActiveTab] = useState<ItemFormTab>("info")

  // Form State matching Zoho Inventory images 1 & 2
  const [itemType, setItemType] = useState<"goods" | "service">(itemToEdit?.type === "service" ? "service" : "goods")
  const [name, setName] = useState(itemToEdit?.name || "")
  const [sku, setSku] = useState(itemToEdit?.code || "")
  const [itemCode, setItemCode] = useState(itemToEdit?.itemCode || itemToEdit?.code || "")
  const [unit, setUnit] = useState(itemToEdit?.unit || "box")
  const [category, setCategory] = useState(itemToEdit?.category || "General")

  // Memoized dynamic unit options with fallback for current unit
  const unitOptions = useMemo(() => {
    const list = [...(units || [])]
    if (unit && !list.some(u => u.toLowerCase() === unit.toLowerCase())) {
      list.push(unit)
    }
    return list.map(u => ({ value: u, label: u }))
  }, [units, unit])

  // Memoized dynamic category options with fallback for current category
  const categoryOptions = useMemo(() => {
    const list = [...(categories || [])]
    if (category && !list.some(c => c.toLowerCase() === category.toLowerCase())) {
      list.push(category)
    }
    return list.map(c => ({ value: c, label: c }))
  }, [categories, category])

  // Sales Information
  const [salesEnabled, setSalesEnabled] = useState(true)
  const [salesTaxType, setSalesTaxType] = useState<"exclusive" | "inclusive">(itemToEdit?.salesTaxType || "exclusive")
  const [sellingPrice, setSellingPrice] = useState<number | string>(itemToEdit ? (itemToEdit.salePrice ?? 0) : 250)
  const [salesDiscount, setSalesDiscount] = useState<number | string>(itemToEdit?.salesDiscount ?? 0)
  const [salesDiscountType, setSalesDiscountType] = useState<"percent" | "amount">(itemToEdit?.salesDiscountType || "percent")
  const [salesAccount, setSalesAccount] = useState("Sales")
  const [salesDescription, setSalesDescription] = useState("")

  // Purchase Information
  const [purchaseEnabled, setPurchaseEnabled] = useState(true)
  const [purchaseTaxType, setPurchaseTaxType] = useState<"exclusive" | "inclusive">(itemToEdit?.purchaseTaxType || "exclusive")
  const [costPrice, setCostPrice] = useState<number | string>(itemToEdit ? (itemToEdit.purchasePrice ?? 0) : 180)
  const [purchaseDiscount, setPurchaseDiscount] = useState<number | string>(itemToEdit?.purchaseDiscount ?? 0)
  const [purchaseAccount, setPurchaseAccount] = useState("Cost of Goods Sold")
  const [purchaseDescription, setPurchaseDescription] = useState("")
  const [preferredVendor, setPreferredVendor] = useState(parties.find(p => p.type === "supplier")?.id || "")

  // Wholesale Information
  const [wholesaleEnabled, setWholesaleEnabled] = useState(itemToEdit?.enableWholesale ?? false)
  const [wholesaleTaxType, setWholesaleTaxType] = useState<"exclusive" | "inclusive">(itemToEdit?.wholesaleTaxType || "exclusive")
  const [wholesalePrice, setWholesalePrice] = useState<number | string>(itemToEdit ? (itemToEdit.wholesalePrice ?? 0) : 210)
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number | string>(itemToEdit?.wholesaleMinQty ?? 50)
  const [wholesaleDiscount, setWholesaleDiscount] = useState<number | string>(itemToEdit?.wholesaleDiscount ?? 5)
  const [wholesaleDiscountType, setWholesaleDiscountType] = useState<"percent" | "amount">(itemToEdit?.wholesaleDiscountType || "percent")

  // MRP Information
  const [enableMrp, setEnableMrp] = useState(itemToEdit?.enableMrp ?? false)
  const [mrp, setMrp] = useState<number | string>(itemToEdit ? (itemToEdit.mrp ?? 0) : 300)
  const [discountOnMrp, setDiscountOnMrp] = useState<number | string>(itemToEdit?.discountOnMrp ?? 0)
  const [discountOnMrpType, setDiscountOnMrpType] = useState<"percent" | "amount">(itemToEdit?.discountOnMrpType || "percent")
  const [discountOnMrpForWholesale, setDiscountOnMrpForWholesale] = useState<number | string>(itemToEdit?.discountOnMrpForWholesale ?? 0)
  const [discountOnMrpForWholesaleType, setDiscountOnMrpForWholesaleType] = useState<"percent" | "amount">(itemToEdit?.discountOnMrpForWholesaleType || "percent")
  const [calculateTaxOnMrp, setCalculateTaxOnMrp] = useState(itemToEdit?.calculateTaxOnMrp ?? false)

  // Track Inventory Information
  const [trackInventory, setTrackInventory] = useState(true)
  const [inventoryAccount, setInventoryAccount] = useState("Inventory Asset")
  const [valuationMethod, setValuationMethod] = useState(itemToEdit?.valuationMethod || "FIFO")
  const [openingStock, setOpeningStock] = useState<number | string>(itemToEdit ? (itemToEdit.currentStock ?? 0) : 100)
  const [openingStockRate, setOpeningStockRate] = useState<number | string>(itemToEdit ? (itemToEdit.purchasePrice ?? 0) : 180)
  const [reorderPoint, setReorderPoint] = useState<number | string>(itemToEdit ? (itemToEdit.minStock ?? 0) : 20)
  const [openingGodownId, setOpeningGodownId] = useState(activeGodownId || godowns[0]?.id || "godown-1")

  // Batch & Expiry Tracking
  const [hasBatch, setHasBatch] = useState<boolean>(itemToEdit?.hasBatch ?? false)
  const [wholesaleCaution, setWholesaleCaution] = useState("")
  const [batchCaution, setBatchCaution] = useState("")
  const [batches, setBatches] = useState<ItemBatch[]>(
    itemToEdit?.batchDetails && itemToEdit.batchDetails.length > 0
      ? itemToEdit.batchDetails
      : []
  )

  const handleAddBatchRow = () => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]
    const autoBatchNo = `${sku ? sku.trim() : "BAT"}-${String(batches.length + 1).padStart(2, "0")}`
    setBatches(prev => [
      ...prev,
      {
        batchNo: autoBatchNo,
        manufacturingDate: todayStr,
        expiryDate: nextYear,
        quantity: 0,
        godownId: openingGodownId || godowns[0]?.id || "godown-1",
        mrp: Number(mrp) || undefined,
        purchasePrice: Number(costPrice) || undefined,
        costPrice: Number(costPrice) || undefined,
        salePrice: Number(sellingPrice) || undefined
      }
    ])
  }

  const handleUpdateBatchRow = (index: number, updates: Partial<ItemBatch>) => {
    setBatches(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b))
  }

  const handleRemoveBatchRow = (index: number) => {
    setBatches(prev => prev.filter((_, i) => i !== index))
  }

  // GST / Tax
  const [hsn, setHsn] = useState(itemToEdit?.hsn || (itemToEdit?.type === "service" ? "998314" : "3004"))
  const [gstRate, setGstRate] = useState(itemToEdit ? (itemToEdit.gstRate ?? 0) : (gstSettings?.enableGst ? 18 : 0))
  const [isHsnModalOpen, setIsHsnModalOpen] = useState(false)

  const handleSelectHsnSac = (selectedItem: HsnSacItem) => {
    setHsn(selectedItem.code)
    if (selectedItem.type !== itemType) {
      setItemType(selectedItem.type)
    }
    if (gstSettings?.enableGst && selectedItem.defaultGstRate !== undefined) {
      setGstRate(selectedItem.defaultGstRate)
    }
    setIsHsnModalOpen(false)
  }

  const handleItemTypeSelect = (newType: "goods" | "service") => {
    setItemType(newType)
    // If current code is the default code of the opposite type, adapt it seamlessly
    if (newType === "service" && (hsn === "3004" || !hsn)) {
      setHsn("998314")
    } else if (newType === "goods" && (hsn === "998314" || !hsn)) {
      setHsn("3004")
    }
  }

  // If GST is disabled, keep tax at 0 (None)
  React.useEffect(() => {
    if (!gstSettings?.enableGst) {
      setGstRate(0)
    }
  }, [gstSettings?.enableGst])

  // Images Upload & Gallery
  const initialImages: string[] = itemToEdit?.images || (itemToEdit?.image ? [itemToEdit.image] : [])
  const [images, setImages] = useState<string[]>(initialImages)
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(itemToEdit?.primaryImageIndex ?? 0)
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setImageError("")

    const remainingSlots = 15 - images.length
    if (remainingSlots <= 0) {
      setImageError("Maximum limit of 15 images reached.")
      return
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots)
    const validFiles: File[] = []

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setImageError("Only valid image formats (PNG, JPG, WebP, GIF, SVG) are allowed.")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError(`"${file.name}" exceeds 5MB limit. Please upload images under 5MB.`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setImages(prev => {
            if (prev.length >= 15) return prev
            return [...prev, result]
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== indexToRemove)
      if (primaryImageIndex >= updated.length) {
        setPrimaryImageIndex(Math.max(0, updated.length - 1))
      }
      return updated
    })
  }

  // Manufacturing / BOM Recipe Configuration
  const [isManufactured, setIsManufactured] = useState(Boolean(itemToEdit?.isManufactured))
  interface BOMRow {
    rawItemId: string
    rawItemName: string
    qty: number | string
    unit: string
    unitCost: number
  }
  const [bomRows, setBomRows] = useState<BOMRow[]>(
    itemToEdit?.bom && itemToEdit.bom.length > 0
      ? itemToEdit.bom.map(b => {
        const raw = items.find(i => i.id === b.rawItemId)
        return {
          rawItemId: b.rawItemId,
          rawItemName: raw?.name || b.rawItemName,
          qty: b.qty,
          unit: b.unit || raw?.unit || "pcs",
          unitCost: raw?.purchasePrice !== undefined ? raw.purchasePrice : (b.unitCost || 0)
        }
      })
      : [{ rawItemId: "", rawItemName: "", qty: 1, unit: "pcs", unitCost: 0 }]
  )

  // Smooth Drag & drop reorder matching Invoices
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(bomRows, setBomRows)

  const handleAddBomRow = () => {
    setBomRows(prev => [
      ...prev,
      { rawItemId: "", rawItemName: "", qty: 1, unit: "pcs", unitCost: 0 }
    ])
  }

  const handleRemoveBomRow = (index: number) => {
    if (bomRows.length <= 1) {
      setBomRows([{ rawItemId: "", rawItemName: "", qty: 1, unit: "pcs", unitCost: 0 }])
      return
    }
    setBomRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleBomItemSelect = (index: number, itemId: string) => {
    const itm = items.find(i => i.id === itemId)
    if (!itm) return
    setBomRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      return {
        ...row,
        rawItemId: itm.id,
        rawItemName: itm.name,
        unit: itm.unit || "pcs",
        unitCost: itm.purchasePrice || 0
      }
    }))
    if (unit === "box" && itm.unit) {
      setUnit(itm.unit)
    }
  }

  const handleBomQtyChange = (index: number, qtyVal: string) => {
    setBomRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      return { ...row, qty: qtyVal }
    }))
  }

  const handleBomUnitCostChange = (index: number, costVal: string) => {
    setBomRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      return { ...row, unitCost: Number(costVal) || 0 }
    }))
  }

  const totalBOMCost = useMemo(() => {
    return bomRows.reduce((sum, row) => {
      const q = Number(row.qty) || 0
      return sum + q * (row.unitCost || 0)
    }, 0)
  }, [bomRows])


  // Quick Add Raw Material Modal State
  const [isQuickRawOpen, setIsQuickRawOpen] = useState(false)
  const [quickRawTargetIndex, setQuickRawTargetIndex] = useState<number | null>(null)
  const [quickRawName, setQuickRawName] = useState("")
  const [quickRawSku, setQuickRawSku] = useState("")
  const [quickRawUnit, setQuickRawUnit] = useState("pcs")
  const [quickRawCost, setQuickRawCost] = useState<number | string>(0)
  const [quickRawSellingPrice, setQuickRawSellingPrice] = useState<number | string>("")
  const [isSellingPriceCustom, setIsSellingPriceCustom] = useState(false)
  const [quickRawStock, setQuickRawStock] = useState<number | string>(0)
  const [quickRawGodownId, setQuickRawGodownId] = useState(activeGodownId || godowns[0]?.id || "godown-1")
  const [quickRawError, setQuickRawError] = useState("")

  const handleOpenQuickRawModal = (index: number | null) => {
    setQuickRawTargetIndex(index)
    setQuickRawName("")
    setQuickRawSku("")
    setQuickRawUnit("pcs")
    setQuickRawCost(0)
    setQuickRawSellingPrice("")
    setIsSellingPriceCustom(false)
    setQuickRawStock(0)
    setQuickRawGodownId(activeGodownId || godowns[0]?.id || "godown-1")
    setQuickRawError("")
    setIsQuickRawOpen(true)
  }

  const handleSaveQuickRaw = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickRawName.trim()) {
      setQuickRawError("Raw material item name is required.")
      return
    }

    const generatedRawCode = quickRawSku.trim() || `RAW-${Date.now().toString().slice(-4)}`
    const parsedCost = Number(quickRawCost) || 0
    const parsedOpening = Number(quickRawStock) || 0
    const parsedSelling = quickRawSellingPrice !== "" && Number(quickRawSellingPrice) >= 0
      ? Number(quickRawSellingPrice)
      : Number((parsedCost * 1.25).toFixed(2))

    const rawItemPayload = {
      code: generatedRawCode,
      name: quickRawName.trim(),
      type: "product" as const,
      category: "Raw Materials",
      brand: "General",
      unit: quickRawUnit,
      hsn: "2905",
      gstRate: 18,
      salePrice: parsedSelling,
      purchasePrice: parsedCost,
      mrp: Number((parsedCost * 1.3).toFixed(2)),
      wholesalePrice: Number((parsedCost * 1.15).toFixed(2)),
      stockByGodown: {
        [quickRawGodownId]: parsedOpening
      },
      hasBatch: false,
      hasSerial: false,
      minStock: 10,
      isManufactured: false,
    }

    const res = addItem(rawItemPayload)
    if (!res.success) {
      setQuickRawError(res.message)
      return
    }

    const newlyCreatedItem = res.item || {
      id: `itm-${Date.now()}`,
      name: quickRawName.trim(),
      code: generatedRawCode,
      unit: quickRawUnit,
      purchasePrice: parsedCost,
      currentStock: parsedOpening,
    }

    if (quickRawTargetIndex !== null && quickRawTargetIndex < bomRows.length) {
      // Update targeted row
      setBomRows(prev => prev.map((row, i) => {
        if (i !== quickRawTargetIndex) return row
        return {
          ...row,
          rawItemId: newlyCreatedItem.id,
          rawItemName: newlyCreatedItem.name,
          unit: newlyCreatedItem.unit || quickRawUnit,
          unitCost: newlyCreatedItem.purchasePrice || parsedCost
        }
      }))
    } else {
      // Append as new row
      setBomRows(prev => [
        ...prev.filter(r => r.rawItemId !== ""),
        {
          rawItemId: newlyCreatedItem.id,
          rawItemName: newlyCreatedItem.name,
          qty: 1,
          unit: newlyCreatedItem.unit || quickRawUnit,
          unitCost: newlyCreatedItem.purchasePrice || parsedCost
        }
      ])
    }

    if (unit === "box" && (newlyCreatedItem.unit || quickRawUnit)) {
      setUnit(newlyCreatedItem.unit || quickRawUnit)
    }

    setIsQuickRawOpen(false)
  }

  // Quick Edit Raw Material Modal State (for editing raw material price & details directly from BOM row)
  const [isEditRawModalOpen, setIsEditRawModalOpen] = useState(false)
  const [editRawItemTarget, setEditRawItemTarget] = useState<Item | null>(null)
  const [editRawRowIndex, setEditRawRowIndex] = useState<number | null>(null)
  const [editRawName, setEditRawName] = useState("")
  const [editRawSku, setEditRawSku] = useState("")
  const [editRawUnit, setEditRawUnit] = useState("pcs")
  const [editRawCost, setEditRawCost] = useState<number | string>(0)
  const [editRawSellingPrice, setEditRawSellingPrice] = useState<number | string>("")
  const [isEditSellingPriceCustom, setIsEditSellingPriceCustom] = useState(false)
  const [editRawStock, setEditRawStock] = useState<number | string>(0)
  const [editRawError, setEditRawError] = useState("")

  const handleOpenEditRawModal = (rawItemId: string, rowIndex: number) => {
    const rawItm = items.find(i => i.id === rawItemId)
    if (!rawItm) return

    const currentRow = rowIndex < bomRows.length ? bomRows[rowIndex] : null
    const currentCost = (currentRow && currentRow.unitCost !== undefined && currentRow.unitCost !== 0)
      ? currentRow.unitCost
      : (rawItm.purchasePrice ?? 0)

    setEditRawItemTarget(rawItm)
    setEditRawRowIndex(rowIndex)
    setEditRawName(rawItm.name || "")
    setEditRawSku(rawItm.code || "")
    setEditRawUnit(rawItm.unit || "pcs")
    setEditRawCost(currentCost)
    setEditRawSellingPrice(rawItm.salePrice ?? Number((currentCost * 1.25).toFixed(2)))
    setIsEditSellingPriceCustom(true)
    setEditRawStock(rawItm.currentStock ?? 0)
    setEditRawError("")
    setIsEditRawModalOpen(true)
  }

  const handleSaveEditRaw = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editRawItemTarget) return
    if (!editRawName.trim()) {
      setEditRawError("Raw material item name is required.")
      return
    }

    const parsedCost = Number(editRawCost) || 0
    const parsedSelling = editRawSellingPrice !== "" && Number(editRawSellingPrice) >= 0
      ? Number(editRawSellingPrice)
      : Number((parsedCost * 1.25).toFixed(2))
    const parsedStock = Number(editRawStock) || 0

    const updates: Partial<Item> = {
      name: editRawName.trim(),
      code: editRawSku.trim() || editRawItemTarget.code,
      unit: editRawUnit,
      purchasePrice: parsedCost,
      salePrice: parsedSelling,
      mrp: Number((parsedCost * 1.3).toFixed(2)),
      wholesalePrice: Number((parsedCost * 1.15).toFixed(2)),
      currentStock: parsedStock,
    }

    const res = updateItem(editRawItemTarget.id, updates)
    if (!res.success) {
      setEditRawError(res.message)
      return
    }

    // Immediately update all matching BOM rows' unitCost, rawItemName, and unit
    setBomRows(prev => prev.map((row, i) => {
      if (i !== editRawRowIndex && row.rawItemId !== editRawItemTarget.id) return row
      return {
        ...row,
        rawItemName: editRawName.trim(),
        unit: editRawUnit,
        unitCost: parsedCost
      }
    }))

    setIsEditRawModalOpen(false)
  }

  const [errorMsg, setErrorMsg] = useState("")

  const handleAssignCode = () => {
    // Generate an automatic unique 12-digit barcode with standard GS1 890 prefix
    let candidate = ""
    for (let attempt = 0; attempt < 100; attempt++) {
      const random9 = Math.floor(100000000 + Math.random() * 900000000).toString()
      const testCode = `890${random9}`
      const isTaken = items.some(
        it => it.code === testCode || it.itemCode === testCode || it.barcode === testCode
      )
      if (!isTaken) {
        candidate = testCode
        break
      }
    }
    if (!candidate) {
      candidate = `890${Date.now().toString().slice(-9)}`
    }
    setItemCode(candidate)
    if (!sku.trim()) {
      setSku(candidate)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setActiveTab("info")
      setErrorMsg("Item Name is mandatory.")
      return
    }

    if (isManufactured) {
      const validBom = bomRows.filter(r => r.rawItemId && Number(r.qty) > 0)
      if (validBom.length === 0) {
        setActiveTab("bom")
        setErrorMsg("Please select at least one raw material component with a valid quantity for this manufacturing item.")
        return
      }
    }

    const finalCode = sku.trim() || itemCode.trim() || `ITM-${Math.floor(1000 + Math.random() * 9000)}`
    const finalItemCode = itemCode.trim() || finalCode
    const appliedGst = !gstSettings?.enableGst ? 0 : gstRate
    const parsedSaleInput = Number(sellingPrice) || 0
    const baseSale = salesTaxType === "inclusive" && appliedGst > 0
      ? Number((parsedSaleInput / (1 + appliedGst / 100)).toFixed(2))
      : parsedSaleInput

    const parsedCostInput = Number(costPrice) || 0
    const baseCost = purchaseTaxType === "inclusive" && appliedGst > 0
      ? Number((parsedCostInput / (1 + appliedGst / 100)).toFixed(2))
      : parsedCostInput

    const parsedWholesaleInput = Number(wholesalePrice) || 0
    const baseWholesale = wholesaleTaxType === "inclusive" && appliedGst > 0
      ? Number((parsedWholesaleInput / (1 + appliedGst / 100)).toFixed(2))
      : parsedWholesaleInput

    const parsedSalesDiscount = Number(salesDiscount) || 0
    const parsedPurchaseDiscount = Number(purchaseDiscount) || 0
    const parsedWholesaleMinQty = Number(wholesaleMinQty) || 0
    const parsedMrp = enableMrp ? (Number(mrp) || 0) : Number((baseSale * 1.2).toFixed(2))
    const parsedDiscountOnMrp = enableMrp ? (Number(discountOnMrp) || 0) : 0
    const parsedDiscountOnMrpForWholesale = enableMrp ? (Number(discountOnMrpForWholesale) || 0) : 0

    const parsedOpening = Number(openingStock) || 0
    const parsedMin = Number(reorderPoint) || 0

    const validBatches = hasBatch
      ? batches.filter(b => b.batchNo.trim()).map(b => ({
        ...b,
        batchNo: b.batchNo.trim(),
        quantity: Number(b.quantity) || 0,
        initialQuantity: b.initialQuantity !== undefined ? b.initialQuantity : (Number(b.quantity) || 0),
        godownId: b.godownId || openingGodownId,
        purchasePrice: b.purchasePrice !== undefined && Number(b.purchasePrice) > 0 ? Number(b.purchasePrice) : (Number(baseCost) || undefined),
        costPrice: b.purchasePrice !== undefined && Number(b.purchasePrice) > 0 ? Number(b.purchasePrice) : (b.costPrice !== undefined && Number(b.costPrice) > 0 ? Number(b.costPrice) : (Number(baseCost) || undefined)),
        salePrice: b.salePrice !== undefined && Number(b.salePrice) > 0 ? Number(b.salePrice) : (Number(baseSale) || undefined)
      }))
      : []

    const totalBatchQty = validBatches.reduce((sum, b) => sum + b.quantity, 0)
    const batchStockByGodown: Record<string, number> = {}
    validBatches.forEach(b => {
      batchStockByGodown[b.godownId] = (batchStockByGodown[b.godownId] || 0) + b.quantity
    })

    const finalItem = {
      ...(isEditing && itemToEdit ? { id: itemToEdit.id } : {}),
      code: finalCode,
      itemCode: finalItemCode,
      barcode: finalItemCode,
      name: name.trim(),
      category: isManufactured && category === "General" ? "Finished Assembly" : category,
      brand: isEditing && itemToEdit ? (itemToEdit.brand || "General") : "General",
      type: itemType === "service" ? ("service" as const) : ("product" as const),
      unit,
      hsn: !gstSettings?.enableHsnSac || !gstSettings?.enableGst ? "" : hsn.trim(),
      gstRate: !gstSettings?.enableGst ? 0 : gstRate,
      salePrice: baseSale,
      salesTaxType,
      salesDiscount: parsedSalesDiscount,
      salesDiscountType,
      purchasePrice: baseCost,
      purchaseTaxType,
      purchaseDiscount: parsedPurchaseDiscount,
      mrp: parsedMrp,
      enableMrp,
      discountOnMrp: parsedDiscountOnMrp,
      discountOnMrpType: enableMrp ? discountOnMrpType : "percent",
      discountOnMrpForWholesale: parsedDiscountOnMrpForWholesale,
      discountOnMrpForWholesaleType: enableMrp ? discountOnMrpForWholesaleType : "percent",
      calculateTaxOnMrp: enableMrp ? calculateTaxOnMrp : false,
      wholesalePrice: baseWholesale,
      wholesaleTaxType,
      enableWholesale: hasBatch ? false : wholesaleEnabled,
      wholesaleMinQty: parsedWholesaleMinQty,
      wholesaleDiscount: 0,
      wholesaleDiscountType: "percent",
      hasBatch,
      batchDetails: hasBatch && validBatches.length > 0 ? validBatches : undefined,
      currentStock: hasBatch && validBatches.length > 0
        ? totalBatchQty
        : (isEditing && itemToEdit
          ? itemToEdit.currentStock
          : (trackInventory ? parsedOpening : 0)),
      minStock: parsedMin,
      stockByGodown: hasBatch && validBatches.length > 0
        ? batchStockByGodown
        : (isEditing && itemToEdit
          ? (itemToEdit.stockByGodown || { [openingGodownId]: parsedOpening })
          : { [openingGodownId]: trackInventory ? parsedOpening : 0 }),
      itemType,
      salesEnabled,
      purchaseEnabled,
      trackInventory,
      salesDescription,
      purchaseDescription,
      inventoryAccount,
      valuationMethod,
      isManufactured,
      customFields: customFieldValues,
      images,
      image: images[primaryImageIndex] || images[0] || "",
      primaryImageIndex,
      bom: isManufactured ? bomRows.filter(r => r.rawItemId && Number(r.qty) > 0).map(r => ({
        rawItemId: r.rawItemId,
        rawItemName: r.rawItemName,
        qty: Number(r.qty) || 1,
        unit: r.unit || "pcs",
        unitCost: Number(r.unitCost) || 0
      })) : undefined,
    }

    onSave(finalItem)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* 1. Zoho Standard Form Header & Tab Bar (Locked at Top, Always 100% Visible) */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs z-30">
        {/* Title & Action Buttons */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Back to Items"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {isEditing ? "Edit Item" : "Add Item"}
              </h1>
              {isEditing && itemToEdit && (
                <Badge variant="blue" className="text-xs font-semibold py-0.5 px-2">
                  {itemToEdit.code}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Document Settings Drawer Button */}
            <button
              type="button"
              onClick={() => setIsDocSettingsOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Configure item fields & document settings"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Document Settings</span>
            </button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-slate-500" />
              <span>Cancel</span>
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isEditing ? "Update Item" : "Save"}</span>
            </Button>
          </div>
        </div>

        {/* 2. Three-Section Tab Navigation (Clean, Zoho Standard Style) */}
        <div className="px-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-6 overflow-x-auto select-none bg-slate-50/40 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "info"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
              }`}
          >
            <Package className="h-4 w-4" />
            <span>Item Information & Sales Information</span>
          </button>

          {itemFieldToggles?.inventoryTracking !== false && (
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "inventory"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
                }`}
            >
              <Warehouse className="h-4 w-4" />
              <span>Track Inventory for this item</span>
            </button>
          )}

          {itemFieldToggles?.manufacturing !== false && (
            <button
              type="button"
              onClick={() => setActiveTab("bom")}
              className={`flex items-center gap-2 py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "bom"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
                }`}
            >
              <Factory className="h-4 w-4" />
              <span>Manufacturing / BOM item</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Scrollable Form Canvas */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="w-full max-w-5xl px-8 py-6 space-y-7">

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: Item Information & Sales Information */}
            {activeTab === "info" && (
              <div className="space-y-7 animate-in fade-in duration-150">
                {/* SECTION 1: Item Type & Basic Info */}
                <div className="space-y-5">
                  {/* Item Type Radio */}
                  <div>
                    <div className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <span>Type</span>
                      <FieldInfo content="Specify whether this item is physical merchandise (Goods) or billable professional work/labor (Service)." title="Item Type" />
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="radio"
                          name="itemType"
                          value="goods"
                          checked={itemType === "goods"}
                          onChange={() => handleItemTypeSelect("goods")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>Goods</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                        <input
                          type="radio"
                          name="itemType"
                          value="service"
                          checked={itemType === "service"}
                          onChange={() => handleItemTypeSelect("service")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>Service</span>
                      </label>
                    </div>
                  </div>

                  {/* Grid: Name, SKU, Unit on Left | Image Upload on Right */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                    {/* Left Inputs (7 cols when images enabled, 12 cols when disabled) */}
                    <div className={`space-y-4 ${itemFieldToggles?.images !== false ? "md:col-span-7" : "md:col-span-12"}`}>
                      <div>
                        <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                          <span>Name*</span>
                          <FieldInfo content="Primary display name of the product or service shown on customer invoices, purchase orders, and stock catalogs." title="Item Name" />
                        </label>
                        <Input
                          type="text"
                          placeholder=""
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (errorMsg) setErrorMsg("")
                          }}
                          className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600"
                        />
                      </div>

                      {itemFieldToggles?.sku !== false && (
                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>SKU</span>
                            <FieldInfo content="Unique Stock Keeping Unit identifier to locate, scan, and track inventory for this product variant." title="SKU (Stock Keeping Unit)" />
                          </label>
                          <Input
                            type="text"
                            placeholder=""
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400">
                            <span>Unit*</span>
                            <FieldInfo content="Standard unit of measurement (UoM) used for counting, purchasing, and selling this item (e.g., pcs, box, kg, mtr)." title="Unit of Measurement" />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setNewUnitInput("")
                              setIsAddUnitModalOpen(true)
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Custom Unit</span>
                          </button>
                        </div>
                        <Select
                          value={unit}
                          onValueChange={(val) => setUnit(val)}
                          searchable
                          searchPlaceholder="Search or add custom unit..."
                          onAddCustom={(newU) => {
                            addUnit(newU)
                            setUnit(newU)
                          }}
                          addCustomLabel="Add Custom Unit"
                          className="w-full h-9 text-xs"
                          options={unitOptions}
                        />
                      </div>

                      {(itemFieldToggles?.category !== false || itemFieldToggles?.hsn !== false) && (
                        <div className={`grid ${itemFieldToggles?.category !== false && itemFieldToggles?.hsn !== false ? "grid-cols-2" : "grid-cols-1"} gap-3 pt-1`}>
                          {itemFieldToggles?.category !== false && (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                                  <span>Category</span>
                                  <FieldInfo content="Group related items into categories for structured inventory management, margin analysis, and sales reporting." title="Item Category" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewCategoryInput("")
                                    setIsAddCategoryModalOpen(true)
                                  }}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Custom</span>
                                </button>
                              </div>
                              <Select
                                value={category}
                                onValueChange={(val) => setCategory(val)}
                                searchable
                                searchPlaceholder="Search or add custom category..."
                                onAddCustom={(newC) => {
                                  addCategory(newC)
                                  setCategory(newC)
                                }}
                                addCustomLabel="Add Custom Category"
                                className="w-full h-9 text-xs"
                                options={categoryOptions}
                              />
                            </div>
                          )}

                          {itemFieldToggles?.hsn !== false && (
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>{itemType === "service" ? "Services (SAC Code)" : "Goods (HSN Code)"} / GST %</span>
                                <FieldInfo content="Official 4, 6, or 8-digit HSN (for Goods) or SAC (for Services) code paired with the applicable GST tax slab under Indian tax law." title="HSN/SAC & GST Slab" />
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex items-center">
                                  <Input
                                    type="text"
                                    placeholder={
                                      !gstSettings?.enableHsnSac || !gstSettings?.enableGst
                                        ? (itemType === "service" ? "SAC (Disabled)" : "HSN (Disabled)")
                                        : (itemType === "service" ? "SAC Code" : "HSN Code")
                                    }
                                    disabled={!gstSettings?.enableHsnSac || !gstSettings?.enableGst}
                                    value={!gstSettings?.enableHsnSac || !gstSettings?.enableGst ? "" : hsn}
                                    onChange={(e) => setHsn(e.target.value)}
                                    className={cn(
                                      "h-9 text-xs font-semibold tabular-nums w-28 pr-7 border-slate-300 dark:border-slate-700",
                                      (!gstSettings?.enableHsnSac || !gstSettings?.enableGst) && "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                    )}
                                  />
                                  {gstSettings?.enableHsnSac !== false && gstSettings?.enableGst !== false && (
                                    <button
                                      type="button"
                                      onClick={() => setIsHsnModalOpen(true)}
                                      className="absolute right-1 top-1 bottom-1 px-1.5 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                      title={`Search official Government ${itemType === "service" ? "SAC" : "HSN"} directory`}
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Select
                                    value={String(!gstSettings?.enableGst ? 0 : gstRate)}
                                    onValueChange={(val) => setGstRate(Number(val))}
                                    className="w-full h-9 text-xs"
                                    options={
                                      !gstSettings?.enableGst
                                        ? [{ value: "0", label: "None" }]
                                        : [
                                          { value: "0", label: "None [0%]" },
                                          ...(taxGroups || []).map(tg => ({
                                            value: String(tg.rate),
                                            label: `${tg.name} (${tg.rate}%)`,
                                            description: tg.subTaxes && tg.subTaxes.length > 0 ? tg.subTaxes.join(" + ") : undefined
                                          }))
                                        ]
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Item Code with Assign Code button matching Image 1 & marked red box in Image 2 */}
                      {itemFieldToggles?.barcode !== false && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              <span>Item Code / Barcode</span>
                              <FieldInfo content="Custom or auto-generated alphanumeric code or barcode for quick point-of-sale scanner lookup and physical stock counts." title="Item Code & Barcode" />
                            </label>
                            <div className="relative flex items-center">
                              <Input
                                type="text"
                                placeholder="Item Code"
                                value={itemCode}
                                onChange={(e) => setItemCode(e.target.value)}
                                className="h-9 text-xs pr-28 border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 bg-white dark:bg-slate-900 font-mono tracking-wide placeholder:text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={handleAssignCode}
                                className="absolute right-1 top-1 bottom-1 px-3.5 flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 dark:text-blue-400 rounded-full transition-colors border border-blue-200/50 shadow-2xs cursor-pointer select-none"
                                title="Generate unique barcode / item code"
                              >
                                Assign Code
                              </button>
                            </div>
                          </div>
                          <div></div>
                        </div>
                      )}
                    </div>

                    {/* Right: Drag Image Upload Box & Gallery (5 cols) */}
                    {itemFieldToggles?.images !== false && (
                      <div className="md:col-span-5">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleImageFiles(e.target.files)
                            if (e.target) e.target.value = ""
                          }}
                        />

                        {images.length === 0 ? (
                          <div>
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageFiles(e.dataTransfer.files) }}
                              className={cn(
                                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none",
                                isDragging
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]"
                                  : "border-sky-300/80 dark:border-sky-800/80 bg-sky-50/20 dark:bg-sky-950/10 hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
                              )}
                            >
                              <div className="h-12 w-12 rounded-full bg-sky-100/70 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 mb-3">
                                <UploadCloud className="h-6 w-6 text-sky-600" />
                              </div>
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Drag Image
                              </div>
                              <div className="text-[11px] text-slate-400 my-0.5">(or)</div>
                              <div className="text-xs">
                                <span className="text-blue-600 hover:underline font-semibold cursor-pointer">Click here</span>
                                <span className="text-slate-500"> to attach</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-3 max-w-[200px]">
                                (You can add up to 15 images, each not exceeding 5MB)
                              </div>
                            </div>
                            {imageError && (
                              <p className="text-[11px] text-rose-500 font-semibold mt-2 text-center animate-in fade-in">
                                {imageError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                            {/* Gallery Header Bar */}
                            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="blue" className="text-[10px] font-bold py-0.5 px-2">
                                  PRIMARY IMAGE {primaryImageIndex + 1} of {images.length}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" /> Add More ({15 - images.length} left)
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(primaryImageIndex)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete current image"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Main Preview Container */}
                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center relative min-h-[190px]">
                              <img
                                src={images[primaryImageIndex] || images[0]}
                                alt="Item Preview"
                                className="max-h-48 max-w-full object-contain rounded-md shadow-2xs"
                              />
                            </div>

                            {/* Thumbnails Strip */}
                            <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900">
                              {images.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setPrimaryImageIndex(idx)}
                                  className={cn(
                                    "relative h-12 w-12 rounded-md overflow-hidden shrink-0 border cursor-pointer group transition-all",
                                    primaryImageIndex === idx
                                      ? "border-blue-600 ring-2 ring-blue-500/40 shadow-xs"
                                      : "border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100"
                                  )}
                                >
                                  <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                                  {primaryImageIndex === idx && (
                                    <div className="absolute top-0.5 right-0.5 bg-blue-600 text-white p-0.5 rounded-full shadow-2xs">
                                      <Check className="h-2 w-2" />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveImage(idx)
                                    }}
                                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Remove image"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}

                              {images.length < 15 && (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="h-12 w-12 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                                  title="Attach another image"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Horizontal Divider */}
                <hr className="border-slate-200 dark:border-slate-800" />

                {/* SECTION 2: Sales & Purchase Information (Two Columns) matching Image 1 */}
                <div className={`grid grid-cols-1 ${itemFieldToggles?.purchasePrice !== false ? "md:grid-cols-2" : "md:grid-cols-1"} gap-8 items-start`}>

                  {/* Left Column: Sales Information */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                        <span>Sales Information</span>
                        <FieldInfo content="Enable to allow selling this item on customer invoices, sales orders, and delivery challans." title="Sales Information" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={salesEnabled}
                          onCheckedChange={setSalesEnabled}
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {salesEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    {salesEnabled && (
                      <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              <span>Price Type</span>
                              <FieldInfo content="Choose 'Without Tax' to enter net selling rate (GST added on top) or 'With Tax' to enter total retail price including GST." title="Sales Price Type" />
                            </label>
                            <Select
                              value={salesTaxType}
                              onValueChange={(val) => setSalesTaxType(val as "exclusive" | "inclusive")}
                              className="w-full h-9 text-xs"
                              options={[
                                { value: "exclusive", label: "Without Tax" },
                                { value: "inclusive", label: "With Tax" }
                              ]}
                            />
                          </div>

                          <div>
                            <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                              <span>{salesTaxType === "exclusive" ? "Selling Price (Without Tax)*" : "Selling Price (With Tax)*"}</span>
                              <FieldInfo content="Base price charged to your customers per unit before invoice discounts." title="Selling Price" />
                            </label>
                            <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                              <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                                INR
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium"
                              />
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                              {salesTaxType === "exclusive"
                                ? `₹${formatINR(Number(sellingPrice || 0) * (1 + gstRate / 100), 2)} with ${gstRate}% GST`
                                : `Base: ₹${formatINR(Number(sellingPrice || 0) / (1 + gstRate / 100), 2)} excl. GST`}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Discount</span>
                            <FieldInfo content="Default discount (flat amount ₹ or percentage %) automatically prefilled when adding this item to customer invoices." title="Default Sales Discount" />
                          </label>
                          <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 bg-white dark:bg-slate-900">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSalesDiscountType("percent")}
                                className={cn(
                                  "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                  salesDiscountType === "percent"
                                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                                title="Percentage Discount (%)"
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() => setSalesDiscountType("amount")}
                                className={cn(
                                  "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                  salesDiscountType === "amount"
                                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                                title="Amount Discount (₹)"
                              >
                                ₹
                              </button>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={salesDiscountType === "percent" ? "100" : undefined}
                              placeholder="0"
                              value={salesDiscount}
                              onChange={(e) => setSalesDiscount(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-transparent focus:outline-none font-medium tabular-nums"
                            />
                          </div>
                          {Number(salesDiscount || 0) > 0 && (
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium tabular-nums">
                              {salesDiscountType === "percent"
                                ? `Effective discount: ₹${formatINR((Number(sellingPrice || 0) * Number(salesDiscount || 0)) / 100, 2)} per unit`
                                : `Effective discount: ₹${formatINR(Number(salesDiscount || 0), 2)} per unit (${((Number(salesDiscount || 0) / (Number(sellingPrice) || 1)) * 100).toFixed(1)}%)`}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                            <span>Account*</span>
                            <FieldInfo content="The General Ledger revenue account credited upon item sale (e.g., Sales Account or Service Revenue)." title="Sales Revenue Account" />
                          </label>
                          <Select
                            value={salesAccount}
                            onValueChange={(val) => setSalesAccount(val)}
                            className="w-full h-9 text-xs"
                            options={[
                              { value: "Sales", label: "Sales" },
                              { value: "General Income", label: "General Income" },
                              { value: "Discount Income", label: "Discount Income" },
                            ]}
                          />
                        </div>

                        {itemFieldToggles?.description !== false && (
                          <div>
                            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              <span>Description</span>
                              <FieldInfo content="Item specifications, model details, or notes automatically printed below this line item on customer invoices." title="Sales Description" />
                            </label>
                            <textarea
                              rows={3}
                              value={salesDescription}
                              onChange={(e) => setSalesDescription(e.target.value)}
                              className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Purchase Information */}
                  {itemFieldToggles?.purchasePrice !== false && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                          <span>Purchase Information</span>
                          <FieldInfo content="Enable to allow buying this item on vendor bills, purchase orders, and goods receipts." title="Purchase Information" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={purchaseEnabled}
                            onCheckedChange={setPurchaseEnabled}
                          />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {purchaseEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {purchaseEnabled && (
                        <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Price Type</span>
                                <FieldInfo content="Choose 'Without Tax' if supplier quotes base price, or 'With Tax' if supplier invoice is tax-inclusive." title="Purchase Price Type" />
                              </label>
                              <Select
                                value={purchaseTaxType}
                                onValueChange={(val) => setPurchaseTaxType(val as "exclusive" | "inclusive")}
                                className="w-full h-9 text-xs"
                                options={[
                                  { value: "exclusive", label: "Without Tax" },
                                  { value: "inclusive", label: "With Tax" }
                                ]}
                              />
                            </div>

                            <div>
                              <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                                <span>{purchaseTaxType === "exclusive" ? "Cost Price (Without Tax)*" : "Cost Price (With Tax)*"}</span>
                                <FieldInfo content="Purchase acquisition cost per unit paid to vendors, used to calculate profit margins and inventory valuation." title="Cost Price" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                                <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                                  INR
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={costPrice}
                                  onChange={(e) => setCostPrice(e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium"
                                />
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                                {purchaseTaxType === "exclusive"
                                  ? `₹${formatINR(Number(costPrice || 0) * (1 + gstRate / 100), 2)} with ${gstRate}% GST`
                                  : `Base: ₹${formatINR(Number(costPrice || 0) / (1 + gstRate / 100), 2)} excl. GST`}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                              <span>Account*</span>
                              <FieldInfo content="The General Ledger expense account debited when purchasing this item (e.g., Cost of Goods Sold or Raw Material Expenses)." title="Purchase Expense Account" />
                            </label>
                            <Select
                              value={purchaseAccount}
                              onValueChange={(val) => setPurchaseAccount(val)}
                              className="w-full h-9 text-xs"
                              options={[
                                { value: "Cost of Goods Sold", label: "Cost of Goods Sold" },
                                { value: "Raw Material Expenses", label: "Raw Material Expenses" },
                                { value: "Operating Cost", label: "Operating Cost" },
                              ]}
                            />
                          </div>

                          {itemFieldToggles?.description !== false && (
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Description</span>
                                <FieldInfo content="Internal procurement notes or technical vendor specifications printed on purchase orders sent to suppliers." title="Purchase Description" />
                              </label>
                              <textarea
                                rows={3}
                                value={purchaseDescription}
                                onChange={(e) => setPurchaseDescription(e.target.value)}
                                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                            </div>
                          )}

                          <div>
                            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              <span>Preferred Vendor</span>
                              <FieldInfo content="Primary supplier or manufacturer for this item to expedite purchase order reordering and vendor tracking." title="Preferred Vendor" />
                            </label>
                            <Select
                              searchable
                              allowCustomValue
                              searchPlaceholder="Search vendor by name, GSTIN..."
                              value={preferredVendor}
                              onValueChange={(val) => setPreferredVendor(val)}
                              placeholder="Select or add vendor"
                              className="w-full h-9 text-xs font-medium"
                              options={[
                                { value: "", label: "Select or add vendor" },
                                ...parties.filter(p => p.type === "supplier" || p.type === "both").map(p => ({
                                  value: p.id,
                                  label: p.name,
                                  description: p.gstin ? `GSTIN: ${p.gstin}${p.state ? ` • ${p.state}` : ""}` : (p.phone ? `Phone: ${p.phone}` : undefined)
                                }))
                              ]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* SECTION 3: Wholesale Information */}
                {itemFieldToggles?.wholesale !== false && (
                  <>
                    <hr className="border-slate-200 dark:border-slate-800" />
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                          <span>Wholesale Information</span>
                          <FieldInfo content="Enable bulk-order pricing tiers for commercial clients or wholesale customers." title="Wholesale Information" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={wholesaleEnabled}
                            disabled={hasBatch}
                            onCheckedChange={(checked) => {
                              if (checked && hasBatch) {
                                setWholesaleCaution("Batch tracking is active for this product. Wholesale bulk pricing cannot be combined with the batch system. Please disable batch tracking first.")
                                return
                              }
                              setWholesaleCaution("")
                              setWholesaleEnabled(checked)
                            }}
                          />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {hasBatch ? "Disabled (Batches Active)" : wholesaleEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        {hasBatch && (
                          <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Batch tracking is active for this product. Wholesale bulk pricing is disabled for batched items.</span>
                          </div>
                        )}
                        {!hasBatch && wholesaleCaution && (
                          <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{wholesaleCaution}</span>
                          </div>
                        )}
                      </div>

                      {wholesaleEnabled && (
                        <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Price Type</span>
                                <FieldInfo content="Choose whether the wholesale bulk rate includes or excludes GST." title="Wholesale Price Type" />
                              </label>
                              <Select
                                value={wholesaleTaxType}
                                onValueChange={(val) => setWholesaleTaxType(val as "exclusive" | "inclusive")}
                                className="w-full h-9 text-xs"
                                options={[
                                  { value: "exclusive", label: "Without Tax" },
                                  { value: "inclusive", label: "With Tax" }
                                ]}
                              />
                            </div>

                            <div>
                              <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                                <span>{wholesaleTaxType === "exclusive" ? "Wholesale Price (Without Tax)*" : "Wholesale Price (With Tax)*"}</span>
                                <FieldInfo content="Discounted per-unit price charged when a customer purchases at or above the wholesale minimum quantity." title="Wholesale Rate" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                                <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                                  INR
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={wholesalePrice}
                                  onChange={(e) => setWholesalePrice(e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium"
                                />
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                                {wholesaleTaxType === "exclusive"
                                  ? `₹${formatINR(Number(wholesalePrice || 0) * (1 + gstRate / 100), 2)} with ${gstRate}% GST`
                                  : `Base: ₹${formatINR(Number(wholesalePrice || 0) / (1 + gstRate / 100), 2)} excl. GST`}
                              </div>
                            </div>

                            <div>
                              <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                                <span>Wholesale Minimum Quantity*</span>
                                <FieldInfo content="Minimum order quantity threshold required to automatically trigger wholesale pricing on sales orders." title="Wholesale Minimum Quantity" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                                <input
                                  type="number"
                                  min="1"
                                  value={wholesaleMinQty}
                                  onChange={(e) => setWholesaleMinQty(e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium"
                                />
                                <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-l border-slate-200 dark:border-slate-700">
                                  {unit}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                Threshold to trigger wholesale rates
                              </div>
                            </div>
                          </div>

                          {/* Informative Rule Helper Banner */}
                          <div className="flex items-center gap-2 p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300">
                            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span>
                              When wholesale is enabled, if order/invoice quantity is equal to or greater than minimum wholesale quantity (<strong>{wholesaleMinQty || 1} {unit}</strong>), pricing will automatically calculate at the wholesale rate (<strong>₹{wholesalePrice ? formatINR(Number(wholesalePrice)) : "0"}</strong>).
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* SECTION 4: Maximum Retail Price (MRP) & Tax Assessment */}
                {itemFieldToggles?.mrp !== false && (
                  <>
                    <hr className="border-slate-200 dark:border-slate-800" />
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                          <span>Maximum Retail Price (MRP)</span>
                          <FieldInfo content="Enable statutory MRP packaging calculations and consumer discount structures." title="Maximum Retail Price (MRP)" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={enableMrp}
                            onCheckedChange={setEnableMrp}
                          />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {enableMrp ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {enableMrp && (
                        <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 1. MRP Input */}
                            <div>
                              <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                                <span>MRP (Maximum Retail Price)*</span>
                                <FieldInfo content="Maximum consumer price printed on the product packaging, which cannot legally be exceeded at retail." title="Maximum Retail Price" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                                <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                                  INR
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={mrp}
                                  onChange={(e) => setMrp(e.target.value)}
                                  placeholder="0.00"
                                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium tabular-nums"
                                />
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                Printed packaging maximum retail price
                              </div>
                            </div>

                            {/* 2. Disc on MRP for Sale */}
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Disc on MRP for Sale</span>
                                <FieldInfo content="Standard retail discount deducted from packaging MRP for regular consumer sales." title="Retail Discount on MRP" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 bg-white dark:bg-slate-900">
                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setDiscountOnMrpType("percent")}
                                    className={cn(
                                      "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                      discountOnMrpType === "percent"
                                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                    title="Percentage Discount (%)"
                                  >
                                    %
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDiscountOnMrpType("amount")}
                                    className={cn(
                                      "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                      discountOnMrpType === "amount"
                                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                    title="Amount Discount (₹)"
                                  >
                                    ₹
                                  </button>
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={discountOnMrpType === "percent" ? "100" : undefined}
                                  placeholder="0"
                                  value={discountOnMrp}
                                  onChange={(e) => setDiscountOnMrp(e.target.value)}
                                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-transparent focus:outline-none font-medium tabular-nums"
                                />
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                                {Number(mrp || 0) > 0 && Number(discountOnMrp || 0) > 0 ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {discountOnMrpType === "percent"
                                      ? `Sale Rate: ₹${formatINR(Number(mrp || 0) * (1 - Number(discountOnMrp || 0) / 100), 2)} after ${discountOnMrp}% off`
                                      : `Sale Rate: ₹${formatINR(Math.max(0, Number(mrp || 0) - Number(discountOnMrp || 0)), 2)} after ₹${discountOnMrp} off`}
                                  </span>
                                ) : (
                                  "Default discount for retail/regular sales"
                                )}
                              </div>
                            </div>

                            {/* 3. Disc on MRP for Wholesale */}
                            <div>
                              <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                <span>Disc on MRP for Wholesale</span>
                                <FieldInfo content="Bulk wholesale discount deducted from packaging MRP when an order meets the wholesale quantity threshold." title="Wholesale Discount on MRP" />
                              </label>
                              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 bg-white dark:bg-slate-900">
                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setDiscountOnMrpForWholesaleType("percent")}
                                    className={cn(
                                      "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                      discountOnMrpForWholesaleType === "percent"
                                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                    title="Percentage Discount (%)"
                                  >
                                    %
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDiscountOnMrpForWholesaleType("amount")}
                                    className={cn(
                                      "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                                      discountOnMrpForWholesaleType === "amount"
                                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                    title="Amount Discount (₹)"
                                  >
                                    ₹
                                  </button>
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={discountOnMrpForWholesaleType === "percent" ? "100" : undefined}
                                  placeholder="0"
                                  value={discountOnMrpForWholesale}
                                  onChange={(e) => setDiscountOnMrpForWholesale(e.target.value)}
                                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-transparent focus:outline-none font-medium tabular-nums"
                                />
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                                {Number(mrp || 0) > 0 && Number(discountOnMrpForWholesale || 0) > 0 ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {discountOnMrpForWholesaleType === "percent"
                                      ? `Wholesale Rate: ₹${formatINR(Number(mrp || 0) * (1 - Number(discountOnMrpForWholesale || 0) / 100), 2)} after ${discountOnMrpForWholesale}% off`
                                      : `Wholesale Rate: ₹${formatINR(Math.max(0, Number(mrp || 0) - Number(discountOnMrpForWholesale || 0)), 2)} after ₹${discountOnMrpForWholesale} off`}
                                  </span>
                                ) : (
                                  "Applied when order meets wholesale min qty"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* GST Tax Assessment on MRP */}
                          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={calculateTaxOnMrp}
                                onChange={(e) => setCalculateTaxOnMrp(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="text-xs">
                                <span className="inline-flex items-center font-semibold text-slate-800 dark:text-slate-200">
                                  <span>Calculate Tax based on MRP (Section 4A / Abatement)</span>
                                  <FieldInfo content="Under Section 4A of the Central Excise/GST Act, tax is assessed on printed packaging MRP (or abated MRP) rather than actual discounted transaction value. Mandatory for certain notified commodities (e.g. medicines, cosmetics)." title="MRP-Based Tax Assessment" />
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                  GST tax is assessed on the full MRP rather than discounted transaction value.
                                </p>
                              </div>
                            </label>
                          </div>

                          {/* Informative Helper Banner */}
                          <div className="flex items-center gap-2 p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300">
                            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span>
                              When MRP is enabled: Regular sales populate with MRP (<strong>₹{mrp ? formatINR(Number(mrp)) : "0"}</strong>) and <strong>{discountOnMrpType === "amount" ? `₹${discountOnMrp || 0}` : `${discountOnMrp || 0}%`}</strong> discount. Wholesale orders populate with <strong>{discountOnMrpForWholesaleType === "amount" ? `₹${discountOnMrpForWholesale || 0}` : `${discountOnMrpForWholesale || 0}%`}</strong> discount{calculateTaxOnMrp ? ", with GST assessed on full MRP" : ""}.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* SECTION 5: Configured Custom Item Fields */}
                {customItemFields && customItemFields.filter(f => f.isEnabled).length > 0 && (
                  <>
                    <hr className="border-slate-200 dark:border-slate-800" />
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">
                          Custom Attributes
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Custom fields configured in Settings &gt; Items
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {customItemFields.filter(f => f.isEnabled).map((field) => (
                          <div key={field.id}>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              {field.name}
                            </label>
                            {field.type === "select" ? (
                              <Select
                                value={customFieldValues[field.id] || ""}
                                onValueChange={(val) => setCustomFieldValues(prev => ({ ...prev, [field.id]: val }))}
                                className="w-full h-9 text-xs"
                                options={[
                                  { value: "", label: "Select option" },
                                  ...(field.options || []).map(opt => ({ value: opt, label: opt }))
                                ]}
                              />
                            ) : (
                              <Input
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={customFieldValues[field.id] || ""}
                                onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                className="h-9 text-xs"
                                placeholder={`Enter ${field.name.toLowerCase()}...`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 1 Navigation Footer */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400">
                    Step 1 of 3 • Basic item details, sales price & purchase rates
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("inventory")}
                    className="h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Next: Track Inventory</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: Track Inventory for this item */}
            {activeTab === "inventory" && (
              <div className="space-y-7 animate-in fade-in duration-150">
                {/* SECTION 3: Track Inventory for this item */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                      <span>Track Inventory for this item</span>
                      <FieldInfo content="Maintains real-time stock balances, batch logs, warehouse transfers, and low-stock alerts. Once transactions exist, this cannot be toggled." title="Inventory Tracking" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={trackInventory}
                        onCheckedChange={setTrackInventory}
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {trackInventory ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      You cannot enable/disable inventory tracking once you&apos;ve created transactions for this item
                    </p>
                  </div>

                  {trackInventory && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                      {/* Row 1: Inventory Account & Valuation Method */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                            <span>Inventory Account*</span>
                            <FieldInfo content="The Balance Sheet asset account tracking the monetary valuation of stock on hand (e.g., Inventory Asset)." title="Inventory Asset Account" />
                          </label>
                          <Select
                            value={inventoryAccount}
                            onValueChange={(val) => setInventoryAccount(val)}
                            className="w-full h-9 text-xs"
                            options={[
                              { value: "Inventory Asset", label: "Inventory Asset" },
                              { value: "Finished Goods Stock", label: "Finished Goods Stock" },
                              { value: "Work in Progress (WIP)", label: "Work in Progress (WIP)" },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                            <span>Inventory Valuation Method*</span>
                            <FieldInfo content="Costing method used to calculate inventory asset value and cost of goods sold (FIFO: First-In First-Out, or Weighted Average Cost)." title="Valuation Method" />
                          </label>
                          <Select
                            value={valuationMethod}
                            onValueChange={(val) => setValuationMethod(val)}
                            className="w-full h-9 text-xs"
                            options={[
                              { value: "FIFO", label: "FIFO (First In First Out)" },
                              { value: "Weighted Average", label: "Weighted Average Cost" },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Row 2: Opening Stock & Opening Stock Rate per Unit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Opening Stock</span>
                            <FieldInfo content="Initial physical quantity already in your warehouse before entering new purchases or sales in this system." title="Opening Stock Quantity" />
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={openingStock}
                            onChange={(e) => setOpeningStock(e.target.value)}
                            className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Opening Stock Rate per Unit</span>
                            <FieldInfo content="Unit cost used to compute the starting monetary asset balance of your opening inventory." title="Opening Unit Cost" />
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={openingStockRate}
                            onChange={(e) => setOpeningStockRate(e.target.value)}
                            className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                          />
                        </div>
                      </div>

                      {/* Row 3: Reorder Point & Opening Godown Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Reorder Point</span>
                            <FieldInfo content="Minimum inventory threshold. When available stock reaches or drops below this number, the system triggers a reorder alert." title="Reorder Point Threshold" />
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={reorderPoint}
                            onChange={(e) => setReorderPoint(e.target.value)}
                            className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Opening Godown / Warehouse</span>
                            <FieldInfo content="The physical warehouse or godown where opening stock is initially stored." title="Warehouse Godown" />
                          </label>
                          <Select
                            value={openingGodownId}
                            onValueChange={(val) => setOpeningGodownId(val)}
                            className="w-full h-9 text-xs"
                            options={godowns.map(g => ({
                              value: g.id,
                              label: g.name
                            }))}
                          />
                        </div>
                      </div>

                      {/* Row 4: Batch & Expiry Date Tracking */}
                      {itemFieldToggles?.batchTracking !== false && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                                <span>Batch & Expiry Date Tracking</span>
                                <FieldInfo content="Track distinct manufacturing lots, expiry dates, and lot-wise stock balances for statutory compliance and FIFO dispatch." title="Batch & Expiry Tracking" />
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Enable to assign batch numbers and track shelf-life for individual lots of this product.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={hasBatch}
                                onCheckedChange={(checked) => {
                                  if (checked && wholesaleEnabled) {
                                    setBatchCaution("Wholesale pricing has been automatically disabled because the batch system uses individual batch lot pricing and does not support wholesale bulk rates.")
                                    setWholesaleEnabled(false)
                                  } else {
                                    setBatchCaution("")
                                  }
                                  setHasBatch(checked)
                                  if (checked && batches.length === 0) {
                                    handleAddBatchRow()
                                  }
                                }}
                              />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                {hasBatch ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>

                          {batchCaution && hasBatch && (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 animate-in fade-in duration-150">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{batchCaution}</span>
                            </div>
                          )}

                          {hasBatch && (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Initial Product Batches ({batches.length})
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleAddBatchRow}
                                  className="h-7 text-xs font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Batch</span>
                                </Button>
                              </div>

                              {batches.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    No batches added yet. Click &quot;Add Batch&quot; to configure your opening lots.
                                  </p>
                                </div>
                              ) : (
                                <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                                        <TableHead className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">BATCH NUMBER</TableHead>
                                        <TableHead className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">MFG DATE</TableHead>
                                        <TableHead className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">EXPIRY DATE</TableHead>
                                        <TableHead className="px-2 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">PURCHASE (₹)</TableHead>
                                        <TableHead className="px-2 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">SALE (₹)</TableHead>
                                        <TableHead className="px-2 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">QTY ({unit})</TableHead>
                                        <TableHead className="px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">GODOWN</TableHead>
                                        <TableHead className="w-8 px-1 py-2 text-center text-xs"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {batches.map((batch, bIdx) => (
                                        <TableRow key={bIdx} className="border-b border-slate-100 dark:border-slate-800/60">
                                          <TableCell className="px-2.5 py-2">
                                            <Input
                                              value={batch.batchNo}
                                              onChange={(e) => handleUpdateBatchRow(bIdx, { batchNo: e.target.value })}
                                              placeholder="e.g. BATCH-01"
                                              className="h-8 text-xs font-mono font-medium"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2.5 py-2">
                                            <Input
                                              type="date"
                                              value={batch.manufacturingDate}
                                              onChange={(e) => handleUpdateBatchRow(bIdx, { manufacturingDate: e.target.value })}
                                              className="h-8 text-xs"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2.5 py-2">
                                            <Input
                                              type="date"
                                              value={batch.expiryDate}
                                              onChange={(e) => handleUpdateBatchRow(bIdx, { expiryDate: e.target.value })}
                                              className="h-8 text-xs"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2 py-2 text-right">
                                            <Input
                                              type="number"
                                              min="0"
                                              step="any"
                                              placeholder={String(costPrice || 0)}
                                              value={batch.purchasePrice ?? batch.costPrice ?? ""}
                                              onChange={(e) => {
                                                const val = e.target.value === "" ? undefined : Number(e.target.value)
                                                handleUpdateBatchRow(bIdx, { purchasePrice: val, costPrice: val })
                                              }}
                                              className="h-8 text-xs text-right font-medium"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2 py-2 text-right">
                                            <Input
                                              type="number"
                                              min="0"
                                              step="any"
                                              placeholder={String(sellingPrice || 0)}
                                              value={batch.salePrice ?? ""}
                                              onChange={(e) => {
                                                const val = e.target.value === "" ? undefined : Number(e.target.value)
                                                handleUpdateBatchRow(bIdx, { salePrice: val })
                                              }}
                                              className="h-8 text-xs text-right font-medium"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2 py-2 text-right">
                                            <Input
                                              type="number"
                                              min="0"
                                              value={batch.quantity}
                                              onChange={(e) => handleUpdateBatchRow(bIdx, { quantity: Number(e.target.value) || 0 })}
                                              className="h-8 text-xs text-right font-medium"
                                            />
                                          </TableCell>
                                          <TableCell className="px-2.5 py-2">
                                            <Select
                                              value={batch.godownId || openingGodownId}
                                              onValueChange={(val) => handleUpdateBatchRow(bIdx, { godownId: val })}
                                              className="w-full h-8 text-xs"
                                              options={godowns.map(g => ({
                                                value: g.id,
                                                label: g.name
                                              }))}
                                            />
                                          </TableCell>
                                          <TableCell className="px-1 py-2 text-center">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRemoveBatchRow(bIdx)}
                                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600 dark:text-slate-400">
                                <span>
                                  Total Batch Quantity: <strong className="text-slate-900 dark:text-white font-semibold">{batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)} {unit}</strong>
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Sum of batch quantities will establish opening stock
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* TAB 2 Navigation Footer */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("info")}
                    className="h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back: Item & Sales Info</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("bom")}
                    className="h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Next: Manufacturing / BOM</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: Manufacturing / BOM item */}
            {activeTab === "bom" && (
              <div className="space-y-7 animate-in fade-in duration-150">
                {/* SECTION 4: Manufacturing / BOM Recipe Specification */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center text-xs font-bold text-slate-900 dark:text-white mb-2">
                      <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="ml-1.5">Manufacturing / BOM Recipe</span>
                      <FieldInfo content="Bill of Materials blueprint defining the constituent raw materials and assembly components required to manufacture 1 unit of this finished item." title="Manufacturing / BOM Recipe" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isManufactured}
                        onCheckedChange={(checked) => {
                          setIsManufactured(checked)
                          if (checked && category === "General") {
                            setCategory("Finished Assembly")
                          }
                        }}
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {isManufactured ? "Enabled (This is a Manufactured / Assembly item)" : "Disabled"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Define the raw materials and component quantities required to manufacture 1 unit of this finished item.
                    </p>
                  </div>

                  {isManufactured && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                      {/* BOM Line Items Table matching Invoices (NewInvoiceForm) */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-[#f4f7fa] dark:bg-slate-900 divide-x divide-slate-200 dark:divide-slate-800">
                              <TableHead className="w-10 px-2 py-2.5 text-center"></TableHead>
                              <TableHead className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                <div className="flex items-center gap-1">
                                  <span>RAW MATERIAL / COMPONENT</span>
                                  <FieldInfo content="Select an existing stock item used as an input ingredient or component." title="Raw Materials" />
                                </div>
                              </TableHead>
                              <TableHead className="w-36 px-4 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                  <span>QTY PER UNIT</span>
                                  <FieldInfo content="Quantity of this material consumed to produce 1 unit of finished output." title="Consumption Quantity" />
                                </div>
                              </TableHead>
                              <TableHead className="w-36 px-4 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span>UNIT RATE (₹)</span>
                                  <Calculator className="h-3.5 w-3.5 text-slate-400 inline" />
                                </div>
                              </TableHead>
                              <TableHead className="w-36 px-4 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                TOTAL COST (₹)
                              </TableHead>
                              <TableHead className="w-16 px-2 py-2.5 text-center"></TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody ref={tbodyRef}>
                            {bomRows.map((row, index) => {
                              const rowQty = Number(row.qty) || 0
                              const rowCost = rowQty * (row.unitCost || 0)
                              const itm = items.find(i => i.id === row.rawItemId)

                              return (
                                <TableRow
                                  key={index}
                                  className={cn(
                                    "group border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 transition-all duration-150 ease-out",
                                    activeDragIndex === index
                                      ? "bg-blue-50/90 dark:bg-blue-950/70 shadow-md ring-2 ring-blue-500/40 z-20 scale-[1.003]"
                                      : "hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
                                  )}
                                >
                                  {/* Drag Grip Handle */}
                                  <TableCell className="w-10 px-2 py-3 text-center align-middle">
                                    <div
                                      onPointerDown={(e) => handlePointerDown(e, index)}
                                      className={cn(
                                        "p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-grab active:cursor-grabbing inline-flex items-center justify-center transition-all select-none touch-none",
                                        activeDragIndex === index && "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 cursor-grabbing scale-110 shadow-xs"
                                      )}
                                      title="Click and drag to smoothly reorder"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                  </TableCell>

                                  {/* Raw Material Select */}
                                  <TableCell className="px-3 py-3">
                                    <div className="flex items-start gap-2.5">
                                      <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 mt-0.5">
                                        {(itm?.images?.[0] || itm?.image) ? (
                                          <img
                                            src={itm.images?.[0] || itm.image}
                                            alt={itm.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <Package className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <Select
                                          searchable
                                          allowCustomValue
                                          searchPlaceholder="Search raw material by name, SKU..."
                                          value={row.rawItemId}
                                          onValueChange={(val) => {
                                            if (val === "__new_raw__") {
                                              handleOpenQuickRawModal(index)
                                            } else {
                                              handleBomItemSelect(index, val)
                                            }
                                          }}
                                          placeholder="Type or click to select an item."
                                          size="sm"
                                          className="w-full h-8 text-xs font-medium"
                                          options={[
                                            { value: "", label: "Type or click to select an item." },
                                            {
                                              value: "__new_raw__",
                                              label: "+ Add New Raw Material...",
                                              description: "Create and register a new raw material item on the fly"
                                            },
                                            ...items.map((i) => ({
                                              value: i.id,
                                              label: i.name,
                                              description: `SKU: ${i.code} • Rate: ₹${i.purchasePrice} • Stock: ${i.currentStock ?? 0} ${i.unit}`,
                                            }))
                                          ]}
                                        />
                                        {row.rawItemId && itm && (
                                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                            <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{itm.code || "N/A"}</span></span>
                                            <span>•</span>
                                            <span>Available Stock: <strong className="text-slate-700 dark:text-slate-200">{itm.currentStock ?? 0} {itm.unit}</strong></span>
                                            <span>•</span>
                                            <span>Unit: <span className="font-semibold text-slate-600 dark:text-slate-300">{itm.unit || "pcs"}</span></span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* Quantity per Unit */}
                                  <TableCell className="px-3 py-3 text-center">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <Input
                                        type="number"
                                        min="0.001"
                                        step="any"
                                        value={row.qty}
                                        onChange={(e) => handleBomQtyChange(index, e.target.value)}
                                        className="h-8 text-right text-xs w-24 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2.5 font-medium tabular-nums"
                                      />
                                      <span className="text-[11px] font-semibold text-slate-500 w-10 text-left">
                                        {row.unit || "pcs"}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Unit Rate */}
                                  <TableCell className="px-3 py-3 text-right">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.unitCost}
                                      onChange={(e) => handleBomUnitCostChange(index, e.target.value)}
                                      className="h-8 text-right text-xs w-28 ml-auto tabular-nums font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:border-blue-600 px-2.5"
                                    />
                                  </TableCell>

                                  {/* Total Cost */}
                                  <TableCell className="px-4 py-3 text-right tabular-nums text-xs font-bold text-slate-900 dark:text-white">
                                    ₹{rowCost.toFixed(2)}
                                  </TableCell>

                                  {/* Actions: Edit Raw Material & Delete Line */}
                                  <TableCell className="w-16 px-2 py-3 text-center align-middle">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        disabled={!row.rawItemId}
                                        onClick={() => handleOpenEditRawModal(row.rawItemId, index)}
                                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                        title={row.rawItemId ? "Edit Raw Material Price & Details" : "Select an item first"}
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBomRow(index)}
                                        className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                        title="Remove Line"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Action Buttons below table (matching NewInvoiceForm lines 564-580) */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
                        {/* Left Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleAddBomRow}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
                          >
                            <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span>Add New Line Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQuickRawModal(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
                          >
                            <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span>Create New Raw Material</span>
                          </button>
                        </div>

                        {/* Right Summary Block */}
                        <div className="w-full md:w-auto bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex items-center justify-between md:justify-end gap-6 shadow-2xs">
                          <div className="text-right">
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Total Raw Material Cost:
                            </div>
                            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                              ₹{totalBOMCost.toFixed(2)}
                            </div>
                          </div>

                          {totalBOMCost > 0 && (
                            <button
                              type="button"
                              onClick={() => setCostPrice(totalBOMCost)}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-md transition-colors cursor-pointer"
                              title="Set this calculated cost as the Cost Price in Tab 1"
                            >
                              Use as Cost Price
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TAB 3 Navigation Footer */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("inventory")}
                    className="h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back: Track Inventory</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs rounded-md cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Item</span>
                  </Button>
                </div>
              </div>
            )}

          </div>

        </form>
      </div>

      {/* Quick Add Raw Material Modal - Zoho Enterprise Item Addition Form Style */}
      <Dialog open={isQuickRawOpen} onOpenChange={setIsQuickRawOpen} className="max-w-xl p-0 overflow-hidden">
        <form onSubmit={handleSaveQuickRaw} className="flex flex-col">
          {/* Header Bar matching Application Modal Standards */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between pr-12">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Factory className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Quick Add Raw Material
                  </h3>
                  <Badge variant="blue" className="text-[10px] font-semibold py-0 px-1.5 h-4.5">
                    BOM Item
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Add a new raw material to your catalog and use it immediately in this BOM recipe.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Error Alert */}
          {quickRawError && (
            <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{quickRawError}</span>
            </div>
          )}

          {/* Form Body - Matching Add Item Form typography, borders, and input styling */}
          <div className="px-6 py-5 space-y-4 text-xs">
            {/* Field 1: Raw Material Name* */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Raw Material Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. 500ml HDPE Bottle Cap, USB Cable..."
                value={quickRawName}
                onChange={(e) => {
                  setQuickRawName(e.target.value)
                  if (quickRawError) setQuickRawError("")
                }}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
                autoFocus
              />
            </div>

            {/* Field 2 & 3: SKU / Code (Optional) & Unit of Measure* */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>SKU / Code</span>
                  <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Auto-generated"
                  value={quickRawSku}
                  onChange={(e) => setQuickRawSku(e.target.value)}
                  className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Unit of Measure</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={quickRawUnit}
                  onValueChange={(val) => setQuickRawUnit(val)}
                  searchable
                  searchPlaceholder="Search or add unit..."
                  onAddCustom={(newU) => {
                    addUnit(newU)
                    setQuickRawUnit(newU)
                  }}
                  addCustomLabel="Add Custom Unit"
                  className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                  options={unitOptions}
                />
              </div>
            </div>

            {/* Subtle Divider */}
            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Field 4 & 5: Purchase Cost Rate (₹)* & Selling Price (₹) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Purchase Cost Rate <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white dark:bg-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-medium border-r border-slate-300 dark:border-slate-700 select-none">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={quickRawCost}
                    onChange={(e) => {
                      const val = e.target.value
                      setQuickRawCost(val)
                      if (!isSellingPriceCustom) {
                        const parsed = Number(val) || 0
                        setQuickRawSellingPrice(parsed > 0 ? (parsed * 1.25).toFixed(2) : "")
                      }
                    }}
                    className="border-0 focus-visible:ring-0 h-9 text-xs font-semibold tabular-nums rounded-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Selling Price <span className="text-[11px] text-slate-400 font-normal">(Editable)</span>
                  </label>
                  {!isSellingPriceCustom && Number(quickRawCost) > 0 && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                      +25% markup
                    </span>
                  )}
                </div>
                <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white dark:bg-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-medium border-r border-slate-300 dark:border-slate-700 select-none">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={quickRawSellingPrice}
                    onChange={(e) => {
                      setQuickRawSellingPrice(e.target.value)
                      setIsSellingPriceCustom(true)
                    }}
                    className="border-0 focus-visible:ring-0 h-9 text-xs font-semibold tabular-nums rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Field 6 & 7: Initial Stock (Optional) & Godown Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Initial Stock <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quickRawStock}
                  onChange={(e) => setQuickRawStock(e.target.value)}
                  className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Godown / Warehouse Location
                </label>
                <Select
                  value={quickRawGodownId}
                  onValueChange={(val) => setQuickRawGodownId(val)}
                  className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                  options={godowns.map(g => ({
                    value: g.id,
                    label: g.name
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions matching Application Standards */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickRawOpen(false)}
              className="h-8.5 px-4 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save & Add to BOM</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Raw Material Modal - Direct Price & Details Edit from BOM Row */}
      <Dialog open={isEditRawModalOpen} onOpenChange={setIsEditRawModalOpen} className="max-w-xl p-0 overflow-hidden">
        <form onSubmit={handleSaveEditRaw} className="flex flex-col">
          {/* Header Bar matching Application Modal Standards */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between pr-12">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Edit3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Raw Material Price & Details
                  </h3>
                  {editRawSku && (
                    <Badge variant="blue" className="text-[10px] font-semibold py-0 px-1.5 h-4.5">
                      {editRawSku}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Update purchase cost rate, selling price, and specifications for this raw material.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Error Alert */}
          {editRawError && (
            <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{editRawError}</span>
            </div>
          )}

          {/* Form Body */}
          <div className="px-6 py-5 space-y-4 text-xs">
            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Raw Material Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Raw material name..."
                value={editRawName}
                onChange={(e) => {
                  setEditRawName(e.target.value)
                  if (editRawError) setEditRawError("")
                }}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
              />
            </div>

            {/* Field 2 & 3: SKU / Code & Unit of Measure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>SKU / Code</span>
                </label>
                <Input
                  type="text"
                  placeholder="SKU Code"
                  value={editRawSku}
                  onChange={(e) => setEditRawSku(e.target.value)}
                  className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Unit of Measure</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={editRawUnit}
                  onValueChange={(val) => setEditRawUnit(val)}
                  searchable
                  searchPlaceholder="Search or add unit..."
                  onAddCustom={(newU) => {
                    addUnit(newU)
                    setEditRawUnit(newU)
                  }}
                  addCustomLabel="Add Custom Unit"
                  className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                  options={unitOptions}
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Field 4 & 5: Purchase Cost Rate (₹)* & Selling Price (₹) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Purchase Cost Rate <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white dark:bg-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-medium border-r border-slate-300 dark:border-slate-700 select-none">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editRawCost}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditRawCost(val)
                      if (!isEditSellingPriceCustom) {
                        const parsed = Number(val) || 0
                        setEditRawSellingPrice(parsed > 0 ? (parsed * 1.25).toFixed(2) : "")
                      }
                    }}
                    className="border-0 focus-visible:ring-0 h-9 text-xs font-semibold tabular-nums rounded-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Selling Price <span className="text-[11px] text-slate-400 font-normal">(Editable)</span>
                  </label>
                  {!isEditSellingPriceCustom && Number(editRawCost) > 0 && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                      +25% markup
                    </span>
                  )}
                </div>
                <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white dark:bg-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-medium border-r border-slate-300 dark:border-slate-700 select-none">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editRawSellingPrice}
                    onChange={(e) => {
                      setEditRawSellingPrice(e.target.value)
                      setIsEditSellingPriceCustom(true)
                    }}
                    className="border-0 focus-visible:ring-0 h-9 text-xs font-semibold tabular-nums rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Field 6: Available Stock */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Current Available Stock
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={editRawStock}
                onChange={(e) => setEditRawStock(e.target.value)}
                className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditRawModalOpen(false)}
              className="h-8.5 px-4 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save & Update Recipe</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Government HSN / SAC Directory Modal */}
      <HsnSacDirectoryModal
        isOpen={isHsnModalOpen}
        onClose={() => setIsHsnModalOpen(false)}
        onSelect={handleSelectHsnSac}
        initialType={itemType}
        currentCode={hsn}
      />

      {/* Modal: Add Custom Unit */}
      <Dialog open={isAddUnitModalOpen} onOpenChange={setIsAddUnitModalOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            Add Custom Unit of Measurement
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Create a custom unit (e.g. crate, barrel, set, bundle, drum) to use across all items and documents.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Unit Name / Symbol <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. crate, barrel, set, bundle"
            value={newUnitInput}
            onChange={(e) => setNewUnitInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newUnitInput.trim()) {
                e.preventDefault()
                addUnit(newUnitInput.trim())
                setUnit(newUnitInput.trim())
                setIsAddUnitModalOpen(false)
                setNewUnitInput("")
              }
            }}
            className="h-9 text-xs"
            autoFocus
          />
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddUnitModalOpen(false)
              setNewUnitInput("")
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!newUnitInput.trim()}
            onClick={() => {
              if (newUnitInput.trim()) {
                addUnit(newUnitInput.trim())
                setUnit(newUnitInput.trim())
                setIsAddUnitModalOpen(false)
                setNewUnitInput("")
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Unit
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal: Add Custom Category */}
      <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            Add Custom Category
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Create a custom category (e.g. Electronics, Hardware, Apparel, Kitchenware) for your item catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Electronics, Hardware, Apparel"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCategoryInput.trim()) {
                e.preventDefault()
                addCategory(newCategoryInput.trim())
                setCategory(newCategoryInput.trim())
                setIsAddCategoryModalOpen(false)
                setNewCategoryInput("")
              }
            }}
            className="h-9 text-xs"
            autoFocus
          />
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddCategoryModalOpen(false)
              setNewCategoryInput("")
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!newCategoryInput.trim()}
            onClick={() => {
              if (newCategoryInput.trim()) {
                addCategory(newCategoryInput.trim())
                setCategory(newCategoryInput.trim())
                setIsAddCategoryModalOpen(false)
                setNewCategoryInput("")
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Category
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Document Settings Drawer */}
      <DocumentSettingsDrawer
        open={isDocSettingsOpen}
        onOpenChange={setIsDocSettingsOpen}
        documentType="item"
      />

    </div>
  )
}

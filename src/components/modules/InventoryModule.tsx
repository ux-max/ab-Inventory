"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AdjustStockForm } from "@/components/forms/AdjustStockForm"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { formatINR, cn } from "@/lib/utils"
import { Godown } from "@/types/inventory"
import { TransferOrderDetailView } from "./TransferOrderDetailView"
import { AdjustmentDetailView } from "./AdjustmentDetailView"
import { AuditDetailView } from "./AuditDetailView"
import {
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Warehouse,
  History,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  Eye,
  MapPin,
  Package,
  Building2,
  Edit2,
  Trash2
} from "lucide-react"

interface InventoryModuleProps {
  initialAction?: "transfer" | "adjustment" | null
  subModule?: string
  onCloseActionTrigger?: () => void
}

export function InventoryModule({ initialAction, subModule, onCloseActionTrigger }: InventoryModuleProps) {
  const {
    items,
    godowns,
    addGodown,
    updateGodown,
    deleteGodown,
    activeGodownId,
    stockMovements,
    stockAudits,
    createStockTransfer,
    createStockAdjustment,
    createStockAudit,
    approveStockAudit
  } = useApp()

  const [activeTab, setActiveTab] = useState<"summary" | "transfers" | "adjustments" | "audits" | "ledger">(
    subModule === "adjustments"
      ? "adjustments"
      : subModule === "transfers"
        ? "transfers"
        : subModule === "audits"
          ? "audits"
          : "summary"
  )
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(initialAction === "transfer")
  const [isAdjustMode, setIsAdjustMode] = useState(initialAction === "adjustment")
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Godowns Table and View Mode State
  const [summaryViewMode, setSummaryViewMode] = useState<"godowns" | "items">("godowns")
  const [godownSearch, setGodownSearch] = useState("")
  const [godownFilter, setGodownFilter] = useState("all")
  const [godownPage, setGodownPage] = useState(1)
  const [godownPageSize, setGodownPageSize] = useState(10)
  const [selectedGodownRowIds, setSelectedGodownRowIds] = useState<string[]>([])
  const [selectedGodownId, setSelectedGodownId] = useState<string | null>(null)
  const [godownDetailSearch, setGodownDetailSearch] = useState("")
  const [godownDetailFilter, setGodownDetailFilter] = useState("all")
  const [godownDetailPage, setGodownDetailPage] = useState(1)
  const [godownDetailPageSize, setGodownDetailPageSize] = useState(25)
  const [selectedGodownItemRowIds, setSelectedGodownItemRowIds] = useState<string[]>([])

  // Add/Edit Godown Modal State (Matching User's Reference Form)
  const [isAddGodownModalOpen, setIsAddGodownModalOpen] = useState(false)
  const [editingGodown, setEditingGodown] = useState<Godown | null>(null)
  const [newGodownType, setNewGodownType] = useState("")
  const [newGodownName, setNewGodownName] = useState("")
  const [newGodownPhone, setNewGodownPhone] = useState("")
  const [newGodownEmail, setNewGodownEmail] = useState("")
  const [newGodownGstin, setNewGodownGstin] = useState("")
  const [newGodownPincode, setNewGodownPincode] = useState("")
  const [newGodownAddress, setNewGodownAddress] = useState("")
  const [newGodownIsDefault, setNewGodownIsDefault] = useState(false)

  // Transfer Orders Table State
  const [transferSearch, setTransferSearch] = useState("")
  const [transferFilterGodown, setTransferFilterGodown] = useState("all")
  const [transferPage, setTransferPage] = useState(1)
  const [transferPageSize, setTransferPageSize] = useState(10)
  const [selectedTransferRowIds, setSelectedTransferRowIds] = useState<string[]>([])
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null)

  // Inventory Adjustments Table State
  const [adjustmentSearch, setAdjustmentSearch] = useState("")
  const [adjustmentFilterGodown, setAdjustmentFilterGodown] = useState("all")
  const [adjustmentPage, setAdjustmentPage] = useState(1)
  const [adjustmentPageSize, setAdjustmentPageSize] = useState(10)
  const [selectedAdjustmentRowIds, setSelectedAdjustmentRowIds] = useState<string[]>([])
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null)

  // Item Matrix Table State
  const [itemSearch, setItemSearch] = useState("")
  const [itemFilter, setItemFilter] = useState("all")
  const [itemPage, setItemPage] = useState(1)
  const [itemPageSize, setItemPageSize] = useState(25)

  // Transfer Form State (PRD G1, INV-09, AC-09)
  const [transferFrom, setTransferFrom] = useState(godowns[0]?.id || "godown-1")
  const [transferTo, setTransferTo] = useState(godowns[1]?.id || "godown-2")
  const [transferItemId, setTransferItemId] = useState(items[0]?.id || "")
  const [transferQty, setTransferQty] = useState(10)
  const [transferReason, setTransferReason] = useState("Branch inventory balance replenishment")

  // Stock Audit Table State
  const [auditSearch, setAuditSearch] = useState("")
  const [auditFilterGodown, setAuditFilterGodown] = useState("all")
  const [auditFilterStatus, setAuditFilterStatus] = useState("all")
  const [auditPage, setAuditPage] = useState(1)
  const [auditPageSize, setAuditPageSize] = useState(10)
  const [selectedAuditRowIds, setSelectedAuditRowIds] = useState<string[]>([])
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)

  // Stock Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditGodownId, setAuditGodownId] = useState(godowns[0]?.id || "")
  const [auditCategory, setAuditCategory] = useState("all")
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({})

  const handleOpenAuditModal = () => {
    const targetGodown = auditGodownId || godowns[0]?.id || ""
    setAuditGodownId(targetGodown)
    const initialCounts: Record<string, number> = {}
    items.forEach(itm => {
      initialCounts[itm.id] = itm.stockByGodown[targetGodown] || 0
    })
    setAuditCounts(initialCounts)
    setIsAuditModalOpen(true)
  }

  const handleAuditSubmitModal = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMsg(null)

    const relevantItems = items.filter(itm => {
      if (auditCategory !== "all" && itm.category !== auditCategory) return false
      return true
    })

    const itemsList = relevantItems.map(itm => ({
      itemId: itm.id,
      countedQty: auditCounts[itm.id] ?? (itm.stockByGodown[auditGodownId] || 0)
    }))

    const res = createStockAudit(
      auditGodownId,
      auditCategory === "all" ? "All Categories" : auditCategory,
      itemsList
    )

    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message })
      setIsAuditModalOpen(false)
    } else {
      setFeedbackMsg({ type: "error", text: res.message })
    }
  }

  // Adjustment Form State (PRD INV-11, ADJ-01, AC-11)
  const [adjustGodownId, setAdjustGodownId] = useState(activeGodownId)
  const [adjustItemId, setAdjustItemId] = useState(items[0]?.id || "")
  const [adjustQtyDiff, setAdjustQtyDiff] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")

  // Computed Godowns with Inventory Metrics
  const godownsWithMetrics = useMemo(() => {
    return godowns.map(g => {
      let totalUnits = 0
      let totalSkus = 0
      let totalValuation = 0
      let lowStockCount = 0

      items.forEach(itm => {
        const qty = itm.stockByGodown[g.id] || 0
        if (qty > 0) {
          totalSkus += 1
          totalUnits += qty
          const rate = itm.purchasePrice || itm.salePrice || 0
          totalValuation += qty * rate
        }
        if (qty <= (itm.minStock || 0) && itm.minStock > 0) {
          lowStockCount += 1
        }
      })

      return {
        ...g,
        totalUnits,
        totalSkus,
        totalValuation,
        lowStockCount,
        isHealthy: lowStockCount === 0
      }
    })
  }, [godowns, items])

  const filteredGodowns = useMemo(() => {
    return godownsWithMetrics.filter(g => {
      const q = godownSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.address.toLowerCase().includes(q) ||
        (g.contactPerson && g.contactPerson.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (godownFilter === "primary") return g.isDefault
      if (godownFilter === "branches") return !g.isDefault
      if (godownFilter === "low_stock") return !g.isHealthy
      if (godownFilter === "with_stock") return g.totalUnits > 0
      return true
    })
  }, [godownsWithMetrics, godownSearch, godownFilter])

  const paginatedGodowns = useMemo(() => {
    const start = (godownPage - 1) * godownPageSize
    return filteredGodowns.slice(start, start + godownPageSize)
  }, [filteredGodowns, godownPage, godownPageSize])

  const toggleSelectAllGodowns = () => {
    if (selectedGodownRowIds.length === paginatedGodowns.length && paginatedGodowns.length > 0) {
      setSelectedGodownRowIds([])
    } else {
      setSelectedGodownRowIds(paginatedGodowns.map(g => g.id))
    }
  }

  const toggleSelectGodown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedGodownRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Filtered and Paginated Items for Item Stock Matrix
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = itemSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))

      if (!matchesSearch) return false

      const isLow = item.currentStock <= item.minStock
      if (itemFilter === "low_stock") return isLow
      if (itemFilter === "in_stock") return item.currentStock > 0
      return true
    })
  }, [items, itemSearch, itemFilter])

  const paginatedItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize
    return filteredItems.slice(start, start + itemPageSize)
  }, [filteredItems, itemPage, itemPageSize])

  // Selected Godown Detail Page Computations
  const selectedGodown = useMemo(() => {
    return godowns.find(g => g.id === selectedGodownId) || null
  }, [godowns, selectedGodownId])

  const selectedGodownMetrics = useMemo(() => {
    if (!selectedGodown) return { totalUnits: 0, totalSkus: 0, totalValuation: 0, lowStockCount: 0 }
    return godownsWithMetrics.find(g => g.id === selectedGodown.id) || { totalUnits: 0, totalSkus: 0, totalValuation: 0, lowStockCount: 0 }
  }, [selectedGodown, godownsWithMetrics])

  const godownAllItems = useMemo(() => {
    if (!selectedGodown) return []
    return items.map(item => {
      const qty = item.stockByGodown[selectedGodown.id] || 0
      const rate = item.purchasePrice || item.salePrice || 0
      const value = qty * rate
      const isLow = qty <= item.minStock && item.minStock > 0
      return {
        item,
        qty,
        rate,
        value,
        isLow
      }
    })
  }, [selectedGodown, items])

  const filteredGodownItems = useMemo(() => {
    return godownAllItems.filter(({ item, qty, isLow }) => {
      const q = godownDetailSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (godownDetailFilter === "in_stock") return qty > 0
      if (godownDetailFilter === "low_stock") return isLow
      if (godownDetailFilter === "zero_stock") return qty === 0
      return true
    })
  }, [godownAllItems, godownDetailSearch, godownDetailFilter])

  const paginatedGodownItems = useMemo(() => {
    const start = (godownDetailPage - 1) * godownDetailPageSize
    return filteredGodownItems.slice(start, start + godownDetailPageSize)
  }, [filteredGodownItems, godownDetailPage, godownDetailPageSize])

  const toggleSelectAllGodownItems = () => {
    if (selectedGodownItemRowIds.length === paginatedGodownItems.length && paginatedGodownItems.length > 0) {
      setSelectedGodownItemRowIds([])
    } else {
      setSelectedGodownItemRowIds(paginatedGodownItems.map(x => x.item.id))
    }
  }

  const toggleSelectGodownItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedGodownItemRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Derive Transfer Orders from stock movements (paired transfer_out & transfer_in)
  const transferOrders = useMemo(() => {
    const outMovements = stockMovements.filter(m => m.movementType === "transfer_out")
    return outMovements.map(outM => {
      const inM = stockMovements.find(m => m.refDocNo === outM.refDocNo && m.movementType === "transfer_in")
      const item = items.find(i => i.id === outM.itemId)

      let destGodownName = inM?.godownName || ""
      let cleanReason = outM.reason || "Inter-godown stock replenishment"
      if (!destGodownName && outM.reason?.includes("Transfer to ")) {
        const match = outM.reason.match(/Transfer to ([^:]+):?\s*(.*)/)
        if (match) {
          destGodownName = match[1]
          cleanReason = match[2] || cleanReason
        }
      }
      if (cleanReason.startsWith("Transfer to ")) {
        cleanReason = cleanReason.replace(/^Transfer to [^:]+:\s*/, "")
      }

      return {
        id: outM.refDocNo || outM.id,
        refDocNo: outM.refDocNo,
        timestamp: outM.timestamp,
        itemId: outM.itemId,
        itemName: outM.itemName,
        itemUnit: item?.unit || "units",
        itemCode: item?.code || "",
        qty: Math.abs(outM.qtyChange),
        fromGodownId: outM.godownId,
        fromGodownName: outM.godownName,
        toGodownId: inM?.godownId || "",
        toGodownName: destGodownName || "Destination Godown",
        actor: outM.actor,
        reason: cleanReason || "Inter-godown stock transfer",
        status: "Completed" as const
      }
    })
  }, [stockMovements, items])

  const filteredTransfers = useMemo(() => {
    return transferOrders.filter(trf => {
      const q = transferSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        trf.refDocNo.toLowerCase().includes(q) ||
        trf.itemName.toLowerCase().includes(q) ||
        trf.fromGodownName.toLowerCase().includes(q) ||
        trf.toGodownName.toLowerCase().includes(q) ||
        trf.actor.toLowerCase().includes(q) ||
        trf.reason.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (transferFilterGodown !== "all") {
        if (trf.fromGodownId !== transferFilterGodown && trf.toGodownId !== transferFilterGodown) {
          return false
        }
      }
      return true
    })
  }, [transferOrders, transferSearch, transferFilterGodown])

  const paginatedTransfers = useMemo(() => {
    const start = (transferPage - 1) * transferPageSize
    return filteredTransfers.slice(start, start + transferPageSize)
  }, [filteredTransfers, transferPage, transferPageSize])

  const toggleSelectAllTransfers = () => {
    if (selectedTransferRowIds.length === paginatedTransfers.length && paginatedTransfers.length > 0) {
      setSelectedTransferRowIds([])
    } else {
      setSelectedTransferRowIds(paginatedTransfers.map(t => t.id))
    }
  }

  const toggleSelectTransfer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTransferRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedTransfer = useMemo(() => {
    return transferOrders.find(t => t.id === selectedTransferId) || null
  }, [transferOrders, selectedTransferId])

  // Derive Adjustments list from stockMovements
  const adjustmentMovements = useMemo(() => {
    return stockMovements.filter(m => m.movementType.startsWith("adjustment"))
  }, [stockMovements])

  const filteredAdjustments = useMemo(() => {
    return adjustmentMovements.filter(adj => {
      const q = adjustmentSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        adj.refDocNo.toLowerCase().includes(q) ||
        adj.itemName.toLowerCase().includes(q) ||
        adj.godownName.toLowerCase().includes(q) ||
        adj.actor.toLowerCase().includes(q) ||
        (adj.reason && adj.reason.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (adjustmentFilterGodown !== "all") {
        if (adj.godownId !== adjustmentFilterGodown) return false
      }
      return true
    })
  }, [adjustmentMovements, adjustmentSearch, adjustmentFilterGodown])

  const paginatedAdjustments = useMemo(() => {
    const start = (adjustmentPage - 1) * adjustmentPageSize
    return filteredAdjustments.slice(start, start + adjustmentPageSize)
  }, [filteredAdjustments, adjustmentPage, adjustmentPageSize])

  const toggleSelectAllAdjustments = () => {
    if (selectedAdjustmentRowIds.length === paginatedAdjustments.length && paginatedAdjustments.length > 0) {
      setSelectedAdjustmentRowIds([])
    } else {
      setSelectedAdjustmentRowIds(paginatedAdjustments.map(a => a.id))
    }
  }

  const toggleSelectAdjustment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAdjustmentRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedAdjustment = useMemo(() => {
    return adjustmentMovements.find(a => a.id === selectedAdjustmentId || a.refDocNo === selectedAdjustmentId) || null
  }, [adjustmentMovements, selectedAdjustmentId])

  // Derive Stock Audits
  const filteredAudits = useMemo(() => {
    return stockAudits.filter(a => {
      const q = auditSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        a.auditNo.toLowerCase().includes(q) ||
        a.godownName.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.approvedBy && a.approvedBy.toLowerCase().includes(q)) ||
        a.items.some(i => i.itemName.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (auditFilterGodown !== "all" && a.godownId !== auditFilterGodown) return false
      if (auditFilterStatus !== "all" && a.status !== auditFilterStatus) return false

      return true
    })
  }, [stockAudits, auditSearch, auditFilterGodown, auditFilterStatus])

  const paginatedAudits = useMemo(() => {
    const start = (auditPage - 1) * auditPageSize
    return filteredAudits.slice(start, start + auditPageSize)
  }, [filteredAudits, auditPage, auditPageSize])

  const toggleSelectAllAudits = () => {
    if (selectedAuditRowIds.length === paginatedAudits.length && paginatedAudits.length > 0) {
      setSelectedAuditRowIds([])
    } else {
      setSelectedAuditRowIds(paginatedAudits.map(a => a.id))
    }
  }

  const toggleSelectAudit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAuditRowIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedAudit = useMemo(() => {
    return stockAudits.find(a => a.id === selectedAuditId) || null
  }, [stockAudits, selectedAuditId])

  const handleOpenAddGodown = () => {
    setEditingGodown(null)
    setNewGodownType("")
    setNewGodownName("")
    setNewGodownPhone("")
    setNewGodownEmail("")
    setNewGodownGstin("")
    setNewGodownPincode("")
    setNewGodownAddress("")
    setNewGodownIsDefault(false)
    setIsAddGodownModalOpen(true)
  }

  const handleOpenEditGodown = (g: Godown) => {
    setEditingGodown(g)
    setNewGodownType(g.godownType || "Warehouse")
    setNewGodownName(g.name || "")
    setNewGodownPhone(g.phone || "")
    setNewGodownEmail(g.email || "")
    setNewGodownGstin(g.gstin || "")
    setNewGodownPincode(g.pincode || "")
    setNewGodownAddress(g.address || "")
    setNewGodownIsDefault(!!g.isDefault)
    setIsAddGodownModalOpen(true)
  }

  const handleDeleteGodown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = godowns.find(g => g.id === id)
    if (target?.isDefault) {
      setFeedbackMsg({ type: "error", text: "Cannot delete the primary default godown." })
      return
    }
    const res = deleteGodown(id)
    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message })
      if (selectedGodownId === id) setSelectedGodownId(null)
    } else {
      setFeedbackMsg({ type: "error", text: res.message })
    }
  }

  const handleCreateGodown = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGodownType.trim()) {
      setFeedbackMsg({ type: "error", text: "Please select a Godown Type." })
      return
    }
    if (!newGodownName.trim()) {
      setFeedbackMsg({ type: "error", text: "Godown Name is required." })
      return
    }
    if (!newGodownPhone.trim()) {
      setFeedbackMsg({ type: "error", text: "Phone Number is required." })
      return
    }

    const fullAddress = [
      newGodownAddress.trim(),
      newGodownPincode.trim() ? `PIN: ${newGodownPincode.trim()}` : ""
    ].filter(Boolean).join(", ")

    if (editingGodown) {
      const res = updateGodown(editingGodown.id, {
        name: newGodownName.trim(),
        godownType: newGodownType.trim(),
        phone: newGodownPhone.trim(),
        email: newGodownEmail.trim(),
        gstin: newGodownGstin.trim(),
        pincode: newGodownPincode.trim(),
        address: fullAddress || newGodownAddress.trim() || "Main Logistics Hub",
        contactPerson: newGodownPhone.trim() ? `Phone: ${newGodownPhone.trim()}` : editingGodown.contactPerson,
        isDefault: newGodownIsDefault
      })
      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message || "Godown updated successfully." })
        setIsAddGodownModalOpen(false)
        setEditingGodown(null)
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Failed to update godown." })
      }
    } else {
      const res = addGodown({
        name: newGodownName.trim(),
        godownType: newGodownType.trim(),
        phone: newGodownPhone.trim(),
        email: newGodownEmail.trim(),
        gstin: newGodownGstin.trim(),
        pincode: newGodownPincode.trim(),
        address: fullAddress || "Main Logistics Hub",
        contactPerson: newGodownPhone.trim() ? `Phone: ${newGodownPhone.trim()}` : "Manager",
        isDefault: newGodownIsDefault
      })

      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message })
        setIsAddGodownModalOpen(false)
        setEditingGodown(null)
        setNewGodownType("")
        setNewGodownName("")
        setNewGodownPhone("")
        setNewGodownEmail("")
        setNewGodownGstin("")
        setNewGodownPincode("")
        setNewGodownAddress("")
        setNewGodownIsDefault(false)
      } else {
        setFeedbackMsg({ type: "error", text: res.message })
      }
    }
  }

  // React to subModule updates from sidebar
  React.useEffect(() => {
    if (subModule === "adjustments") {
      setActiveTab("adjustments")
    } else if (subModule === "transfers") {
      setActiveTab("transfers")
    } else if (subModule === "audits") {
      setActiveTab("audits")
    } else if (subModule === "summary") {
      setActiveTab("summary")
    }
  }, [subModule])

  // React to initialAction
  React.useEffect(() => {
    if (initialAction === "adjustment") {
      setIsAdjustMode(true)
    } else if (initialAction === "transfer") {
      setIsTransferModalOpen(true)
    }
  }, [initialAction])

  if (isAdjustMode) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto">
        <AdjustStockForm
          onClose={() => {
            setIsAdjustMode(false)
            if (onCloseActionTrigger) onCloseActionTrigger()
          }}
          onSuccess={() => {
            setIsAdjustMode(false)
            if (onCloseActionTrigger) onCloseActionTrigger()
          }}
        />
      </div>
    )
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMsg(null)

    const res = createStockTransfer(transferFrom, transferTo, transferItemId, transferQty, transferReason)
    if (!res.success) {
      setFeedbackMsg({ type: "error", text: res.message })
      return
    }

    setFeedbackMsg({ type: "success", text: res.message })
    setIsTransferModalOpen(false)
    if (onCloseActionTrigger) onCloseActionTrigger()
  }

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMsg(null)

    if (adjustQtyDiff === 0) {
      setFeedbackMsg({ type: "error", text: "Adjustment quantity difference cannot be zero." })
      return
    }
    if (!adjustReason.trim()) {
      setFeedbackMsg({ type: "error", text: "A mandatory reason must be provided for stock adjustments (AC-11)." })
      return
    }

    const res = createStockAdjustment(adjustGodownId, adjustItemId, adjustQtyDiff, adjustReason)
    if (!res.success) {
      setFeedbackMsg({ type: "error", text: res.message })
      return
    }

    setFeedbackMsg({ type: "success", text: res.message })
    setIsAdjustMode(false)
    setAdjustReason("")
    setAdjustQtyDiff(0)
    if (onCloseActionTrigger) onCloseActionTrigger()
  }

  const handleAuditApprove = (auditId: string) => {
    const res = approveStockAudit(auditId)
    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message })
    } else {
      setFeedbackMsg({ type: "error", text: res.message })
    }
  }

  const targetTransferItem = items.find(i => i.id === transferItemId) || items[0]
  const sourceStock = targetTransferItem.stockByGodown[transferFrom] || 0

  const renderTransferDialog = () => (
    <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen} className="max-w-md">
      <form onSubmit={handleTransferSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold">INV-09</Badge>
            <DialogTitle className="text-base font-bold">Inter-Godown Transfer</DialogTitle>
          </div>
          <DialogDescription>
            Transfers post immediately between selected godowns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Select Item to Transfer *</label>
            <Select
              searchable
              searchPlaceholder="Search item by name, SKU..."
              value={transferItemId}
              onValueChange={(val) => setTransferItemId(val)}
              options={items.map(i => ({
                value: i.id,
                label: i.name,
                description: `SKU: ${i.code} • Total Stock: ${i.currentStock} ${i.unit}`
              }))}
              className="w-full h-8 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Source Godown *</label>
              <Select
                value={transferFrom}
                onValueChange={(val) => setTransferFrom(val)}
                options={godowns.map(g => ({ value: g.id, label: g.name }))}
                className="w-full h-8"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Available: <span className="font-bold text-slate-700 dark:text-slate-300">{sourceStock} {targetTransferItem.unit}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Destination Godown *</label>
              <Select
                value={transferTo}
                onValueChange={(val) => setTransferTo(val)}
                options={godowns.map(g => ({ value: g.id, label: g.name }))}
                className="w-full h-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Quantity to Transfer *</label>
            <Input
              type="number"
              min="1"
              max={sourceStock}
              value={transferQty}
              onChange={(e) => setTransferQty(Number(e.target.value) || 1)}
              className="h-8 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Transfer Reason / Dispatch Note</label>
            <Input
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Post Transfer</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )

  const renderAddGodownDialog = () => (
    <Dialog
      open={isAddGodownModalOpen}
      onOpenChange={(open) => {
        setIsAddGodownModalOpen(open)
        if (!open) setEditingGodown(null)
      }}
      className="max-w-2xl"
    >
      <form onSubmit={handleCreateGodown} className="space-y-4">
        {/* Header */}
        <div className="pb-2">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {editingGodown ? "Edit Godown" : "Add Godown"}
          </DialogTitle>
        </div>

        {/* Section 1: Godown Type & Godown Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Godown Type <span className="text-rose-500">*</span>
            </label>
            <Select
              value={newGodownType}
              onValueChange={setNewGodownType}
              placeholder="Select"
              options={[
                { value: "Warehouse", label: "Warehouse" },
                { value: "Store Room", label: "Store Room" },
                { value: "Showroom", label: "Showroom" },
                { value: "Transit Hub", label: "Transit Hub" },
                { value: "Branch", label: "Branch" },
                { value: "Cold Storage", label: "Cold Storage" },
                { value: "Third-Party Logistics (3PL)", label: "Third-Party Logistics (3PL)" },
              ]}
              className="w-full h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Godown Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Enter Godown Name"
              value={newGodownName}
              onChange={(e) => setNewGodownName(e.target.value)}
              className="h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700"
              required
            />
          </div>
        </div>

        {/* Section 2: Phone No & Email ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone No <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              placeholder=""
              value={newGodownPhone}
              onChange={(e) => setNewGodownPhone(e.target.value)}
              className="h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email ID
            </label>
            <Input
              type="email"
              placeholder=""
              value={newGodownEmail}
              onChange={(e) => setNewGodownEmail(e.target.value)}
              className="h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* More Information Header */}
        <div className="pt-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            More Information
          </h4>
          <div className="mt-2 border-b border-slate-100 dark:border-slate-800" />
        </div>

        {/* Section 3: GSTIN, Pincode & Godown Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GSTIN
              </label>
              <Input
                placeholder=""
                value={newGodownGstin}
                onChange={(e) => setNewGodownGstin(e.target.value.toUpperCase())}
                className="h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Godown Pincode
              </label>
              <Input
                placeholder=""
                value={newGodownPincode}
                onChange={(e) => setNewGodownPincode(e.target.value)}
                className="h-10 text-sm rounded-lg border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Godown Address
            </label>
            <textarea
              rows={5}
              placeholder=""
              value={newGodownAddress}
              onChange={(e) => setNewGodownAddress(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-[126px]"
            />
          </div>
        </div>

        {/* Primary Hub checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newGodownIsDefault}
              onChange={(e) => setNewGodownIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Set as Primary Default Hub</span>
          </label>
        </div>

        {/* Footer Actions - Matching App Theme */}
        <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsAddGodownModalOpen(false)
              setEditingGodown(null)
            }}
            className="h-8 px-4 text-xs font-semibold rounded-md border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer"
          >
            {editingGodown ? "Save Changes" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )

  const renderAuditDialog = () => {
    const godownItems = items.filter(itm => (itm.stockByGodown[auditGodownId] || 0) > 0 || (auditCounts[itm.id] !== undefined && auditCounts[itm.id] !== 0))
    const displayItems = godownItems.length > 0 ? godownItems : items.slice(0, 10)

    return (
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen} className="max-w-2xl">
        <form onSubmit={handleAuditSubmitModal}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold">Physical Count</Badge>
              <DialogTitle className="text-base font-bold">Record Physical Stock Audit</DialogTitle>
            </div>
            <DialogDescription>
              Enter verified floor count quantities for the selected godown. Variances against system counts will be calculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Audit Godown / Warehouse *</label>
                <Select
                  value={auditGodownId}
                  onValueChange={(val) => {
                    setAuditGodownId(val)
                    const newCounts: Record<string, number> = {}
                    items.forEach(itm => {
                      newCounts[itm.id] = itm.stockByGodown[val] || 0
                    })
                    setAuditCounts(newCounts)
                  }}
                  options={godowns.map(g => ({ value: g.id, label: g.name }))}
                  className="w-full h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Inventory Category</label>
                <Select
                  value={auditCategory}
                  onValueChange={(val) => setAuditCategory(val)}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...Array.from(new Set(items.map(i => i.category || "General"))).map(cat => ({ value: cat, label: cat }))
                  ]}
                  className="w-full h-8 text-xs"
                />
              </div>
            </div>

            {/* Items count input table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/80 text-xs">
                    <TableHead className="px-3 py-2">Item Name</TableHead>
                    <TableHead className="px-3 py-2 text-center">System Qty</TableHead>
                    <TableHead className="px-3 py-2 text-center w-32">Physical Count</TableHead>
                    <TableHead className="px-3 py-2 text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map(itm => {
                    const sys = itm.stockByGodown[auditGodownId] || 0
                    const counted = auditCounts[itm.id] ?? sys
                    const diff = counted - sys

                    return (
                      <TableRow key={itm.id} className="text-xs">
                        <TableCell className="px-3 py-2 font-medium">
                          <div>{itm.name}</div>
                          {itm.code && <div className="text-[11px] text-slate-400">SKU: {itm.code}</div>}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400 font-medium">
                          {sys} {itm.unit}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={counted}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0
                              setAuditCounts(prev => ({ ...prev, [itm.id]: val }))
                            }}
                            className="h-7 text-xs text-center font-bold"
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums font-bold">
                          <span className={diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-slate-400"}>
                            {diff > 0 ? `+${diff}` : diff} {itm.unit}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAuditModalOpen(false)}
              className="h-8 px-4 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
            >
              Save Audit (Pending Review)
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    )
  }

  // FULL PAGE VIEW WHEN A GODOWN IS CLICKED
  if (selectedGodown) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedGodownId(null)}
              className="h-7 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Godowns</span>
            </Button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedGodown.name}
              </span>
              {selectedGodown.isDefault && (
                <Badge variant="blue" className="text-[10px] py-0 px-1.5 h-4 font-semibold">
                  Primary Hub
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTransferFrom(selectedGodown.id)
                setIsTransferModalOpen(true)
              }}
              className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
              <span>Transfer Stock</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAdjustGodownId(selectedGodown.id)
                setIsAdjustMode(true)
              }}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Adjust Stock</span>
            </Button>
          </div>
        </div>

        {/* Full Page Content */}
        <div className="p-4 md:p-6 space-y-4 flex-1 overflow-auto">
          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline">Dismiss</button>
            </div>
          )}


          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <SearchInput
                value={godownDetailSearch}
                onChange={setGodownDetailSearch}
                placeholder={`Search products in ${selectedGodown.name}...`}
                className="w-full text-xs"
              />
              <Select
                value={godownDetailFilter}
                onValueChange={(val) => {
                  setGodownDetailFilter(val)
                  setGodownDetailPage(1)
                }}
                options={[
                  { value: "all", label: "All Items" },
                  { value: "in_stock", label: "In Stock Only" },
                  { value: "low_stock", label: "Low Stock Alert" },
                  { value: "zero_stock", label: "Zero Stock" },
                ]}
                className="w-36 h-8 text-xs shrink-0"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {paginatedGodownItems.length} of {filteredGodownItems.length} items
            </div>
          </div>

          {/* Full Width Table (Matching Image 2 & App Theme) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="w-12 px-4 py-3 text-center">
                    <TableCheckbox
                      checked={paginatedGodownItems.length > 0 && selectedGodownItemRowIds.length === paginatedGodownItems.length}
                      indeterminate={selectedGodownItemRowIds.length > 0 && selectedGodownItemRowIds.length < paginatedGodownItems.length}
                      onChange={toggleSelectAllGodownItems}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Item Name & SKU
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Stock in this Godown
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Rate (Cost)
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Total Value
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Total on Hand
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGodownItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-slate-400 text-xs">
                      No items found matching criteria in this godown.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGodownItems.map(({ item, qty, rate, value, isLow }) => {
                    const isSelected = selectedGodownItemRowIds.includes(item.id)
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group",
                          isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        )}
                      >
                        <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectGodownItem(item.id, e)}>
                          <TableCheckbox
                            checked={isSelected}
                            onChange={() => { }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.code} {item.hsn ? `• HSN: ${item.hsn}` : ""}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {item.category || "General"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                          {qty} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                          {formatINR(rate)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-semibold text-sm text-slate-900 dark:text-white tabular-nums">
                          {formatINR(value)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {item.currentStock} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          {isLow ? (
                            <Badge variant="outline" className="text-xs font-medium bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              Healthy
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setTransferItemId(item.id)
                              setTransferFrom(selectedGodown.id)
                              setTransferQty(Math.min(qty, 10) || 1)
                              setIsTransferModalOpen(true)
                            }}
                            className="h-7 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1 cursor-pointer"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            <span>Transfer</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <Pagination
              variant="table"
              totalCount={filteredGodownItems.length}
              pageSize={godownDetailPageSize}
              currentPage={godownDetailPage}
              onPageChange={setGodownDetailPage}
              onPageSizeChange={setGodownDetailPageSize}
              itemLabel="Items in Godown"
            />
          </div>
        </div>

        {/* Modals inside Detail View */}
        {renderTransferDialog()}
        {renderAddGodownDialog()}
      </div>
    )
  }

  // MASTER-DETAIL: TRANSFER ORDER DETAIL VIEW (matching Items and Invoices)
  if (activeTab === "transfers" && selectedTransferId && selectedTransfer) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Transfer Orders List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Transfer Orders</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={transferSearch}
              onChange={(e) => setTransferSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {transferSearch && (
              <button onClick={() => setTransferSearch("")} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Master List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTransfers.map(trf => {
              const isSelected = trf.id === selectedTransferId
              return (
                <div
                  key={trf.id}
                  onClick={() => setSelectedTransferId(trf.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-colors space-y-1.5",
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {trf.refDocNo}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                      {trf.timestamp.split(" ")[0]}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {trf.itemName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[170px]">{trf.fromGodownName} → {trf.toGodownName}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{trf.qty} {trf.itemUnit}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Pagination Bar */}
          <Pagination
            variant="master-list"
            totalCount={filteredTransfers.length}
            pageSize={transferPageSize}
            currentPage={transferPage}
            onPageChange={setTransferPage}
            onPageSizeChange={setTransferPageSize}
          />
        </div>

        {/* Right: Transfer Order Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <TransferOrderDetailView
            transfer={selectedTransfer}
            onClose={() => setSelectedTransferId(null)}
            onNewTransfer={() => setIsTransferModalOpen(true)}
          />
        </div>

        {/* Modals */}
        {renderTransferDialog()}
      </div>
    )
  }

  // MASTER-DETAIL: INVENTORY ADJUSTMENT DETAIL VIEW (matching Items, Invoices, and Transfers)
  if (activeTab === "adjustments" && selectedAdjustmentId && selectedAdjustment) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Adjustments List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Adjustments</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAdjustMode(true)}
              className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search adjustments..."
              value={adjustmentSearch}
              onChange={(e) => setAdjustmentSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {adjustmentSearch && (
              <button onClick={() => setAdjustmentSearch("")} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Master List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAdjustments.map(adj => {
              const isSelected = adj.id === selectedAdjustmentId || adj.refDocNo === selectedAdjustmentId
              const itm = items.find(i => i.id === adj.itemId)
              return (
                <div
                  key={adj.id}
                  onClick={() => setSelectedAdjustmentId(adj.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-colors space-y-1.5",
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {adj.refDocNo}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                      {adj.timestamp.split(" ")[0]}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {adj.itemName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[170px]">{adj.godownName}</span>
                    <span className={`font-bold tabular-nums ${adj.qtyChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {adj.qtyChange > 0 ? `+${adj.qtyChange}` : adj.qtyChange} {itm?.unit || "units"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Pagination Bar */}
          <Pagination
            variant="master-list"
            totalCount={filteredAdjustments.length}
            pageSize={adjustmentPageSize}
            currentPage={adjustmentPage}
            onPageChange={setAdjustmentPage}
            onPageSizeChange={setAdjustmentPageSize}
          />
        </div>

        {/* Right: Adjustment Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <AdjustmentDetailView
            adjustment={selectedAdjustment}
            onClose={() => setSelectedAdjustmentId(null)}
            onNewAdjustment={() => setIsAdjustMode(true)}
          />
        </div>

        {/* Modals inside Detail View */}
        {renderTransferDialog()}
        {renderAddGodownDialog()}
      </div>
    )
  }

  // MASTER-DETAIL: STOCK AUDIT DETAIL VIEW
  if (activeTab === "audits" && selectedAuditId && selectedAudit) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Audits List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Stock Audits</span>
            </div>
            <Button
              size="sm"
              onClick={handleOpenAuditModal}
              className="h-7 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search audits..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {auditSearch && (
              <button onClick={() => setAuditSearch("")} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Master List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAudits.map(adt => {
              const isSelected = adt.id === selectedAuditId
              const totalVar = adt.items.reduce((s, i) => s + i.varianceQty, 0)
              const isAppr = adt.status === "approved"
              return (
                <div
                  key={adt.id}
                  onClick={() => setSelectedAuditId(adt.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-colors space-y-1.5",
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {adt.auditNo}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isAppr
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                        }`}
                    >
                      {isAppr ? "Approved" : "Review"}
                    </Badge>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {adt.godownName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{adt.category} • {adt.items.length} SKUs</span>
                    <span className={`font-bold tabular-nums ${totalVar < 0 ? "text-rose-600 dark:text-rose-400" : totalVar > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {totalVar > 0 ? `+${totalVar}` : totalVar} units
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Pagination Bar */}
          <Pagination
            variant="master-list"
            totalCount={filteredAudits.length}
            pageSize={auditPageSize}
            currentPage={auditPage}
            onPageChange={setAuditPage}
            onPageSizeChange={setAuditPageSize}
          />
        </div>

        {/* Right: Audit Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <AuditDetailView
            audit={selectedAudit}
            onClose={() => setSelectedAuditId(null)}
            onApprove={handleAuditApprove}
          />
        </div>

        {/* Modals inside Detail View */}
        {renderTransferDialog()}
        {renderAddGodownDialog()}
        {renderAuditDialog()}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Zoho Standard Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Inventory
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as any)
              setCurrentPage(1)
            }}
            options={[
              { value: "summary", label: "Stock Summary by Godown" },
              { value: "transfers", label: "Transfer Orders" },
              { value: "adjustments", label: "Inventory Adjustments" },
              { value: "audits", label: "Physical Audits" },
              { value: "ledger", label: "Stock Ledger (Audit Trail)" },
            ]}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === "summary" && (
            <Button
              size="sm"
              onClick={handleOpenAddGodown}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Godown</span>
            </Button>
          )}
          {activeTab === "transfers" && (
            <Button
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Transfer Order</span>
            </Button>
          )}
          {activeTab === "audits" && (
            <Button
              size="sm"
              onClick={handleOpenAuditModal}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Physical Audit</span>
            </Button>
          )}
          {activeTab !== "transfers" && (
            <Button
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              variant="outline"
              className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
              <span>Transfer</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsAdjustMode(true)}
            variant="outline"
            className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Adjust Stock</span>
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-auto flex-1">

        {feedbackMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}>
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline">Dismiss</button>
          </div>
        )}

        {/* TAB 1: GODOWN STOCK SUMMARY */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {/* Controls: Search & Filters */}
            <div className="flex items-center gap-2 max-w-lg">
              <SearchInput
                value={godownSearch}
                onChange={setGodownSearch}
                placeholder="Search godown by name, address, manager..."
                className="w-full text-xs"
              />
              <Select
                value={godownFilter}
                onValueChange={(val) => {
                  setGodownFilter(val)
                  setGodownPage(1)
                }}
                options={[
                  { value: "all", label: "All Godowns" },
                  { value: "primary", label: "Primary Hubs" },
                  { value: "branches", label: "Branch Locations" },
                  { value: "with_stock", label: "With Active Stock" },
                  { value: "low_stock", label: "Low Stock Alert" },
                ]}
                className="w-40 h-8 text-xs shrink-0"
              />
            </div>

            {/* VIEW 1: GODOWNS TABLE */}
            {summaryViewMode === "godowns" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                      <TableHead className="w-12 px-4 py-3 text-center">
                        <TableCheckbox
                          checked={paginatedGodowns.length > 0 && selectedGodownRowIds.length === paginatedGodowns.length}
                          indeterminate={selectedGodownRowIds.length > 0 && selectedGodownRowIds.length < paginatedGodowns.length}
                          onChange={toggleSelectAllGodowns}
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Godown / Warehouse
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Location & Manager
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        SKUs Stocked
                      </TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Total Units
                      </TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Est. Stock Valuation
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGodowns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16 text-slate-400 text-xs">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Warehouse className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                            <span className="font-semibold text-slate-600 dark:text-slate-400">No godowns found matching your search.</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setGodownSearch("")
                                setGodownFilter("all")
                              }}
                              className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-1"
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedGodowns.map(g => {
                        const isSelected = selectedGodownRowIds.includes(g.id)
                        return (
                          <TableRow
                            key={g.id}
                            onClick={() => {
                              setSelectedGodownId(g.id)
                              setGodownDetailPage(1)
                              setGodownDetailSearch("")
                            }}
                            className={cn(
                              "border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group",
                              isSelected
                                ? "bg-blue-50/50 dark:bg-blue-950/30"
                                : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {/* Selection Checkbox */}
                            <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectGodown(g.id, e)}>
                              <TableCheckbox
                                checked={isSelected}
                                onChange={() => { }}
                              />
                            </TableCell>

                            {/* Godown Name & Type */}
                            <TableCell className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                                  <Warehouse className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                    <span>{g.name}</span>
                                    {g.isDefault && (
                                      <Badge variant="blue" className="text-[10px] py-0 px-1.5 h-4 font-semibold">
                                        Primary Hub
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span className="font-medium">ID:</span> {g.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Location & Manager */}
                            <TableCell className="px-4 py-3.5">
                              <div className="flex items-start gap-1.5 max-w-[280px]">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-normal text-slate-700 dark:text-slate-300 line-clamp-1">
                                    {g.address}
                                  </div>
                                  {g.contactPerson && (
                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                      Manager: {g.contactPerson}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* SKUs Stocked */}
                            <TableCell className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums">
                                {g.totalSkus} {g.totalSkus === 1 ? "Item" : "Items"}
                              </span>
                            </TableCell>

                            {/* Total Units */}
                            <TableCell className="px-4 py-3.5 text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                              {g.totalUnits.toLocaleString()}
                            </TableCell>

                            {/* Valuation */}
                            <TableCell className="px-4 py-3.5 text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                              {formatINR(g.totalValuation)}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="px-4 py-3.5 text-center">
                              {g.isHealthy ? (
                                <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                  Healthy
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                  {g.lowStockCount} Low Stock
                                </Badge>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenEditGodown(g)
                                  }}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                                  title="Edit Godown"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={g.isDefault}
                                  onClick={(e) => handleDeleteGodown(g.id, e)}
                                  className={cn(
                                    "p-1.5 rounded-md transition-colors cursor-pointer",
                                    g.isDefault
                                      ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                      : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  )}
                                  title={g.isDefault ? "Cannot delete primary default hub" : "Delete Godown"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Godowns Table Pagination Bar */}
                <Pagination
                  variant="table"
                  totalCount={filteredGodowns.length}
                  pageSize={godownPageSize}
                  currentPage={godownPage}
                  onPageChange={setGodownPage}
                  onPageSizeChange={setGodownPageSize}
                  itemLabel="Total Godowns"
                />
              </div>
            )}

            {/* VIEW 2: ITEM STOCK MATRIX */}
            {summaryViewMode === "items" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                      <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Item Name & SKU
                      </TableHead>
                      {godowns.map(g => (
                        <TableHead key={g.id} className="text-center px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {g.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Total On Hand
                      </TableHead>
                      <TableHead className="text-center px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={godowns.length + 3} className="text-center py-16 text-slate-400 text-xs">
                          No products found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedItems.map(item => {
                        const isLow = item.currentStock <= item.minStock
                        return (
                          <TableRow key={item.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <TableCell className="px-4 py-3.5">
                              <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.name}</div>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.code} {item.category ? `• ${item.category}` : ""}</div>
                            </TableCell>
                            {godowns.map(g => (
                              <TableCell key={g.id} className="text-center px-4 py-3.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                                {item.stockByGodown[g.id] || 0} {item.unit}
                              </TableCell>
                            ))}
                            <TableCell className="text-right px-4 py-3.5 font-bold text-sm tabular-nums text-slate-900 dark:text-white">
                              {item.currentStock} {item.unit}
                            </TableCell>
                            <TableCell className="text-center px-4 py-3.5">
                              {isLow ? (
                                <Badge variant="outline" className="text-xs font-medium bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                  Healthy
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Items Table Pagination Bar */}
                <Pagination
                  variant="table"
                  totalCount={filteredItems.length}
                  pageSize={itemPageSize}
                  currentPage={itemPage}
                  onPageChange={setItemPage}
                  onPageSizeChange={setItemPageSize}
                  itemLabel="Total Products"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB: TRANSFER ORDERS */}
        {activeTab === "transfers" && (
          <div className="space-y-4">
            {/* Controls: Search & Filters */}
            <div className="flex items-center gap-2 max-w-lg">
              <SearchInput
                value={transferSearch}
                onChange={(val) => {
                  setTransferSearch(val)
                  setTransferPage(1)
                }}
                placeholder="Search transfer orders by doc #, item, godown, actor..."
                className="w-full text-xs"
              />
              <Select
                value={transferFilterGodown}
                onValueChange={(val) => {
                  setTransferFilterGodown(val)
                  setTransferPage(1)
                }}
                options={[
                  { value: "all", label: "All Godowns" },
                  ...godowns.map(g => ({ value: g.id, label: g.name }))
                ]}
                className="w-48 h-8 text-xs shrink-0"
              />
            </div>

            {/* Transfer Orders Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={paginatedTransfers.length > 0 && selectedTransferRowIds.length === paginatedTransfers.length}
                        indeterminate={selectedTransferRowIds.length > 0 && selectedTransferRowIds.length < paginatedTransfers.length}
                        onChange={toggleSelectAllTransfers}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Date & Time
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Transfer #
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Item / Product
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      From (Source)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      To (Destination)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Transfer Qty
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Transferred By
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-20">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16 text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ArrowLeftRight className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">No transfer orders found.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsTransferModalOpen(true)}
                            className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Transfer Order
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransfers.map(trf => {
                      const isSelected = selectedTransferRowIds.includes(trf.id)
                      return (
                        <TableRow
                          key={trf.id}
                          onClick={() => setSelectedTransferId(trf.id)}
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group",
                            isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          )}
                        >
                          {/* Checkbox */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectTransfer(trf.id, e)}>
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => { }}
                            />
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {trf.timestamp}
                          </TableCell>

                          {/* Transfer # */}
                          <TableCell className="px-4 py-3.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                              {trf.refDocNo}
                            </span>
                          </TableCell>

                          {/* Item / Product */}
                          <TableCell className="px-4 py-3.5">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {trf.itemName}
                            </div>
                            {trf.itemCode && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                SKU: {trf.itemCode}
                              </div>
                            )}
                          </TableCell>

                          {/* Source Godown */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium truncate max-w-[160px]">{trf.fromGodownName}</span>
                            </div>
                          </TableCell>

                          {/* Destination Godown */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Warehouse className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span className="font-medium truncate max-w-[160px]">{trf.toGodownName}</span>
                            </div>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell className="px-4 py-3.5 text-right font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                            {trf.qty} {trf.itemUnit}
                          </TableCell>

                          {/* Transferred By */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                            {trf.actor}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-4 py-3.5 text-center">
                            <Badge variant="outline" className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              {trf.status}
                            </Badge>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTransferId(trf.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title="View Transfer Slip"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination Bar */}
              <Pagination
                variant="table"
                totalCount={filteredTransfers.length}
                pageSize={transferPageSize}
                currentPage={transferPage}
                onPageChange={setTransferPage}
                onPageSizeChange={setTransferPageSize}
                itemLabel="Transfer Orders"
              />
            </div>
          </div>
        )}

        {/* TAB: INVENTORY ADJUSTMENTS */}
        {activeTab === "adjustments" && (
          <div className="space-y-4">
            {/* Controls: Search & Filters */}
            <div className="flex items-center gap-2 max-w-lg">
              <SearchInput
                value={adjustmentSearch}
                onChange={(val) => {
                  setAdjustmentSearch(val)
                  setAdjustmentPage(1)
                }}
                placeholder="Search adjustments by doc #, item, godown, actor, reason..."
                className="w-full text-xs"
              />
              <Select
                value={adjustmentFilterGodown}
                onValueChange={(val) => {
                  setAdjustmentFilterGodown(val)
                  setAdjustmentPage(1)
                }}
                options={[
                  { value: "all", label: "All Godowns" },
                  ...godowns.map(g => ({ value: g.id, label: g.name }))
                ]}
                className="w-48 h-8 text-xs shrink-0"
              />
            </div>

            {/* Adjustments Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={paginatedAdjustments.length > 0 && selectedAdjustmentRowIds.length === paginatedAdjustments.length}
                        indeterminate={selectedAdjustmentRowIds.length > 0 && selectedAdjustmentRowIds.length < paginatedAdjustments.length}
                        onChange={toggleSelectAllAdjustments}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Date & Time
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Adjustment #
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Item / Product
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Godown / Warehouse
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Reason
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Quantity Adjusted
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-20">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <SlidersHorizontal className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">No inventory adjustments recorded yet</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAdjustMode(true)}
                            className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-1 cursor-pointer"
                          >
                            Adjust Stock Now
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAdjustments.map(m => {
                      const isSelected = selectedAdjustmentRowIds.includes(m.id)
                      const itm = items.find(i => i.id === m.itemId)
                      return (
                        <TableRow
                          key={m.id}
                          onClick={() => setSelectedAdjustmentId(m.id)}
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group",
                            isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          )}
                        >
                          {/* Checkbox */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectAdjustment(m.id, e)}>
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => { }}
                            />
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {m.timestamp}
                          </TableCell>

                          {/* Adjustment # */}
                          <TableCell className="px-4 py-3.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                              {m.refDocNo}
                            </span>
                          </TableCell>

                          {/* Item / Product */}
                          <TableCell className="px-4 py-3.5">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {m.itemName}
                            </div>
                            {itm?.code && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                SKU: {itm.code}
                              </div>
                            )}
                          </TableCell>

                          {/* Godown */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium truncate max-w-[160px]">{m.godownName}</span>
                            </div>
                          </TableCell>

                          {/* Reason */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {m.reason || "Physical count reconciliation"}
                          </TableCell>

                          {/* Quantity Adjusted */}
                          <TableCell className="px-4 py-3.5 text-right font-bold text-xs tabular-nums">
                            <span className={m.qtyChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                              {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange} {itm?.unit || "units"}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-4 py-3.5 text-center">
                            <Badge variant="outline" className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              Adjusted
                            </Badge>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedAdjustmentId(m.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title="View Adjustment Slip"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination Bar */}
              <Pagination
                variant="table"
                totalCount={filteredAdjustments.length}
                pageSize={adjustmentPageSize}
                currentPage={adjustmentPage}
                onPageChange={setAdjustmentPage}
                onPageSizeChange={setAdjustmentPageSize}
                itemLabel="Adjustments"
              />
            </div>
          </div>
        )}

        {/* TAB 2: PHYSICAL STOCK AUDITS (PRD INV-13 to 16, F7) */}
        {activeTab === "audits" && (
          <div className="space-y-4">
            {/* Controls: Search & Filters */}
            <div className="flex items-center gap-2 max-w-2xl">
              <SearchInput
                value={auditSearch}
                onChange={(val) => {
                  setAuditSearch(val)
                  setAuditPage(1)
                }}
                placeholder="Search audits by audit #, godown, category, item, or authorizer..."
                className="w-full text-xs"
              />
              <Select
                value={auditFilterGodown}
                onValueChange={(val) => {
                  setAuditFilterGodown(val)
                  setAuditPage(1)
                }}
                options={[
                  { value: "all", label: "All Godowns" },
                  ...godowns.map(g => ({ value: g.id, label: g.name }))
                ]}
                className="w-44 h-8 text-xs shrink-0"
              />
              <Select
                value={auditFilterStatus}
                onValueChange={(val) => {
                  setAuditFilterStatus(val)
                  setAuditPage(1)
                }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "approved", label: "Approved" },
                  { value: "review", label: "Pending Review" }
                ]}
                className="w-36 h-8 text-xs shrink-0"
              />
            </div>

            {/* Stock Audits Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                    <TableHead className="w-12 px-4 py-3 text-center">
                      <TableCheckbox
                        checked={paginatedAudits.length > 0 && selectedAuditRowIds.length === paginatedAudits.length}
                        indeterminate={selectedAuditRowIds.length > 0 && selectedAuditRowIds.length < paginatedAudits.length}
                        onChange={toggleSelectAllAudits}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Audit #
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Godown / Warehouse
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Category Scope
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Items Audited
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Variance Qty
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Net Variance Value
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-24">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16 text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ClipboardCheck className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">No physical stock audits found</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleOpenAuditModal}
                            className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-1 cursor-pointer"
                          >
                            Record First Physical Audit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAudits.map(audit => {
                      const isSelected = selectedAuditRowIds.includes(audit.id)
                      const totalVarQty = audit.items.reduce((s, i) => s + i.varianceQty, 0)
                      const totalVarVal = audit.items.reduce((s, i) => s + i.varianceValue, 0)
                      const isAppr = audit.status === "approved"

                      return (
                        <TableRow
                          key={audit.id}
                          onClick={() => setSelectedAuditId(audit.id)}
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group",
                            isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          )}
                        >
                          {/* Checkbox */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectAudit(audit.id, e)}>
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => { }}
                            />
                          </TableCell>

                          {/* Audit # */}
                          <TableCell className="px-4 py-3.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                              {audit.auditNo}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {audit.date}
                          </TableCell>

                          {/* Godown */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium truncate max-w-[160px]">{audit.godownName}</span>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {audit.category}
                            </span>
                          </TableCell>

                          {/* Items count */}
                          <TableCell className="px-4 py-3.5 text-center text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {audit.items.length} {audit.items.length === 1 ? "SKU" : "SKUs"}
                          </TableCell>

                          {/* Variance Qty */}
                          <TableCell className="px-4 py-3.5 text-right font-bold text-xs tabular-nums">
                            <span className={totalVarQty < 0 ? "text-rose-600 dark:text-rose-400" : totalVarQty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                              {totalVarQty > 0 ? `+${totalVarQty}` : totalVarQty} units
                            </span>
                          </TableCell>

                          {/* Variance Value */}
                          <TableCell className="px-4 py-3.5 text-right font-bold text-xs tabular-nums">
                            <span className={totalVarVal < 0 ? "text-rose-600 dark:text-rose-400" : totalVarVal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                              {totalVarVal < 0 ? `-₹${Math.abs(totalVarVal)}` : `₹${totalVarVal}`}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-4 py-3.5 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium ${isAppr
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                                }`}
                            >
                              {isAppr ? "Approved" : "Review"}
                            </Badge>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {!isAppr && (
                                <button
                                  type="button"
                                  onClick={() => handleAuditApprove(audit.id)}
                                  className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                                  title="Approve Audit & Post Adjustments"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedAuditId(audit.id)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                                title="View Audit Slip & Breakdown"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination Bar */}
              <Pagination
                variant="table"
                totalCount={filteredAudits.length}
                pageSize={auditPageSize}
                currentPage={auditPage}
                onPageChange={setAuditPage}
                onPageSizeChange={setAuditPageSize}
                itemLabel="Stock Audits"
              />
            </div>
          </div>
        )}

        {/* TAB 3: STOCK LEDGER AUDIT TRAIL (PRD INV-12, ITM-08, AC-11) */}
        {activeTab === "ledger" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Immutable Stock Movement Log</div>
                <p className="text-xs text-slate-500 mt-0.5">Every inventory deduction and addition with actor, reason, and ref doc.</p>
              </div>
              <Badge variant="outline" className="text-xs">{stockMovements.length} Movements</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Godown</TableHead>
                  <TableHead>Doc Ref</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead className="text-right">Qty Change</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">{m.timestamp}</TableCell>
                    <TableCell className="font-semibold text-sm text-slate-900 dark:text-white">{m.itemName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {m.movementType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-normal text-slate-600 dark:text-slate-300">{m.godownName}</TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">{m.refDocNo}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-500 dark:text-slate-400">{m.actor}</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      <span className={m.qtyChange < 0 ? "text-rose-600" : "text-emerald-600"}>
                        {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                      {m.reason || "Standard posting"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modals in Summary / Root View */}
        {renderTransferDialog()}
        {renderAddGodownDialog()}
        {renderAuditDialog()}
      </div>
    </div>
  )
}

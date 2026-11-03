"use client"

import React, { useState, useEffect, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ItemDetailView } from "./ItemDetailView"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  RotateCw, 
  Filter, 
  MoreHorizontal, 
  Search, 
  ChevronDown, 
  Package, 
  Boxes, 
  Layers, 
  History, 
  X,
  SlidersHorizontal,
  Check,
  Building,
  Image as ImageIcon,
  UploadCloud,
  FileSpreadsheet,
  Barcode
} from "lucide-react"
import { Item } from "@/types/inventory"
import { AddItemForm } from "@/components/forms/AddItemForm"
import { AdjustStockForm } from "@/components/forms/AdjustStockForm"
import { ImportFromSoftwareModal } from "@/components/modals/ImportFromSoftwareModal"
import { BulkAddItemsModal } from "@/components/modals/BulkAddItemsModal"
import { BarcodeModal } from "@/components/modals/BarcodeModal"
import { formatINR } from "@/lib/utils"

import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"

interface ItemsModuleProps {
  initialOpenAdd?: boolean
  onCloseAddTrigger?: () => void
}

export function ItemsModule({ initialOpenAdd = false, onCloseAddTrigger }: ItemsModuleProps = {}) {
  const { items, godowns, canViewCostAndProfit, addItem, updateItem } = useApp()
  const [viewFilter, setViewFilter] = useState<"all" | "low_stock" | "active">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isAddMode, setIsAddMode] = useState(initialOpenAdd)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isAdjustMode, setIsAdjustMode] = useState(false)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [inlineSearch, setInlineSearch] = useState("")

  // Bulk Actions & Software Import State
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false)
  const [isImportSoftwareModalOpen, setIsImportSoftwareModalOpen] = useState(false)
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [barcodeModalItem, setBarcodeModalItem] = useState<Item | null>(null)
  const bulkMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setIsBulkMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])



  const itemFilterOptions = [
    { value: "all", label: "All Items" },
    { value: "low_stock", label: "Low Stock Items" },
    { value: "active", label: "Active Items" },
  ]

  const filteredItems = items.filter(item => {
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      const matches = item.name.toLowerCase().includes(q) || 
                      item.code.toLowerCase().includes(q) ||
                      Boolean(item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
                      Boolean(item.barcode && item.barcode.toLowerCase().includes(q))
      if (!matches) return false
    }
    if (viewFilter === "low_stock") return item.currentStock <= item.minStock
    return true
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [viewFilter, inlineSearch])

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const selectedItem = items.find(i => i.id === selectedItemId) || null

  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedItems.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(paginatedItems.map(i => i.id))
    }
  }

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  if (isAddMode || editingItem) {
    return (
      <AddItemForm
        itemToEdit={editingItem}
        onSave={(itemData) => {
          if (editingItem) {
            updateItem(editingItem.id, itemData)
            setSelectedItemId(editingItem.id)
            setEditingItem(null)
          } else {
            const res = addItem(itemData)
            if (res.item) {
              setSelectedItemId(res.item.id)
            }
            setIsAddMode(false)
          }
          if (onCloseAddTrigger) onCloseAddTrigger()
        }}
        onCancel={() => {
          setIsAddMode(false)
          setEditingItem(null)
          if (onCloseAddTrigger) onCloseAddTrigger()
        }}
      />
    )
  }

  if (selectedItemId && selectedItem) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left: Master Item List (matching Reference Image) */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          
          {/* Action Bar matching Reference */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Items</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={viewFilter}
                onValueChange={(val) => setViewFilter(val as any)}
                options={itemFilterOptions}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Add New Item"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search items..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master Item List matching Reference Image */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredItems.map(item => {
              const isSelected = item.id === selectedItemId
              const isLow = item.currentStock <= item.minStock

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id)
                    setIsAdjustMode(false)
                  }}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(item.id)}
                      onChange={(e) => toggleSelectRow(item.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                    />
                    <div className="min-w-0 flex items-start gap-2">
                      {(item.images?.[0] || item.image) && (
                        <img 
                          src={item.images?.[0] || item.image} 
                          alt="" 
                          className="h-8 w-8 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" 
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.brand || item.code}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₹{item.salePrice.toFixed(2)}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${isLow ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {isLow ? "Low Stock" : "Active"}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Bottom Pagination Bar matching Reference */}
          <Pagination
            variant="master-list"
            totalCount={filteredItems.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />

        </div>

        {/* Right: Adjust Stock Form OR Detail View matching Reference Image */}
        {isAdjustMode ? (
          <AdjustStockForm
            item={selectedItem}
            onClose={() => setIsAdjustMode(false)}
            onSuccess={() => setIsAdjustMode(false)}
          />
        ) : (
          <ItemDetailView
            item={selectedItem}
            onClose={() => {
              setSelectedItemId(null)
              setIsAdjustMode(false)
            }}
            onEdit={() => setEditingItem(selectedItem)}
            onAdjustStock={() => setIsAdjustMode(true)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Zoho Inventory Standard Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11">
        
        {/* Left: Module Title | View Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Items
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={viewFilter}
            onValueChange={(val) => setViewFilter(val as any)}
            options={itemFilterOptions}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        {/* Right: Bulk Actions (Secondary) + New Button */}
        <div className="flex items-center gap-2">
          {/* Secondary Button: Bulk Actions */}
          <div className="relative" ref={bulkMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkMenuOpen(prev => !prev)}
              className="h-7 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md gap-1.5 shadow-2xs cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Bulk Actions</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>

            {/* Dropdown Menu */}
            {isBulkMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-40 text-xs select-none animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bulk Item Actions
                </div>

                {/* Option 1: Add Items from Other Software */}
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMenuOpen(false)
                    setIsImportSoftwareModalOpen(true)
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                      Add Items from Other Software
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Import from Vyapar, Zoho, myBillBook, Tally
                    </span>
                  </div>
                </button>

                {/* Option 2: Add Items in Bulk (Excel / CSV) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMenuOpen(false)
                    setIsBulkAddModalOpen(true)
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0 mt-0.5">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block leading-tight">
                      Add Items in Bulk (Excel / CSV)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Download template and bulk import
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddMode(true)}
            className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>

      </div>

      {/* Inline Quick Search if filter opened */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          {inlineSearch && (
            <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
              Clear
            </button>
          )}
        </div>
      )}

      {/* 2. Standard Card Data Table using ui/table.tsx */}
      <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                <TableHead className="w-12 px-4 py-3 text-center">
                  <TableCheckbox
                    checked={paginatedItems.length > 0 && selectedRowIds.length === paginatedItems.length}
                    indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < paginatedItems.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">ITEM NAME & SKU</TableHead>
                <TableHead className="px-4 py-3">CATEGORY</TableHead>
                <TableHead className="px-4 py-3 text-right">RATE</TableHead>
                <TableHead className="px-4 py-3 text-right">STOCK ON HAND</TableHead>
                <TableHead className="px-4 py-3 text-center">USAGE UNIT</TableHead>
                <TableHead className="px-4 py-3 text-right">REORDER LEVEL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-xs">
                    No items found in this view.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map(item => {
                  const isSelected = selectedRowIds.includes(item.id)
                  const isLow = item.currentStock <= item.minStock

                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${
                        isSelected 
                          ? "bg-blue-50/50 dark:bg-blue-950/30" 
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectRow(item.id, e)}>
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </TableCell>

                      {/* Name with SKU stacked underneath */}
                      <TableCell className="px-4 py-3.5">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {item.code}
                          </span>
                          {(item.code || item.itemCode || item.barcode) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setBarcodeModalItem(item)
                              }}
                              className="p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Generate & print barcode / QR labels"
                            >
                              <Barcode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Category - Secondary */}
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {item.category}
                      </TableCell>

                      {/* Rate - Primary */}
                      <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        ₹{item.salePrice.toFixed(2)}
                      </TableCell>

                      {/* Stock on hand - Primary */}
                      <TableCell className="px-4 py-3.5 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${isLow ? "text-rose-600" : "text-slate-900 dark:text-slate-100"}`}>
                          {item.currentStock.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Usage unit - Secondary */}
                      <TableCell className="px-4 py-3.5 text-center text-sm font-normal text-slate-500 dark:text-slate-400 lowercase">
                        {item.unit}
                      </TableCell>

                      {/* Reorder Level - Secondary */}
                      <TableCell className="px-4 py-3.5 text-right text-sm font-normal tabular-nums text-slate-500 dark:text-slate-400">
                        {item.minStock}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Standard Table Footer */}
          <Pagination
            totalCount={filteredItems.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Total Count"
          />
        </div>
      </div>

      {/* Import from Other Software Modal (Vyapar, Zoho, myBillBook, Tally) */}
      <ImportFromSoftwareModal
        isOpen={isImportSoftwareModalOpen}
        onClose={() => setIsImportSoftwareModalOpen(false)}
      />

      {/* Bulk Add Items Modal (Excel / CSV Template) */}
      <BulkAddItemsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
      />

      {/* Barcode & QR Label Generator Modal */}
      <BarcodeModal
        isOpen={Boolean(barcodeModalItem)}
        onClose={() => setBarcodeModalItem(null)}
        item={barcodeModalItem}
      />

    </div>
  )
}

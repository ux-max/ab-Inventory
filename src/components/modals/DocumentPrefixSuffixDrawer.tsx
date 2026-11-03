"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { 
  X, 
  Plus, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Check, 
  Hash, 
  FileText,
  AlertCircle
} from "lucide-react"
import { DocumentSequenceType, PrefixSuffixEntry } from "@/types/inventory"

interface DocumentPrefixSuffixDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDocType?: DocumentSequenceType
}

interface DocTypeTab {
  id: DocumentSequenceType
  label: string
}

const DOC_TYPE_TABS: DocTypeTab[] = [
  { id: "invoice", label: "Invoice" },
  { id: "bill", label: "Purchase" },
  { id: "sales_return", label: "Sales Return" },
  { id: "purchase_return", label: "Purchase Return" },
  { id: "order", label: "Sales Order" },
  { id: "challan", label: "Delivery Challan" },
  { id: "quotation", label: "Quotation" },
  { id: "proforma", label: "Proforma" },
  { id: "credit_note", label: "Credit Note" },
  { id: "debit_note", label: "Debit Note" },
]

export const DocumentPrefixSuffixDrawer: React.FC<DocumentPrefixSuffixDrawerProps> = ({
  open,
  onOpenChange,
  initialDocType = "invoice"
}) => {
  const { 
    prefixSuffixSettings, 
    setDefaultPrefixSuffix, 
    addPrefixSuffixEntry, 
    editPrefixSuffixEntry, 
    deletePrefixSuffixEntry 
  } = useApp()

  const [activeTab, setActiveTab] = useState<"prefixes" | "suffixes">("prefixes")
  const [selectedDocType, setSelectedDocType] = useState<DocumentSequenceType>(initialDocType)
  
  // Add/Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<PrefixSuffixEntry | null>(null)
  const [formValue, setFormValue] = useState("")
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [formError, setFormError] = useState("")
  const [savedToast, setSavedToast] = useState(false)

  // Sync initialDocType when opening
  React.useEffect(() => {
    if (open && initialDocType) {
      setSelectedDocType(initialDocType)
      setIsEditing(false)
      setEditingItem(null)
      setFormError("")
    }
  }, [open, initialDocType])

  const currentConfig = prefixSuffixSettings[selectedDocType] || { prefixes: [], suffixes: [] }
  const currentList = activeTab === "prefixes" ? currentConfig.prefixes : currentConfig.suffixes

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormValue("")
    setFormIsDefault(currentList.length === 0)
    setFormError("")
    setIsEditing(true)
  }

  const handleOpenEdit = (item: PrefixSuffixEntry) => {
    setEditingItem(item)
    setFormValue(item.value)
    setFormIsDefault(item.isDefault)
    setFormError("")
    setIsEditing(true)
  }

  const handleSaveForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formValue.trim()) {
      setFormError(`Please enter a valid ${activeTab === "prefixes" ? "prefix" : "suffix"}.`)
      return
    }

    const kind = activeTab === "prefixes" ? "prefix" : "suffix"
    if (editingItem) {
      editPrefixSuffixEntry(selectedDocType, kind, editingItem.id, formValue.trim())
      if (formIsDefault && !editingItem.isDefault) {
        setDefaultPrefixSuffix(selectedDocType, kind, editingItem.id)
      }
    } else {
      addPrefixSuffixEntry(selectedDocType, kind, formValue.trim(), formIsDefault)
    }

    setIsEditing(false)
    setEditingItem(null)
    setFormValue("")
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2000)
  }

  const handleToggleDefault = (item: PrefixSuffixEntry) => {
    const kind = activeTab === "prefixes" ? "prefix" : "suffix"
    setDefaultPrefixSuffix(selectedDocType, kind, item.id)
  }

  const handleDelete = (item: PrefixSuffixEntry) => {
    const kind = activeTab === "prefixes" ? "prefix" : "suffix"
    deletePrefixSuffixEntry(selectedDocType, kind, item.id)
  }

  // Header matching the reference screenshot media_1793340883491_f5319cb0.png
  const customHeader = (
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="p-1.5 -ml-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Document Prefix/Suffixes
        </h2>
      </div>

      {savedToast && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
          <Check className="h-3.5 w-3.5" />
          Settings Saved
        </span>
      )}
    </div>
  )

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      header={customHeader}
      hideCloseButton
      side="right"
      className="w-full sm:max-w-2xl md:max-w-3xl"
      zIndex={10060}
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        
        {/* ========================================================= */}
        {/* 1. Top Mode Selector: Prefixes | Suffixes + Add Button    */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => { setActiveTab("prefixes"); setIsEditing(false); }}
              className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === "prefixes"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Prefixes
              {activeTab === "prefixes" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("suffixes"); setIsEditing(false); }}
              className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === "suffixes"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Suffixes
              {activeTab === "suffixes" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add {activeTab === "prefixes" ? "Prefix" : "Suffix"}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. Document Form Category Tabs (Horizontal Scrollable)    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
          {DOC_TYPE_TABS.map(tab => {
            const isSelected = selectedDocType === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setSelectedDocType(tab.id); setIsEditing(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* 3. Add / Edit Form Modal / Box (When active)              */}
        {/* ========================================================= */}
        {isEditing && (
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {editingItem ? `Edit ${activeTab === "prefixes" ? "Prefix" : "Suffix"}` : `Add New ${activeTab === "prefixes" ? "Prefix" : "Suffix"}`} for {DOC_TYPE_TABS.find(t => t.id === selectedDocType)?.label}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {activeTab === "prefixes" ? "Prefix String (e.g. INV-, AB/26/)" : "Suffix String (e.g. /26, -FY)"}*
                </label>
                <Input
                  type="text"
                  placeholder={activeTab === "prefixes" ? "e.g. INV-" : "e.g. /26"}
                  value={formValue}
                  onChange={(e) => { setFormValue(e.target.value); setFormError(""); }}
                  className="h-9 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formIsDefault}
                    onCheckedChange={setFormIsDefault}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Set as Default
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveForm}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. Main Sequence Table matching Reference Image           */}
        {/* ========================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-6">
              {activeTab === "prefixes" ? "Prefix" : "Suffix"}
            </div>
            <div className="col-span-3 text-center">
              Default
            </div>
            <div className="col-span-3 text-right">
              Actions
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Hash className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium text-slate-500">
                  No {activeTab} configured for {DOC_TYPE_TABS.find(t => t.id === selectedDocType)?.label}.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Add First {activeTab === "prefixes" ? "Prefix" : "Suffix"}
                </button>
              </div>
            ) : (
              currentList.map(item => (
                <div 
                  key={item.id}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Column 1: Value */}
                  <div className="col-span-6 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {item.value}
                    </span>
                    {item.isDefault && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Column 2: Default Toggle Switch */}
                  <div className="col-span-3 flex justify-center">
                    <Switch
                      checked={item.isDefault}
                      onCheckedChange={() => handleToggleDefault(item)}
                    />
                  </div>

                  {/* Column 3: Edit Action Button (Matching yellow Edit badge in ref screenshot) */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit prefix"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>

                    {currentList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. Dashed + Add Button at bottom matching screenshot      */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full py-2.5 rounded-xl border border-dashed border-blue-400 dark:border-blue-600/80 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add {activeTab === "prefixes" ? "Prefix" : "Suffix"}</span>
        </button>

      </div>
    </Drawer>
  )
}


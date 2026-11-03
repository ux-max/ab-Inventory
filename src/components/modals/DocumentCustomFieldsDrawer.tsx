"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Plus, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Check, 
  Layers, 
  FileText,
  AlertCircle,
  Eye,
  Printer
} from "lucide-react"
import { 
  FormCustomFieldDocType, 
  CustomItemField, 
  CustomFieldType, 
  DocumentSequenceType 
} from "@/types/inventory"

interface DocumentCustomFieldsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDocType?: FormCustomFieldDocType
}

interface DocTabDef {
  id: FormCustomFieldDocType
  label: string
}

const FORM_TABS: DocTabDef[] = [
  { id: "invoice", label: "Invoice" },
  { id: "proforma", label: "Proforma" },
  { id: "quotation", label: "Quotation" },
  { id: "order", label: "Sales Order" },
  { id: "challan", label: "Delivery Challan" },
  { id: "bill", label: "Purchase" },
  { id: "sales_return", label: "Sales Return" },
  { id: "purchase_return", label: "Purchase Return" },
  { id: "credit_note", label: "Credit Note" },
  { id: "debit_note", label: "Debit Note" },
  { id: "item", label: "Item Master" },
]

export const DocumentCustomFieldsDrawer: React.FC<DocumentCustomFieldsDrawerProps> = ({
  open,
  onOpenChange,
  initialDocType = "invoice"
}) => {
  const { 
    documentCustomFields, 
    addFormCustomField, 
    updateFormCustomField, 
    deleteFormCustomField 
  } = useApp()

  const [selectedDocType, setSelectedDocType] = useState<FormCustomFieldDocType>(initialDocType)
  
  // Add / Edit form state
  const [isEditing, setIsEditing] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState<CustomFieldType>("text")
  const [fieldPrintOnPaper, setFieldPrintOnPaper] = useState(true)
  const [fieldIsEnabled, setFieldIsEnabled] = useState(true)
  const [optionsList, setOptionsList] = useState<string[]>(["Option 1", "Option 2"])
  const [newOptionInput, setNewOptionInput] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [savedToast, setSavedToast] = useState(false)

  // Sync initialDocType when opened
  useEffect(() => {
    if (open && initialDocType) {
      setSelectedDocType(initialDocType)
      setIsEditing(false)
      setEditingFieldId(null)
      setErrorMessage("")
    }
  }, [open, initialDocType])

  const currentFields = documentCustomFields[selectedDocType] || []
  const isMaxReached = currentFields.length >= 6

  const openAddForm = () => {
    if (isMaxReached) {
      setErrorMessage("Maximum 6 custom fields allowed per document format.")
      return
    }
    setEditingFieldId(null)
    setFieldName("")
    setFieldType("text")
    setFieldPrintOnPaper(true)
    setFieldIsEnabled(true)
    setOptionsList(["Standard", "Deluxe", "Premium"])
    setNewOptionInput("")
    setErrorMessage("")
    setIsEditing(true)
  }

  const openEditForm = (field: CustomItemField) => {
    setEditingFieldId(field.id)
    setFieldName(field.name)
    setFieldType(field.type)
    setFieldPrintOnPaper(field.printOnPaper)
    setFieldIsEnabled(field.isEnabled)
    setOptionsList(field.options && field.options.length > 0 ? [...field.options] : ["Option 1", "Option 2"])
    setNewOptionInput("")
    setErrorMessage("")
    setIsEditing(true)
  }

  const handleAddOptionItem = () => {
    const trimmed = newOptionInput.trim()
    if (!trimmed) return
    if (optionsList.includes(trimmed)) {
      setErrorMessage("Option already exists.")
      return
    }
    setOptionsList(prev => [...prev, trimmed])
    setNewOptionInput("")
    setErrorMessage("")
  }

  const handleRemoveOptionItem = (idx: number) => {
    if (optionsList.length <= 1) {
      setErrorMessage("Dropdown must have at least one option.")
      return
    }
    setOptionsList(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveField = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = fieldName.trim()
    if (!trimmed) {
      setErrorMessage("Field name is required.")
      return
    }

    if (editingFieldId) {
      const res = updateFormCustomField(selectedDocType, editingFieldId, {
        name: trimmed,
        type: fieldType,
        printOnPaper: fieldPrintOnPaper,
        isEnabled: fieldIsEnabled,
        options: fieldType === "select" ? optionsList : undefined
      })
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }
    } else {
      if (isMaxReached) {
        setErrorMessage("Maximum 6 custom fields reached for this form.")
        return
      }
      const res = addFormCustomField(selectedDocType, {
        name: trimmed,
        type: fieldType,
        printOnPaper: fieldPrintOnPaper,
        isEnabled: fieldIsEnabled,
        options: fieldType === "select" ? optionsList : undefined
      })
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }
    }

    setIsEditing(false)
    setEditingFieldId(null)
    setFieldName("")
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2000)
  }

  const handleTogglePrint = (field: CustomItemField) => {
    updateFormCustomField(selectedDocType, field.id, { printOnPaper: !field.printOnPaper })
  }

  const handleToggleEnabled = (field: CustomItemField) => {
    updateFormCustomField(selectedDocType, field.id, { isEnabled: !field.isEnabled })
  }

  const handleDeleteField = (fieldId: string) => {
    deleteFormCustomField(selectedDocType, fieldId)
  }

  const activeTabLabel = FORM_TABS.find(t => t.id === selectedDocType)?.label || "Document"

  // Header matching Document Settings Drawer
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
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Document Custom Fields
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeTabLabel} • {currentFields.length} of 6 fields used
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {savedToast && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}

        <Button
          type="button"
          size="sm"
          onClick={openAddForm}
          disabled={isMaxReached}
          className="h-8.5 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-50 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Field</span>
        </Button>
      </div>
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
        {/* 1. Form Category Tabs (Horizontal Scrollable)             */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
          {FORM_TABS.map(tab => {
            const isSelected = selectedDocType === tab.id
            const count = (documentCustomFields[tab.id] || []).length
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setSelectedDocType(tab.id); setIsEditing(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-bold" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* 2. Add / Edit Custom Field Form Box (When active)         */}
        {/* ========================================================= */}
        {isEditing && (
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>{editingFieldId ? "Edit Custom Field" : "Create Custom Field"} for {activeTabLabel}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-md border border-rose-200 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Name (e.g., Vehicle No, PO Date, E-way Bill)*
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Vehicle Number"
                  value={fieldName}
                  onChange={(e) => { setFieldName(e.target.value); setErrorMessage(""); }}
                  className="h-9 text-xs bg-white dark:bg-slate-900 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Type
                </label>
                <Select
                  value={fieldType}
                  onValueChange={(val) => setFieldType(val as CustomFieldType)}
                  className="h-9 text-xs w-full bg-white dark:bg-slate-900"
                  options={[
                    { value: "text", label: "Text (Single line)" },
                    { value: "number", label: "Number (Numeric)" },
                    { value: "date", label: "Date (Calendar picker)" },
                    { value: "select", label: "Dropdown (Single select)" },
                  ]}
                />
              </div>
            </div>

            {/* Dropdown Options editor if type === select */}
            {fieldType === "select" && (
              <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Dropdown Options
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add option..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOptionItem(); } }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddOptionItem}
                    className="h-8 text-xs"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {optionsList.map((opt, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {opt}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOptionItem(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Print on PDF & Enable on Form switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Show on PDF
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Print this field on generated invoice PDFs
                  </p>
                </div>
                <Switch
                  checked={fieldPrintOnPaper}
                  onCheckedChange={setFieldPrintOnPaper}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Enabled on Form
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Display input on the document entry form
                  </p>
                </div>
                <Switch
                  checked={fieldIsEnabled}
                  onCheckedChange={setFieldIsEnabled}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveField}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {editingFieldId ? "Update Field" : "Save Field"}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. Main Custom Fields List / Table                        */}
        {/* ========================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-5">
              Field Name & Type
            </div>
            <div className="col-span-3 text-center">
              Show on PDF
            </div>
            <div className="col-span-2 text-center">
              Status
            </div>
            <div className="col-span-2 text-right">
              Actions
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentFields.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium text-slate-500">
                  No custom fields configured for {activeTabLabel}.
                </p>
                <button
                  type="button"
                  onClick={openAddForm}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + Add First Custom Field
                </button>
              </div>
            ) : (
              currentFields.map(field => (
                <div 
                  key={field.id}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Column 1: Name and Type badge */}
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {field.name}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 shrink-0">
                      {field.type}
                    </span>
                    {field.type === "select" && field.options && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({field.options.length} opts)
                      </span>
                    )}
                  </div>

                  {/* Column 2: Show on PDF Switch */}
                  <div className="col-span-3 flex items-center justify-center gap-1.5">
                    <Switch
                      checked={field.printOnPaper}
                      onCheckedChange={() => handleTogglePrint(field)}
                    />
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {field.printOnPaper ? "Printed" : "Hidden"}
                    </span>
                  </div>

                  {/* Column 3: Active / Enabled Switch */}
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={field.isEnabled}
                      onCheckedChange={() => handleToggleEnabled(field)}
                    />
                  </div>

                  {/* Column 4: Edit & Delete */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditForm(field)}
                      className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit field"
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                      title="Delete field"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Dashed + Add Custom Field button at bottom             */}
        {/* ========================================================= */}
        {!isMaxReached && (
          <button
            type="button"
            onClick={openAddForm}
            className="w-full py-2.5 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-600/80 bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Field for {activeTabLabel} ({currentFields.length}/6)</span>
          </button>
        )}

      </div>
    </Drawer>
  )
}


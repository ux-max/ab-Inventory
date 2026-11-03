"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Plus, 
  Trash2, 
  Printer, 
  Sliders, 
  Check, 
  AlertCircle, 
  Edit2, 
  ListPlus, 
  Eye, 
  EyeOff,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react"
import { CustomItemField, CustomFieldType, ItemFieldToggles } from "@/types/inventory"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function ItemsSettings() {
  const { 
    customItemFields, 
    addCustomItemField, 
    updateCustomItemField, 
    deleteCustomItemField,
    itemFieldToggles,
    updateItemFieldToggles 
  } = useApp()

  // Modal State for adding/editing a custom field
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  
  // Field Form State
  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState<CustomFieldType>("text")
  const [optionsList, setOptionsList] = useState<string[]>(["Option 1", "Option 2"])
  const [newOptionInput, setNewOptionInput] = useState("")
  const [fieldPrintOnPaper, setFieldPrintOnPaper] = useState(true)
  const [fieldIsEnabled, setFieldIsEnabled] = useState(true)
  const [validationError, setValidationError] = useState("")

  const openAddModal = () => {
    if (customItemFields.length >= 6) {
      alert("You can add up to 6 custom fields only.")
      return
    }
    setEditingFieldId(null)
    setFieldName("")
    setFieldType("text")
    setOptionsList(["Standard", "Deluxe", "Premium"])
    setNewOptionInput("")
    setFieldPrintOnPaper(true)
    setFieldIsEnabled(true)
    setValidationError("")
    setIsModalOpen(true)
  }

  const openEditModal = (field: CustomItemField) => {
    setEditingFieldId(field.id)
    setFieldName(field.name)
    setFieldType(field.type)
    setOptionsList(field.options && field.options.length > 0 ? [...field.options] : ["Option 1"])
    setNewOptionInput("")
    setFieldPrintOnPaper(field.printOnPaper)
    setFieldIsEnabled(field.isEnabled)
    setValidationError("")
    setIsModalOpen(true)
  }

  const handleAddOptionItem = () => {
    const trimmed = newOptionInput.trim()
    if (!trimmed) return
    if (optionsList.includes(trimmed)) {
      setValidationError("Option value already exists.")
      return
    }
    setOptionsList((prev) => [...prev, trimmed])
    setNewOptionInput("")
    setValidationError("")
  }

  const handleRemoveOptionItem = (index: number) => {
    if (optionsList.length <= 1) {
      setValidationError("Dropdown fields must have at least one option.")
      return
    }
    setOptionsList((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSaveField = () => {
    const trimmedName = fieldName.trim()
    if (!trimmedName) {
      setValidationError("Please enter a field name.")
      return
    }

    if (fieldType === "select" && optionsList.length === 0) {
      setValidationError("Please add at least one option for the dropdown.")
      return
    }

    if (editingFieldId) {
      updateCustomItemField(editingFieldId, {
        name: trimmedName,
        type: fieldType,
        options: fieldType === "select" ? optionsList : undefined,
        printOnPaper: fieldPrintOnPaper,
        isEnabled: fieldIsEnabled,
      })
    } else {
      if (customItemFields.length >= 6) {
        setValidationError("Maximum limit of 6 custom fields reached.")
        return
      }
      addCustomItemField({
        name: trimmedName,
        type: fieldType,
        options: fieldType === "select" ? optionsList : undefined,
        printOnPaper: fieldPrintOnPaper,
        isEnabled: fieldIsEnabled,
      })
    }

    setIsModalOpen(false)
  }

  const handleToggleBuiltin = (field: keyof ItemFieldToggles) => {
    updateItemFieldToggles({
      [field]: !itemFieldToggles[field],
    })
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Item Form & Custom Fields
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure existing fields and add up to 6 custom attributes with print toggles for invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className="text-xs px-2.5 py-1 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              Custom Fields: <span className="font-bold text-blue-600 dark:text-blue-400 ml-1">{customItemFields.length} / 6</span>
            </Badge>

            <Button
              onClick={openAddModal}
              disabled={customItemFields.length >= 6}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add Custom Field
            </Button>
          </div>
        </div>

        {/* Section 1: Standard Item Form Fields (Enable / Disable) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-400" />
                Standard Item Form Fields
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Turn on or off built-in pricing, tax, and tracking fields inside the Add / Edit Item drawer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wholesale Pricing */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Wholesale Price & Min Qty
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Allows defining bulk wholesale pricing tiers and minimum order quantities.
                </p>
              </div>
              <Switch
                checked={itemFieldToggles.wholesale}
                onCheckedChange={() => handleToggleBuiltin("wholesale")}
              />
            </div>

            {/* MRP */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Maximum Retail Price (MRP)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Enables consumer MRP, discount on MRP, and MRP-inclusive tax calculations.
                </p>
              </div>
              <Switch
                checked={itemFieldToggles.mrp}
                onCheckedChange={() => handleToggleBuiltin("mrp")}
              />
            </div>

            {/* Barcode */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Barcode / Item Code Scanning
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Enables barcode input and camera scanning inside catalog and invoice forms.
                </p>
              </div>
              <Switch
                checked={itemFieldToggles.barcode}
                onCheckedChange={() => handleToggleBuiltin("barcode")}
              />
            </div>

            {/* HSN / SAC */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  HSN / SAC Code
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Required for GST invoicing and GST filing reports (GSTR-1 HSN summary).
                </p>
              </div>
              <Switch
                checked={itemFieldToggles.hsn}
                onCheckedChange={() => handleToggleBuiltin("hsn")}
              />
            </div>

            {/* Purchase Price */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4 md:col-span-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Purchase Price / Cost Rate
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Track purchase cost for profitability, margins, and cost-of-goods-sold calculation.
                </p>
              </div>
              <Switch
                checked={itemFieldToggles.purchasePrice}
                onCheckedChange={() => handleToggleBuiltin("purchasePrice")}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Custom Fields (Up to 6) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                Custom Item Fields (Max 6)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define specialized attributes (e.g. Brand, Batch Type, Guarantee, Color). Toggle &ldquo;Print on Paper&rdquo; to control appearance on invoices.
              </p>
            </div>
            {customItemFields.length >= 6 && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                Max 6 fields reached
              </span>
            )}
          </div>

          {customItemFields.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No custom fields defined
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add up to 6 custom attributes such as Brand, Material, Expiry Period, or Custom Classifications.
              </p>
              <Button
                onClick={openAddModal}
                size="sm"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Create First Custom Field
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customItemFields.map((field) => (
                <div
                  key={field.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/10 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {field.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                        {field.type}
                      </Badge>
                      {!field.isEnabled && (
                        <Badge variant="secondary" className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    {field.type === "select" && field.options && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Options:</span>
                        {field.options.map((opt, i) => (
                          <span
                            key={i}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    {/* Active in Form toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Form Active
                      </span>
                      <Switch
                        checked={field.isEnabled}
                        onCheckedChange={(val) =>
                          updateCustomItemField(field.id, { isEnabled: val })
                        }
                      />
                    </div>

                    {/* Print on Paper toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Printer className="h-3.5 w-3.5 text-slate-400" />
                        Print on Paper
                      </span>
                      <Switch
                        checked={field.printOnPaper}
                        onCheckedChange={(val) =>
                          updateCustomItemField(field.id, { printOnPaper: val })
                        }
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(field)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit Field"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete custom field "${field.name}"?`)) {
                            deleteCustomItemField(field.id)
                          }
                        }}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete Field"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Add / Edit Custom Field */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="p-6 space-y-4 max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {editingFieldId ? "Edit Custom Item Field" : "Add Custom Item Field"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Customize item attributes. Dropdown options are individually configured with dynamic fields.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          <div className="space-y-4 py-1">
            {/* Field Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Field Label / Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. Brand, Material, Warranty Period"
                autoFocus
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Field Data Type
              </label>
              <Select
                value={fieldType}
                onValueChange={(val) => setFieldType(val as CustomFieldType)}
                options={[
                  { value: "text", label: "Text (Single line)" },
                  { value: "number", label: "Number (Numeric value)" },
                  { value: "date", label: "Date (Calendar picker)" },
                  { value: "select", label: "Dropdown / Select (Predefined options)" },
                ]}
              />
            </div>

            {/* If Type is 'select', render individual Option inputs */}
            {fieldType === "select" && (
              <div className="space-y-2.5 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ListPlus className="h-3.5 w-3.5 text-blue-600" />
                    Dropdown Options List
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {optionsList.length} options defined
                  </span>
                </div>

                {/* Existing options list with delete buttons */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {optionsList.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {opt}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOptionItem(idx)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Remove option"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Input row to add new option */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOptionItem()
                      }
                    }}
                    placeholder="Type new option & press enter..."
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddOptionItem}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 shrink-0 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Switches */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Enable in Item Form
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Show this field when adding or editing items in catalog.
                  </div>
                </div>
                <Switch
                  checked={fieldIsEnabled}
                  onCheckedChange={setFieldIsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Printer className="h-3.5 w-3.5 text-blue-600" />
                    Print on Paper / Invoices
                  </div>
                  <div className="text-[11px] text-slate-500">
                    If disabled, this field will be hidden on printed invoices and PDFs.
                  </div>
                </div>
                <Switch
                  checked={fieldPrintOnPaper}
                  onCheckedChange={setFieldPrintOnPaper}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveField}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingFieldId ? "Update Field" : "Add Field"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}

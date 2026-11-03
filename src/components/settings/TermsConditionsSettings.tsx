"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  Search, 
  Star, 
  Truck, 
  ShoppingBag, 
  FileCheck, 
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import { TermsTemplate, ApplicableDocumentType } from "@/types/inventory"
import { cn } from "@/lib/utils"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

const ALL_DOC_TYPES: Array<{
  id: ApplicableDocumentType
  label: string
  icon: React.ElementType
}> = [
  { id: "invoice", label: "Tax Invoices", icon: FileText },
  { id: "quotation", label: "Quotations & Estimates", icon: FileCheck },
  { id: "order", label: "Sales Orders", icon: ShoppingBag },
  { id: "challan", label: "Delivery Challans", icon: Truck },
  { id: "proforma", label: "Proforma Invoices", icon: FileSpreadsheet },
  { id: "purchase_order", label: "Purchase Orders", icon: ShoppingBag },
  { id: "purchase_bill", label: "Purchase Bills", icon: FileText },
]

export function TermsConditionsSettings() {
  const { termsTemplates, addTermsTemplate, updateTermsTemplate, deleteTermsTemplate, setDefaultTermsTemplate } = useApp()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<ApplicableDocumentType | "all">("all")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [applicableTo, setApplicableTo] = useState<ApplicableDocumentType[]>(["invoice"])
  const [isDefault, setIsDefault] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState("")

  const openAddModal = () => {
    setEditingTemplateId(null)
    setTitle("")
    setContent("1. Goods once sold will not be taken back or exchanged.\n2. Payment terms 30 days from date of invoice.\n3. All disputes are subject to local jurisdiction only.")
    setApplicableTo(selectedFilter === "all" ? ["invoice"] : [selectedFilter])
    setIsDefault(false)
    setValidationError("")
    setIsModalOpen(true)
  }

  const openEditModal = (template: TermsTemplate) => {
    setEditingTemplateId(template.id)
    setTitle(template.title)
    setContent(template.content)
    setApplicableTo([...template.applicableTo])
    setIsDefault(!!template.isDefault)
    setValidationError("")
    setIsModalOpen(true)
  }

  const handleToggleDocType = (docId: ApplicableDocumentType) => {
    if (applicableTo.includes(docId)) {
      if (applicableTo.length <= 1) {
        setValidationError("Select at least one applicable document type.")
        return
      }
      setApplicableTo((prev) => prev.filter((d) => d !== docId))
    } else {
      setApplicableTo((prev) => [...prev, docId])
    }
    setValidationError("")
  }

  const handleSave = () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setValidationError("Please enter a title for the terms preset.")
      return
    }

    if (!trimmedContent) {
      setValidationError("Please enter the terms and conditions clauses.")
      return
    }

    if (applicableTo.length === 0) {
      setValidationError("Please select at least one document type.")
      return
    }

    if (editingTemplateId) {
      updateTermsTemplate(editingTemplateId, {
        title: trimmedTitle,
        content: trimmedContent,
        applicableTo,
        isDefault,
      })
    } else {
      addTermsTemplate({
        title: trimmedTitle,
        content: trimmedContent,
        applicableTo,
        isDefault,
      })
    }

    setIsModalOpen(false)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDuplicate = (template: TermsTemplate) => {
    addTermsTemplate({
      title: `${template.title} (Copy)`,
      content: template.content,
      applicableTo: [...template.applicableTo],
      isDefault: false,
    })
  }

  // Filter templates
  const filteredTemplates = termsTemplates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDoc =
      selectedFilter === "all" ||
      t.applicableTo.includes(selectedFilter) ||
      t.applicableTo.includes("all")

    return matchesSearch && matchesDoc
  })

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Terms & Conditions Library
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create multiple terms presets and insert them into Invoices, Quotations, Orders, Challans, and Bills with a single click.
            </p>
          </div>

          <Button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Terms Preset
          </Button>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Document Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All Presets ({termsTemplates.length})
            </button>

            {ALL_DOC_TYPES.map((dt) => {
              const count = termsTemplates.filter(
                (t) => t.applicableTo.includes(dt.id) || t.applicableTo.includes("all")
              ).length
              const isSelected = selectedFilter === dt.id
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setSelectedFilter(dt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <span>{dt.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clauses..."
              className="h-8 text-xs pl-8 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Templates Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Terms & Conditions Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? "No presets match your search query."
                : "Create custom terms presets to reuse across invoices, quotations, delivery challans, and bills."}
            </p>
            <Button
              onClick={openAddModal}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Create Terms Preset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
              return (
                <div
                  key={template.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {template.title}
                          </h3>
                          {template.isDefault && (
                            <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-semibold gap-1">
                              <Star className="h-2.5 w-2.5 fill-white" /> Default
                            </Badge>
                          )}
                        </div>

                        {/* Applicable document badges */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {template.applicableTo.includes("all") ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900">
                              All Documents
                            </span>
                          ) : (
                            template.applicableTo.map((dt) => {
                              const found = ALL_DOC_TYPES.find((d) => d.id === dt)
                              return (
                                <span
                                  key={dt}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                                >
                                  {found?.label || dt}
                                </span>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(template.id, template.content)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                          title="Copy text to clipboard"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(template)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                          title="Edit terms preset"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                              deleteTermsTemplate(template.id)
                            }
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Delete preset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Clauses Preview Box */}
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {template.content}
                    </div>
                  </div>

                  {/* Card Footer: Metadata and quick actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {template.content.split("\n").filter(Boolean).length} clauses • {template.content.length} chars
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(template)}
                        className="hover:text-blue-600 font-medium cursor-pointer"
                      >
                        Duplicate
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          template.applicableTo.forEach((docType) => {
                            setDefaultTermsTemplate(template.id, docType)
                          })
                        }}
                        className={cn(
                          "font-medium cursor-pointer transition-colors",
                          template.isDefault
                            ? "text-emerald-600 font-semibold"
                            : "hover:text-blue-600"
                        )}
                      >
                        {template.isDefault ? "Active Default" : "Set as Default"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Terms Preset Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="p-6 space-y-4 max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {editingTemplateId ? "Edit Terms Preset" : "Create Terms Preset"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Configure reusable clauses and choose which document forms can insert this preset.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          <div className="space-y-4 py-1">
            {/* Preset Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preset Name / Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 15-Day Net Payment Terms, Export LUT Terms, Returnable Transit"
                autoFocus
              />
            </div>

            {/* Applicable Forms Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Applicable Document Forms</span>
                <span className="text-[11px] text-slate-400 font-normal">(Select where this preset appears)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 max-h-36 overflow-y-auto">
                {ALL_DOC_TYPES.map((dt) => {
                  const isChecked = applicableTo.includes(dt.id)
                  return (
                    <label
                      key={dt.id}
                      className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDocType(dt.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{dt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Clauses Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Terms & Conditions Clauses <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {content.length} chars • {content.split("\n").filter(Boolean).length} lines
                </span>
              </div>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="1. Goods once sold will not be returned...&#10;2. Payment due within agreed credit period...&#10;3. Subject to local jurisdiction."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Each line separated by Enter prints as an individual bullet on invoices and PDFs.
              </p>
            </div>

            {/* Set as Default Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Set as Default for Selected Forms
                </div>
                <div className="text-[11px] text-slate-500">
                  Automatically pre-populates when opening new creation forms.
                </div>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
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
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingTemplateId ? "Update Preset" : "Save Preset"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}

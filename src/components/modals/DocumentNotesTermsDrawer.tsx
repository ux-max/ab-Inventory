"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Check,
  FileText,
  RotateCcw,
  Printer,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  Star,
  Layers
} from "lucide-react"
import {
  DocumentSequenceType,
  DEFAULT_FORM_NOTES_TERMS,
  FormNotePreset,
  FormTermsPreset
} from "@/types/inventory"

interface DocumentNotesTermsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDocType?: DocumentSequenceType
}

interface FormTabDef {
  id: DocumentSequenceType
  label: string
}

const FORM_TABS: FormTabDef[] = [
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
]

export const DocumentNotesTermsDrawer: React.FC<DocumentNotesTermsDrawerProps> = ({
  open,
  onOpenChange,
  initialDocType = "invoice"
}) => {
  const {
    formNotesTerms,
    updateFormNotesTerms,
    resetFormNotesTerms,
    addFormNotePreset,
    updateFormNotePreset,
    deleteFormNotePreset,
    addFormTermsPreset,
    updateFormTermsPreset,
    deleteFormTermsPreset
  } = useApp()

  const [selectedDocType, setSelectedDocType] = useState<DocumentSequenceType>(initialDocType)
  const [localNotes, setLocalNotes] = useState("")
  const [localTerms, setLocalTerms] = useState("")
  const [localPrintNotes, setLocalPrintNotes] = useState(true)
  const [localPrintTerms, setLocalPrintTerms] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Preset Creator/Editor state for Notes
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [isNoteDefault, setIsNoteDefault] = useState(false)
  const [noteError, setNoteError] = useState("")

  // Preset Creator/Editor state for Terms
  const [isTermsEditorOpen, setIsTermsEditorOpen] = useState(false)
  const [editingTermsId, setEditingTermsId] = useState<string | null>(null)
  const [termsTitle, setTermsTitle] = useState("")
  const [termsContent, setTermsContent] = useState("")
  const [isTermsDefault, setIsTermsDefault] = useState(false)
  const [termsError, setTermsError] = useState("")

  // Sync state when open or tab changed
  useEffect(() => {
    if (open) {
      const config = formNotesTerms[selectedDocType] || DEFAULT_FORM_NOTES_TERMS[selectedDocType]
      if (config) {
        setLocalNotes(config.notes || "")
        setLocalTerms(config.terms || "")
        setLocalPrintNotes(config.printNotesOnPdf !== false)
        setLocalPrintTerms(config.printTermsOnPdf !== false)
      }
      setIsNoteEditorOpen(false)
      setIsTermsEditorOpen(false)
      setSavedSuccess(false)
    }
  }, [open, selectedDocType, formNotesTerms])

  useEffect(() => {
    if (initialDocType) {
      setSelectedDocType(initialDocType)
    }
  }, [initialDocType])

  const activeConfig = formNotesTerms[selectedDocType] || DEFAULT_FORM_NOTES_TERMS[selectedDocType]
  const notePresets = activeConfig?.notesPresets || []
  const termsPresets = activeConfig?.termsPresets || []
  const activeTabLabel = FORM_TABS.find(t => t.id === selectedDocType)?.label || "Document"

  // Open Note Creator / Editor
  const openNewNotePreset = () => {
    setEditingNoteId(null)
    setNoteTitle("")
    setNoteContent(localNotes || "")
    setIsNoteDefault(false)
    setNoteError("")
    setIsNoteEditorOpen(true)
  }

  const openEditNotePreset = (preset: FormNotePreset) => {
    setEditingNoteId(preset.id)
    setNoteTitle(preset.title)
    setNoteContent(preset.content)
    setIsNoteDefault(!!preset.isDefault)
    setNoteError("")
    setIsNoteEditorOpen(true)
  }

  const handleSaveNotePreset = () => {
    const trimmedTitle = noteTitle.trim()
    const trimmedContent = noteContent.trim()
    if (!trimmedTitle) {
      setNoteError("Please provide a preset title.")
      return
    }
    if (!trimmedContent) {
      setNoteError("Preset note content cannot be empty.")
      return
    }

    if (editingNoteId) {
      updateFormNotePreset(selectedDocType, editingNoteId, {
        title: trimmedTitle,
        content: trimmedContent,
        isDefault: isNoteDefault
      })
    } else {
      addFormNotePreset(selectedDocType, {
        title: trimmedTitle,
        content: trimmedContent,
        isDefault: isNoteDefault
      })
    }

    if (isNoteDefault) {
      setLocalNotes(trimmedContent)
    }
    setIsNoteEditorOpen(false)
  }

  // Open Terms Creator / Editor
  const openNewTermsPreset = () => {
    setEditingTermsId(null)
    setTermsTitle("")
    setTermsContent(localTerms || "")
    setIsTermsDefault(false)
    setTermsError("")
    setIsTermsEditorOpen(true)
  }

  const openEditTermsPreset = (preset: FormTermsPreset) => {
    setEditingTermsId(preset.id)
    setTermsTitle(preset.title)
    setTermsContent(preset.content)
    setIsTermsDefault(!!preset.isDefault)
    setTermsError("")
    setIsTermsEditorOpen(true)
  }

  const handleSaveTermsPreset = () => {
    const trimmedTitle = termsTitle.trim()
    const trimmedContent = termsContent.trim()
    if (!trimmedTitle) {
      setTermsError("Please provide a preset title.")
      return
    }
    if (!trimmedContent) {
      setTermsError("Preset terms content cannot be empty.")
      return
    }

    if (editingTermsId) {
      updateFormTermsPreset(selectedDocType, editingTermsId, {
        title: trimmedTitle,
        content: trimmedContent,
        isDefault: isTermsDefault
      })
    } else {
      addFormTermsPreset(selectedDocType, {
        title: trimmedTitle,
        content: trimmedContent,
        isDefault: isTermsDefault
      })
    }

    if (isTermsDefault) {
      setLocalTerms(trimmedContent)
    }
    setIsTermsEditorOpen(false)
  }

  const handleSave = () => {
    updateFormNotesTerms(selectedDocType, {
      notes: localNotes.trim(),
      terms: localTerms.trim(),
      printNotesOnPdf: localPrintNotes,
      printTermsOnPdf: localPrintTerms
    })
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onOpenChange(false)
    }, 400)
  }

  const handleResetToDefault = () => {
    const def = DEFAULT_FORM_NOTES_TERMS[selectedDocType]
    if (def) {
      setLocalNotes(def.notes)
      setLocalTerms(def.terms)
      setLocalPrintNotes(def.printNotesOnPdf !== false)
      setLocalPrintTerms(def.printTermsOnPdf !== false)
      resetFormNotesTerms(selectedDocType)
    }
  }

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
            Notes & Terms Settings
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Configure form-wise custom notes and terms presets for {activeTabLabel}
          </span>
        </div>
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
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      header={customHeader}
      hideCloseButton
      side="right"
      className="w-full sm:max-w-2xl md:max-w-3xl"
      zIndex={10060}
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">

        {/* ========================================================= */}
        {/* 1. Form Category Tabs                                     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
          {FORM_TABS.map(tab => {
            const isSelected = selectedDocType === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDocType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isSelected
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
        {/* 2. Customer / Commercial Notes Section with Presets       */}
        {/* ========================================================= */}
        <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Customer Notes ({activeTabLabel})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saved reusable notes available directly on {activeTabLabel} forms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Print on PDF
              </span>
              <Switch
                checked={localPrintNotes}
                onCheckedChange={setLocalPrintNotes}
              />
            </div>
          </div>

          {/* Preset Chips Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Custom Notes Presets ({notePresets.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openNewNotePreset}
                className="h-7 text-[11px] gap-1 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/30"
              >
                <Plus className="h-3 w-3" />
                <span>Create Custom Note</span>
              </Button>
            </div>

            {/* Presets List */}
            <div className="flex flex-wrap gap-2">
              {notePresets.map((preset) => {
                const isActive = localNotes === preset.content
                return (
                  <div
                    key={preset.id}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer select-none ${isActive
                        ? "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200 font-semibold shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                  >
                    <span
                      onClick={() => setLocalNotes(preset.content)}
                      className="truncate max-w-[150px]"
                      title={preset.content}
                    >
                      {preset.title}
                    </span>
                    {preset.isDefault && (
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded font-bold border border-blue-200 dark:border-blue-800">
                        Default
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditNotePreset(preset); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity"
                      title="Edit preset"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {notePresets.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteFormNotePreset(selectedDocType, preset.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Delete preset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inline Note Preset Editor (When open) */}
          {isNoteEditorOpen && (
            <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {editingNoteId ? "Edit Note Preset" : "Create New Custom Note Preset"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsNoteEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              {noteError && (
                <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs font-medium">
                  {noteError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Preset Title</label>
                <Input
                  type="text"
                  placeholder="e.g., Bank Details Note, Urgent Shipment..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Note Content</label>
                <textarea
                  rows={2}
                  placeholder="Enter custom note text..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNoteDefault}
                    onChange={(e) => setIsNoteDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Set as default note for {activeTabLabel}</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNoteEditorOpen(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNotePreset}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Preset
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Active Default Note on Form:
            </label>
            <textarea
              rows={3}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder={`Enter default customer notes for ${activeTabLabel}...`}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. Terms & Conditions Section with Presets                */}
        {/* ========================================================= */}
        <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Terms & Conditions ({activeTabLabel})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saved legal stipulations, validity & return clauses for {activeTabLabel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Print on PDF
              </span>
              <Switch
                checked={localPrintTerms}
                onCheckedChange={setLocalPrintTerms}
              />
            </div>
          </div>

          {/* Preset Chips Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Custom Terms Presets ({termsPresets.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openNewTermsPreset}
                className="h-7 text-[11px] gap-1 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/30"
              >
                <Plus className="h-3 w-3" />
                <span>Create Custom Terms</span>
              </Button>
            </div>

            {/* Presets List */}
            <div className="flex flex-wrap gap-2">
              {termsPresets.map((preset) => {
                const isActive = localTerms === preset.content
                return (
                  <div
                    key={preset.id}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer select-none ${isActive
                        ? "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200 font-semibold shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                  >
                    <span
                      onClick={() => setLocalTerms(preset.content)}
                      className="truncate max-w-[150px]"
                      title={preset.content}
                    >
                      {preset.title}
                    </span>
                    {preset.isDefault && (
                      <span className="text-[9px] bg-blue-200/70 dark:bg-blue-900 text-blue-900 dark:text-blue-200 px-1 py-0.2 rounded font-bold">
                        Default
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditTermsPreset(preset); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity"
                      title="Edit preset"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {termsPresets.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteFormTermsPreset(selectedDocType, preset.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Delete preset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inline Terms Preset Editor (When open) */}
          {isTermsEditorOpen && (
            <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  {editingTermsId ? "Edit Terms Preset" : "Create New Custom Terms Preset"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTermsEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              {termsError && (
                <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs font-medium">
                  {termsError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Preset Title</label>
                <Input
                  type="text"
                  placeholder="e.g., Standard 30-Day Terms, Job Work Rule 55..."
                  value={termsTitle}
                  onChange={(e) => setTermsTitle(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Terms Content</label>
                <textarea
                  rows={4}
                  placeholder="1. Goods once sold...\n2. Payment terms..."
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  className="w-full p-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTermsDefault}
                    onChange={(e) => setIsTermsDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Set as default terms for {activeTabLabel}</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTermsEditorOpen(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTermsPreset}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Preset
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Terms Textarea */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Active Default Terms & Conditions on Form:
            </label>
            <textarea
              rows={5}
              value={localTerms}
              onChange={(e) => setLocalTerms(e.target.value)}
              placeholder={`Enter standard terms & conditions for ${activeTabLabel}...`}
              className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 leading-relaxed"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Reset to Recommended Default                           */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset {activeTabLabel} to Recommended Defaults</span>
          </button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
          >
            Save for {activeTabLabel}
          </Button>
        </div>

      </div>
    </Drawer>
  )
}

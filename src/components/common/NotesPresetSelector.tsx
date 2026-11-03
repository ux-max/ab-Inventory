"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { DocumentSequenceType } from "@/types/inventory"
import { FileText, ChevronDown } from "lucide-react"

interface NotesPresetSelectorProps {
  documentType: DocumentSequenceType | string
  onSelect: (notesContent: string) => void
  className?: string
}

export const NotesPresetSelector: React.FC<NotesPresetSelectorProps> = ({
  documentType,
  onSelect,
  className = "",
}) => {
  const { formNotesTerms } = useApp()

  // Map string to DocumentSequenceType
  const mappedDocType: DocumentSequenceType = ((): DocumentSequenceType => {
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
      case "invoice":
      default:
        return "invoice"
    }
  })()

  const config = formNotesTerms[mappedDocType]
  const relevantPresets = config?.notesPresets || []

  if (relevantPresets.length === 0) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (!selectedId) return
    const preset = relevantPresets.find((p) => p.id === selectedId)
    if (preset) {
      onSelect(preset.content)
    }
    e.target.value = ""
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:text-amber-300 rounded-md text-xs font-medium transition-colors border border-amber-200 dark:border-amber-800/60 cursor-pointer shadow-2xs">
        <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="truncate max-w-[130px]">Insert Saved Note</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        <select
          onChange={handleChange}
          defaultValue=""
          aria-label="Select customer note preset"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
        >
          <option value="" disabled>
            Choose custom note preset...
          </option>
          {relevantPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.title} {preset.isDefault ? "(Default)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}


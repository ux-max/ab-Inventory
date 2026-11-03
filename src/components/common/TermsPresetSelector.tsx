"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { ApplicableDocumentType, DocumentSequenceType } from "@/types/inventory"
import { ShieldCheck, ChevronDown } from "lucide-react"

interface TermsPresetSelectorProps {
  documentType: ApplicableDocumentType | DocumentSequenceType | string
  onSelect: (termsContent: string) => void
  className?: string
}

export const TermsPresetSelector: React.FC<TermsPresetSelectorProps> = ({
  documentType,
  onSelect,
  className = "",
}) => {
  const { termsTemplates, formNotesTerms } = useApp()

  // Map to DocumentSequenceType
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

  // Form-wise terms presets
  const formPresets = formNotesTerms?.[mappedDocType]?.termsPresets || []

  // Legacy global terms templates applicable to this doc type
  const relevantTemplates = (termsTemplates || []).filter(
    (t) => Array.isArray(t.applicableTo) && (t.applicableTo.includes("all") || t.applicableTo.includes(mappedDocType as any))
  )

  // Combined list, prioritizing form-wise presets
  const allPresets: Array<{ id: string; title: string; content: string; isDefault?: boolean }> = [
    ...formPresets,
    ...relevantTemplates
      .filter(t => !formPresets.some(fp => fp.title.toLowerCase() === t.title.toLowerCase()))
      .map(t => ({ id: t.id, title: t.title, content: t.content, isDefault: t.isDefault }))
  ]

  if (allPresets.length === 0) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (!selectedId) return
    const template = allPresets.find((t) => t.id === selectedId)
    if (template) {
      onSelect(template.content)
    }
    e.target.value = ""
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-md text-xs font-medium transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="truncate max-w-[130px]">Insert Saved Terms</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        <select
          onChange={handleChange}
          defaultValue=""
          aria-label="Select terms and conditions preset"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
        >
          <option value="" disabled>
            Choose custom terms preset...
          </option>
          {allPresets.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title} {template.isDefault ? "(Default)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

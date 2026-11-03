"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { formatINR } from "@/lib/utils"

export interface AdditionalChargeItem {
  id: string
  name: string
  amount: number | string
}

export const COMMON_CHARGE_PRESETS = [
  "Freight / Delivery",
  "Packaging & Forwarding",
  "Shipping Charges",
  "Insurance",
  "Loading / Unloading",
  "Installation / Service Fee",
  "Fuel Surcharge",
  "Handling Charges"
]

interface AdditionalChargesSectionProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  charges: AdditionalChargeItem[]
  onChange: (charges: AdditionalChargeItem[]) => void
  maxCharges?: number
  className?: string
  totalCalculatedAmount?: number
}

export function AdditionalChargesSection({
  enabled,
  onEnabledChange,
  charges,
  onChange,
  maxCharges = 6,
  className = "",
  totalCalculatedAmount
}: AdditionalChargesSectionProps) {
  const sumAmount = charges.reduce((acc, c) => acc + (parseFloat(String(c.amount)) || 0), 0)
  const displayTotal = totalCalculatedAmount !== undefined ? totalCalculatedAmount : sumAmount
  const isExpanded = enabled && charges.length > 0

  const handleAddFirst = () => {
    onEnabledChange(true)
    onChange([
      {
        id: `charge-${Date.now()}-1`,
        name: "Freight / Delivery",
        amount: ""
      }
    ])
  }

  const handleAddCharge = () => {
    if (charges.length >= maxCharges) return
    const nextPreset = COMMON_CHARGE_PRESETS[charges.length] || "Additional Charge"
    onChange([
      ...charges,
      {
        id: `charge-${Date.now()}-${charges.length + 1}`,
        name: nextPreset,
        amount: ""
      }
    ])
  }

  const handleRemoveCharge = (idx: number) => {
    const updated = charges.filter((_, i) => i !== idx)
    if (updated.length === 0) {
      onEnabledChange(false)
      onChange([])
    } else {
      onChange(updated)
    }
  }

  const handleClearAll = () => {
    onEnabledChange(false)
    onChange([])
  }

  const handleUpdate = (idx: number, field: "name" | "amount", value: any) => {
    const updated = [...charges]
    updated[idx] = {
      ...updated[idx],
      [field]: value
    }
    onChange(updated)
  }

  return (
    <div className={`pt-2 border-t border-slate-200/80 dark:border-slate-800 ${className}`}>
      {!isExpanded ? (
        <div className="flex items-center justify-between py-0.5 text-xs">
          <button
            type="button"
            onClick={handleAddFirst}
            className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Additional Charges</span>
          </button>
          <span className="text-slate-400 font-medium tabular-nums">₹0.00</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Section Header */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Additional Charges
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {displayTotal !== 0 ? (displayTotal > 0 ? `+${formatINR(displayTotal)}` : formatINR(displayTotal)) : "₹0.00"}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] text-slate-400 hover:text-rose-500 hover:underline cursor-pointer font-medium"
                title="Remove all charges"
              >
                Clear
              </button>
            </div>
          </div>

          {/* List of charge rows */}
          <div className="space-y-1.5">
            {charges.map((charge, idx) => (
              <div key={charge.id || idx} className="flex items-center gap-1.5">
                <Input
                  type="text"
                  value={charge.name}
                  onChange={(e) => handleUpdate(idx, "name", e.target.value)}
                  placeholder="Charge Name (e.g. Freight)"
                  className="flex-1 min-w-0 h-7 px-2 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium placeholder:text-slate-400"
                />

                <div className="relative w-24 shrink-0">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={charge.amount}
                    onChange={(e) => handleUpdate(idx, "amount", e.target.value)}
                    className="h-7 w-24 text-right text-xs font-semibold tabular-nums border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pr-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCharge(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                  title="Remove this charge"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Another Link */}
          {charges.length < maxCharges && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleAddCharge}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add another charge ({charges.length}/{maxCharges})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

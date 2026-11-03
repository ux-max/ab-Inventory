"use client"

import React from "react"
import { Warehouse, Users, Building2, User } from "lucide-react"
import { ReportDatePreset, DateRange } from "@/lib/reportDataEngine"
import { Godown, Party } from "@/types/inventory"
import { Select } from "@/components/ui/select"
import { ReportDateRangePicker } from "@/components/reports/ReportDateRangePicker"

interface ReportFilterBarProps {
  preset: ReportDatePreset
  onPresetChange: (preset: ReportDatePreset) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  godowns: Godown[]
  selectedGodownId: string
  onGodownChange: (id: string) => void
  salespersons: string[]
  selectedSalesperson: string
  onSalespersonChange: (sp: string) => void
  firmName?: string
  // If viewing party statement
  isPartyStatement?: boolean
  parties?: Party[]
  selectedPartyId?: string
  onPartyChange?: (partyId: string) => void
}

export function ReportFilterBar({
  preset,
  onPresetChange,
  dateRange,
  onDateRangeChange,
  godowns,
  selectedGodownId,
  onGodownChange,
  salespersons,
  selectedSalesperson,
  onSalespersonChange,
  firmName = "AB Inventory Ltd",
  isPartyStatement = false,
  parties = [],
  selectedPartyId = "",
  onPartyChange
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-2.5 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
      {/* 1. Filter by Preset Dropdown */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 pl-3 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
        <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap text-xs">Filter by :</span>
        <Select
          variant="minimal"
          size="xs"
          value={preset}
          onValueChange={(val) => onPresetChange(val as ReportDatePreset)}
          options={[
            { value: "this_month", label: "This Month" },
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "this_week", label: "This Week" },
            { value: "this_quarter", label: "This Quarter" },
            { value: "this_fy", label: "This FY" },
            { value: "all_time", label: "All Time" },
            { value: "custom", label: "Custom Range" },
          ]}
          className="h-6 font-semibold text-slate-800 dark:text-slate-200 px-1 hover:bg-transparent"
        />
      </div>

      {/* 2. Interactive Advanced Date Range Picker */}
      <ReportDateRangePicker
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        preset={preset}
        onPresetChange={onPresetChange}
      />

      {/* 3. Firm Selector Pill with Custom Select */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 pl-2.5 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <Select
          variant="minimal"
          size="xs"
          value="all_firms"
          options={[
            { value: "all_firms", label: "All Firms" },
            { value: "main", label: firmName },
          ]}
          className="h-6 font-medium text-slate-700 dark:text-slate-300 px-1 hover:bg-transparent"
        />
      </div>

      {/* 4. Users / Salesperson Selector Pill with Custom Select */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 pl-2.5 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <Select
          variant="minimal"
          size="xs"
          value={selectedSalesperson}
          onValueChange={onSalespersonChange}
          options={[
            { value: "all", label: "All Users" },
            ...salespersons.map(sp => ({ value: sp, label: sp }))
          ]}
          className="h-6 font-medium text-slate-700 dark:text-slate-300 px-1 hover:bg-transparent"
        />
      </div>

      {/* 5. Godown Selector Pill with Custom Select */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 pl-2.5 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
        <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <Select
          variant="minimal"
          size="xs"
          value={selectedGodownId}
          onValueChange={onGodownChange}
          options={[
            { value: "all", label: "All Godowns" },
            ...godowns.map(g => ({ value: g.id, label: g.name }))
          ]}
          className="h-6 font-medium text-slate-700 dark:text-slate-300 px-1 hover:bg-transparent"
        />
      </div>

      {/* 6. Contextual Party Selector (Visible when viewing Party Statement) */}
      {isPartyStatement && onPartyChange && (
        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 pl-3 pr-1 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 ml-auto">
          <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold text-blue-900 dark:text-blue-300 whitespace-nowrap text-xs">Party:</span>
          <Select
            variant="minimal"
            size="xs"
            value={selectedPartyId}
            onValueChange={onPartyChange}
            options={[
              { value: "all", label: "All Parties" },
              ...parties.map(p => ({
                value: p.id,
                label: `${p.name} (${p.type.toUpperCase()})`
              }))
            ]}
            className="h-6 font-bold text-blue-700 dark:text-blue-300 px-1 hover:bg-transparent"
          />
        </div>
      )}
    </div>
  )
}


"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Check
} from "lucide-react"
import { DateRange, ReportDatePreset, getDatePresetRange } from "@/lib/reportDataEngine"
import { cn } from "@/lib/utils"

interface ReportDateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  preset?: ReportDatePreset
  onPresetChange?: (preset: ReportDatePreset) => void
}

// Convert YYYY-MM-DD to DD-MM-YYYY
export function formatToIndianDate(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

// Convert DD-MM-YYYY or YYYY-MM-DD to YYYY-MM-DD
function parseToIsoDate(val: string): string | null {
  if (!val) return null
  const clean = val.trim()
  // Check if DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split("-")
    return `${y}-${m}-${d}`
  }
  // Check if DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split("/")
    return `${y}-${m}-${d}`
  }
  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean
  }
  return null
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dt = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dt}`
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

interface DayItem {
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isPrevMonth: boolean
  isNextMonth: boolean
  dayOfWeek: number
}

export function ReportDateRangePicker({
  dateRange,
  onDateRangeChange,
  preset = "this_month",
  onPresetChange,
}: ReportDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Local selection state
  const [startDate, setStartDate] = useState(dateRange.startDate || "")
  const [endDate, setEndDate] = useState(dateRange.endDate || "")
  const [selectionStep, setSelectionStep] = useState<"start" | "end">("start")
  const [hoverDate, setHoverDate] = useState<string | null>(null)

  // Direct text input states for "From" and "To"
  const [fromInputText, setFromInputText] = useState(formatToIndianDate(dateRange.startDate || ""))
  const [toInputText, setToInputText] = useState(formatToIndianDate(dateRange.endDate || ""))

  // View state for Month and Year
  const initialDate = useMemo(() => {
    if (dateRange.startDate) {
      const parts = dateRange.startDate.split("-").map(Number)
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2])
    }
    return new Date()
  }, [dateRange.startDate])

  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()) // 0 to 11

  // View mode: "calendar" | "year" | "month"
  type ViewMode = "calendar" | "year" | "month"
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [decadeStart, setDecadeStart] = useState(() => Math.floor(initialDate.getFullYear() / 12) * 12)

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external changes
  useEffect(() => {
    setStartDate(dateRange.startDate)
    setEndDate(dateRange.endDate)
    setFromInputText(formatToIndianDate(dateRange.startDate))
    setToInputText(formatToIndianDate(dateRange.endDate))

    if (dateRange.startDate) {
      const parts = dateRange.startDate.split("-").map(Number)
      if (parts.length === 3) {
        setViewYear(parts[0])
        setViewMonth(parts[1] - 1)
        setDecadeStart(Math.floor(parts[0] / 12) * 12)
      }
    }
  }, [dateRange])

  // Click outside and ESC listener
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setViewMode("calendar")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        setViewMode("calendar")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Today's date string
  const todayStr = useMemo(() => formatIsoDate(new Date()), [])

  // Trigger pill display string
  const triggerDisplay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return "Select Dates"
    const s = formatToIndianDate(dateRange.startDate)
    const e = formatToIndianDate(dateRange.endDate)
    if (dateRange.startDate === dateRange.endDate) {
      return `${s} (Single Day)`
    }
    return `${s}  To  ${e}`
  }, [dateRange])

  // Build calendar matrix (divided by weeks for contiguous row styling)
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const allDays: DayItem[] = []

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const d = new Date(viewYear, viewMonth - 1, dayNum)
      allDays.push({
        dateStr: formatIsoDate(d),
        dayNumber: dayNum,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
        dayOfWeek: d.getDay(),
      })
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      allDays.push({
        dateStr: formatIsoDate(date),
        dayNumber: d,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        dayOfWeek: date.getDay(),
      })
    }

    // Next month leading days (fill up to 35 or 42 cells)
    const totalCells = allDays.length <= 35 ? 35 : 42
    const remaining = totalCells - allDays.length
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d)
      allDays.push({
        dateStr: formatIsoDate(date),
        dayNumber: d,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        dayOfWeek: date.getDay(),
      })
    }

    // Split into 7-day weeks
    const weeks: DayItem[][] = []
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }
    return weeks
  }, [viewYear, viewMonth])

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Handle Day Click
  const handleDayClick = (dayStr: string) => {
    if (selectionStep === "start") {
      setStartDate(dayStr)
      setEndDate(dayStr)
      setFromInputText(formatToIndianDate(dayStr))
      setToInputText(formatToIndianDate(dayStr))
      setSelectionStep("end")
    } else {
      // Step === "end"
      if (dayStr < startDate) {
        setStartDate(dayStr)
        setEndDate(startDate)
        setFromInputText(formatToIndianDate(dayStr))
        setToInputText(formatToIndianDate(startDate))
      } else {
        setEndDate(dayStr)
        setToInputText(formatToIndianDate(dayStr))
      }
      setSelectionStep("start")
    }
  }

  // Active range determination including hover
  const effectiveRange = useMemo(() => {
    if (selectionStep === "end" && hoverDate && startDate) {
      const minDate = startDate < hoverDate ? startDate : hoverDate
      const maxDate = startDate < hoverDate ? hoverDate : startDate
      return { start: minDate, end: maxDate }
    }
    return { start: startDate, end: endDate }
  }, [startDate, endDate, selectionStep, hoverDate])

  // Handle text input changes
  const handleFromInputChange = (val: string) => {
    setFromInputText(val)
    const iso = parseToIsoDate(val)
    if (iso) {
      setStartDate(iso)
      const parts = iso.split("-").map(Number)
      setViewYear(parts[0])
      setViewMonth(parts[1] - 1)
    }
  }

  const handleToInputChange = (val: string) => {
    setToInputText(val)
    const iso = parseToIsoDate(val)
    if (iso) {
      setEndDate(iso)
    }
  }

  // Apply Handler
  const handleApply = () => {
    const finalStart = startDate || todayStr
    const finalEnd = endDate || finalStart
    const sortedStart = finalStart <= finalEnd ? finalStart : finalEnd
    const sortedEnd = finalStart <= finalEnd ? finalEnd : finalStart

    onDateRangeChange({ startDate: sortedStart, endDate: sortedEnd })
    if (onPresetChange) {
      onPresetChange("custom")
    }
    setIsOpen(false)
    setViewMode("calendar")
  }

  // Quick Preset Selection
  const applyPreset = (p: ReportDatePreset) => {
    const range = getDatePresetRange(p)
    setStartDate(range.startDate)
    setEndDate(range.endDate)
    setFromInputText(formatToIndianDate(range.startDate))
    setToInputText(formatToIndianDate(range.endDate))
    setSelectionStep("start")

    const parts = range.startDate.split("-").map(Number)
    if (parts.length === 3) {
      setViewYear(parts[0])
      setViewMonth(parts[1] - 1)
      setDecadeStart(Math.floor(parts[0] / 12) * 12)
    }

    onDateRangeChange(range)
    if (onPresetChange) {
      onPresetChange(p)
    }
    setIsOpen(false)
    setViewMode("calendar")
  }

  // Select Entire Month
  const handleSelectFullMonth = (monthIdx: number, year: number) => {
    const s = new Date(year, monthIdx, 1)
    const e = new Date(year, monthIdx + 1, 0)
    const sStr = formatIsoDate(s)
    const eStr = formatIsoDate(e)
    setStartDate(sStr)
    setEndDate(eStr)
    setFromInputText(formatToIndianDate(sStr))
    setToInputText(formatToIndianDate(eStr))
    setViewMonth(monthIdx)
    setViewYear(year)
    setViewMode("calendar")
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      {/* 1. Trigger Pill Button (Matches User Screenshot Filter Bar) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs group",
          isOpen && "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950 bg-white dark:bg-slate-800"
        )}
        title="Open Calendar Date Range Picker"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform" />
        <span className="font-semibold text-xs tracking-tight text-slate-800 dark:text-slate-200">
          {triggerDisplay}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* 2. Popover Calendar Dropdown (Exact Match to User Reference Screenshot) */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 z-50 w-[310px] sm:w-[325px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-left animate-in fade-in zoom-in-95 duration-150 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Row: "From" and "To" inputs side-by-side */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                From
              </label>
              <input
                type="text"
                placeholder="From Date"
                value={fromInputText}
                onChange={(e) => handleFromInputChange(e.target.value)}
                onFocus={() => setSelectionStep("start")}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                To
              </label>
              <input
                type="text"
                placeholder="To Date"
                value={toInputText}
                onChange={(e) => handleToInputChange(e.target.value)}
                onFocus={() => setSelectionStep("end")}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Thin horizontal divider */}
          <div className="border-b border-slate-100 dark:border-slate-800 my-3" />

          {/* Month / Year Bar with Arrows: ◀ [ October | 2027 ] ▶ */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-blue-600 dark:border-r-blue-400" />
            </button>

            {/* Split Month and Year button */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className="px-2.5 py-1 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Click to select Month"
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700" />
              <button
                type="button"
                onClick={() => {
                  setDecadeStart(Math.floor(viewYear / 12) * 12)
                  setViewMode("year")
                }}
                className="px-2.5 py-1 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Click to select Year"
              >
                {viewYear}
              </button>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-600 dark:border-l-blue-400" />
            </button>
          </div>

          {/* 1. ONLY YEAR COMPONENT (Opens when Year button is clicked) */}
          {viewMode === "year" ? (
            <div className="py-2 space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d - 12)}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                  title="Previous 12 Years"
                >
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-blue-600 dark:border-r-blue-400" />
                </button>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Select Year ({decadeStart} - {decadeStart + 11})
                </span>
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d + 12)}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                  title="Next 12 Years"
                >
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-600 dark:border-l-blue-400" />
                </button>
              </div>

              {/* Grid of Years only */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setViewYear(yr)
                      setViewMode("month") // Once year is chosen, opens month component
                    }}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer",
                      viewYear === yr
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Back to Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("month")}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Select Months →
                </button>
              </div>
            </div>
          ) : viewMode === "month" ? (
            /* 2. ONLY MONTH COMPONENT (Opens after Year is selected) */
            <div className="py-2 space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                  title="Previous Year"
                >
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-blue-600 dark:border-r-blue-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecadeStart(Math.floor(viewYear / 12) * 12)
                    setViewMode("year")
                  }}
                  className="px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  title="Click to change Year"
                >
                  Year {viewYear}
                </button>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                  title="Next Year"
                >
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-600 dark:border-l-blue-400" />
                </button>
              </div>

              {/* Grid of 12 Months only */}
              <div className="grid grid-cols-3 gap-2">
                {SHORT_MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx)
                      setViewMode("calendar") // Once month is selected, returns to calendar
                    }}
                    onDoubleClick={() => handleSelectFullMonth(idx, viewYear)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer",
                      viewMonth === idx
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setDecadeStart(Math.floor(viewYear / 12) * 12)
                    setViewMode("year")
                  }}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← Back to Years
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Back to Calendar
                </button>
              </div>
            </div>
          ) : (
            /* 3. STANDARD CALENDAR VIEW (Days grid) */
            <div>
              {/* Days of week header: Su Mo Tu We Th Fr Sa */}
              <div className="grid grid-cols-7 text-center mb-1">
                {WEEK_DAYS.map((wd) => (
                  <span
                    key={wd}
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 py-1"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Calendar Grid with Seamless Continuous Range Ribbon */}
              <div className="space-y-0.5">
                {calendarWeeks.map((week, wIdx) => {
                  return (
                    <div key={wIdx} className="grid grid-cols-7 relative">
                      {week.map((item, dIdx) => {
                        const { dateStr, dayNumber, isCurrentMonth } = item
                        const isStart = Boolean(effectiveRange.start && dateStr === effectiveRange.start)
                        const isEnd = Boolean(effectiveRange.end && dateStr === effectiveRange.end)
                        const isInBetween = Boolean(
                          effectiveRange.start &&
                          effectiveRange.end &&
                          dateStr > effectiveRange.start &&
                          dateStr < effectiveRange.end
                        )
                        const isToday = dateStr === todayStr

                        return (
                          <div
                            key={dIdx}
                            onMouseEnter={() => {
                              if (selectionStep === "end") {
                                setHoverDate(dateStr)
                              }
                            }}
                            onClick={() => handleDayClick(dateStr)}
                            className="relative h-8 flex items-center justify-center cursor-pointer select-none group"
                          >
                            {/* 1. Light Blue Ribbon Span (matches user screenshot exactly) */}
                            {/* Intermediate Days */}
                            {isInBetween && (
                              <div
                                className={cn(
                                  "absolute inset-y-0 bg-[#e7f3ff] dark:bg-blue-950/60 z-0",
                                  dIdx === 0 && "rounded-l-sm left-0",
                                  dIdx === 6 && "rounded-r-sm right-0",
                                  dIdx > 0 && "left-0",
                                  dIdx < 6 && "right-0"
                                )}
                              />
                            )}

                            {/* Start Day: ribbon extension to the right if range extends */}
                            {isStart && effectiveRange.end && effectiveRange.end > effectiveRange.start && (
                              <div className="absolute inset-y-0 right-0 w-1/2 bg-[#e7f3ff] dark:bg-blue-950/60 z-0" />
                            )}

                            {/* End Day: ribbon extension to the left if range extends */}
                            {isEnd && effectiveRange.start && effectiveRange.start < effectiveRange.end && (
                              <div className="absolute inset-y-0 left-0 w-1/2 bg-[#e7f3ff] dark:bg-blue-950/60 z-0" />
                            )}

                            {/* 2. Date Number Badge */}
                            {isStart || isEnd ? (
                              // Solid blue circle badge (like Day 1 and Day 31 in screenshot)
                              <span className="h-7 w-7 rounded-full bg-[#0070e0] text-white font-bold text-xs flex items-center justify-center relative z-10 shadow-xs">
                                {dayNumber}
                              </span>
                            ) : isToday && isInBetween ? (
                              // Blue highlighted square for Today inside active range (like Day 16 in screenshot)
                              <span className="h-7 w-7 rounded-md bg-[#0070e0] text-white font-bold text-xs flex items-center justify-center relative z-10 shadow-xs">
                                {dayNumber}
                              </span>
                            ) : (
                              // Standard or in-range day
                              <span
                                className={cn(
                                  "h-7 w-7 text-xs flex items-center justify-center relative z-10 transition-colors rounded-full",
                                  !isCurrentMonth
                                    ? "text-slate-400 dark:text-slate-500 font-normal"
                                    : isInBetween
                                    ? "text-slate-800 dark:text-slate-100 font-medium"
                                    : isToday
                                    ? "text-blue-600 dark:text-blue-400 font-bold border border-blue-500/60"
                                    : "text-slate-700 dark:text-slate-200 font-medium group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                                )}
                              >
                                {dayNumber}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "calendar") {
                  setViewMode("calendar")
                } else {
                  setIsOpen(false)
                }
              }}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

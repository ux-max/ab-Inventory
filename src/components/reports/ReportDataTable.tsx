"use client"

import React, { useState, useMemo } from "react"
import { 
  Search, 
  Printer, 
  Share2, 
  MoreVertical, 
  Filter, 
  FileSpreadsheet, 
  BarChart2, 
  ArrowUpDown
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { TableColumn, exportReportToCsv, printReport, ReportResult } from "@/lib/reportDataEngine"
import { cn } from "@/lib/utils"

interface ReportDataTableProps {
  report: ReportResult
  onViewRecord?: (row: any) => void
}

export function ReportDataTable({ report, onViewRecord }: ReportDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Filter rows by global search term across all text columns
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return report.rows

    const lower = searchTerm.toLowerCase()
    return report.rows.filter(row => {
      return Object.values(row).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(lower)
      )
    })
  }, [report.rows, searchTerm])

  // Sorting
  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (valA === undefined || valA === null) return 1
      if (valB === undefined || valB === null) return -1
      if (valA < valB) return sortOrder === "asc" ? -1 : 1
      if (valA > valB) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredRows, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  // Render status badge or text matching app theme
  const renderStatus = (status?: string) => {
    if (!status) return "-"
    const s = status.toLowerCase()
    if (s === "paid" || s === "completed" || s === "approved" || s.includes("healthy")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {status}
        </span>
      )
    }
    if (s === "partial" || s === "moderate" || s.includes("near expiry")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {status}
        </span>
      )
    }
    if (s === "unpaid" || s === "pending" || s === "expired" || s === "cancelled") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          {status}
        </span>
      )
    }
    return <span className="text-slate-600 dark:text-slate-400 capitalize">{status}</span>
  }

  return (
    <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
      {/* Table Section Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Transactions & Entries ({filteredRows.length})
        </h3>

        <div className="flex items-center gap-2">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Export to Excel (.csv format) */}
          <button
            type="button"
            onClick={() => exportReportToCsv(report)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-2xs cursor-pointer"
            title="Export report to Excel / CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={() => printReport()}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Print report"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="printable-document-sheet flex-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-auto shadow-2xs">
        <Table className="w-full text-xs">
          <TableHeader className="bg-[#f8fafc] dark:bg-slate-900/90 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
            <TableRow>
              {report.columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-9 px-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 select-none whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="inline-flex items-center gap-1.5 hover:text-blue-600 cursor-pointer"
                  >
                    <span>{col.label}</span>
                    <ArrowUpDown className="h-2.5 w-2.5 text-slate-400" />
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-20 px-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={report.columns.length + 1}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  No records found matching the active filters or search criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors"
                >
                  {report.columns.map((col) => {
                    const val = row[col.key]

                    if (col.key === "status") {
                      return (
                        <TableCell key={col.key} className="px-3 py-2.5 text-center align-middle">
                          {renderStatus(val)}
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "px-3 py-2.5 text-slate-800 dark:text-slate-200 align-middle",
                          col.align === "right" && "text-right font-medium tabular-nums",
                          col.align === "center" && "text-center",
                          col.key === "docNo" && "font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                        )}
                        onClick={() => col.key === "docNo" && onViewRecord && onViewRecord(row)}
                      >
                        {val !== undefined && val !== null ? String(val) : "-"}
                      </TableCell>
                    )
                  })}

                  {/* Actions Column */}
                  <TableCell className="px-3 py-2.5 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                      <button
                        type="button"
                        onClick={() => printReport()}
                        className="p-1 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                        title="Print record"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Share link created for ${row.docNo || row.name || "entry"}`)}
                        className="p-1 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                        title="Share record"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewRecord && onViewRecord(row)}
                        className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                        title="View details"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Standard Table Pagination */}
      <Pagination
        totalCount={filteredRows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 15, 25, 50, 100]}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSize={true}
        itemLabel="Total Records"
        className="rounded-b-lg border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-2"
      />
    </div>
  )
}

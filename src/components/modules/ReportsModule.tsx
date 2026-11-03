"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Plus, Settings, Lock, ShieldAlert, Download } from "lucide-react"
import { ReportsSidebar, ReportKey } from "@/components/reports/ReportsSidebar"
import { ReportFilterBar } from "@/components/reports/ReportFilterBar"
import { ReportDataTable } from "@/components/reports/ReportDataTable"
import { getDocPlaceOfSupply, isInterStateTransaction } from "@/lib/gstConstants"
import { 
  ReportDatePreset, 
  DateRange, 
  getDatePresetRange,
  ReportFilterOptions,
  isDateInRange,
  computeSaleInvoicesReport,
  computePurchaseBillsReport,
  computeDayBookReport,
  computeAllTransactionsReport,
  computeProfitAndLossReport,
  computeBillWiseProfitReport,
  computeCashFlowReport,
  computePartyStatementReport,
  computeCreditLedgerReport,
  computePartyWisePnLReport,
  computeAllPartiesReport,
  computePartyReportByItem,
  computeSalePurchaseByPartyReport,
  computeGstr1Report,
  computeGstr2Report,
  computeGstr3bReport,
  computeCmp08Report,
  computeHsnSummaryReport,
  computeStockSummaryReport,
  computeLowStockReport,
  computeStockMovementReport,
  computeBatchExpiryReport,
  computeGodownStockReport,
  computeTdsTcsReceivablesReport,
  computeTdsTcsPayablesReport,
  computeSalesReturnsReport,
  computePurchaseReturnsReport,
  computeCreditNotesReport,
  computeDebitNotesReport
} from "@/lib/reportDataEngine"

interface ReportsModuleProps {
  onNavigate?: (module: string) => void
}

export function ReportsModule({ onNavigate }: ReportsModuleProps) {
  const { 
    items, 
    parties, 
    salesDocs, 
    purchaseDocs, 
    stockMovements, 
    godowns, 
    payments,
    salesReturns,
    purchaseReturns,
    creditNotes,
    debitNotes,
    business,
    gstSettings,
    canViewCostAndProfit 
  } = useApp()

  const [activeReport, setActiveReport] = useState<ReportKey>("sale_invoices")
  const [preset, setPreset] = useState<ReportDatePreset>("this_month")
  const [dateRange, setDateRange] = useState<DateRange>(() => getDatePresetRange("this_month"))
  const [selectedGodownId, setSelectedGodownId] = useState<string>("all")
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("all")
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id || "")

  const handlePresetChange = (newPreset: ReportDatePreset) => {
    setPreset(newPreset)
    if (newPreset !== "custom") {
      setDateRange(getDatePresetRange(newPreset))
    }
  }

  // Unique list of salespersons / creators from sales & purchases
  const salespersons = useMemo(() => {
    const list = new Set<string>()
    salesDocs.forEach(s => s.createdBy && list.add(s.createdBy))
    purchaseDocs.forEach(p => p.createdBy && list.add(p.createdBy))
    return Array.from(list)
  }, [salesDocs, purchaseDocs])

  const filterOptions: ReportFilterOptions = {
    dateRange,
    godownId: selectedGodownId,
    salesperson: selectedSalesperson,
    partyId: selectedPartyId
  }

  // Check if current report requires cost/margin permission
  const isCostSensitiveReport = activeReport === "profit_loss" || activeReport === "bill_wise_profit" || activeReport === "party_pnl"
  const isBlocked = isCostSensitiveReport && !canViewCostAndProfit

  // Dynamically compute report data
  const reportData = useMemo(() => {
    switch (activeReport) {
      case "sale_invoices":
        return computeSaleInvoicesReport(salesDocs, filterOptions)
      case "purchase_bills":
        return computePurchaseBillsReport(purchaseDocs, filterOptions)
      case "sales_returns":
        return computeSalesReturnsReport(salesReturns || [], filterOptions)
      case "purchase_returns":
        return computePurchaseReturnsReport(purchaseReturns || [], filterOptions)
      case "credit_notes":
        return computeCreditNotesReport(creditNotes || [], filterOptions)
      case "debit_notes":
        return computeDebitNotesReport(debitNotes || [], filterOptions)
      case "day_book":
        return computeDayBookReport(salesDocs, purchaseDocs, payments, filterOptions, creditNotes, debitNotes)
      case "all_transactions":
        return computeAllTransactionsReport(salesDocs, purchaseDocs, payments, creditNotes, debitNotes, filterOptions, salesReturns, purchaseReturns)
      case "profit_loss":
        return computeProfitAndLossReport(salesDocs, items, filterOptions, gstSettings)
      case "bill_wise_profit":
        return computeBillWiseProfitReport(salesDocs, items, filterOptions)
      case "cash_flow":
        return computeCashFlowReport(payments, salesDocs, purchaseDocs, filterOptions)
      case "party_statement":
        return computePartyStatementReport(parties, salesDocs, purchaseDocs, payments, selectedPartyId, filterOptions)
      case "credit_ledger":
        return computeCreditLedgerReport(parties, salesDocs, purchaseDocs, filterOptions)
      case "party_pnl":
        return computePartyWisePnLReport(parties, salesDocs, items, filterOptions)
      case "all_parties":
        return computeAllPartiesReport(parties)
      case "party_by_item":
        return computePartyReportByItem(parties, salesDocs, purchaseDocs, filterOptions)
      case "sale_purchase_by_party":
        return computeSalePurchaseByPartyReport(parties, salesDocs, purchaseDocs, filterOptions)
      case "gstr_1":
        return computeGstr1Report(salesDocs, filterOptions)
      case "gstr_2":
        return computeGstr2Report(purchaseDocs, filterOptions)
      case "gstr_3b":
        return computeGstr3bReport(salesDocs, purchaseDocs, filterOptions, debitNotes, purchaseReturns)
      case "cmp_08":
        return computeCmp08Report(salesDocs, filterOptions, gstSettings.compositionRate, gstSettings.compositionCategory, purchaseDocs, debitNotes, purchaseReturns)
      case "hsn_summary":
        return computeHsnSummaryReport(salesDocs, filterOptions)
      case "stock_summary":
        return computeStockSummaryReport(items, godowns, filterOptions)
      case "low_stock":
        return computeLowStockReport(items)
      case "stock_movement":
        return computeStockMovementReport(stockMovements, filterOptions)
      case "batch_expiry":
        return computeBatchExpiryReport(items)
      case "godown_stock":
        return computeGodownStockReport(items, godowns)
      case "tds_tcs_receivables":
        return computeTdsTcsReceivablesReport(salesDocs, purchaseDocs, filterOptions)
      case "tds_tcs_payables":
        return computeTdsTcsPayablesReport(salesDocs, purchaseDocs, filterOptions)
      default:
        return computeSaleInvoicesReport(salesDocs, filterOptions)
    }
  }, [
    activeReport, 
    filterOptions, 
    salesDocs, 
    purchaseDocs, 
    payments, 
    items, 
    parties, 
    stockMovements, 
    godowns, 
    salesReturns,
    purchaseReturns,
    creditNotes, 
    debitNotes, 
    selectedPartyId,
    gstSettings
  ])

  const handleQuickAction = () => {
    if (reportData.actionModule && onNavigate) {
      onNavigate(reportData.actionModule)
    } else if (activeReport === "sale_invoices" && onNavigate) {
      onNavigate("sales")
    } else if (activeReport === "purchase_bills" && onNavigate) {
      onNavigate("purchases")
    } else if (activeReport === "all_parties" && onNavigate) {
      onNavigate("parties")
    } else {
      alert(`Action triggered for ${reportData.title}`)
    }
  }

  const handleExportGstr1Json = () => {
    try {
      const b2bInvoices = salesDocs.filter(d => Boolean(d.partyGstin && d.partyGstin.trim().length >= 15))
      const b2clInvoices = salesDocs.filter(d => (!d.partyGstin || d.partyGstin.trim().length < 15) && (d.grandTotal || 0) > 250000 && isInterStateTransaction(getDocPlaceOfSupply(d, business.stateCode || "27"), business.stateCode || "27"))
      const gstr1Payload = {
        gstin: business.gstin || "27AABCA1234F1Z5",
        fp: (new Date().getMonth() + 1).toString().padStart(2, "0") + new Date().getFullYear(),
        version: "GST3.1.2",
        hash: "hash",
        b2b: b2bInvoices.map(inv => ({
          ctin: inv.partyGstin,
          inv: [{
            inum: inv.docNo,
            idt: inv.date.split("-").reverse().join("-"),
            val: inv.grandTotal,
            pos: getDocPlaceOfSupply(inv, business.stateCode || "27"),
            rchrg: "N",
            inv_typ: "R",
            itms: inv.items.map((it, idx) => ({
              num: idx + 1,
              itm_det: {
                rt: it.gstRate,
                txval: it.taxableAmount,
                iamt: it.igst || 0,
                camt: it.cgst || 0,
                samt: it.sgst || 0,
                csamt: 0
              }
            }))
          }]
        })),
        b2cl: b2clInvoices.map(inv => ({
          pos: getDocPlaceOfSupply(inv, business.stateCode || "27"),
          inv: [{
            inum: inv.docNo,
            idt: inv.date.split("-").reverse().join("-"),
            val: inv.grandTotal,
            itms: inv.items.map((it, idx) => ({
              num: idx + 1,
              itm_det: {
                rt: it.gstRate,
                txval: it.taxableAmount,
                iamt: it.igst || 0,
                csamt: 0
              }
            }))
          }]
        })),
        cdnr: creditNotes.map(cn => ({
          ctin: cn.customerGstin || "27AABCA1234F1Z5",
          nt: [{
            ntty: "C",
            nt_num: cn.creditNoteNo,
            nt_dt: cn.date.split("-").reverse().join("-"),
            inum: cn.originalInvoiceNo || "INV-001",
            val: cn.grandTotal,
            itms: cn.items.map((it, idx) => ({
              num: idx + 1,
              itm_det: {
                rt: it.gstRate,
                txval: it.amount,
                iamt: it.igst || 0,
                camt: it.cgst || 0,
                samt: it.sgst || 0,
                csamt: 0
              }
            }))
          }]
        }))
      }
      const blob = new Blob([JSON.stringify(gstr1Payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `GSTR1_${business.gstin || "OFFLINE"}_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  const handleExportCmp08Json = () => {
    try {
      const filtered = salesDocs.filter(d => d.type === "invoice" && isDateInRange(d.date, filterOptions.dateRange))
      const totalCompositionTurnover = filtered.reduce((s, d) => s + (d.grandTotal || d.subtotal || 0), 0)
      const compositionRate = gstSettings.compositionRate || 1
      const compositionCategory = gstSettings.compositionCategory || "trader_manufacturer"
      const compositionTaxPayable = (totalCompositionTurnover * compositionRate) / 100
      const compositionCgstPayable = compositionTaxPayable / 2
      const compositionSgstPayable = compositionTaxPayable / 2

      const payload = {
        gstin: business.gstin || "27AABCA1234F1Z5",
        financial_year: "2026-27",
        version: "CMP08_v1.0",
        turnover: totalCompositionTurnover,
        rate: compositionRate,
        category: compositionCategory,
        tax_details: {
          table1_outward: {
            val: totalCompositionTurnover,
            camt: compositionCgstPayable,
            samt: compositionSgstPayable,
            iamt: 0,
            csamt: 0
          },
          table3_tax_payable: {
            camt: compositionCgstPayable,
            samt: compositionSgstPayable,
            tot_tax: compositionTaxPayable
          }
        },
        bills: filtered.map(doc => ({
          inum: doc.docNo,
          idt: doc.date,
          val: doc.grandTotal || doc.subtotal,
          cname: doc.partyName,
          pos: getDocPlaceOfSupply(doc, business.stateCode || "27")
        }))
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `CMP08_${business.gstin || "OFFLINE"}_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-950 overflow-hidden">
      {/* 1. Left Sub-Sidebar Navigation */}
      <ReportsSidebar
        activeReport={activeReport}
        onSelectReport={(key) => setActiveReport(key)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafbfc] dark:bg-slate-950">
        
        {/* Top Action Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {reportData.title}
          </h2>

          <div className="flex items-center gap-3">
            {activeReport === "gstr_1" && (
              <button
                type="button"
                onClick={handleExportGstr1Json}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Export GSTR-1 JSON</span>
              </button>
            )}

            {activeReport === "cmp_08" && (
              <button
                type="button"
                onClick={handleExportCmp08Json}
                className="bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Export CMP-08 JSON</span>
              </button>
            )}

            {/* Primary Action Button */}
            {reportData.actionButtonLabel && (
              <button
                type="button"
                onClick={handleQuickAction}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{reportData.actionButtonLabel}</span>
              </button>
            )}

            {/* Settings Gear Button */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("settings")}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Report & System Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <ReportFilterBar
          preset={preset}
          onPresetChange={handlePresetChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          godowns={godowns}
          selectedGodownId={selectedGodownId}
          onGodownChange={setSelectedGodownId}
          salespersons={salespersons}
          selectedSalesperson={selectedSalesperson}
          onSalespersonChange={setSelectedSalesperson}
          firmName={business.name}
          isPartyStatement={activeReport === "party_statement" || activeReport === "credit_ledger"}
          parties={parties}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
        />

        {/* Scrollable Report Content View */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Blocked Sensitive Financial Data Alert */}
          {isBlocked ? (
            <div className="mx-4 my-6 p-8 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 text-center space-y-3">
              <Lock className="h-10 w-10 text-amber-600 mx-auto" />
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Permission Restricted: Sensitive Financial Analytics
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                Per security rule AC-03: Your current user role is restricted from viewing cost of goods sold, profit margins, and net profitability. Please switch to the Business Owner or Accountant role to access this report.
              </p>
            </div>
          ) : (
            /* Interactive Data Table */
            <ReportDataTable
              report={reportData}
              onViewRecord={(row) => {
                if (row.docNo && activeReport === "sale_invoices" && onNavigate) {
                  onNavigate("sales")
                } else if (row.docNo && activeReport === "purchase_bills" && onNavigate) {
                  onNavigate("purchases")
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

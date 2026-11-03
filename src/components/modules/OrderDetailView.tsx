"use client"

import React, { useState } from "react"
import { SalesOrder } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  ShoppingBag,
  Printer,
  Download,
  Share2,
  Truck,
  Receipt,
  X,
  Package,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Info,
  Layers,
  ArrowRight
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface OrderDetailViewProps {
  order: SalesOrder
  onClose: () => void
  onConvertToChallan: (orderId: string) => void
  onConvertToInvoice: (orderId: string) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function OrderDetailView({
  order,
  onClose,
  onConvertToChallan,
  onConvertToInvoice,
  onEdit,
  onDelete
}: OrderDetailViewProps) {
  const { business, parties, godowns, deleteSalesOrder, gstSettings, formCustomColumns } = useApp()
  const customColumns = (formCustomColumns?.order || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "fulfillment" | "history">("preview")

  const party = parties.find(p => p.id === order.partyId || (p.name && order.partyName && p.name.trim().toLowerCase() === order.partyName.trim().toLowerCase()))
  const currSym = order.currencySymbol || party?.currencySymbol || (order.currency === "USD" ? "$" : "₹")
  const isFulfilled = order.orderStatus === "fulfilled"
  const isInvoiced = order.invoicedStatus === "invoiced"

  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0)

  const formatAmountWords = (num: number) => {
    return `${order.currency || "INR"} ${Math.round(num).toLocaleString("en-US")} Only`
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">

      {/* 1. Header Action Bar - Unified with current theme */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Sales Order {order.orderNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${isFulfilled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                }`}>
                {order.orderStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.partyName}</span> • Date: {order.date}
            </p>
          </div>
        </div>

        {/* Action Buttons - Standardized with primary blue and outline buttons */}
        <div className="flex items-center gap-2">
          {!isFulfilled && (
            <Button
              size="sm"
              onClick={() => onConvertToChallan(order.id)}
              className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
              title="Dispatch goods under Rule 55 Delivery Challan"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Create Challan</span>
            </Button>
          )}

          {!isInvoiced && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvertToInvoice(order.id)}
              className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
              title="Convert this Sales Order into a Commercial Tax Invoice"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Convert to Invoice</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Downloading PDF for Sales Order ${order.orderNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp notification with Sales Order copy sent to ${order.partyName}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </Button>

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deleteSalesOrder(order.id)
                onClose()
              }
            }}
            title="Delete Sales Order"
            description={`Are you sure you want to delete Sales Order ${order.orderNo}? This action cannot be undone.`}
            itemName={`${order.orderNo} • ${order.partyName}`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Tabs Navigation - Uniform theme blue underline across all tabs */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          Order Preview
        </button>
        <button
          onClick={() => setActiveTab("fulfillment")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "fulfillment"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <span>Fulfillment & Pipeline</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
            {order.items.length} items
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          Audit History
        </button>
      </div>

      {/* 3. Main Document Preview Sheet / Tabs */}
      <div className={`flex-1 overflow-y-auto ${activeTab === "preview"
          ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start"
          : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
        }`}>

        {/* PREVIEW TAB: Authentic Sales Order Document Canvas formatted to A4 */}
        {activeTab === "preview" && (
          <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:max-w-none print:min-h-0 print:m-0 print:w-full">
            <div className="space-y-6">

              {/* Document Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-md bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      AB
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {business.tradeName || business.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                    <p>{business.address}</p>
                    <p>State: {business.state} ({business.stateCode})</p>
                    <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
                    SALES ORDER
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mt-0.5">
                    Order Confirmation
                  </span>

                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Order #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{order.orderNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Order Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{order.date}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Expected Delivery: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{order.expectedDeliveryDate}</span>
                    </p>
                    {order.referenceNo && (
                      <p>
                        <span className="text-slate-400">Customer PO Ref: </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{order.referenceNo}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Terms */}
              <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Customer / Buyer
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {order.partyName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{party?.address || "Registered Business Address"}</p>
                    <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.partyGstin || party?.gstin || "Unregistered"}</span></p>
                    <p>State: {party?.state || "Delhi"} ({order.partyStateCode || "07"})</p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fulfillment & Delivery Terms
                  </span>
                  <div className="text-slate-600 dark:text-slate-400 space-y-1">
                    <p><span className="text-slate-400">Dispatch Godown: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{order.godownName}</span></p>
                    <p><span className="text-slate-400">Target Delivery: </span><span className="font-medium text-slate-800 dark:text-slate-200">{order.expectedDeliveryDate}</span></p>
                    <p><span className="text-slate-400">Total Items: </span><span className="font-medium text-slate-800 dark:text-slate-200">{order.items.length} Lines ({totalQuantity} Units)</span></p>
                  </div>
                </div>
              </div>

              {/* Ordered Line Items Table */}
              <div className="py-6">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">ORDERED ITEM & DESCRIPTION</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">HSN/SAC</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">BOOKED RATE ({currSym})</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">TAX %</TableHead>
                        {customColumns.map(col => (
                          <TableHead
                            key={col.id}
                            className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                          >
                            {col.name}
                          </TableHead>
                        ))}
                        <TableHead className="px-3 py-2.5 text-right text-xs">TOTAL AMOUNT ({currSym})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((line, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3 py-3 text-xs">
                            <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                            {line.sku && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                SKU: {line.sku}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-xs tabular-nums text-slate-500">{line.hsn || "8471"}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            {line.qty} {line.unit}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                            {currSym}{line.rate.toFixed(2)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-500">
                            {line.gstRate}%
                          </TableCell>
                          {customColumns.map(col => (
                            <TableCell
                              key={col.id}
                              className={`px-3 py-3 text-center text-xs text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                            >
                              {(line as any).customColumns?.[col.id] || "—"}
                            </TableCell>
                          ))}
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            {currSym}{line.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Totals Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Order Value in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      {formatAmountWords(order.grandTotal)}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Note: This booking confirms committed inventory and rates. Commercial invoice will be issued upon dispatch.
                  </p>
                </div>

                {/* Right Column: Clean Calculations */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{order.subtotal.toFixed(2)}</span>
                  </div>
                  {(order.cgstTotal || 0) > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Estimated CGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{(order.cgstTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(order.sgstTotal || 0) > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Estimated SGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{(order.sgstTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(order.igstTotal || 0) > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Estimated IGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{(order.igstTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(!order.cgstTotal && !order.sgstTotal && !order.igstTotal && order.taxTotal > 0) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Estimated GST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{order.taxTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {order.additionalCharges && order.additionalCharges.length > 0 ? (
                    order.additionalCharges.map((ch, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    order.adjustment !== undefined && order.adjustment !== 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{order.adjustmentLabel || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {order.adjustment > 0 ? `+${currSym}${order.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(order.adjustment).toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {order.withholdingAmount !== undefined && order.withholdingAmount > 0 && (
                    ((order.withholdingType === "TDS" && gstSettings?.enableTds) ||
                      (order.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">
                          {order.withholdingType} {order.withholdingRate ? `(${order.withholdingRate}%)` : ""}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {order.withholdingType === "TDS"
                            ? `-${currSym}${order.withholdingAmount.toFixed(2)}`
                            : `+${currSym}${order.withholdingAmount.toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {order.roundOff !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Round Off</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {order.roundOff > 0 ? `+${currSym}${order.roundOff.toFixed(2)}` : order.roundOff < 0 ? `-${currSym}${Math.abs(order.roundOff).toFixed(2)}` : `${currSym}0.00`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Total Order Value</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{order.grandTotal.toFixed(2)}</span>
                  </div>
                  {order.notes && order.notes.includes("Advance Received:") && (
                    <div className="pt-2 p-2 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {order.notes.split("•").find(n => n.includes("Advance Received:"))?.trim() || order.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Footer: Terms & Order Confirmation Signatures at the bottom of A4 page */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Order Terms:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Prices and tax estimates are confirmed as per this booking order.</li>
                  <li>Delivery schedules are subject to site clearance and standard logistics transit.</li>
                </ol>
              </div>

              <div className="flex gap-12 text-center">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                    {order.partyName}
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                    Buyer's Stamp & Signature
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                    For {business.name}
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* FULFILLMENT TAB */}
        {activeTab === "fulfillment" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fulfillment & Stock Allocation</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-blue-700 dark:text-blue-400 block mb-1">Total Committed</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {totalQuantity} Units
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1">Source Godown</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {order.godownName}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1">Fulfillment Status</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Customer PO Reference #</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{order.referenceNo || "None"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Expected Delivery Schedule</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{order.expectedDeliveryDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Invoice Billing Status</span>
                  <span className="font-semibold text-blue-600">{order.invoicedStatus.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Order Audit History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological record of status changes and fulfillment events</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {order.orderNo}
                </Badge>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Order Confirmed</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Booked on {order.date} with PO Ref #{order.referenceNo || "Direct"}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Stock Reserved</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Inventory reserved at {order.godownName} for dispatch</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Fulfillment Tracking</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Status: {order.orderStatus.toUpperCase()} • Target Delivery: {order.expectedDeliveryDate}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

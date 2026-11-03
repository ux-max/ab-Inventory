"use client"

import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  FileCheck2,
  QrCode,
  Truck,
  Download,
  Layers,
  Info,
  ChevronRight,
  Plus,
  PlusCircle,
  Trash2,
  Pencil,
  ArrowLeft,
  X,
  ExternalLink,
  FileText,
  Sliders,
  Check,
  CheckCircle2,
  Copy,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TaxRateItem, TaxGroupItem, WithholdingRateItem, isInterStateTransaction, getStateNameFromCode } from "@/lib/gstConstants"

// Unclipped portal tooltip that renders directly into document.body
function PortalTooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const top = Math.max(12, rect.top - 8)
      const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 1200) - 290
      const left = Math.min(rect.right + 10, maxLeft)
      setCoords({ top, left })
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </div>

      {isVisible && coords && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            maxWidth: "280px"
          }}
          className="z-[9999] px-3 py-2 bg-slate-900 text-white text-xs font-normal leading-relaxed rounded-lg shadow-xl pointer-events-none animate-in fade-in duration-150 border border-slate-700/80"
        >
          {text}
        </div>,
        document.body
      )}
    </>
  )
}

export function GstModule() {
  const {
    business,
    salesDocs,
    purchaseDocs,
    creditNotes,
    debitNotes,
    purchaseReturns,
    gstSettings,
    updateGstSettings,
    taxRates,
    taxGroups,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    addTaxGroup,
    updateTaxGroup,
    deleteTaxGroup,
    tdsRates,
    addTdsRate,
    updateTdsRate,
    deleteTdsRate,
    tcsRates,
    addTcsRate,
    updateTcsRate,
    deleteTcsRate
  } = useApp()

  // Main tab view: "settings" (default) or "returns"
  const [mainView, setMainView] = useState<"settings" | "returns">("settings")
  const [activeReturnTab, setActiveReturnTab] = useState<"gstr1" | "gstr3b" | "einvoice" | "eway" | "cmp08">(() => {
    return gstSettings?.isCompositionScheme ? "cmp08" : "gstr1"
  })
  const [cmp08Quarter, setCmp08Quarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q3")
  const [cmp08Search, setCmp08Search] = useState("")
  const [gstr1Section, setGstr1Section] = useState<"4A" | "5" | "7" | "9B">("4A")
  const [toastMsg, setToastMsg] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null)

  // Tax List visibility on the same screen (matching user screenshot)
  const [showTaxList, setShowTaxList] = useState(true)

  // Tax Rate Modal state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [rateFormName, setRateFormName] = useState("")
  const [rateFormRate, setRateFormRate] = useState<string | number>("")
  const [rateFormType, setRateFormType] = useState<"igst" | "cgst" | "sgst" | "cess" | "gst">("igst")

  // Tax Group Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupFormName, setGroupFormName] = useState("")
  const [groupFormRate, setGroupFormRate] = useState<string | number>("")
  const [groupFormSubTaxes, setGroupFormSubTaxes] = useState<string[]>([])

  // TDS Modal state & sub-view
  const [isTdsModalOpen, setIsTdsModalOpen] = useState(false)
  const [tdsView, setTdsView] = useState<"list" | "form">("list")
  const [editingTdsId, setEditingTdsId] = useState<string | null>(null)
  const [tdsFormSection, setTdsFormSection] = useState("192")
  const [tdsFormName, setTdsFormName] = useState("")
  const [tdsFormRate, setTdsFormRate] = useState<string | number>("")

  // TCS Modal state & sub-view
  const [isTcsModalOpen, setIsTcsModalOpen] = useState(false)
  const [tcsView, setTcsView] = useState<"list" | "form">("list")
  const [editingTcsId, setEditingTcsId] = useState<string | null>(null)
  const [tcsFormSection, setTcsFormSection] = useState("206C(1H)")
  const [tcsFormName, setTcsFormName] = useState("")
  const [tcsFormRate, setTcsFormRate] = useState<string | number>("")

  // Portal mount check
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])


  // Helper to extract clean 2-digit Place of Supply code
  const getDocPlaceOfSupply = (doc: { placeOfSupply?: string; partyStateCode?: string; partyGstin?: string }, defaultState: string = "27") => {
    if (doc.placeOfSupply && doc.placeOfSupply.trim()) {
      return doc.placeOfSupply.split("-")[0].trim().padStart(2, "0")
    }
    if (doc.partyStateCode && doc.partyStateCode.trim()) {
      return doc.partyStateCode.split("-")[0].trim().padStart(2, "0")
    }
    if (doc.partyGstin && doc.partyGstin.trim().length >= 2) {
      const prefix = doc.partyGstin.trim().slice(0, 2)
      if (/^\d{2}$/.test(prefix)) return prefix
    }
    return defaultState.split("-")[0].trim().padStart(2, "0")
  }

  // Compute GSTR values for Returns view
  // B2B: Registered buyers with valid GSTIN (length >= 15)
  const b2bInvoices = salesDocs.filter(s => s.partyGstin && s.partyGstin.trim().length >= 15)

  // B2CL (Table 5): Unregistered buyers, Inter-State supply, invoice value > ₹2,50,000
  const b2clInvoices = salesDocs.filter(s => {
    const isUnregistered = !s.partyGstin || s.partyGstin.trim().length < 15
    const pos = getDocPlaceOfSupply(s, business.stateCode || "27")
    const isInter = isInterStateTransaction(pos, business.stateCode || "27")
    return isUnregistered && isInter && (s.grandTotal || 0) > 250000
  })

  // B2CS (Table 7): Unregistered buyers (All Intra-State, plus Inter-State <= ₹2,50,000)
  const b2csInvoices = salesDocs.filter(s => {
    const isUnregistered = !s.partyGstin || s.partyGstin.trim().length < 15
    const pos = getDocPlaceOfSupply(s, business.stateCode || "27")
    const isInter = isInterStateTransaction(pos, business.stateCode || "27")
    return isUnregistered && (!isInter || (s.grandTotal || 0) <= 250000)
  })

  // Group B2CS by Place of Supply for statutory consolidated Table 7
  const b2csSummaryByState = React.useMemo(() => {
    const map = new Map<string, { pos: string; stateName: string; isInterState: boolean; taxable: number; cgst: number; sgst: number; igst: number; total: number; count: number }>()
    b2csInvoices.forEach(inv => {
      const pos = getDocPlaceOfSupply(inv, business.stateCode || "27")
      const isInter = isInterStateTransaction(pos, business.stateCode || "27")
      const existing = map.get(pos) || {
        pos,
        stateName: getStateNameFromCode(pos) || `State ${pos}`,
        isInterState: isInter,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
        count: 0
      }
      existing.taxable += inv.subtotal || 0
      existing.cgst += inv.cgstTotal || 0
      existing.sgst += inv.sgstTotal || 0
      existing.igst += inv.igstTotal || 0
      existing.total += inv.grandTotal || 0
      existing.count += 1
      map.set(pos, existing)
    })
    return Array.from(map.values())
  }, [b2csInvoices, business.stateCode])

  // GSTR-3B Table 3.2: Inter-State supplies made to unregistered persons by Place of Supply
  const gstr3bTable32 = React.useMemo(() => {
    const map = new Map<string, { pos: string; stateName: string; taxable: number; igst: number; count: number }>()
    salesDocs.forEach(inv => {
      const isUnregistered = !inv.partyGstin || inv.partyGstin.trim().length < 15
      const pos = getDocPlaceOfSupply(inv, business.stateCode || "27")
      const isInter = isInterStateTransaction(pos, business.stateCode || "27")
      if (isUnregistered && isInter) {
        const existing = map.get(pos) || {
          pos,
          stateName: getStateNameFromCode(pos) || `State ${pos}`,
          taxable: 0,
          igst: 0,
          count: 0
        }
        existing.taxable += inv.subtotal || 0
        existing.igst += inv.igstTotal || 0
        existing.count += 1
        map.set(pos, existing)
      }
    })
    return Array.from(map.values())
  }, [salesDocs, business.stateCode])

  const totalTaxable = salesDocs.reduce((a, b) => a + (b.subtotal || 0), 0)
  const totalCgst = salesDocs.reduce((a, b) => a + (b.cgstTotal || 0), 0)
  const totalSgst = salesDocs.reduce((a, b) => a + (b.sgstTotal || 0), 0)
  const totalIgst = salesDocs.reduce((a, b) => a + (b.igstTotal || 0), 0)
  const totalOutputTax = totalCgst + totalSgst + totalIgst
  const itcAvailable = purchaseDocs.reduce((a, b) => {
    if (b.itcEligibility === "ineligible") return a
    const tax = (b.cgstTotal ?? 0) + (b.sgstTotal ?? 0) + (b.igstTotal ?? 0)
    return a + tax
  }, 0)

  // Purchases ITC breakdown
  const purchasesIgst = purchaseDocs.reduce((a, b) => b.itcEligibility === "ineligible" ? a : a + (b.igstTotal ?? 0), 0)
  const purchasesCgst = purchaseDocs.reduce((a, b) => b.itcEligibility === "ineligible" ? a : a + (b.cgstTotal ?? 0), 0)
  const purchasesSgst = purchaseDocs.reduce((a, b) => b.itcEligibility === "ineligible" ? a : a + (b.sgstTotal ?? 0), 0)

  // RCM (Inward Reverse Charge) Metrics
  const rcmPurchases = purchaseDocs.filter(d => d.type === "bill" && Boolean(d.isRcm))
  const rcmPurchaseTaxable = rcmPurchases.reduce((a, b) => a + (b.subtotal || 0), 0)
  const rcmPurchaseCgst = rcmPurchases.reduce((a, b) => a + (b.cgstTotal || 0), 0)
  const rcmPurchaseSgst = rcmPurchases.reduce((a, b) => a + (b.sgstTotal || 0), 0)
  const rcmPurchaseIgst = rcmPurchases.reduce((a, b) => a + (b.igstTotal || 0), 0)

  // RCM Reversals (Debit Notes & standalone Purchase Returns where isRcm === true)
  const rcmDebitNotes = debitNotes.filter(d => Boolean(d.isRcm))
  const standaloneRcmReturns = purchaseReturns.filter(r => Boolean(r.isRcm) && !r.debitNoteId && !r.debitNoteNo)

  const rcmDnTaxable = rcmDebitNotes.reduce((a, b) => a + (b.subtotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.subtotal || 0), 0)
  const rcmDnCgst = rcmDebitNotes.reduce((a, b) => a + (b.cgstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.cgstTotal || 0), 0)
  const rcmDnSgst = rcmDebitNotes.reduce((a, b) => a + (b.sgstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.sgstTotal || 0), 0)
  const rcmDnIgst = rcmDebitNotes.reduce((a, b) => a + (b.igstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.igstTotal || 0), 0)

  // Net RCM for Table 3.1(d) and CMP-08 Table 2
  const netRcmTaxable = Math.max(0, rcmPurchaseTaxable - rcmDnTaxable)
  const netRcmCgst = Math.max(0, rcmPurchaseCgst - rcmDnCgst)
  const netRcmSgst = Math.max(0, rcmPurchaseSgst - rcmDnSgst)
  const netRcmIgst = Math.max(0, rcmPurchaseIgst - rcmDnIgst)
  const netRcmTax = netRcmCgst + netRcmSgst + netRcmIgst

  // ITC Reversals for Table 4(B) (All debit notes + standalone returns)
  const itcReversedIgst = debitNotes.reduce((a, b) => a + (b.igstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.igstTotal || 0), 0)
  const itcReversedCgst = debitNotes.reduce((a, b) => a + (b.cgstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.cgstTotal || 0), 0)
  const itcReversedSgst = debitNotes.reduce((a, b) => a + (b.sgstTotal || 0), 0) + standaloneRcmReturns.reduce((a, b) => a + (b.sgstTotal || 0), 0)
  const totalItcReversed = itcReversedIgst + itcReversedCgst + itcReversedSgst

  const netItcIgst = Math.max(0, purchasesIgst - itcReversedIgst)
  const netItcCgst = Math.max(0, purchasesCgst - itcReversedCgst)
  const netItcSgst = Math.max(0, purchasesSgst - itcReversedSgst)
  const netItcAvailable = Math.max(0, itcAvailable - totalItcReversed)

  const netGstPayable = Math.max(0, totalOutputTax - netItcAvailable) + netRcmTax

  // Composition Scheme Metrics (Section 10 CGST Act)
  const isCompositionActive = Boolean(gstSettings.enableGst && gstSettings.isCompositionScheme)
  const compositionCategory = gstSettings.compositionCategory || "trader_manufacturer"
  const compositionRate = gstSettings.compositionRate || (compositionCategory === "restaurant" ? 5 : compositionCategory === "service_provider" ? 6 : 1)
  const totalCompositionTurnover = salesDocs.reduce((a, b) => a + (b.grandTotal || b.subtotal || 0), 0)
  const compositionTaxPayable = isCompositionActive ? (totalCompositionTurnover * compositionRate) / 100 : 0
  const compositionCgstPayable = compositionTaxPayable / 2
  const compositionSgstPayable = compositionTaxPayable / 2

  // Form CMP-08 JSON Exporter
  const handleExportCmp08Json = () => {
    try {
      const payload = {
        gstin: business.gstin || "27AABCA1234F1Z5",
        fp: cmp08Quarter === "Q1" ? "062026" : cmp08Quarter === "Q2" ? "092026" : cmp08Quarter === "Q3" ? "122026" : "032027",
        quarter: cmp08Quarter,
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
          table2_rcm: {
            val: netRcmTaxable,
            camt: netRcmCgst,
            samt: netRcmSgst,
            iamt: netRcmIgst,
            csamt: 0
          },
          table3_tax_payable: {
            camt: compositionCgstPayable + netRcmCgst,
            samt: compositionSgstPayable + netRcmSgst,
            tot_tax: compositionTaxPayable + netRcmTax
          }
        },
        bills: salesDocs.map(doc => ({
          inum: doc.docNo,
          idt: doc.date,
          val: doc.grandTotal || doc.subtotal,
          cname: doc.partyName,
          pos: getDocPlaceOfSupply(doc, business.stateCode || "27")
        }))
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `CMP08_${business.gstin || "GSTIN"}_${cmp08Quarter}_2026-27.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToastMsg({ message: `Form CMP-08 Statement JSON for ${cmp08Quarter} exported successfully.`, type: "success" })
    } catch {
      setToastMsg({ message: "Failed to export CMP-08 JSON.", type: "error" })
    }
  }

  // Real GSTR-1 JSON Generator & Downloader
  const handleExportGstr1Json = () => {
    try {
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
        b2cs: b2csSummaryByState.map(s => ({
          sply_ty: s.isInterState ? "INTER" : "INTRA",
          pos: s.pos,
          typ: "OE",
          rt: 18,
          txval: s.taxable,
          iamt: s.igst,
          camt: s.cgst,
          samt: s.sgst,
          csamt: 0
        }))
      }
      const blob = new Blob([JSON.stringify(gstr1Payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `GSTR1_${business.gstin || "27AABCA1234F1Z5"}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setToastMsg({ message: "GSTR-1 JSON Payload exported with statutory Place of Supply codes!", type: "success" })
      setTimeout(() => setToastMsg(null), 4000)
    } catch (e: any) {
      setToastMsg({ message: `Export failed: ${e?.message || "Unknown error"}`, type: "error" })
      setTimeout(() => setToastMsg(null), 4000)
    }
  }

  // Handlers for settings toggle
  const handleToggleEnableGst = () => {
    const nextVal = !gstSettings.enableGst
    updateGstSettings({ enableGst: nextVal })
  }

  // --- TDS Handlers ---
  const handleOpenTdsModal = () => {
    if (!gstSettings.enableTds) return
    setTdsView("list")
    setIsTdsModalOpen(true)
  }

  const handleOpenAddTds = () => {
    setEditingTdsId(null)
    setTdsFormSection("192")
    setTdsFormName("")
    setTdsFormRate("")
    setTdsView("form")
  }

  const handleEditTds = (item: WithholdingRateItem) => {
    setEditingTdsId(item.id)
    setTdsFormSection(item.section || "194C")
    setTdsFormName(item.name)
    setTdsFormRate(item.rate)
    setTdsView("form")
  }

  const handleDeleteTds = (id: string) => {
    deleteTdsRate(id)
  }

  const handleSaveTds = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tdsFormName.trim()) return
    const rateNum = Number(tdsFormRate) || 0
    if (editingTdsId) {
      updateTdsRate(editingTdsId, {
        name: tdsFormName.trim(),
        section: tdsFormSection.trim(),
        rate: rateNum
      })
    } else {
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString()
      addTdsRate({
        name: tdsFormName.trim(),
        section: tdsFormSection.trim() || "194C",
        rate: rateNum,
        collectionCode: randomCode
      })
    }
    setTdsView("list")
  }

  // --- TCS Handlers ---
  const handleOpenTcsModal = () => {
    if (!gstSettings.enableTcs) return
    setTcsView("list")
    setIsTcsModalOpen(true)
  }

  const handleOpenAddTcs = () => {
    setEditingTcsId(null)
    setTcsFormSection("206C(1H)")
    setTcsFormName("")
    setTcsFormRate("")
    setTcsView("form")
  }

  const handleEditTcs = (item: WithholdingRateItem) => {
    setEditingTcsId(item.id)
    setTcsFormSection(item.section || "206C(1H)")
    setTcsFormName(item.name)
    setTcsFormRate(item.rate)
    setTcsView("form")
  }

  const handleDeleteTcs = (id: string) => {
    deleteTcsRate(id)
  }

  const handleSaveTcs = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tcsFormName.trim()) return
    const rateNum = Number(tcsFormRate) || 0
    if (editingTcsId) {
      updateTcsRate(editingTcsId, {
        name: tcsFormName.trim(),
        section: tcsFormSection.trim(),
        rate: rateNum
      })
    } else {
      const randomCode = Math.floor(2000 + Math.random() * 8000).toString()
      addTcsRate({
        name: tcsFormName.trim(),
        section: tcsFormSection.trim() || "206C(1H)",
        rate: rateNum,
        collectionCode: randomCode
      })
    }
    setTcsView("list")
  }

  // --- Tax Rate & Tax Group Handlers ---
  const handleOpenAddTaxRate = () => {
    setEditingRateId(null)
    setRateFormName("")
    setRateFormRate("")
    setRateFormType("igst")
    setIsRateModalOpen(true)
  }

  const handleEditTaxRate = (rate: TaxRateItem) => {
    setEditingRateId(rate.id)
    setRateFormName(rate.name)
    setRateFormRate(rate.rate)
    setRateFormType(rate.type || "igst")
    setIsRateModalOpen(true)
  }

  const handleSaveTaxRate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rateFormName.trim()) return
    const numRate = Number(rateFormRate) || 0
    if (editingRateId) {
      updateTaxRate(editingRateId, {
        name: rateFormName.trim(),
        rate: numRate,
        type: rateFormType
      })
    } else {
      addTaxRate({
        name: rateFormName.trim(),
        rate: numRate,
        type: rateFormType
      })
    }
    setIsRateModalOpen(false)
  }

  const handleOpenAddTaxGroup = () => {
    setEditingGroupId(null)
    setGroupFormName("")
    setGroupFormRate("")
    setGroupFormSubTaxes([])
    setIsGroupModalOpen(true)
  }

  const handleEditTaxGroup = (group: TaxGroupItem) => {
    setEditingGroupId(group.id)
    setGroupFormName(group.name)
    setGroupFormRate(group.rate)
    setGroupFormSubTaxes(group.subTaxes || [])
    setIsGroupModalOpen(true)
  }

  const handleToggleSubTax = (taxName: string) => {
    const exists = groupFormSubTaxes.includes(taxName)
    const next = exists
      ? groupFormSubTaxes.filter(t => t !== taxName)
      : [...groupFormSubTaxes, taxName]
    const sum = next.reduce((acc, name) => {
      const found = taxRates.find(r => r.name === name)
      return acc + (found ? found.rate : 0)
    }, 0)
    const roundedRate = Math.round(sum * 10000) / 10000
    setGroupFormSubTaxes(next)
    setGroupFormRate(roundedRate)
  }

  const handleSaveTaxGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupFormName.trim()) return
    const numRate = Number(groupFormRate) || 0
    if (editingGroupId) {
      updateTaxGroup(editingGroupId, {
        name: groupFormName.trim(),
        rate: numRate,
        subTaxes: groupFormSubTaxes
      })
    } else {
      addTaxGroup({
        name: groupFormName.trim(),
        rate: numRate,
        subTaxes: groupFormSubTaxes
      })
    }
    setIsGroupModalOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-12 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              GST and Tax Settings
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              GSTIN: {business.gstin} ({business.state})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white dark:bg-slate-950">
            {/* Column 1: Left Column: GST Settings Checklist */}
            <div className="w-full md:w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900/40">
              <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-12">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  GST Settings
                </h3>
              </div>

              {/* Scrollable Checklist */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* 1. Enable GST */}
                <div className="flex items-start gap-3 group">
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={gstSettings.enableGst}
                      onChange={handleToggleEnableGst}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400"
                    )}>
                      {gstSettings.enableGst && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={handleToggleEnableGst}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable GST
                      </span>
                      <PortalTooltip text="Enables Goods & Services Tax calculation, GSTR reporting tables, and GST slabs on sales and purchases." />
                    </div>
                    {!gstSettings.enableGst && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        GST is currently disabled. In the Add Item form, tax options will strictly show &quot;None&quot;, and HSN, Place of Supply, ITC, &amp; RCM are locked.
                      </p>
                    )}
                  </div>
                </div>

                {/* Composition Scheme (Section 10) */}
                <div className={cn(
                  "flex items-start gap-3 transition-opacity",
                  !gstSettings.enableGst && "opacity-40 pointer-events-none select-none"
                )}>
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      disabled={!gstSettings.enableGst}
                      checked={Boolean(gstSettings.enableGst && gstSettings.isCompositionScheme)}
                      onChange={() => {
                        if (!gstSettings.enableGst) return
                        const nextVal = !gstSettings.isCompositionScheme
                        const cat = gstSettings.compositionCategory || "trader_manufacturer"
                        const rate = cat === "restaurant" ? 5 : cat === "service_provider" ? 6 : 1
                        updateGstSettings({
                          isCompositionScheme: nextVal,
                          compositionCategory: cat,
                          compositionRate: rate
                        })
                        if (nextVal) {
                          setActiveReturnTab("cmp08")
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst && gstSettings.isCompositionScheme 
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs" 
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400",
                      !gstSettings.enableGst && "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed"
                    )}>
                      {gstSettings.enableGst && gstSettings.isCompositionScheme && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span 
                        onClick={() => {
                          if (!gstSettings.enableGst) return
                          const nextVal = !gstSettings.isCompositionScheme
                          const cat = gstSettings.compositionCategory || "trader_manufacturer"
                          const rate = cat === "restaurant" ? 5 : cat === "service_provider" ? 6 : 1
                          updateGstSettings({
                            isCompositionScheme: nextVal,
                            compositionCategory: cat,
                            compositionRate: rate
                          })
                          if (nextVal) {
                            setActiveReturnTab("cmp08")
                          }
                        }}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Composition Scheme
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Sec 10
                      </span>
                      <PortalTooltip text="For small businesses with turnover up to ₹1.5 Cr. Issues Bill of Supply (0% customer tax). Pays flat turnover tax quarterly via Form CMP-08 without claiming ITC." />
                    </div>

                    {gstSettings.enableGst && gstSettings.isCompositionScheme && (
                      <div className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                          Composition Category &amp; Tax Rate
                        </label>
                        <select
                          value={gstSettings.compositionCategory || "trader_manufacturer"}
                          onChange={(e) => {
                            const cat = e.target.value as "trader_manufacturer" | "restaurant" | "service_provider"
                            const rate = cat === "restaurant" ? 5 : cat === "service_provider" ? 6 : 1
                            updateGstSettings({
                              compositionCategory: cat,
                              compositionRate: rate
                            })
                          }}
                          className="w-full text-xs font-medium px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
                        >
                          <option value="trader_manufacturer">Traders / Manufacturers (1%)</option>
                          <option value="restaurant">Restaurant Service (5%)</option>
                          <option value="service_provider">Service Providers (6%)</option>
                        </select>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          Statutory rate: <strong>{gstSettings.compositionRate || 1}%</strong> on gross turnover ({((gstSettings.compositionRate || 1) / 2).toFixed(2)}% CGST + {((gstSettings.compositionRate || 1) / 2).toFixed(2)}% SGST). Customer GST is 0%, inward ITC is locked.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Enable HSN/SAC Code */}
                <div className={cn(
                  "flex items-start gap-3 transition-opacity",
                  !gstSettings.enableGst && "opacity-40 pointer-events-none select-none"
                )}>
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      disabled={!gstSettings.enableGst}
                      checked={gstSettings.enableGst && gstSettings.enableHsnSac}
                      onChange={() => updateGstSettings({ enableHsnSac: !gstSettings.enableHsnSac })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst && gstSettings.enableHsnSac
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400",
                      !gstSettings.enableGst && "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed"
                    )}>
                      {gstSettings.enableGst && gstSettings.enableHsnSac && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => gstSettings.enableGst && updateGstSettings({ enableHsnSac: !gstSettings.enableHsnSac })}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable HSN/SAC Code
                      </span>
                      <PortalTooltip text="Mandates 4, 6 or 8-digit HSN/SAC classification codes for item invoicing under GST rules." />
                    </div>
                  </div>
                </div>

                {/* 3. Enable Place of Supply */}
                <div className={cn(
                  "flex items-start gap-3 transition-opacity",
                  !gstSettings.enableGst && "opacity-40 pointer-events-none select-none"
                )}>
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      disabled={!gstSettings.enableGst}
                      checked={gstSettings.enableGst && gstSettings.enablePlaceOfSupply}
                      onChange={() => updateGstSettings({ enablePlaceOfSupply: !gstSettings.enablePlaceOfSupply })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst && gstSettings.enablePlaceOfSupply
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400",
                      !gstSettings.enableGst && "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed"
                    )}>
                      {gstSettings.enableGst && gstSettings.enablePlaceOfSupply && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => gstSettings.enableGst && updateGstSettings({ enablePlaceOfSupply: !gstSettings.enablePlaceOfSupply })}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable Place of Supply
                      </span>
                      <PortalTooltip text="Tracks customer state and location of goods for inter-state (IGST) vs intra-state (CGST + SGST) bifurcation." />
                    </div>
                  </div>
                </div>

                {/* 4. Enable Input Tax Credit (ITC) */}
                <div className={cn(
                  "flex items-start gap-3 transition-opacity",
                  !gstSettings.enableGst && "opacity-40 pointer-events-none select-none"
                )}>
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      disabled={!gstSettings.enableGst}
                      checked={gstSettings.enableGst && (gstSettings.enableItc ?? true)}
                      onChange={() => updateGstSettings({ enableItc: !(gstSettings.enableItc ?? true) })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst && (gstSettings.enableItc ?? true)
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400",
                      !gstSettings.enableGst && "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed"
                    )}>
                      {gstSettings.enableGst && (gstSettings.enableItc ?? true) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => gstSettings.enableGst && updateGstSettings({ enableItc: !(gstSettings.enableItc ?? true) })}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable Input Tax Credit (ITC)
                      </span>
                      <PortalTooltip text="Allows claiming and classifying Input Tax Credit (ITC) on inward purchase bills for GSTR-3B Table 4." />
                    </div>
                  </div>
                </div>

                {/* 5. Enable Reverse Charge Mechanism (RCM) */}
                <div className={cn(
                  "flex items-start gap-3 transition-opacity",
                  !gstSettings.enableGst && "opacity-40 pointer-events-none select-none"
                )}>
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      disabled={!gstSettings.enableGst}
                      checked={gstSettings.enableGst && (gstSettings.enableRcm ?? true)}
                      onChange={() => updateGstSettings({ enableRcm: !(gstSettings.enableRcm ?? true) })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableGst && (gstSettings.enableRcm ?? true)
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400",
                      !gstSettings.enableGst && "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed"
                    )}>
                      {gstSettings.enableGst && (gstSettings.enableRcm ?? true) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => gstSettings.enableGst && updateGstSettings({ enableRcm: !(gstSettings.enableRcm ?? true) })}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable Reverse Charge (RCM)
                      </span>
                      <PortalTooltip text="Enables Reverse Charge (RCM) applicability on inward purchases from unregistered suppliers or specified services payable directly to Govt." />
                    </div>
                  </div>
                </div>

                {/* 6. Enable TCS (Always active & independent of GST) */}
                <div className="flex items-start gap-3">
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={gstSettings.enableTcs}
                      onChange={() => updateGstSettings({ enableTcs: !gstSettings.enableTcs })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableTcs
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400"
                    )}>
                      {gstSettings.enableTcs && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => {
                          const next = !gstSettings.enableTcs
                          updateGstSettings({ enableTcs: next })
                          if (!next) setIsTcsModalOpen(false)
                        }}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable TCS
                      </span>

                      <button
                        type="button"
                        disabled={!gstSettings.enableTcs}
                        onClick={handleOpenTcsModal}
                        className={cn(
                          "text-xs font-semibold transition-colors",
                          gstSettings.enableTcs
                            ? "text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                            : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 select-none"
                        )}
                      >
                        Manage TCS Rates
                      </button>

                      <PortalTooltip text="Tax Collected at Source (Section 206C) on specified goods and sales receipts exceeding ₹50 Lakhs." />
                    </div>
                  </div>
                </div>

                {/* 5. Enable TDS (Always active & independent of GST) */}
                <div className="flex items-start gap-3">
                  <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={gstSettings.enableTds}
                      onChange={() => {
                        const next = !gstSettings.enableTds
                        updateGstSettings({ enableTds: next })
                        if (!next) setIsTdsModalOpen(false)
                      }}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      gstSettings.enableTds
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400"
                    )}>
                      {gstSettings.enableTds && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>

                  <div className="flex-1 select-none">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => {
                          const next = !gstSettings.enableTds
                          updateGstSettings({ enableTds: next })
                          if (!next) setIsTdsModalOpen(false)
                        }}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        Enable TDS
                      </span>

                      <button
                        type="button"
                        disabled={!gstSettings.enableTds}
                        onClick={handleOpenTdsModal}
                        className={cn(
                          "text-xs font-semibold transition-colors",
                          gstSettings.enableTds
                            ? "text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                            : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 select-none"
                        )}
                      >
                        Manage TDS Rates
                      </button>

                      <PortalTooltip text="Tax Deducted at Source (Section 194C, 194J, 194Q) on business expenses and purchases." />
                    </div>
                  </div>
                </div>

                {/* 6. Tax List > Button matching User's Image */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTaxList(prev => !prev)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors border shadow-2xs cursor-pointer select-none",
                      showTaxList
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                        : "text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-700"
                    )}
                  >
                    <span>Tax List</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", showTaxList && "rotate-90 text-blue-600 dark:text-blue-400")} />
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Middle Column: Tax Rates (Whole height, flat edge-to-edge list) */}
            {showTaxList && (
              <div className="flex-1 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-12">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Tax Rates
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenAddTaxRate}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Add Tax Rate"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Scrollable list filling whole remaining height */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {taxRates.map(rate => (
                    <div
                      key={rate.id}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        {rate.name}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400 tabular-nums min-w-[28px] text-right">
                          {rate.rate}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEditTaxRate(rate)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit rate"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTaxRate(rate.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete rate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Column 3: Right Column: Tax Group (Whole height, flat edge-to-edge list) */}
            {showTaxList && (
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-12">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Tax Group
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenAddTaxGroup}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Add Tax Group"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Scrollable list filling whole remaining height */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {taxGroups.map(group => (
                    <div
                      key={group.id}
                      className="px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">
                          {group.name}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEditTaxGroup(group)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit group"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTaxGroup(group.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {group.subTaxes && group.subTaxes.length > 0 && (
                        <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {group.subTaxes.map((sub, idx) => (
                            <span key={idx}>
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[200] max-w-sm flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200 text-xs">
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium flex-1">{toastMsg.message}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="p-1 hover:opacity-70 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. MODAL: Add / Edit Tax Rate */}
      {mounted && isRateModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRateModalOpen(false)
          }}
        >
          <div
            className="relative z-[10000] w-full max-w-md my-auto max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRateId ? "Edit Tax Rate" : "Add Tax Rate"}
              </h3>
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxRate} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tax Name<span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. IGST@18% or Cess@12%"
                    value={rateFormName}
                    onChange={(e) => setRateFormName(e.target.value)}
                    className="h-10 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tax Rate (%)<span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max="100"
                      placeholder="e.g. 18"
                      value={rateFormRate}
                      onChange={(e) => setRateFormRate(e.target.value)}
                      className="h-10 text-xs pr-8 border-slate-300 dark:border-slate-700 rounded-md"
                      required
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tax Type
                  </label>
                  <Select
                    value={rateFormType}
                    onValueChange={(val) => setRateFormType(val as any)}
                    className="w-full h-10 text-xs"
                    options={[
                      { value: "igst", label: "IGST - Integrated Goods & Service Tax" },
                      { value: "cgst", label: "CGST - Central GST" },
                      { value: "sgst", label: "SGST - State GST" },
                      { value: "cess", label: "CESS - GST Compensation Cess" },
                      { value: "gst", label: "GST - General Rate" },
                    ]}
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRateModalOpen(false)}
                  className="h-8 px-4 text-xs font-semibold rounded-md border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shadow-xs"
                >
                  Save Tax Rate
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 3.1 MODAL: Add / Edit Tax Group */}
      {mounted && isGroupModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGroupModalOpen(false)
          }}
        >
          <div
            className="relative z-[10000] w-full max-w-lg my-auto max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingGroupId ? "Edit Tax Group" : "Add Tax Group"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Combine intra-state taxes (CGST + SGST) or special cess under one GST slab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxGroup} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Group Name<span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. GST@18%"
                      value={groupFormName}
                      onChange={(e) => setGroupFormName(e.target.value)}
                      className="h-10 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Total Group Rate (%)<span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        max="100"
                        placeholder="e.g. 18"
                        value={groupFormRate}
                        onChange={(e) => setGroupFormRate(e.target.value)}
                        className="h-10 text-xs pr-8 border-slate-300 dark:border-slate-700 rounded-md"
                        required
                      />
                      <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Component Taxes:
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {groupFormSubTaxes.length} selected
                    </span>
                  </div>
                  <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg max-h-56 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30">
                    {taxRates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No tax rates available. Please add tax rates first.
                      </div>
                    ) : (
                      taxRates.map(r => {
                        const isChecked = groupFormSubTaxes.includes(r.name)
                        return (
                          <div
                            key={r.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleSubTax(r.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleToggleSubTax(r.name)
                              }
                            }}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs select-none border",
                              isChecked
                                ? "bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200 font-semibold"
                                : "hover:bg-slate-100/70 border-transparent dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                isChecked
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                              )}>
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <span>{r.name}</span>
                            </div>
                            <span className="tabular-nums font-mono text-slate-500 dark:text-slate-400">
                              {r.rate}%
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {groupFormSubTaxes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      <span className="text-[11px] text-slate-500 font-medium">Included:</span>
                      {groupFormSubTaxes.map((sub, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3.5 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="h-8 px-4 text-xs font-semibold rounded-md border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shadow-xs"
                >
                  Save Tax Group
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. MODAL: Manage TCS Rates (matching Image 2 & 3) */}
      {mounted && isTcsModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTcsModalOpen(false)
          }}
        >
          <div
            className="relative z-[10000] w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {tcsView === "list" ? (
              /* VIEW 1: TCS TABLE LIST (Image 2) */
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage TCS Rates
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddTcs}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-xs cursor-pointer select-none"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Add TCS Rate</span>
                    </button>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      type="button"
                      onClick={() => setIsTcsModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-6 min-w-[300px]">
                          TAX NAME
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 text-center w-28">
                          RATE(%)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 w-44">
                          SECTION
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 w-36">
                          COLLECTION CODE
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-6 text-right w-28">
                          ACTIONS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tcsRates.map(r => (
                        <TableRow key={r.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100 py-3.5 px-6">
                            {r.name}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums py-3.5 px-4 text-center">
                            {r.rate}%
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 py-3.5 px-4">
                            {r.section}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 py-3.5 px-4">
                            {r.collectionCode || "—"}
                          </TableCell>
                          <TableCell className="text-right py-3.5 px-6">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleDeleteTcs(r.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditTcs(r)}
                                className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              /* VIEW 2: ADD / EDIT TCS RATE (3 Form Inputs matching Image 3) */
              <form onSubmit={handleSaveTcs} className="flex-1 flex flex-col justify-between overflow-auto">
                <div>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTcsView("list")}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Back to list"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {editingTcsId ? "Edit TCS Rate" : "Add TCS Rate"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTcsModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Row 1: Section* (Select) and Tax Name* (Input) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Section<span className="text-rose-500">*</span>
                        </label>
                        <Select
                          value={tcsFormSection}
                          onValueChange={setTcsFormSection}
                          placeholder="Select Section"
                          className="w-full h-10 text-xs"
                          options={[
                            { value: "206C(1H)", label: "206C(1H) - Sale of Goods exceeding ₹50 Lakhs" },
                            { value: "206C(1)", label: "206C(1) - Alcoholic Liquor / Forest Produce / Scrap" },
                            { value: "206C(1C)", label: "206C(1C) - Parking lot, Toll Plaza, Mine or Quarry" },
                            { value: "206C(1F)", label: "206C(1F) - Motor vehicle sale exceeding ₹10 Lakhs" },
                            { value: "206C(1G)", label: "206C(1G) - Remittance under LRS / Overseas Tour" },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tax Name<span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="Sale of goods exceeding ₹50 Lakhs"
                          value={tcsFormName}
                          onChange={(e) => setTcsFormName(e.target.value)}
                          className="h-10 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: TCS Rate* (Input with % symbol on right) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          TCS Rate<span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="E.g 0.1"
                            value={tcsFormRate}
                            onChange={(e) => setTcsFormRate(e.target.value)}
                            className="h-10 text-xs pr-8 border-slate-300 dark:border-slate-700 rounded-md"
                            required
                          />
                          <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer matching Image 3 */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80 shrink-0">
                  <a
                    href="https://incometaxindia.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    <span>View standard TCS rates listed by the Govt. of India</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTcsView("list")}
                      className="h-8 px-4 text-xs font-semibold rounded-md border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shadow-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 5. MODAL: Manage TDS Rates (matching Image 2 & 3) */}
      {mounted && isTdsModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTdsModalOpen(false)
          }}
        >
          <div
            className="relative z-[10000] w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {tdsView === "list" ? (
              /* VIEW 1: TDS TABLE LIST (Image 2) */
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage TDS Rates
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddTds}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-xs cursor-pointer select-none"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Add TDS Rate</span>
                    </button>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      type="button"
                      onClick={() => setIsTdsModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-6 min-w-[300px]">
                          TAX NAME
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 text-center w-28">
                          RATE(%)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 w-44">
                          SECTION
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-4 w-36">
                          COLLECTION CODE
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-3.5 px-6 text-right w-28">
                          ACTIONS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tdsRates.map(r => (
                        <TableRow key={r.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100 py-3.5 px-6">
                            {r.name}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums py-3.5 px-4 text-center">
                            {r.rate}%
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 py-3.5 px-4">
                            {r.section}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 py-3.5 px-4">
                            {r.collectionCode || "—"}
                          </TableCell>
                          <TableCell className="text-right py-3.5 px-6">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleDeleteTds(r.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditTds(r)}
                                className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              /* VIEW 2: ADD / EDIT TDS RATE (3 Form Inputs matching Image 3) */
              <form onSubmit={handleSaveTds} className="flex-1 flex flex-col justify-between overflow-auto">
                <div>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTdsView("list")}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Back to list"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {editingTdsId ? "Edit TDS Rate" : "Add TDS Rate"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTdsModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Row 1: Section* (Select) and Tax Name* (Input) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Section<span className="text-rose-500">*</span>
                        </label>
                        <Select
                          value={tdsFormSection}
                          onValueChange={setTdsFormSection}
                          placeholder="Select Section"
                          className="w-full h-10 text-xs"
                          options={[
                            { value: "192", label: "192 - Payment of salary" },
                            { value: "194A", label: "194A - Interest other than securities" },
                            { value: "194C", label: "194C - Payment to contractors" },
                            { value: "194H", label: "194H - Commission or brokerage" },
                            { value: "194I", label: "194I - Rent on land, building or furniture" },
                            { value: "194J", label: "194J - Fees for professional or technical services" },
                            { value: "194Q", label: "194Q - Purchase of goods exceeding ₹50 Lakhs" },
                            { value: "195", label: "195 - Other sums to non-residents" },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tax Name<span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="Payment of salary"
                          value={tdsFormName}
                          onChange={(e) => setTdsFormName(e.target.value)}
                          className="h-10 text-xs border-slate-300 dark:border-slate-700 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: TDS Rate* (Input with % symbol on right) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          TDS Rate<span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="E.g 10"
                            value={tdsFormRate}
                            onChange={(e) => setTdsFormRate(e.target.value)}
                            className="h-10 text-xs pr-8 border-slate-300 dark:border-slate-700 rounded-md"
                            required
                          />
                          <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer matching Image 3 */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80 shrink-0">
                  <a
                    href="https://incometaxindia.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    <span>View standard TDS rates listed by the Govt. of India</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTdsView("list")}
                      className="h-8 px-4 text-xs font-semibold rounded-md border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shadow-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

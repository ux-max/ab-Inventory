"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table"
import { 
  Coins, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  AlertCircle, 
  ArrowLeftRight, 
  Info,
  DollarSign,
  Search,
  Lock
} from "lucide-react"
import { CurrencyItem } from "@/types/inventory"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

const POPULAR_CURRENCIES = [
  { code: "USD", name: "United States Dollar", symbol: "$", defaultRate: 83.50 },
  { code: "EUR", name: "Euro", symbol: "€", defaultRate: 90.25 },
  { code: "AED", name: "UAE Dirham", symbol: "AED", defaultRate: 22.74 },
  { code: "GBP", name: "British Pound", symbol: "£", defaultRate: 106.10 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", defaultRate: 62.40 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", defaultRate: 22.25 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", defaultRate: 61.30 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", defaultRate: 54.80 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", defaultRate: 0.55 },
]

export function MultiCurrencySettings() {
  const { currencies, addCurrency, updateCurrency, deleteCurrency } = useApp()

  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null)

  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [exchangeRate, setExchangeRate] = useState<number | string>(1)
  const [isActive, setIsActive] = useState(true)
  const [validationError, setValidationError] = useState("")

  const openAddModal = () => {
    setEditingCurrencyId(null)
    setCode("")
    setName("")
    setSymbol("")
    setExchangeRate(1)
    setIsActive(true)
    setValidationError("")
    setIsModalOpen(true)
  }

  const openEditModal = (curr: CurrencyItem) => {
    setEditingCurrencyId(curr.id)
    setCode(curr.code)
    setName(curr.name)
    setSymbol(curr.symbol)
    setExchangeRate(curr.exchangeRate)
    setIsActive(curr.isActive)
    setValidationError("")
    setIsModalOpen(true)
  }

  const handleSelectPopular = (pop: typeof POPULAR_CURRENCIES[0]) => {
    setCode(pop.code)
    setName(pop.name)
    setSymbol(pop.symbol)
    setExchangeRate(pop.defaultRate)
  }

  const handleSave = () => {
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    const rate = typeof exchangeRate === "number" ? exchangeRate : parseFloat(String(exchangeRate))

    if (!trimmedCode || !trimmedName) {
      setValidationError("Please enter both currency code and name.")
      return
    }

    if (isNaN(rate) || rate <= 0) {
      setValidationError("Please enter a valid exchange rate greater than 0.")
      return
    }

    if (editingCurrencyId) {
      updateCurrency(editingCurrencyId, {
        code: trimmedCode,
        name: trimmedName,
        symbol: symbol.trim() || trimmedCode,
        exchangeRate: rate,
        isActive,
      })
    } else {
      if (currencies.some((c) => c.code.toUpperCase() === trimmedCode)) {
        setValidationError(`Currency code "${trimmedCode}" already exists.`)
        return
      }

      addCurrency({
        code: trimmedCode,
        name: trimmedName,
        symbol: symbol.trim() || trimmedCode,
        exchangeRate: rate,
        isBase: false,
        isActive,
      })
    }

    setIsModalOpen(false)
  }

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="max-w-5xl mx-auto space-y-5">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Multi-Currency Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure base currency (INR) and foreign currencies for international export sales and import purchase bills.
            </p>
          </div>

          <Button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs text-xs font-semibold h-9 px-4 rounded-md"
          >
            <Plus className="h-4 w-4" /> Add Foreign Currency
          </Button>
        </div>

        {/* Informational Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-xs">Indian Rupee (INR) is locked as your Base Accounting Currency.</span>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
              Exchange rates represent the conversion value in INR (e.g., 1 USD = 83.50 INR). When creating export invoices in foreign currency, reports automatically convert amounts back to INR for GST returns.
            </p>
          </div>
        </div>

        {/* Currency List Table Container matching all other pages */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          
          {/* Card Filter & Control Bar */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Configured Currencies
              </h2>
              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                {currencies.length}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search currencies..."
                  className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                Base: <strong className="text-slate-900 dark:text-white">INR (₹)</strong>
              </span>
            </div>
          </div>

          {/* Standard Data Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  CURRENCY
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  CODE
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  SYMBOL
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  EXCHANGE RATE (1 UNIT)
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                  STATUS
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                      No currencies found matching &quot;{searchQuery}&quot;
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-2"
                    >
                      Clear Search
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCurrencies.map((curr) => (
                  <TableRow
                    key={curr.id}
                    className="border-b border-slate-100 dark:border-slate-800/80 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    {/* Currency Name & Base Badge */}
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {curr.name}
                        </span>
                        {curr.isBase && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 font-semibold rounded-md">
                            Base
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* ISO Code */}
                    <TableCell className="px-4 py-3.5 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {curr.code}
                    </TableCell>

                    {/* Symbol */}
                    <TableCell className="px-4 py-3.5">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {curr.symbol}
                      </span>
                    </TableCell>

                    {/* Exchange Rate in INR */}
                    <TableCell className="px-4 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {curr.isBase ? (
                        <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">
                          1.00 INR
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-slate-900 dark:text-white font-semibold">
                            {Number(curr.exchangeRate).toFixed(2)}
                          </span>
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                            INR
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-4 py-3.5 text-center">
                      {curr.isBase ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 inline-flex items-center gap-1"
                        >
                          <Lock className="h-3 w-3" /> Active (Locked)
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={curr.isActive}
                            onCheckedChange={(val) => updateCurrency(curr.id, { isActive: val })}
                          />
                          <span className={`text-xs font-medium ${curr.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {curr.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-4 py-3.5 text-right">
                      {curr.isBase ? (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic font-medium pr-2">
                          Base Locked
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(curr)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Edit Currency"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${curr.name} (${curr.code})?`)) {
                                deleteCurrency(curr.id)
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete Currency"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Currency Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="p-6 space-y-4 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {editingCurrencyId ? "Edit Currency Details" : "Add Foreign Currency"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Configure international currency code and exchange rate against Indian Rupee (INR).
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          {!editingCurrencyId && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Select Popular Currencies:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CURRENCIES.map((pop) => (
                  <button
                    key={pop.code}
                    type="button"
                    onClick={() => handleSelectPopular(pop)}
                    className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {pop.code} ({pop.symbol})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Code (ISO) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. USD, EUR, AED"
                maxLength={4}
                className="font-mono uppercase text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. US Dollar"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. $, €, AED"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rate in INR (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="83.50"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active in Transactions
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {editingCurrencyId ? "Update Currency" : "Save Currency"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}

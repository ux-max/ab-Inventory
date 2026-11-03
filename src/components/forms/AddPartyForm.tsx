"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { 
  Save, 
  X, 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  CreditCard,
  HelpCircle,
  ChevronDown,
  CheckCircle2
} from "lucide-react"

interface AddPartyFormProps {
  partyType?: "customer" | "supplier"
  initialParty?: any
  onSave: (partyData: any) => void
  onCancel: () => void
}

const STATE_CODE_MAP: Record<string, string> = {
  "Maharashtra": "27",
  "Gujarat": "24",
  "Karnataka": "29",
  "Delhi": "07",
  "Tamil Nadu": "33",
  "Telangana": "36",
  "Uttar Pradesh": "09",
  "Rajasthan": "08",
  "West Bengal": "19",
  "Haryana": "06",
  "Madhya Pradesh": "23",
  "Punjab": "03",
  "Andhra Pradesh": "37",
  "Kerala": "32",
}

const GST_PREFIX_TO_STATE: Record<string, string> = {
  "27": "Maharashtra",
  "24": "Gujarat",
  "29": "Karnataka",
  "07": "Delhi",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "09": "Uttar Pradesh",
  "08": "Rajasthan",
  "19": "West Bengal",
  "06": "Haryana",
  "23": "Madhya Pradesh",
  "03": "Punjab",
  "37": "Andhra Pradesh",
  "32": "Kerala",
}

export function AddPartyForm({ partyType = "customer", initialParty, onSave, onCancel }: AddPartyFormProps) {
  const { business, currencies, gstSettings } = useApp()
  const isPlaceOfSupplyEnabled = Boolean(gstSettings?.enableGst && gstSettings?.enablePlaceOfSupply)
  const isEditing = Boolean(initialParty && initialParty.id)

  const [roleType, setRoleType] = useState<"customer" | "supplier">(
    initialParty?.type === "supplier" ? "supplier" : (partyType === "supplier" ? "supplier" : "customer")
  )
  const [customerType, setCustomerType] = useState<"business" | "individual">(() => {
    if (initialParty?.customerType) return initialParty.customerType
    if (initialParty?.gstTreatment === "Consumer") return "individual"
    return "business"
  })
  const [salutation, setSalutation] = useState(initialParty?.salutation || "Mr.")
  const [firstName, setFirstName] = useState(initialParty?.firstName || "")
  const [lastName, setLastName] = useState(initialParty?.lastName || "")
  const [companyName, setCompanyName] = useState(
    initialParty?.companyName || (initialParty?.customerType === "individual" ? "" : initialParty?.name || "")
  )
  const [displayName, setDisplayName] = useState(initialParty?.name || "")
  const [email, setEmail] = useState(initialParty?.email || "")
  const [phone, setPhone] = useState(initialParty?.phone || "")
  const [mobile, setMobile] = useState(initialParty?.mobile || "")

  // Tax Details
  const [gstTreatment, setGstTreatment] = useState(
    initialParty?.gstTreatment && initialParty.gstTreatment !== "Overseas / Export"
      ? initialParty.gstTreatment
      : (initialParty?.gstin ? "Registered Business - Regular" : (initialParty?.customerType === "individual" ? "Consumer" : "Registered Business - Regular"))
  )
  const [gstin, setGstin] = useState(initialParty?.gstin || "")
  const [state, setState] = useState(initialParty?.state || business.state || "Gujarat")
  const [pan, setPan] = useState(initialParty?.pan || "")

  // Address Details
  const [billingAddress, setBillingAddress] = useState({
    street: initialParty?.billingAddress?.street || initialParty?.address || "",
    city: initialParty?.billingAddress?.city || "Ahmedabad",
    state: initialParty?.billingAddress?.state || initialParty?.state || business.state || "Gujarat",
    pincode: initialParty?.billingAddress?.pincode || ""
  })

  // Currency Selection
  const [currency, setCurrency] = useState(initialParty?.currency || "INR")
  const [currencySymbol, setCurrencySymbol] = useState(initialParty?.currencySymbol || "₹")

  // Financials
  const [openingBalance, setOpeningBalance] = useState<number | string>(() => {
    if (initialParty?.openingBalance !== undefined) return initialParty.openingBalance
    if (initialParty?.balance !== undefined) return Math.abs(initialParty.balance)
    return 0
  })

  const [openingBalanceType, setOpeningBalanceType] = useState<"debit" | "credit">(() => {
    if (initialParty?.openingBalanceType) return initialParty.openingBalanceType
    if (initialParty) {
      if (initialParty.type === "supplier") {
        return initialParty.balance > 0 ? "debit" : "credit"
      } else {
        return initialParty.balance < 0 ? "credit" : "debit"
      }
    }
    return partyType === "supplier" ? "credit" : "debit"
  })

  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>(() => {
    return initialParty?.openingBalanceDate || new Date().toISOString().split("T")[0]
  })

  const [creditLimit, setCreditLimit] = useState<number | string>(initialParty?.creditLimit ?? 100000)
  const [paymentTerms, setPaymentTerms] = useState(initialParty?.paymentTerms || "Net 30")

  const [errorMsg, setErrorMsg] = useState("")

  // Sync if initialParty changes
  useEffect(() => {
    if (initialParty) {
      setRoleType(initialParty.type === "supplier" ? "supplier" : "customer")
      const detType = initialParty.customerType || (initialParty.gstTreatment === "Consumer" ? "individual" : "business")
      setCustomerType(detType)
      setSalutation(initialParty.salutation || "Mr.")
      setFirstName(initialParty.firstName || "")
      setLastName(initialParty.lastName || "")
      setCompanyName(initialParty.companyName || (detType === "individual" ? "" : initialParty.name || ""))
      setDisplayName(initialParty.name || "")
      setEmail(initialParty.email || "")
      setPhone(initialParty.phone || "")
      setMobile(initialParty.mobile || "")
      const treatment = initialParty.gstTreatment && initialParty.gstTreatment !== "Overseas / Export"
        ? initialParty.gstTreatment
        : (initialParty.gstin ? "Registered Business - Regular" : (detType === "individual" ? "Consumer" : "Registered Business - Regular"))
      setGstTreatment(treatment)
      setGstin(initialParty.gstin || "")
      setState(initialParty.state || business.state || "Gujarat")
      setPan(initialParty.pan || "")
      setBillingAddress({
        street: initialParty.billingAddress?.street || initialParty.address || "",
        city: initialParty.billingAddress?.city || "Ahmedabad",
        state: initialParty.billingAddress?.state || initialParty.state || business.state || "Gujarat",
        pincode: initialParty.billingAddress?.pincode || ""
      })
      setCurrency(initialParty.currency || "INR")
      setCurrencySymbol(initialParty.currencySymbol || "₹")
      setOpeningBalance(
        initialParty.openingBalance !== undefined 
          ? initialParty.openingBalance 
          : initialParty.balance !== undefined 
          ? Math.abs(initialParty.balance) 
          : 0
      )
      setOpeningBalanceType(
        initialParty.openingBalanceType || 
        (initialParty.type === "supplier" 
          ? (initialParty.balance > 0 ? "debit" : "credit") 
          : (initialParty.balance < 0 ? "credit" : "debit"))
      )
      setOpeningBalanceDate(initialParty.openingBalanceDate || new Date().toISOString().split("T")[0])
      setCreditLimit(initialParty.creditLimit ?? 100000)
      setPaymentTerms(initialParty.paymentTerms || "Net 30")
    }
  }, [initialParty, business.state])

  // Linking: Classification (Business vs Individual) -> GST Treatment
  const handleClassificationChange = (type: "business" | "individual") => {
    setCustomerType(type)
    if (type === "individual") {
      setGstTreatment("Consumer")
    } else {
      if (gstTreatment === "Consumer") {
        setGstTreatment("Registered Business - Regular")
      }
    }
  }

  // Linking: GST Treatment -> Classification
  const handleGstTreatmentChange = (val: string) => {
    setGstTreatment(val)
    if (val === "Consumer") {
      setCustomerType("individual")
    } else {
      setCustomerType("business")
    }
  }

  // Auto detect state & PAN from GSTIN
  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim()
    setGstin(upper)

    // Auto detect State from first 2 digits
    if (upper.length >= 2) {
      const code = upper.substring(0, 2)
      if (GST_PREFIX_TO_STATE[code]) {
        setState(GST_PREFIX_TO_STATE[code])
        setBillingAddress(prev => ({ ...prev, state: GST_PREFIX_TO_STATE[code] }))
      }
    }

    // Auto extract PAN (10 chars from 3rd position)
    if (upper.length >= 12) {
      const extractedPan = upper.substring(2, 12)
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan)) {
        setPan(extractedPan)
      }
    }
  }

  const availableCurrencies = (currencies && currencies.length > 0)
    ? currencies.filter(c => c.isActive !== false)
    : [
        { id: "c-inr", code: "INR", name: "Indian Rupee", symbol: "₹" },
        { id: "c-usd", code: "USD", name: "US Dollar", symbol: "$" },
        { id: "c-eur", code: "EUR", name: "Euro", symbol: "€" },
        { id: "c-aed", code: "AED", name: "UAE Dirham", symbol: "د.إ" },
        { id: "c-gbp", code: "GBP", name: "British Pound", symbol: "£" }
      ]

  const handleNameChange = (val: string) => {
    setFirstName(val)
    if (!displayName || displayName === firstName) {
      setDisplayName(val)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const finalName = displayName.trim() || companyName.trim() || `${firstName} ${lastName}`.trim()
    if (!finalName) {
      setErrorMsg("Display Name or Company Name is mandatory.")
      return
    }

    const cleanPhone = phone.trim() || mobile.trim()

    // Formatted Address String
    const addressParts = [
      billingAddress.street.trim(),
      billingAddress.city.trim(),
      (billingAddress.state || state).trim()
    ].filter(Boolean)
    const formattedAddress = addressParts.join(", ") + (billingAddress.pincode.trim() ? ` - ${billingAddress.pincode.trim()}` : "")

    const stateCode = STATE_CODE_MAP[state] || (state === "Maharashtra" ? "27" : state === "Gujarat" ? "24" : "29")

      const numOpening = Number(openingBalance) || 0
      const netBalance = openingBalanceType === "debit" ? Math.abs(numOpening) : -Math.abs(numOpening)

      const payload = {
        ...(initialParty?.id ? { id: initialParty.id } : {}),
        name: finalName,
        type: roleType,
        customerType,
        salutation,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        phone: cleanPhone,
        mobile: mobile.trim(),
        email: email.trim(),
        gstTreatment,
        gstin: (gstTreatment === "Consumer" || gstTreatment === "Unregistered Business") ? "" : gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        state: state || "Gujarat",
        stateCode,
        address: formattedAddress || billingAddress.street || "",
        billingAddress: {
          street: billingAddress.street.trim(),
          city: billingAddress.city.trim(),
          state: billingAddress.state || state || "Gujarat",
          pincode: billingAddress.pincode.trim()
        },
        openingBalance: Math.abs(numOpening),
        openingBalanceType,
        openingBalanceDate,
        balance: netBalance,
        creditLimit: Number(creditLimit) || 100000,
        paymentTerms,
        currency,
        currencySymbol,
        specialPrices: initialParty?.specialPrices || {}
      }

    onSave(payload)
  }

  const titleText = isEditing
    ? (roleType === "supplier" ? `Edit Vendor: ${initialParty.name}` : `Edit Customer: ${initialParty.name}`)
    : (roleType === "supplier" ? "New Vendor" : "New Customer")

  const submitButtonLabel = isEditing
    ? (roleType === "supplier" ? "Update Vendor" : "Update Customer")
    : (roleType === "supplier" ? "Save Vendor" : "Save Customer")

  const isConsumer = gstTreatment === "Consumer" || customerType === "individual"

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Form Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {titleText}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit()}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{submitButtonLabel}</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">
        
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: Party Type & Classification */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-8 text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
            {/* Party Role */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Party Role:
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="roleType"
                  value="customer"
                  checked={roleType === "customer"}
                  onChange={() => setRoleType("customer")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Customer</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="roleType"
                  value="supplier"
                  checked={roleType === "supplier"}
                  onChange={() => setRoleType("supplier")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Vendor (Supplier)</span>
              </label>
            </div>

            {/* Business vs Individual (Linked to GST Treatment) */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Classification:
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="customerType"
                  value="business"
                  checked={customerType === "business"}
                  onChange={() => handleClassificationChange("business")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Business (GST Registered)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="customerType"
                  value="individual"
                  checked={customerType === "individual"}
                  onChange={() => handleClassificationChange("individual")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Individual / Consumer</span>
              </label>
            </div>
          </div>

          {/* Primary Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Contact
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <Select
                      value={salutation}
                      onValueChange={(val) => setSalutation(val)}
                      className="w-full h-9 text-xs"
                      options={[
                        { value: "Mr.", label: "Mr." },
                        { value: "Mrs.", label: "Mrs." },
                        { value: "Ms.", label: "Ms." },
                        { value: "Dr.", label: "Dr." },
                      ]}
                    />
                  </div>
                  <Input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="col-span-5 h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                  <Input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="col-span-4 h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Apex Pharma Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                    Display Name*
                  </label>
                  <Input
                    type="text"
                    placeholder="Displayed on invoices"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="billing@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Work Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 79 2658 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Box on Right (4 cols) */}
            <div className="md:col-span-4 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                Statutory & Currency
              </span>
              <div>
                <label className="text-slate-500 text-xs block mb-1">
                  Billing Currency:
                </label>
                <Select
                  value={currency}
                  onValueChange={(val) => {
                    setCurrency(val)
                    const found = availableCurrencies.find(c => c.code === val)
                    if (found) setCurrencySymbol(found.symbol)
                  }}
                  size="sm"
                  className="w-full h-8 text-xs font-semibold"
                  options={availableCurrencies.map(c => ({
                    value: c.code,
                    label: `${c.code} - ${c.name} (${c.symbol})`
                  }))}
                />
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-1">Payment Terms:</span>
                <Select
                  value={paymentTerms}
                  onValueChange={(val) => setPaymentTerms(val)}
                  size="sm"
                  className="w-full h-8 text-xs"
                  options={[
                    { value: "Due on Receipt", label: "Due on Receipt" },
                    { value: "Net 15", label: "Net 15" },
                    { value: "Net 30", label: "Net 30" },
                    { value: "Net 60", label: "Net 60" },
                  ]}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Horizontal Divider */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* SECTION 2: GST & Statutory Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              GST & Tax Information
            </h2>
            {isConsumer && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Linked to Consumer (B2C)
              </span>
            )}
          </div>

          <div className={`grid grid-cols-1 ${isPlaceOfSupplyEnabled ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6`}>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                GST Treatment
              </label>
              <Select
                value={gstTreatment}
                onValueChange={handleGstTreatmentChange}
                className="w-full h-9 text-xs"
                options={[
                  { value: "Registered Business - Regular", label: "Registered Business - Regular" },
                  { value: "Registered Business - Composition", label: "Registered Business - Composition" },
                  { value: "Unregistered Business", label: "Unregistered Business" },
                  { value: "Consumer", label: "Consumer (Individual / B2C)" },
                ]}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  GSTIN Number {!isConsumer && gstTreatment === "Registered Business - Regular" && <span className="text-rose-500">*</span>}
                </label>
                {isConsumer && (
                  <span className="text-[10px] text-slate-400 italic">Not applicable</span>
                )}
              </div>
              <Input
                type="text"
                placeholder={
                  isConsumer 
                    ? "Not applicable for consumer" 
                    : gstTreatment === "Unregistered Business"
                    ? "Optional / Unregistered" 
                    : "e.g. 24AABCA1234F1Z5"
                }
                value={isConsumer ? "" : gstin}
                disabled={isConsumer}
                onChange={(e) => handleGstinChange(e.target.value)}
                className={`h-9 text-xs font-semibold uppercase tracking-wider tabular-nums border-slate-300 dark:border-slate-700 ${
                  isConsumer ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                PAN Number
              </label>
              <Input
                type="text"
                placeholder="e.g. AABCA1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                className="h-9 text-xs font-semibold uppercase tracking-wider tabular-nums border-slate-300 dark:border-slate-700"
              />
            </div>

            {isPlaceOfSupplyEnabled && (
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                  Place of Supply (State)*
                </label>
                <Select
                  searchable
                  searchPlaceholder="Search state or code..."
                  value={state}
                  onValueChange={(val) => {
                    setState(val)
                    setBillingAddress(prev => ({ ...prev, state: val }))
                  }}
                  className="w-full h-9 text-xs font-medium"
                  options={[
                    { value: "Maharashtra", label: "Maharashtra", description: "State Code: 27" },
                    { value: "Gujarat", label: "Gujarat", description: "State Code: 24" },
                    { value: "Karnataka", label: "Karnataka", description: "State Code: 29" },
                    { value: "Delhi", label: "Delhi", description: "State Code: 07" },
                    { value: "Tamil Nadu", label: "Tamil Nadu", description: "State Code: 33" },
                    { value: "Telangana", label: "Telangana", description: "State Code: 36" },
                    { value: "Uttar Pradesh", label: "Uttar Pradesh", description: "State Code: 09" },
                    { value: "Rajasthan", label: "Rajasthan", description: "State Code: 08" },
                    { value: "West Bengal", label: "West Bengal", description: "State Code: 19" },
                    { value: "Haryana", label: "Haryana", description: "State Code: 06" },
                    { value: "Madhya Pradesh", label: "Madhya Pradesh", description: "State Code: 23" },
                    { value: "Punjab", label: "Punjab", description: "State Code: 03" },
                    { value: "Andhra Pradesh", label: "Andhra Pradesh", description: "State Code: 37" },
                    { value: "Kerala", label: "Kerala", description: "State Code: 32" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Divider */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* SECTION 3: Address & Financial Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Address */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Billing Address
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Street Address
              </label>
              <textarea
                rows={2}
                placeholder="Shop/Office No., Building, Street"
                value={billingAddress.street}
                onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <Input
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Pincode
                </label>
                <Input
                  placeholder="380009"
                  value={billingAddress.pincode}
                  onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                  className="h-8 text-xs font-medium tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Opening Balance & Credit Terms
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-2">
                Opening Balance
              </label>

              {/* Simple Debit / Credit Radio Buttons */}
              <div className="flex items-center gap-6 mb-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="openingBalanceType"
                    value="debit"
                    checked={openingBalanceType === "debit"}
                    onChange={() => setOpeningBalanceType("debit")}
                    className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span>Debit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="openingBalanceType"
                    value="credit"
                    checked={openingBalanceType === "credit"}
                    onChange={() => setOpeningBalanceType("credit")}
                    className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span>Credit</span>
                </label>
              </div>

              {/* Amount input with Currency on Left and Dynamic Indicator on Right */}
              <div className="relative flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden mb-2.5">
                <span className="pl-3 pr-1 text-slate-400 dark:text-slate-500 text-xs font-medium select-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={openingBalanceType === "debit" ? "Enter Debit Amount" : "Enter Credit Amount"}
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-medium tabular-nums"
                />
                <div className="pr-3 pl-2 shrink-0 select-none">
                  {roleType === "customer" ? (
                    openingBalanceType === "debit" ? (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-500">
                        Customer pays you {currencySymbol}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                        You pay the Customer {currencySymbol}
                      </span>
                    )
                  ) : (
                    openingBalanceType === "debit" ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                        Vendor pays you {currencySymbol}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-500">
                        You pay the Vendor {currencySymbol}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* As of Date */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  As of Date:
                </label>
                <input
                  type="date"
                  value={openingBalanceDate}
                  onChange={(e) => setOpeningBalanceDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Credit Limit ({currencySymbol})
              </label>
              <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

        </div>
        </div>

      </form>
    </div>
  )
}

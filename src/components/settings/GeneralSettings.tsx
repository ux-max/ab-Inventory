"use client"

import React, { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { 
  Building2, 
  UploadCloud, 
  Trash2, 
  Check, 
  FileCheck2, 
  Save, 
  Image as ImageIcon,
  PenTool,
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Chandigarh", "Puducherry", "Goa"
]

export function GeneralSettings() {
  const { business, updateBusiness } = useApp()
  const [formData, setFormData] = useState({ ...business })
  const [savedSuccess, setSavedSuccess] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const signInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string
      setFormData((prev) => ({ ...prev, logoUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string
      setFormData((prev) => ({ ...prev, signatureUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: "" }))
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  const handleRemoveSign = () => {
    setFormData((prev) => ({ ...prev, signatureUrl: "" }))
    if (signInputRef.current) signInputRef.current.value = ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBusiness(formData)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Company & General Details
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your business profile, legal identifiers, branding logo, signature, and bank accounts.
            </p>
          </div>

          {savedSuccess && (
            <Badge variant="default" className="bg-emerald-600 text-white text-xs gap-1.5 py-1 px-2.5">
              <Check className="h-3.5 w-3.5" /> Saved Successfully!
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Business Identity & Legal Details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              Company Legal Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Trade Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Apex Bio-Tech Ltd."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (Goods and Services Tax ID)
                </label>
                <Input
                  value={formData.gstin || ""}
                  onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCA1234F1Z5"
                  maxLength={15}
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permanent Account Number (PAN)
                </label>
                <Input
                  value={formData.pan || ""}
                  onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                  placeholder="e.g. AABCA1234F"
                  maxLength={10}
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website / Online Store
                </label>
                <Input
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="e.g. https://apexbiotech.in"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="e.g. billing@apexbiotech.in"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Registered Business Address */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <FileCheck2 className="h-4 w-4 text-slate-400" />
              Registered Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address Line / Building / Industrial Area
                </label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="e.g. Plot No 42, GIDC Industrial Estate, Sector 12"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g. Mumbai"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  State / Union Territory
                </label>
                <Select
                  value={formData.state || "Maharashtra"}
                  onValueChange={(val) => handleInputChange("state", val)}
                  options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIN Code
                </label>
                <Input
                  value={formData.pincode || ""}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  placeholder="e.g. 400001"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Brand Assets (Logo & Signature) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              Logo & Authorized Signature
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Logo */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Company Brand Logo (Prints on Top of Invoices)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/20 min-h-[140px]">
                  {formData.logoUrl ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="max-h-24 max-w-48 p-2 bg-white rounded border border-slate-200 flex items-center justify-center shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.logoUrl} 
                          alt="Logo Preview" 
                          className="max-h-20 object-contain" 
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-xs h-7 gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        PNG, JPG, or SVG up to 2MB
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs h-7 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      >
                        Upload Brand Logo
                      </Button>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Authorized Signature */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Authorized Signatory / Stamp (Prints at Bottom)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/20 min-h-[140px]">
                  {formData.signatureUrl ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="max-h-24 max-w-48 p-2 bg-white rounded border border-slate-200 flex items-center justify-center shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.signatureUrl} 
                          alt="Signature Preview" 
                          className="max-h-20 object-contain" 
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSign}
                        className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-xs h-7 gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove Signature
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <PenTool className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Transparent PNG recommended
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => signInputRef.current?.click()}
                        className="text-xs h-7 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      >
                        Upload Signature
                      </Button>
                    </div>
                  )}
                  <input
                    ref={signInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 shadow-md"
            >
              <Save className="h-4 w-4" /> Save Business Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

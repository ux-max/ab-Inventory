"use client"

import React, { useState, useRef, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserCircle, 
  UploadCloud, 
  Trash2, 
  Check, 
  Save, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Briefcase, 
  User, 
  Camera
} from "lucide-react"

export function UserInfoSettings() {
  const { teamUsers, updateTeamUser, currentRole, roles } = useApp()

  // Target current user (Admin / Owner by default, or persona matching current role)
  const activeUser = teamUsers.find((u) => u.roleId === currentRole) || teamUsers[0]

  const [formData, setFormData] = useState({
    name: activeUser?.name || "Rajesh Sharma",
    phone: activeUser?.phone || "9820011001",
    email: activeUser?.email || "rajesh@apexglobal.in",
    designation: activeUser?.designation || "Business Owner / Managing Director",
    avatarUrl: activeUser?.avatarUrl || ""
  })

  const [savedSuccess, setSavedSuccess] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Sync state if active user changes
  useEffect(() => {
    if (activeUser) {
      setFormData({
        name: activeUser.name || "",
        phone: activeUser.phone || "",
        email: activeUser.email || "",
        designation: activeUser.designation || (activeUser.roleId === "owner" ? "Business Owner / Managing Director" : roles[activeUser.roleId]?.title || "Staff"),
        avatarUrl: activeUser.avatarUrl || ""
      })
    }
  }, [activeUser, roles])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setFormData((prev) => ({ ...prev, avatarUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }))
    if (avatarInputRef.current) avatarInputRef.current.value = ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUser) return

    updateTeamUser(activeUser.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim().replace(/\s+/g, ""),
      email: formData.email.trim(),
      designation: formData.designation.trim(),
      avatarUrl: formData.avatarUrl
    })

    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const currentRoleConfig = roles[activeUser?.roleId || "owner"]

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              User Info & Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal account details, mobile number, role designation, and profile avatar.
            </p>
          </div>

          {savedSuccess && (
            <Badge variant="default" className="bg-emerald-600 text-white text-xs gap-1.5 py-1 px-2.5">
              <Check className="h-3.5 w-3.5" /> Saved Successfully!
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Profile Photo / Avatar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Camera className="h-4 w-4 text-slate-400" />
              Profile Photo
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="h-20 w-20 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt={formData.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="text-xl font-bold text-slate-600 dark:text-slate-300">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs gap-1.5 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200"
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                    Upload Photo
                  </Button>

                  {formData.avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-xs gap-1.5 cursor-pointer text-slate-500 hover:text-slate-700 border-slate-200 dark:border-slate-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Recommended size: 400x400px. JPG, PNG or WebP under 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Personal & Contact Information */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <User className="h-4 w-4 text-slate-400" />
              Personal & Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User Full Name <span className="text-slate-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  required
                  className="text-xs"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-slate-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-medium">
                    +91
                  </span>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="98200 11001"
                    required
                    className="pl-11 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for account alerts and mobile verification.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="e.g. rajesh@apexglobal.in"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Designation / Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Role Title
                </label>
                <div className="relative">
                  <Briefcase className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    placeholder="e.g. Managing Director / Partner"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Account & Role Readonly Metadata */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Assigned Role:</span>
                <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentRoleConfig?.name || activeUser?.roleId}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({currentRoleConfig?.title || "System Role"})
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                User ID: <span className="font-mono text-slate-600 dark:text-slate-300">{activeUser?.id || "user-1"}</span>
              </div>
            </div>
          </div>

          {/* Save Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Profile saved successfully!
              </span>
            )}
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 shadow-2xs cursor-pointer gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save Info
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}


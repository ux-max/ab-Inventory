"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  X,
  Eye,
  EyeOff
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export function UsersSettings() {
  const { 
    teamUsers, 
    roles, 
    inviteUser, 
    deleteTeamUser, 
    toggleUserStatus
  } = useApp()

  const [searchQuery, setSearchQuery] = useState("")

  // Invite User Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState("sales")

  const roleList = Object.values(roles)

  const filteredUsers = teamUsers.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone ? u.phone.includes(searchQuery) : false) ||
    (roles[u.roleId]?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle Invite Form Submission
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password.trim()) return

    const result = inviteUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim().replace(/\s+/g, ""),
      roleId,
      isActive: true,
      password: password.trim()
    })

    if (result.success) {
      setIsInviteModalOpen(false)
      setName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setShowPassword(false)
      setRoleId("sales")
    }
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-white dark:bg-slate-950 font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-blue-600" />
            Users & Team Members
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Invite team members, assign access roles, and manage user login credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Invite User Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* 2. Main Users Table Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Search Bar & Total Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name, email, phone, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredUsers.length}</span> team members
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                  <TableHead className="text-xs font-bold py-3">Team Member</TableHead>
                  <TableHead className="text-xs font-bold py-3">Contact (Email & Mobile)</TableHead>
                  <TableHead className="text-xs font-bold py-3">Assigned Role</TableHead>
                  <TableHead className="text-xs font-bold py-3 text-center">Status</TableHead>
                  <TableHead className="text-xs font-bold py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const assignedRole = roles[user.roleId]
                    const isOwner = user.roleId === "owner" || user.id === "user-1"

                    return (
                      <TableRow 
                        key={user.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Name & ID */}
                        <TableCell className="py-3">
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              ID: {user.id}
                            </span>
                          </div>
                        </TableCell>

                        {/* Contact info */}
                        <TableCell className="py-3">
                          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {user.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{user.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell className="py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {assignedRole?.name || user.roleId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {assignedRole?.title || "Team role"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Toggle */}
                        <TableCell className="py-3 text-center">
                          {isOwner ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs select-none inline-block cursor-default"
                              title="Administrator account is permanently active"
                            >
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                user.isActive
                                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs"
                                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </button>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 text-right">
                          <div className="inline-flex items-center justify-end">
                            {/* Delete User (Protected: Admin / Business Owner cannot be deleted) */}
                            {!isOwner ? (
                              <button
                                onClick={() => deleteTeamUser(user.id)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Remove user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600 px-2 select-none">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                      No team members found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: INVITE USER MODAL                                              */}
      {/* ========================================================================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-100 dark:border-blue-900/50">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invite Team User
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInviteSubmit} className="p-5 space-y-3.5">
              
              {/* Field 1: User Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  User Full Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Field 2: Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address <span className="text-blue-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Field 3: Password with Hide/Unhide toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter user password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer focus:outline-hidden"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  User will use this password to log in.
                </span>
              </div>

              {/* Field 4: Select Role */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign Access Role <span className="text-blue-600">*</span>
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  {roleList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — ({r.title})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Determines sidebar module visibility and action permissions.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Add & Invite User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}


"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { GspPortalConnection } from "@/types/inventory"
import { Drawer } from "@/components/ui/drawer"
import { 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  Server,
  KeyRound,
  ExternalLink,
  Sparkles,
  Check
} from "lucide-react"

interface GspConnectDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function GspConnectDrawer({ isOpen, onClose, onSuccess }: GspConnectDrawerProps) {
  const { business, connectGspPortal, gspConnection } = useApp()

  // Stepper state: 1: Add GSP Details, 2: E-way Bill GSP Login, 3: Done
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  const [provider, setProvider] = useState<GspPortalConnection["provider"]>(gspConnection.provider || "masters_india")
  const [apiUsername, setApiUsername] = useState(gspConnection.apiUsername || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [environment, setEnvironment] = useState<"production" | "sandbox">(gspConnection.environment || "production")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFillDemo = () => {
    setApiUsername("APEX_GSP_USER")
    setPassword("ApexNIC#2026")
    setProvider("masters_india")
    setEnvironment("production")
    setErrorMessage(null)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!apiUsername.trim()) {
      setErrorMessage("Please enter your registered GSP User Name.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    // Simulate real-world NIC/GSP handshake
    setTimeout(async () => {
      try {
        const res = await connectGspPortal({
          provider,
          apiUsername: apiUsername.trim(),
          password,
          environment
        })

        setIsSubmitting(false)
        if (res.success) {
          setCurrentStep(3)
          if (onSuccess) onSuccess()
        } else {
          setErrorMessage(res.message || "Authentication failed.")
        }
      } catch (err: any) {
        setIsSubmitting(false)
        setErrorMessage(err?.message || "Failed to establish connection with GSP.")
      }
    }, 700)
  }

  const handleFinishAndClose = () => {
    setCurrentStep(1)
    onClose()
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentStep(1)
          onClose()
        }
      }}
      side="right"
      className="w-[620px] max-w-[94vw]"
      header={
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl shrink-0 select-none">
          {/* Top Title Bar */}
          <div className="px-6 pt-4 pb-0 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b-2 border-blue-600 inline-block">
                E-way Bill GSP Login
              </span>
            </div>
            <button
              type="button"
              onClick={handleFinishAndClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer -mt-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 1 
                    ? "bg-blue-600 text-white shadow-2xs" 
                    : currentStep > 1 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {currentStep > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 1 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-500 dark:text-slate-400"
                }`}>
                  Add GSP Details
                </span>
              </div>

              {/* Line 1-2 */}
              <div className={`flex-1 h-px mx-3 ${
                currentStep > 1 ? "bg-emerald-600" : "bg-slate-200 dark:border-slate-800"
              }`} />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 2 
                    ? "bg-blue-600 text-white shadow-2xs" 
                    : currentStep > 2 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {currentStep > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 2 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-500 dark:text-slate-400"
                }`}>
                  E-way Bill GSP Login
                </span>
              </div>

              {/* Line 2-3 */}
              <div className={`flex-1 h-px mx-3 ${
                currentStep > 2 ? "bg-emerald-600" : "bg-slate-200 dark:border-slate-800"
              }`} />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3 
                    ? "bg-emerald-600 text-white shadow-2xs" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {currentStep === 3 ? <Check className="h-3.5 w-3.5" /> : "3"}
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 3 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-500 dark:text-slate-400"
                }`}>
                  Done
                </span>
              </div>

            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ========================================================================= */}
        {/* STEP 1: Add GSP Details (Exact reference from user screenshot)            */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-slate-800 dark:text-slate-200">
            
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              Follow below steps to register <strong className="font-bold text-slate-900 dark:text-white">Masters India</strong> as your GST Suvidha Provider(GSP) on <strong className="font-bold text-slate-900 dark:text-white">E-way Bill Portal</strong>
            </p>

            {/* STEP - 1 Box */}
            <div className="space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  STEP - 1
                </span>
              </div>

              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">1.</span>
                  <span>
                    Login to the{" "}
                    <a 
                      href="https://ewaybillgst.gov.in" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>E-way Bill Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">2.</span>
                  <span>Click on <strong className="font-semibold text-slate-800 dark:text-white">Registration</strong> in the left menu and select <strong className="font-semibold text-slate-800 dark:text-white">For GSP</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">3.</span>
                  <span>Click <strong className="font-semibold text-slate-800 dark:text-white">Send OTP</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">4.</span>
                  <span><strong className="font-semibold text-slate-800 dark:text-white">Verify OTP</strong></span>
                </li>
              </ol>
            </div>

            {/* STEP - 2 Box */}
            <div className="space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  STEP - 2
                </span>
              </div>

              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">1.</span>
                  <span>Click the <strong className="font-semibold text-slate-800 dark:text-white">Add/New Button</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">2.</span>
                  <span>Select <strong className="font-semibold text-slate-800 dark:text-white">Masters India Private Limited</strong> in the GSP / ERP Name dropdown</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">3.</span>
                  <span>Enter <strong className="font-semibold text-slate-800 dark:text-white">3 letter Suffix ID</strong> and a password</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-medium text-slate-400">4.</span>
                  <span>Re-enter the User Name and Password and <strong className="font-semibold text-slate-800 dark:text-white">Click ADD</strong></span>
                </li>
              </ol>
            </div>

            {/* Next Step Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Proceed to E-way Bill GSP Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: E-way Bill GSP Login                                              */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Enter GSP Credentials
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter the GSP username and password registered on the E-way bill portal in Step 1.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Business GSTIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered GSTIN
                </label>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {business.gstin || "27AABCA1234F1Z5"}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Registered
                  </span>
                </div>
              </div>

              {/* GSP User Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    GSP User Name <span className="text-slate-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <Sparkles className="h-2.5 w-2.5" /> Auto-fill Demo
                  </button>
                </div>
                <div className="relative">
                  <Server className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={apiUsername}
                    onChange={(e) => setApiUsername(e.target.value)}
                    placeholder="e.g. APEX_GSP_USER"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Username created with your 3-letter suffix on the portal.
                </p>
              </div>

              {/* GSP Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSP Password <span className="text-slate-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Target Environment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Environment
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEnvironment("production")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      environment === "production"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Production (Govt NIC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment("sandbox")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      environment === "sandbox"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Sandbox (Test)
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Steps</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Authenticating with NIC...</span>
                    </>
                  ) : (
                    <>
                      <span>Validate & Connect</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Done (Connected Success)                                          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                GSP Connected Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your ERP is now directly authenticated with the Government NIC Portal. You can generate both <strong className="font-semibold text-slate-800 dark:text-white">E-way Bills (EWB-01)</strong> and <strong className="font-semibold text-slate-800 dark:text-white">E-Invoices (IRN)</strong> seamlessly.
              </p>
            </div>

            {/* Connection Summary Box */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered GSTIN:</span>
                <span className="font-bold text-slate-900 dark:text-white">{business.gstin || "27AABCA1234F1Z5"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GSP User Name:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{apiUsername || "APEX_GSP_USER"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Server:</span>
                <span className="text-slate-700 dark:text-slate-300">Government NIC Production</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinishAndClose}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Start Generating E-way Bills & E-Invoices</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </Drawer>
  )
}

"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/context/AppContext"
import { Mail, Lock, Eye, EyeOff, ChevronLeft, CheckCircle2, User } from "lucide-react"

// Static carousel slides placed outside component to prevent re-creation
const SLIDES = [
  {
    id: "stock-control",
    line1: "“Every Stock. Every",
    line2: "Sale. Under Control.”",
    subtitle: "Reports • Invoices • E-way Bill • E-Invoice • POS",
    image: "/login-illustration-hd.jpg",
    alt: "Automate Business Warehouse & Inventory Control"
  },
  {
    id: "reports-analytics",
    line1: "“Real-Time Insights.",
    line2: "Smarter Decisions.”",
    subtitle: "Profit & Loss • Stock Valuation • GST Summary • Sales Trends",
    image: "/login-reports-hd.jpg",
    alt: "Automate Business Inventory Reports & Analytics"
  },
  {
    id: "eway-logistics",
    line1: "“Instant E-Way Bills.",
    line2: "Automated & Compliant.”",
    subtitle: "1-Click Generation • Vehicle Tracking • QR Verification • E-Invoice Sync",
    image: "/login-eway-hd.jpg",
    alt: "Automate Business E-Way Bill & Logistics Dispatch"
  },
  {
    id: "einvoice-gst",
    line1: "“Seamless E-Invoicing.",
    line2: "Instant GST Clearance.”",
    subtitle: "IRN Generation • Signed QR Codes • Automated B2B Billing • IRP Portal Sync",
    image: "/login-einvoice-hd.jpg",
    alt: "Automate Business E-Invoicing & GST Clearance"
  },
  {
    id: "pos-checkout",
    line1: "“Lightning-Fast POS.",
    line2: "Seamless Counter Checkout.”",
    subtitle: "Barcode Scanning • UPI QR • Split Tender",
    image: "/login-pos-hd.jpg",
    alt: "Automate Business Point of Sale & Counter Checkout"
  }
]

export function LoginPage() {
  const router = useRouter()
  const { login } = useApp()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Smooth transition handler
  const transitionToSlide = (nextIndex: number) => {
    setIsFading(true)
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    fadeTimeoutRef.current = setTimeout(() => {
      setCurrentSlide(nextIndex)
      setIsFading(false)
    }, 220)
  }

  // Auto-play carousel: Advances every 5 seconds, restarts timer whenever slide changes
  useEffect(() => {
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current)

    autoPlayTimeoutRef.current = setTimeout(() => {
      transitionToSlide((currentSlide + 1) % SLIDES.length)
    }, 5000)

    return () => {
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current)
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    }
  }, [currentSlide])

  const handleSelectSlide = (idx: number) => {
    if (idx === currentSlide) return
    transitionToSlide(idx)
  }

  // Form mode: "login" | "signup" | "otp" | "forgot"
  const [authMode, setAuthMode] = useState<"login" | "signup" | "otp" | "forgot">("login")

  // Log in form state
  const [email, setEmail] = useState("admin@apexglobal.in")
  const [password, setPassword] = useState("••••••••")
  const [showPassword, setShowPassword] = useState(false)

  // Sign up form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [whatsAppNumber, setWhatsAppNumber] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  // OTP form state
  const [otpValues, setOtpValues] = useState(["1", "2", "3", "4", "5", "6"])
  const [countdown, setCountdown] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successNotice, setSuccessNotice] = useState("")

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (authMode === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [authMode, countdown])

  const handlePasswordLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)
    setTimeout(() => {
      login(email || "admin@apexglobal.in", password || "admin123")
      setIsSubmitting(false)
      router.push("/")
    }, 350)
  }

  const handleGoogleAuth = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      login("google.user@apexglobal.in")
      setIsSubmitting(false)
      router.push("/")
    }, 350)
  }

  const handleCreateAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage("")

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms and Conditions and Privacy Policy.")
      return
    }

    if (signupPassword && confirmPassword && signupPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      login(businessEmail || `${firstName.toLowerCase() || "user"}@company.com`)
      setIsSubmitting(false)
      router.push("/")
    }, 450)
  }

  const handleSendOtp = () => {
    setErrorMessage("")
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setAuthMode("otp")
      setCountdown(30)
      setOtpValues(["1", "2", "3", "4", "5", "6"])
      setTimeout(() => {
        otpInputsRef.current[5]?.focus()
      }, 100)
    }, 300)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpValues]
    newOtp[index] = value.slice(-1)
    setOtpValues(newOtp)
    setErrorMessage("")

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length > 0) {
      const newOtp = [...otpValues]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || ""
      }
      setOtpValues(newOtp)
      otpInputsRef.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage("")
    const code = otpValues.join("")
    if (code.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      login(email || "admin@apexglobal.in", code)
      setIsSubmitting(false)
      router.push("/")
    }, 400)
  }

  const handleForgotPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSuccessNotice("Password reset instructions have been sent to your email.")
    setTimeout(() => {
      setAuthMode("login")
      setSuccessNotice("")
    }, 2500)
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 sm:p-8 lg:p-12 font-sans selection:bg-[#3361ff] selection:text-white">
      
      {/* MacBook Pro 16" Minimal Pure White Canvas */}
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 my-auto">
        
        {/* ================= LEFT SECTION: CAROUSEL WITH 2D ILLUSTRATIONS & DOTS ================= */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center select-none pt-4 lg:pt-0 pl-2 sm:pl-6 lg:pl-10">
          
          {/* Animated Headline & Subtitle with smooth fade */}
          <div className={`transition-all duration-300 min-h-[165px] flex flex-col justify-end ${isFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>
            <h1 className="font-['Inter'] font-medium text-[28px] sm:text-[34px] lg:text-[40px] text-[#111827] leading-[1.24] tracking-tight">
              {SLIDES[currentSlide].line1}<br />
              {SLIDES[currentSlide].line2}
            </h1>
            <p className="mt-6 sm:mt-7 lg:mt-8 font-['Inter'] font-medium text-[14px] sm:text-[16px] lg:text-[19px] text-[#111827] leading-[1.35] tracking-tight">
              {SLIDES[currentSlide].subtitle}
            </p>
          </div>

          {/* 2D Vector Illustration Stage with Crossfade Transition */}
          <div className="mt-6 sm:mt-10 lg:mt-12 w-full max-w-[580px] h-[250px] sm:h-[300px] flex items-center justify-center relative overflow-hidden">
            <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-out ${isFading ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={SLIDES[currentSlide].id}
                src={SLIDES[currentSlide].image}
                alt={SLIDES[currentSlide].alt}
                className="w-full max-h-full object-contain select-none pointer-events-none mix-blend-multiply drop-shadow-xs"
              />
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6 sm:mt-8 w-full max-w-[580px]">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className="group p-2 flex items-center justify-center cursor-pointer focus:outline-none"
                title={`Slide ${idx + 1}: ${s.line1.replace(/[“”]/g, "")} ${s.line2.replace(/[“”]/g, "")}`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span
                  className={`h-2.5 rounded-full transition-all duration-300 block ${
                    currentSlide === idx
                      ? "w-8 bg-[#2563eb] shadow-xs"
                      : "w-2.5 bg-slate-300 group-hover:bg-slate-400 group-hover:scale-125"
                  }`}
                />
              </button>
            ))}
          </div>

        </div>

        {/* ================= RIGHT SECTION: UPDATED EMAIL/GOOGLE LOGIN CARD ================= */}
        <div className="w-full lg:w-[48%] flex flex-col items-center lg:items-end justify-center pr-2 sm:pr-6 lg:pr-10">
          
          {/* Card & Logo Container */}
          <div className="w-full max-w-[440px] flex flex-col">
            
            {/* Automate Business Full Brand Logo */}
            <div className="mb-5 sm:mb-6 flex items-center justify-center w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ab-logo-full.png"
                alt="Automate Business"
                className="h-10 sm:h-12 w-auto object-contain select-none"
              />
            </div>

            {/* Card exactly matching the reference design */}
            <div className="w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.06)] p-7 sm:p-9 relative">
            
            {/* Header for Signup mode */}
            {authMode === "signup" && (
              <div className="mb-5 text-left">
                <h2 className="text-[26px] font-bold text-slate-900 leading-tight">
                  Create your account
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  Start setting up a shared WhatsApp workspace for your team.
                </p>
              </div>
            )}

            {/* Top Google Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 text-sm font-medium text-slate-700 shadow-xs cursor-pointer disabled:opacity-70"
            >
              {/* Google Multi-Color 'G' Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authMode === "signup" ? "Sign up with Google" : "Log In with Google"}</span>
            </button>

            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                  OR
                </span>
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}
            {successNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* MODE 1: EMAIL & PASSWORD LOGIN */}
            {authMode === "login" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Log In &rarr;</span>
                  )}
                </button>

                {/* Create Account Footer */}
                <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <span>Don&apos;t have an account ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("")
                      setAuthMode("signup")
                    }}
                    className="font-bold underline text-slate-900 hover:text-[#2563eb] cursor-pointer"
                  >
                    Create one
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: CREATE YOUR ACCOUNT (SIGN UP) */}
            {authMode === "signup" && (
              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                {/* Row: First Name & Last Name */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      First name
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                      <User className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Last name
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                      <User className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Business email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Business email
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="email"
                      required
                      value={businessEmail}
                      onChange={e => setBusinessEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* WhatsApp number with +91 Country Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    WhatsApp number
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-700 select-none">
                      <span className="text-sm">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={whatsAppNumber}
                      onChange={e => setWhatsAppNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="98200 45678"
                      className="w-full px-3 py-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    We verify this number after account creation.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Password
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none cursor-pointer"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use 8+ characters with uppercase, lowercase, a number, and a symbol.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Confirm password
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms and Privacy Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termsAgreement"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/20 cursor-pointer"
                  />
                  <label htmlFor="termsAgreement" className="text-xs text-slate-600 select-none leading-normal">
                    I agree to the <span className="font-semibold underline text-slate-900">Terms and Conditions</span> and <span className="font-semibold underline text-slate-900">Privacy Policy</span>.
                  </label>
                </div>

                {/* Create account button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer disabled:opacity-70 mt-3"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Create account"
                  )}
                </button>

                {/* Footer Link to Log In */}
                <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("")
                      setAuthMode("login")
                    }}
                    className="font-bold underline text-slate-900 hover:text-[#2563eb] cursor-pointer"
                  >
                    Log in
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: EMAIL OTP VERIFICATION */}
            {authMode === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Enter 6-Digit OTP Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-xs text-[#2563eb] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Back to Password</span>
                    </button>
                  </div>

                  {/* 6 OTP Boxes */}
                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpInputsRef.current[idx] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className="w-full aspect-square text-center text-lg font-bold rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                      />
                    ))}
                  </div>

                  {/* Resend Countdown */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Demo OTP pre-filled (123456)
                    </span>
                    {countdown > 0 ? (
                      <span className="text-slate-400">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCountdown(30)}
                        className="text-[#2563eb] font-semibold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* VERIFY & LOGIN */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer disabled:opacity-70 mt-4"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Verify &amp; Log In &rarr;</span>
                  )}
                </button>
              </form>
            )}

            {/* MODE 4: FORGOT PASSWORD */}
            {authMode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800">
                    Reset Your Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-xs text-[#2563eb] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>Back</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
                    <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Send Reset Link &rarr;
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      </div>
    </div>
  )
}

export default LoginPage

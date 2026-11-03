"use client"

import React from "react"

interface IllustrationProps {
  className?: string
}

export function EwayEinvoiceIllustration({ className = "w-72 h-44" }: IllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xs"
      >
        {/* Ambient Subtle Background Grid */}
        <g opacity="0.4" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3">
          <line x1="20" y1="40" x2="320" y2="40" />
          <line x1="20" y1="90" x2="320" y2="90" />
          <line x1="20" y1="140" x2="320" y2="140" />
          <line x1="70" y1="20" x2="70" y2="160" />
          <line x1="170" y1="20" x2="170" y2="160" />
          <line x1="270" y1="20" x2="270" y2="160" />
        </g>

        {/* Highway / Route Ground Line */}
        <path
          d="M 20 150 L 320 150"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 50 150 L 80 150 M 130 150 L 170 150 M 220 150 L 260 150 M 290 150 L 310 150"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />

        {/* 1. E-INVOICE DIGITAL DOCUMENT (Left / Center) */}
        <g className="transition-transform duration-300 hover:-translate-y-1">
          {/* Document Drop Shadow & Sheet */}
          <rect
            x="48"
            y="28"
            width="100"
            height="115"
            rx="8"
            className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="1.5"
          />

          {/* Doc Header Ribbon */}
          <rect
            x="48"
            y="28"
            width="100"
            height="22"
            rx="8"
            className="fill-blue-50 dark:fill-blue-950/70"
          />
          <rect
            x="58"
            y="37"
            width="32"
            height="5"
            rx="2.5"
            className="fill-blue-600 dark:fill-blue-400"
          />
          <circle cx="138" cy="39" r="2.5" className="fill-blue-500" />
          <circle cx="131" cy="39" r="2.5" className="fill-slate-300 dark:fill-slate-600" />

          {/* IRN Barcode Lines */}
          <g className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1.5">
            <line x1="58" y1="58" x2="138" y2="58" />
            <line x1="58" y1="66" x2="118" y2="66" />
            <line x1="58" y1="74" x2="128" y2="74" />
          </g>

          {/* Digital Signed QR Code Frame */}
          <rect
            x="58"
            y="84"
            width="36"
            height="36"
            rx="4"
            className="fill-blue-50 dark:fill-slate-900 stroke-blue-200 dark:stroke-blue-800"
            strokeWidth="1"
          />
          {/* QR Code Micro Matrix */}
          <rect x="62" y="88" width="8" height="8" rx="1" className="fill-blue-600" />
          <rect x="82" y="88" width="8" height="8" rx="1" className="fill-blue-600" />
          <rect x="62" y="108" width="8" height="8" rx="1" className="fill-blue-600" />
          <rect x="74" y="94" width="4" height="4" className="fill-slate-700 dark:fill-slate-300" />
          <rect x="80" y="102" width="4" height="4" className="fill-slate-700 dark:fill-slate-300" />
          <rect x="74" y="108" width="4" height="4" className="fill-slate-700 dark:fill-slate-300" />
          <rect x="86" y="108" width="4" height="4" className="fill-slate-700 dark:fill-slate-300" />

          {/* IRN Hash Pill */}
          <rect
            x="100"
            y="88"
            width="38"
            height="14"
            rx="3"
            className="fill-slate-100 dark:fill-slate-700/60"
          />
          <text
            x="104"
            y="98"
            className="fill-slate-600 dark:fill-slate-300 font-mono text-[6.5px] font-bold"
          >
            IRN SYNC
          </text>

          <rect
            x="100"
            y="106"
            width="38"
            height="14"
            rx="3"
            className="fill-emerald-50 dark:fill-emerald-950/40 stroke-emerald-200 dark:stroke-emerald-800/40"
            strokeWidth="0.5"
          />
          <text
            x="104"
            y="116"
            className="fill-emerald-600 dark:fill-emerald-400 font-mono text-[6.5px] font-bold"
          >
            GST VALID
          </text>
        </g>

        {/* 2. E-WAY BILL LOGISTICS TRUCK (Right) */}
        <g className="transition-transform duration-300 hover:translate-x-1">
          {/* Truck Cargo Body */}
          <rect
            x="160"
            y="70"
            width="90"
            height="62"
            rx="6"
            className="fill-blue-600 dark:fill-blue-600"
          />
          {/* Cargo Container Accents */}
          <line x1="182" y1="72" x2="182" y2="130" stroke="#3b82f6" strokeWidth="2" />
          <line x1="205" y1="72" x2="205" y2="130" stroke="#3b82f6" strokeWidth="2" />
          <line x1="228" y1="72" x2="228" y2="130" stroke="#3b82f6" strokeWidth="2" />

          {/* E-Way Bill Number Decal */}
          <rect
            x="172"
            y="84"
            width="66"
            height="18"
            rx="3"
            className="fill-white/95 dark:fill-slate-900/90 shadow-2xs"
          />
          <text
            x="177"
            y="96"
            className="fill-slate-900 dark:fill-white font-mono text-[8px] font-extrabold tracking-wider"
          >
            EWB-01 • NIC
          </text>

          {/* Truck Cabin */}
          <path
            d="M 250 85 L 272 85 C 277 85 281 88 283 93 L 288 106 L 288 132 L 250 132 Z"
            className="fill-slate-900 dark:fill-slate-800 stroke-slate-700 dark:stroke-slate-600"
            strokeWidth="1.5"
          />

          {/* Cabin Windshield */}
          <path
            d="M 254 90 L 268 90 C 271 90 274 92 275 95 L 280 106 L 254 106 Z"
            className="fill-blue-100 dark:fill-blue-950/80 stroke-blue-300 dark:stroke-blue-800"
            strokeWidth="1"
          />

          {/* Cabin Headlight */}
          <rect x="284" y="116" width="4" height="6" rx="1.5" className="fill-amber-400 shadow-xs" />

          {/* Wheels (3 Axles) */}
          {/* Wheel 1 */}
          <circle cx="180" cy="136" r="12" className="fill-slate-900 dark:fill-slate-950" />
          <circle cx="180" cy="136" r="5" className="fill-slate-200 dark:fill-slate-700" />

          {/* Wheel 2 */}
          <circle cx="230" cy="136" r="12" className="fill-slate-900 dark:fill-slate-950" />
          <circle cx="230" cy="136" r="5" className="fill-slate-200 dark:fill-slate-700" />

          {/* Wheel 3 (Front) */}
          <circle cx="270" cy="136" r="12" className="fill-slate-900 dark:fill-slate-950" />
          <circle cx="270" cy="136" r="5" className="fill-slate-200 dark:fill-slate-700" />
        </g>

        {/* 3. GOVERNMENT NIC CLOUD / CONNECTIVITY BEAM */}
        {/* Floating Wireless Handshake Wave */}
        <g className="stroke-blue-500/70 dark:stroke-blue-400/60" strokeWidth="1.5" strokeLinecap="round">
          <path d="M 148 48 C 158 44, 168 44, 178 48" />
          <path d="M 144 42 C 158 36, 174 36, 188 42" strokeDasharray="3 3" />
        </g>

        {/* Government Shield Badge */}
        <g transform="translate(150, 15)">
          <rect
            x="0"
            y="0"
            width="34"
            height="34"
            rx="17"
            className="fill-white dark:fill-slate-900 stroke-blue-200 dark:stroke-blue-800 shadow-xs"
            strokeWidth="1.5"
          />
          <path
            d="M 17 8 L 26 12 C 26 18, 22 23, 17 26 C 12 23, 8 18, 8 12 Z"
            className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M 13 17 L 16 20 L 22 13"
            className="stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Transit GPS Location Pin */}
        <g transform="translate(294, 76)">
          <circle cx="10" cy="10" r="10" className="fill-blue-50 dark:fill-blue-950/80 stroke-blue-200 dark:stroke-blue-800" strokeWidth="1" />
          <circle cx="10" cy="10" r="4" className="fill-blue-600 animate-pulse" />
        </g>
      </svg>
    </div>
  )
}


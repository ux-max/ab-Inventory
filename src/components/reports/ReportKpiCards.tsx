"use client"

import React from "react"
import { KpiCardData } from "@/lib/reportDataEngine"

interface ReportKpiCardsProps {
  cards: KpiCardData[]
}

export function ReportKpiCards({ cards }: ReportKpiCardsProps) {
  if (!cards || !cards.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {card.title}
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums tracking-tight">
              {card.mainValue}
            </div>
          </div>

          {card.subItems && card.subItems.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              {card.subItems.map((sub, sIdx) => (
                <div key={sIdx} className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">{sub.label}:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {sub.value}
                  </span>
                  {sIdx < card.subItems!.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700 ml-2">|</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

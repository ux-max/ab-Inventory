"use client"

import * as React from "react"
import { AlertTriangle, Trash2, Info } from "lucide-react"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  itemName?: string
  itemCount?: number
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemCount,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  loading = false
}: ConfirmModalProps) {
  const iconBg =
    variant === "danger"
      ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/60"
      : variant === "warning"
      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60"
      : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/60"

  const IconComponent =
    variant === "danger" ? Trash2 : variant === "warning" ? AlertTriangle : Info

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-start space-x-4">
        <div
          className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <DialogHeader className="text-left space-y-1 mb-2">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {(itemName || (itemCount !== undefined && itemCount > 0)) && (
            <div className="p-3 my-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Target:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[280px]">
                {itemName || `${itemCount} selected ${itemCount === 1 ? "log" : "logs"}`}
              </span>
            </div>
          )}

          <DialogFooter className="mt-5 flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-semibold h-8 px-3.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-none cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              disabled={loading}
              className={`text-xs font-semibold h-8 px-4 shadow-none cursor-pointer text-white ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                  : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </div>
    </Dialog>
  )
}

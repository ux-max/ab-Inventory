"use client"

import React, { useState } from "react"
import { MoreVertical, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export interface DetailActionsMenuProps {
  onEdit?: () => void
  onDelete: () => void
  title: string
  description?: string
  itemName?: string
  confirmText?: string
  editText?: string
}

export function DetailActionsMenu({
  onEdit,
  onDelete,
  title,
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  itemName,
  confirmText = "Delete",
  editText = "Edit"
}: DetailActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <>
      <div className="relative inline-block text-left">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-8 w-8 p-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
          title="More Options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  if (onEdit) {
                    onEdit()
                  } else {
                    alert(`Edit option opened for ${itemName || title}`)
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>{editText}</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsDeleteModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={title}
        description={description}
        itemName={itemName}
        confirmText={confirmText}
        variant="danger"
        onConfirm={onDelete}
      />
    </>
  )
}

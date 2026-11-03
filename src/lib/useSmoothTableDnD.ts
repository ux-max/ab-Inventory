"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export function useSmoothTableDnD<T>(
  lines: T[],
  setLines: React.Dispatch<React.SetStateAction<T[]>>
) {
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null)
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null)
  const linesRef = useRef(lines)
  linesRef.current = lines

  const activeIndexRef = useRef<number | null>(null)
  activeIndexRef.current = activeDragIndex

  const handlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    // Only trigger on primary mouse button or touch
    if (e.button !== 0) return

    e.preventDefault()
    e.stopPropagation()
    setActiveDragIndex(index)

    // Smooth global cursor while dragging
    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentActive = activeIndexRef.current
      if (currentActive === null || !tbodyRef.current) return

      const rows = Array.from(tbodyRef.current.querySelectorAll("tr"))
      if (!rows.length) return

      const clientY = moveEvent.clientY

      // If dragged above the top row
      if (clientY < rows[0].getBoundingClientRect().top) {
        if (currentActive !== 0) {
          activeIndexRef.current = 0
          setLines((prev) => {
            const updated = [...prev]
            const [moved] = updated.splice(currentActive, 1)
            updated.splice(0, 0, moved)
            return updated
          })
          setActiveDragIndex(0)
        }
        return
      }

      // If dragged below the bottom row
      const lastIdx = rows.length - 1
      if (clientY > rows[lastIdx].getBoundingClientRect().bottom) {
        if (currentActive !== lastIdx) {
          activeIndexRef.current = lastIdx
          setLines((prev) => {
            const updated = [...prev]
            const [moved] = updated.splice(currentActive, 1)
            updated.splice(lastIdx, 0, moved)
            return updated
          })
          setActiveDragIndex(lastIdx)
        }
        return
      }

      // Find the row currently under the pointer
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rect = row.getBoundingClientRect()
        // Check if cursor is within row vertical bounds
        if (clientY >= rect.top && clientY <= rect.bottom) {
          if (i !== currentActive) {
            activeIndexRef.current = i
            // Smoothly swap positions in real-time
            setLines((prev) => {
              const updated = [...prev]
              const [moved] = updated.splice(currentActive, 1)
              updated.splice(i, 0, moved)
              return updated
            })
            setActiveDragIndex(i)
          }
          break
        }
      }
    }

    const onPointerUp = () => {
      setActiveDragIndex(null)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }, [setLines])

  // Cleanup on unmount in case pointerup was missed
  useEffect(() => {
    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [])

  return {
    tbodyRef,
    activeDragIndex,
    handlePointerDown,
  }
}

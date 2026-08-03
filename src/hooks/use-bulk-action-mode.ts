import { useCallback, useMemo, useState } from 'react'

export type BulkActionMode =
  | 'idle'
  | 'selecting-shortlist'
  | 'selecting-reject'

export type BulkActionState = {
  mode: BulkActionMode
  selectedIds: Set<string>
  isBulkMode: boolean
  isAllSelected: boolean
  selectedCount: number
  enterMode: (type: 'shortlist' | 'reject') => void
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  exitMode: () => void
}

/**
 * Selection state machine for board bulk Shortlist / bulk reject (#10 / #21).
 * Ports the source's `useBulkActionMode`.
 */
export function useBulkActionMode(
  totalCandidateIds: string[] = [],
): BulkActionState {
  const [mode, setMode] = useState<BulkActionMode>('idle')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isBulkMode = mode !== 'idle'
  const selectedCount = selectedIds.size

  const isAllSelected = useMemo(() => {
    if (totalCandidateIds.length === 0) return false
    return totalCandidateIds.every((id) => selectedIds.has(id))
  }, [totalCandidateIds, selectedIds])

  const enterMode = useCallback((type: 'shortlist' | 'reject') => {
    setMode(type === 'shortlist' ? 'selecting-shortlist' : 'selecting-reject')
    setSelectedIds(new Set())
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const exitMode = useCallback(() => {
    setMode('idle')
    setSelectedIds(new Set())
  }, [])

  return {
    mode,
    selectedIds,
    isBulkMode,
    isAllSelected,
    selectedCount,
    enterMode,
    toggleSelection,
    selectAll,
    clearSelection,
    exitMode,
  }
}

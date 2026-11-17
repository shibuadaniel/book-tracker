import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadShelf, saveShelf } from '../storage'
import type { ReadingStatus, ShelfBook } from '../types'

export function useShelf() {
  const [books, setBooks] = useState<ShelfBook[]>(() => loadShelf())

  useEffect(() => {
    saveShelf(books)
  }, [books])

  const ids = useMemo(() => new Set(books.map((b) => b.id)), [books])

  const addBook = useCallback((book: Omit<ShelfBook, 'addedAt' | 'status'> & { status?: ReadingStatus }) => {
    setBooks((prev) => {
      if (prev.some((b) => b.id === book.id)) return prev
      const next: ShelfBook = {
        ...book,
        status: book.status ?? 'want',
        addedAt: new Date().toISOString(),
      }
      return [next, ...prev]
    })
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const setStatus = useCallback((id: string, status: ReadingStatus) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
  }, [])

  const hasBook = useCallback((id: string) => ids.has(id), [ids])

  return { books, addBook, removeBook, setStatus, hasBook }
}

import type { ShelfBook } from './types'

const SHELF_KEY = 'book-tracker.shelf.v1'
const NYT_KEY = 'book-tracker.nytApiKey.v1'

export function loadShelf(): ShelfBook[] {
  try {
    const raw = localStorage.getItem(SHELF_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShelfBook[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveShelf(books: ShelfBook[]): void {
  localStorage.setItem(SHELF_KEY, JSON.stringify(books))
}

export function loadNytApiKey(): string {
  return localStorage.getItem(NYT_KEY) ?? ''
}

export function saveNytApiKey(key: string): void {
  const trimmed = key.trim()
  if (!trimmed) {
    localStorage.removeItem(NYT_KEY)
    return
  }
  localStorage.setItem(NYT_KEY, trimmed)
}

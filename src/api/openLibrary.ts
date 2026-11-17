import type { SearchResult } from '../types'

interface OpenLibraryDoc {
  key?: string
  title?: string
  author_name?: string[]
  cover_i?: number
  isbn?: string[]
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[]
}

export function openLibraryCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

export function coverFromIsbn(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '20')
  url.searchParams.set('fields', 'key,title,author_name,cover_i,isbn')

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`)
  }

  const data = (await res.json()) as OpenLibraryResponse
  return (data.docs ?? [])
    .filter((doc) => doc.key && doc.title)
    .map((doc) => {
      const isbn = doc.isbn?.[0]
      const coverUrl = doc.cover_i
        ? openLibraryCoverUrl(doc.cover_i, 'M')
        : isbn
          ? coverFromIsbn(isbn, 'M')
          : null

      return {
        id: doc.key!,
        title: doc.title!,
        authors: doc.author_name ?? [],
        coverUrl,
      }
    })
}

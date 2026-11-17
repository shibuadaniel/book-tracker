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

export interface BookSearchParams {
  /** Free-text query (title, author, or both). */
  query?: string
  title?: string
  author?: string
}

export function openLibraryCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

export function coverFromIsbn(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
}

function mapDocs(docs: OpenLibraryDoc[] | undefined): SearchResult[] {
  return (docs ?? [])
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

/** Search by free-text query and/or dedicated title / author fields. */
export async function searchBooks(
  input: string | BookSearchParams,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const params: BookSearchParams =
    typeof input === 'string' ? { query: input } : input

  const query = params.query?.trim() ?? ''
  const title = params.title?.trim() ?? ''
  const author = params.author?.trim() ?? ''

  if (!query && !title && !author) return []

  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('limit', '24')
  url.searchParams.set('fields', 'key,title,author_name,cover_i,isbn')

  // Prefer dedicated fields for single-dimension search; when both title and
  // author are set, use a combined q so partial titles still match.
  if (query) {
    url.searchParams.set('q', query)
  } else if (title && author) {
    url.searchParams.set('q', `${title} ${author}`)
  } else if (title) {
    url.searchParams.set('title', title)
  } else if (author) {
    url.searchParams.set('author', author)
  }

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`)
  }

  const data = (await res.json()) as OpenLibraryResponse
  return mapDocs(data.docs)
}

export interface BookDetails {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  description: string | null
  subjects: string[]
  publishDate: string | null
}

type OlText = string | { type?: string; value?: string } | null | undefined

function readText(value: OlText): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'object' && typeof value.value === 'string') {
    const trimmed = value.value.trim()
    return trimmed || null
  }
  return null
}

function isWorkKey(id: string): boolean {
  return id.startsWith('/works/')
}

function looksLikeIsbn(id: string): boolean {
  return /^[0-9]{9}[0-9Xx]$|^[0-9]{13}$/.test(id.replace(/-/g, ''))
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  return (await res.json()) as T
}

/**
 * Load synopsis and extra metadata from Open Library.
 * Accepts a work key (`/works/...`), ISBN, or falls back to title+author search.
 */
export async function fetchBookDetails(
  seed: {
    id: string
    title: string
    authors: string[]
    coverUrl: string | null
    description?: string | null
  },
  signal?: AbortSignal,
): Promise<BookDetails> {
  const base: BookDetails = {
    id: seed.id,
    title: seed.title,
    authors: seed.authors,
    coverUrl: seed.coverUrl,
    description: seed.description?.trim() || null,
    subjects: [],
    publishDate: null,
  }

  type WorkJson = {
    key?: string
    title?: string
    description?: OlText
    subjects?: string[]
    covers?: number[]
    authors?: Array<{ author?: { key?: string } }>
  }

  type EditionJson = {
    title?: string
    description?: OlText
    publish_date?: string
    number_of_pages?: number
    covers?: number[]
    works?: Array<{ key?: string }>
  }

  let work: WorkJson | null = null
  let edition: EditionJson | null = null

  if (isWorkKey(seed.id)) {
    work = await fetchJson<WorkJson>(`https://openlibrary.org${seed.id}.json`, signal)
  } else if (looksLikeIsbn(seed.id)) {
    edition = await fetchJson<EditionJson>(
      `https://openlibrary.org/isbn/${seed.id.replace(/-/g, '')}.json`,
      signal,
    )
    const workKey = edition?.works?.[0]?.key
    if (workKey) {
      work = await fetchJson<WorkJson>(`https://openlibrary.org${workKey}.json`, signal)
    }
  } else {
    // NYT composite ids or unknown — resolve via search
    const q = [seed.title, seed.authors[0]].filter(Boolean).join(' ')
    if (q) {
      const results = await searchBooks({ query: q }, signal)
      const match = results[0]
      if (match && isWorkKey(match.id)) {
        work = await fetchJson<WorkJson>(`https://openlibrary.org${match.id}.json`, signal)
        if (!base.coverUrl && match.coverUrl) base.coverUrl = match.coverUrl
        base.id = match.id
      }
    }
  }

  if (work) {
    base.id = work.key || base.id
    base.title = work.title || base.title
    const desc = readText(work.description)
    if (desc) base.description = desc
    base.subjects = (work.subjects ?? []).slice(0, 12)
    if (!base.coverUrl && work.covers?.[0]) {
      base.coverUrl = openLibraryCoverUrl(work.covers[0], 'L')
    }
  }

  if (edition) {
    const editionDesc = readText(edition.description)
    if (!base.description && editionDesc) base.description = editionDesc
    if (edition.publish_date) base.publishDate = edition.publish_date
    if (!base.coverUrl && edition.covers?.[0]) {
      base.coverUrl = openLibraryCoverUrl(edition.covers[0], 'L')
    }
  }

  return base
}

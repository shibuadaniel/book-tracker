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

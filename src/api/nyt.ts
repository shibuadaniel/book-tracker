import type { NytListBook } from '../types'
import { coverFromIsbn } from './openLibrary'

interface NytIsbn {
  isbn10?: string
  isbn13?: string
}

interface NytBook {
  title?: string
  author?: string
  primary_isbn13?: string
  primary_isbn10?: string
  book_image?: string
  description?: string
  rank?: number
  weeks_on_list?: number
  isbns?: NytIsbn[]
}

interface NytListResponse {
  status?: string
  fault?: { faultstring?: string }
  results?: {
    list_name?: string
    books?: NytBook[]
  }
}

function pickIsbn(book: NytBook): string | null {
  return (
    book.primary_isbn13 ||
    book.isbns?.find((x) => x.isbn13)?.isbn13 ||
    book.primary_isbn10 ||
    book.isbns?.find((x) => x.isbn10)?.isbn10 ||
    null
  )
}

export async function fetchNytList(
  listSlug: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<NytListBook[]> {
  const key = apiKey.trim()
  if (!key) {
    throw new Error('Add your NYT API key in Settings to browse bestsellers.')
  }

  // NYT Books API allows browser CORS (Access-Control-Allow-Origin: *),
  // so call it directly — works on Vite, tunnels, and GitHub Pages.
  const url = new URL(
    `https://api.nytimes.com/svc/books/v3/lists/current/${encodeURIComponent(listSlug)}.json`,
  )
  url.searchParams.set('api-key', key)

  const res = await fetch(url, { signal })
  const data = (await res.json()) as NytListResponse

  if (!res.ok) {
    const message = data.fault?.faultstring || `NYT request failed (${res.status})`
    throw new Error(message)
  }

  const books = data.results?.books ?? []
  return books.map((book, index) => {
    const isbn = pickIsbn(book)
    const id = isbn || `${listSlug}-${book.rank ?? index}-${book.title ?? 'book'}`
    const coverUrl =
      book.book_image ||
      (isbn ? coverFromIsbn(isbn, 'L') : null)

    return {
      id,
      title: book.title?.trim() || 'Untitled',
      authors: book.author ? [book.author] : [],
      coverUrl,
      rank: book.rank ?? index + 1,
      weeksOnList: book.weeks_on_list ?? 0,
      listName: listSlug,
      description: book.description?.trim() || null,
    }
  })
}

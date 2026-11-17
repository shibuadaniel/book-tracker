import { loadNytArchive, saveNytArchive, type NytArchivePayload } from '../storage'
import type { ArchivedNytBook, NytListBook } from '../types'
import { NYT_LISTS } from '../types'
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
    list_name_encoded?: string
    published_date?: string
    books?: NytBook[]
  }
}

interface NytOverviewResponse {
  status?: string
  fault?: { faultstring?: string }
  results?: {
    published_date?: string
    lists?: Array<{
      list_name?: string
      list_name_encoded?: string
      books?: NytBook[]
    }>
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

function mapNytBook(
  book: NytBook,
  listSlug: string,
  index: number,
  publishedDate: string,
  fromPastList: boolean,
): ArchivedNytBook {
  const isbn = pickIsbn(book)
  const id = isbn || `${listSlug}-${publishedDate}-${book.rank ?? index}-${book.title ?? 'book'}`
  const coverUrl = book.book_image || (isbn ? coverFromIsbn(isbn, 'L') : null)

  return {
    id,
    title: book.title?.trim() || 'Untitled',
    authors: book.author ? [book.author] : [],
    coverUrl,
    rank: book.rank ?? index + 1,
    weeksOnList: book.weeks_on_list ?? 0,
    listName: listSlug,
    description: book.description?.trim() || null,
    publishedDate,
    fromPastList,
  }
}

function allowedListSlugs(): Set<string> {
  return new Set(NYT_LISTS.map((l) => l.slug))
}

/** Recent Sundays + today-ish dates NYT may accept for weekly lists. */
export function recentNytWeekDates(weeks = 16): string[] {
  const dates: string[] = []
  const d = new Date()
  // Walk back day-by-day to the most recent Sunday, then step by week.
  while (d.getUTCDay() !== 0) {
    d.setUTCDate(d.getUTCDate() - 1)
  }
  for (let i = 0; i < weeks; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 7)
  }
  return dates
}

export async function fetchNytList(
  listSlug: string,
  apiKey: string,
  signal?: AbortSignal,
  date: string = 'current',
): Promise<NytListBook[]> {
  const key = apiKey.trim()
  if (!key) {
    throw new Error('Add your NYT API key in Settings to browse bestsellers.')
  }

  const url = new URL(
    `https://api.nytimes.com/svc/books/v3/lists/${encodeURIComponent(date)}/${encodeURIComponent(listSlug)}.json`,
  )
  url.searchParams.set('api-key', key)

  const res = await fetch(url, { signal })
  const data = (await res.json()) as NytListResponse

  if (!res.ok) {
    const message = data.fault?.faultstring || `NYT request failed (${res.status})`
    throw new Error(message)
  }

  const publishedDate = data.results?.published_date || (date === 'current' ? 'current' : date)
  const fromPastList = date !== 'current'
  const books = data.results?.books ?? []
  return books.map((book, index) =>
    mapNytBook(book, listSlug, index, publishedDate, fromPastList),
  )
}

async function fetchNytOverview(
  apiKey: string,
  publishedDate: string | null,
  signal?: AbortSignal,
): Promise<ArchivedNytBook[]> {
  const url = new URL('https://api.nytimes.com/svc/books/v3/lists/overview.json')
  url.searchParams.set('api-key', apiKey.trim())
  if (publishedDate) url.searchParams.set('published_date', publishedDate)

  const res = await fetch(url, { signal })
  const data = (await res.json()) as NytOverviewResponse
  if (!res.ok) {
    throw new Error(data.fault?.faultstring || `NYT overview failed (${res.status})`)
  }

  const week = data.results?.published_date || publishedDate || 'current'
  const fromPastList = Boolean(publishedDate)
  const allowed = allowedListSlugs()
  const out: ArchivedNytBook[] = []

  for (const list of data.results?.lists ?? []) {
    const slug = list.list_name_encoded || ''
    if (!allowed.has(slug)) continue
    ;(list.books ?? []).forEach((book, index) => {
      out.push(mapNytBook(book, slug, index, week, fromPastList))
    })
  }
  return out
}

function bookKey(book: Pick<NytListBook, 'id' | 'title' | 'authors'>): string {
  if (/^[0-9]{10,13}[0-9Xx]?$/.test(book.id.replace(/-/g, ''))) {
    return `isbn:${book.id.replace(/-/g, '').toLowerCase()}`
  }
  return `t:${book.title.toLowerCase()}|a:${book.authors.join(',').toLowerCase()}`
}

function dedupeBooks(books: ArchivedNytBook[]): ArchivedNytBook[] {
  const map = new Map<string, ArchivedNytBook>()
  for (const book of books) {
    const key = bookKey(book)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, book)
      continue
    }
    // Prefer current-list entries and richer descriptions/covers.
    const preferNew =
      (!book.fromPastList && existing.fromPastList) ||
      ((book.description?.length || 0) > (existing.description?.length || 0)) ||
      (!existing.coverUrl && book.coverUrl)
    if (preferNew) map.set(key, book)
  }
  return [...map.values()]
}

/**
 * Build/refresh a local archive of current + past NYT weeks for the lists we
 * care about. Historical list-by-date still works; the old history *search*
 * endpoint was removed by NYT in 2025.
 */
export async function ensureNytArchive(
  apiKey: string,
  signal?: AbortSignal,
  weeks = 16,
): Promise<ArchivedNytBook[]> {
  const cached = loadNytArchive()
  const freshMs = 12 * 60 * 60 * 1000
  if (cached && Date.now() - cached.fetchedAt < freshMs && cached.books.length > 0) {
    return cached.books
  }

  const dates = recentNytWeekDates(weeks)
  const batches: ArchivedNytBook[] = []

  // Current overview first (no date), then older weeks. Cap concurrency lightly.
  const queue = [null as string | null, ...dates]
  for (let i = 0; i < queue.length; i += 3) {
    if (signal?.aborted) break
    const slice = queue.slice(i, i + 3)
    const settled = await Promise.allSettled(
      slice.map((date) => fetchNytOverview(apiKey, date, signal)),
    )
    for (const result of settled) {
      if (result.status === 'fulfilled') batches.push(...result.value)
    }
  }

  const books = dedupeBooks(batches)
  if (books.length) {
    const payload: NytArchivePayload = { fetchedAt: Date.now(), books }
    saveNytArchive(payload)
  } else if (cached?.books.length) {
    return cached.books
  }
  return books
}

export function searchNytArchive(
  books: ArchivedNytBook[],
  titleQuery: string,
  authorQuery: string,
): ArchivedNytBook[] {
  const title = titleQuery.trim().toLowerCase()
  const author = authorQuery.trim().toLowerCase()
  if (title.length < 2 && author.length < 2) return []

  return books
    .filter((book) => {
      const titleOk = title.length < 2 || book.title.toLowerCase().includes(title)
      const authorOk =
        author.length < 2 ||
        book.authors.some((name) => name.toLowerCase().includes(author))
      return titleOk && authorOk
    })
    .sort((a, b) => Number(a.fromPastList) - Number(b.fromPastList))
    .slice(0, 24)
}

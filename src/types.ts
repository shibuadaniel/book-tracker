export type ReadingStatus = 'want' | 'reading' | 'finished'

export type BookSource = 'search' | 'nyt'

export interface ShelfBook {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  status: ReadingStatus
  source: BookSource
  nytList?: string
  addedAt: string
}

export interface SearchResult {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
}

export interface NytListBook {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  rank: number
  weeksOnList: number
  listName: string
}

export interface NytListOption {
  slug: string
  label: string
}

export const NYT_LISTS: NytListOption[] = [
  { slug: 'hardcover-fiction', label: 'Fiction' },
  { slug: 'hardcover-nonfiction', label: 'Nonfiction' },
  { slug: 'trade-fiction-paperback', label: 'Paperback' },
  { slug: 'young-adult-hardcover', label: 'Young Adult' },
  { slug: 'advice-how-to-and-miscellaneous', label: 'Advice' },
]

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want: 'Want',
  reading: 'Reading',
  finished: 'Finished',
}

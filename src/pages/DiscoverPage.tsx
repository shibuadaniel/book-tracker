import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ensureNytArchive, fetchNytList, searchNytArchive } from '../api/nyt'
import { searchBooks } from '../api/openLibrary'
import { DiscoverBookCard } from '../components/BookCard'
import { BookDetailDialog } from '../components/BookDetailDialog'
import { loadNytArchive } from '../storage'
import type { ArchivedNytBook, BookDetailSeed, NytListBook, ShelfBook } from '../types'
import { NYT_LISTS } from '../types'

interface DiscoverPageProps {
  apiKey: string
  hasKey: boolean
  hasBook: (id: string) => boolean
  onAdd: (book: Omit<ShelfBook, 'addedAt' | 'status'> & { status?: ShelfBook['status'] }) => void
  onOpenSettings: () => void
}

type DiscoverCard = {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  rank?: number
  weeksOnList?: number
  source: 'search' | 'nyt'
  nytList?: string
  description?: string | null
  pastBestSeller?: boolean
}

function mergeCards(nytHits: DiscoverCard[], catalogHits: DiscoverCard[]): DiscoverCard[] {
  const seen = new Set<string>()
  const out: DiscoverCard[] = []
  for (const book of [...nytHits, ...catalogHits]) {
    const key = `${book.title.toLowerCase()}|${book.authors.join(',').toLowerCase()}`
    if (seen.has(key) || seen.has(book.id)) continue
    seen.add(key)
    seen.add(book.id)
    out.push(book)
  }
  return out
}

export function DiscoverPage({ apiKey, hasKey, hasBook, onAdd, onOpenSettings }: DiscoverPageProps) {
  const [titleQuery, setTitleQuery] = useState('')
  const [authorQuery, setAuthorQuery] = useState('')
  const [listSlug, setListSlug] = useState(NYT_LISTS[0].slug)

  const [archive, setArchive] = useState<ArchivedNytBook[]>(() => loadNytArchive()?.books ?? [])
  const [archiveStatus, setArchiveStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [nytHits, setNytHits] = useState<DiscoverCard[]>([])
  const [catalogHits, setCatalogHits] = useState<DiscoverCard[]>([])
  const [listBooks, setListBooks] = useState<NytListBook[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [selected, setSelected] = useState<BookDetailSeed | null>(null)

  const searching = useMemo(() => {
    return titleQuery.trim().length >= 2 || authorQuery.trim().length >= 2
  }, [titleQuery, authorQuery])

  // Prefetch current + past NYT weeks into a local archive for instant search.
  useEffect(() => {
    if (!hasKey) {
      setArchive([])
      setArchiveStatus('idle')
      return
    }

    const controller = new AbortController()
    const hadCache = (loadNytArchive()?.books.length ?? 0) > 0
    setArchiveStatus(hadCache ? 'ready' : 'loading')

    ensureNytArchive(apiKey, controller.signal)
      .then((books) => {
        setArchive(books)
        setArchiveStatus('ready')
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setArchiveStatus(hadCache ? 'ready' : 'error')
      })

    return () => controller.abort()
  }, [apiKey, hasKey])

  // Progressive search: NYT archive instantly, Open Library catalog afterward.
  useEffect(() => {
    if (!searching) {
      setNytHits([])
      setCatalogHits([])
      setSearchError(null)
      setCatalogLoading(false)
      return
    }

    const title = titleQuery.trim()
    const author = authorQuery.trim()
    const localHits = searchNytArchive(archive, title, author).map((book) => ({
      id: book.id,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      rank: book.rank,
      weeksOnList: book.weeksOnList,
      source: 'nyt' as const,
      nytList: book.listName,
      description: book.description,
      pastBestSeller: book.fromPastList,
    }))
    setNytHits(localHits)

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true)
      setSearchError(null)
      try {
        const results = await searchBooks(
          {
            title: title || undefined,
            author: author || undefined,
          },
          controller.signal,
        )
        setCatalogHits(
          results.map((book) => ({
            id: book.id,
            title: book.title,
            authors: book.authors,
            coverUrl: book.coverUrl,
            source: 'search' as const,
          })),
        )
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        // Keep NYT hits even if catalog search fails.
        setSearchError((err as Error).message || 'Catalog search failed')
        setCatalogHits([])
      } finally {
        setCatalogLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [titleQuery, authorQuery, searching, archive])

  // NYT bestsellers when not actively searching
  useEffect(() => {
    if (searching || !hasKey) {
      if (!hasKey) {
        setListBooks([])
        setListError(null)
        setListLoading(false)
      }
      return
    }

    const controller = new AbortController()
    setListLoading(true)
    setListError(null)

    fetchNytList(listSlug, apiKey, controller.signal)
      .then(setListBooks)
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setListBooks([])
        setListError(err.message || 'Could not load bestsellers')
      })
      .finally(() => setListLoading(false))

    return () => controller.abort()
  }, [apiKey, hasKey, listSlug, searching])

  const cards: DiscoverCard[] = searching
    ? mergeCards(nytHits, catalogHits)
    : listBooks.map((book) => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        rank: book.rank,
        weeksOnList: book.weeksOnList,
        source: 'nyt' as const,
        nytList: book.listName,
        description: book.description,
        pastBestSeller: false,
      }))

  const loading = searching ? catalogLoading && cards.length === 0 : listLoading
  const error = searching ? searchError : listError

  const clearSearch = () => {
    setTitleQuery('')
    setAuthorQuery('')
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Discover
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Search by title and/or author. With an NYT key, past bestsellers are included and appear
        instantly.
      </Typography>

      <Stack spacing={1.25} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Title"
          placeholder="e.g. Atomic Habits"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment:
                titleQuery || authorQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear search"
                      size="small"
                      onClick={clearSearch}
                      edge="end"
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
            },
          }}
        />
        <TextField
          size="small"
          label="Author"
          placeholder="e.g. James Clear"
          value={authorQuery}
          onChange={(e) => setAuthorQuery(e.target.value)}
          fullWidth
        />
      </Stack>

      {!searching ? (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Bestsellers
          </Typography>
          {hasKey ? (
            <>
              {archiveStatus === 'loading' ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Caching recent + past NYT lists for faster search…
                </Typography>
              ) : null}
              {archiveStatus === 'ready' && archive.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Search includes {archive.length} titles from current and past NYT lists.
                </Typography>
              ) : null}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  overflowX: 'auto',
                  pb: 1.5,
                  mx: -0.5,
                  px: 0.5,
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {NYT_LISTS.map((list) => (
                  <Chip
                    key={list.slug}
                    label={list.label}
                    clickable
                    color={listSlug === list.slug ? 'primary' : 'default'}
                    variant={listSlug === list.slug ? 'filled' : 'outlined'}
                    onClick={() => setListSlug(list.slug)}
                  />
                ))}
              </Stack>
            </>
          ) : (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={onOpenSettings}>
                  Settings
                </Button>
              }
            >
              Add an NYT API key to browse current lists and search past bestsellers. Open Library
              search still works above without a key.
            </Alert>
          )}
        </>
      ) : (
        <Stack spacing={0.75} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">
            Search results
            {titleQuery.trim() ? ` · title “${titleQuery.trim()}”` : ''}
            {authorQuery.trim() ? ` · author “${authorQuery.trim()}”` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {nytHits.length
              ? `${nytHits.length} from NYT archive`
              : hasKey
                ? 'No NYT archive matches'
                : 'Add an NYT key to include past bestsellers'}
            {catalogLoading ? ' · loading catalog…' : catalogHits.length ? ` · ${catalogHits.length} from catalog` : ''}
          </Typography>
        </Stack>
      )}

      {error ? (
        <Alert severity={searching && cards.length ? 'warning' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && searching && cards.length === 0 && !error ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No books found. Try a different title or author.
        </Typography>
      ) : null}

      {!loading && !searching && hasKey && cards.length === 0 && !error ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No titles on this list right now.
        </Typography>
      ) : null}

      {cards.length > 0 ? (
        <Grid container spacing={1.25}>
          {cards.map((book) => (
            <Grid key={`${book.source}-${book.id}`} size={6}>
              <DiscoverBookCard
                title={book.title}
                authors={book.authors}
                coverUrl={book.coverUrl}
                rank={book.rank}
                weeksOnList={book.weeksOnList}
                pastBestSeller={book.pastBestSeller}
                onShelf={hasBook(book.id)}
                onOpen={() =>
                  setSelected({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    coverUrl: book.coverUrl,
                    description: book.description,
                    rank: book.rank,
                    weeksOnList: book.weeksOnList,
                    source: book.source,
                    nytList: book.nytList,
                  })
                }
                onAdd={() =>
                  onAdd({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    coverUrl: book.coverUrl,
                    source: book.source,
                    nytList: book.nytList,
                    description: book.description,
                    status: 'want',
                  })
                }
              />
            </Grid>
          ))}
        </Grid>
      ) : null}

      {searching && catalogLoading && cards.length > 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      ) : null}

      <BookDetailDialog
        open={Boolean(selected)}
        book={selected}
        onClose={() => setSelected(null)}
        onShelf={selected ? hasBook(selected.id) : false}
        onAdd={
          selected
            ? () => {
                onAdd({
                  id: selected.id,
                  title: selected.title,
                  authors: selected.authors,
                  coverUrl: selected.coverUrl,
                  source: selected.source ?? 'search',
                  nytList: selected.nytList,
                  description: selected.description,
                  status: 'want',
                })
                setSelected(null)
              }
            : undefined
        }
      />
    </Box>
  )
}

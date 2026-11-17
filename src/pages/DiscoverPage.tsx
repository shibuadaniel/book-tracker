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
import { fetchNytList } from '../api/nyt'
import { searchBooks } from '../api/openLibrary'
import { DiscoverBookCard } from '../components/BookCard'
import type { NytListBook, SearchResult, ShelfBook } from '../types'
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
}

export function DiscoverPage({ apiKey, hasKey, hasBook, onAdd, onOpenSettings }: DiscoverPageProps) {
  const [titleQuery, setTitleQuery] = useState('')
  const [authorQuery, setAuthorQuery] = useState('')
  const [listSlug, setListSlug] = useState(NYT_LISTS[0].slug)

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [listBooks, setListBooks] = useState<NytListBook[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const searching = useMemo(() => {
    return titleQuery.trim().length >= 2 || authorQuery.trim().length >= 2
  }, [titleQuery, authorQuery])

  // Title / author catalog search (Open Library) — no NYT key required
  useEffect(() => {
    if (!searching) {
      setSearchResults([])
      setSearchError(null)
      setSearchLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      setSearchError(null)
      try {
        const results = await searchBooks(
          {
            title: titleQuery.trim() || undefined,
            author: authorQuery.trim() || undefined,
          },
          controller.signal,
        )
        setSearchResults(results)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setSearchResults([])
        setSearchError((err as Error).message || 'Search failed')
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [titleQuery, authorQuery, searching])

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
    ? searchResults.map((book) => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        source: 'search' as const,
      }))
    : listBooks.map((book) => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        rank: book.rank,
        weeksOnList: book.weeksOnList,
        source: 'nyt' as const,
        nytList: book.listName,
      }))

  const loading = searching ? searchLoading : listLoading
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
        Search by title and/or author, or browse NYT bestsellers.
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
              Add an NYT API key in Settings to browse bestseller lists. Search above works without a
              key.
            </Alert>
          )}
        </>
      ) : (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Search results
          {titleQuery.trim() ? ` · title “${titleQuery.trim()}”` : ''}
          {authorQuery.trim() ? ` · author “${authorQuery.trim()}”` : ''}
        </Typography>
      )}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
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

      {!loading && cards.length > 0 ? (
        <Grid container spacing={1.25}>
          {cards.map((book) => (
            <Grid key={book.id} size={6}>
              <DiscoverBookCard
                title={book.title}
                authors={book.authors}
                coverUrl={book.coverUrl}
                rank={book.rank}
                weeksOnList={book.weeksOnList}
                onShelf={hasBook(book.id)}
                onAdd={() =>
                  onAdd({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    coverUrl: book.coverUrl,
                    source: book.source,
                    nytList: book.nytList,
                    status: 'want',
                  })
                }
              />
            </Grid>
          ))}
        </Grid>
      ) : null}
    </Box>
  )
}

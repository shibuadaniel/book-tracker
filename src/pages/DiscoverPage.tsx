import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { fetchNytList } from '../api/nyt'
import { DiscoverBookCard } from '../components/BookCard'
import type { NytListBook, ShelfBook } from '../types'
import { NYT_LISTS } from '../types'

interface DiscoverPageProps {
  apiKey: string
  hasKey: boolean
  hasBook: (id: string) => boolean
  onAdd: (book: Omit<ShelfBook, 'addedAt' | 'status'> & { status?: ShelfBook['status'] }) => void
  onOpenSettings: () => void
}

export function DiscoverPage({ apiKey, hasKey, hasBook, onAdd, onOpenSettings }: DiscoverPageProps) {
  const [listSlug, setListSlug] = useState(NYT_LISTS[0].slug)
  const [books, setBooks] = useState<NytListBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasKey) {
      setBooks([])
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchNytList(listSlug, apiKey, controller.signal)
      .then(setBooks)
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setBooks([])
        setError(err.message || 'Could not load bestsellers')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [apiKey, hasKey, listSlug])

  if (!hasKey) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center', px: 1 }}>
        <Typography variant="h5" gutterBottom>
          Browse bestsellers
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Add your personal New York Times Books API key in Settings to load current lists.
        </Typography>
        <Button variant="contained" onClick={onOpenSettings}>
          Open Settings
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        NYT Best Sellers — tap Add to put a title on your shelf.
      </Typography>

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

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={1.25}>
          {books.map((book) => (
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
                    source: 'nyt',
                    nytList: book.listName,
                    status: 'want',
                  })
                }
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

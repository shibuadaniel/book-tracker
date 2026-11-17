import AddRoundedIcon from '@mui/icons-material/AddRounded'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { BookCard } from '../components/BookCard'
import type { ReadingStatus, ShelfBook } from '../types'
import { STATUS_LABELS } from '../types'

interface ShelfPageProps {
  books: ShelfBook[]
  onStatusChange: (id: string, status: ReadingStatus) => void
  onRemove: (id: string) => void
  onAddClick: () => void
}

type Filter = 'all' | ReadingStatus

export function ShelfPage({ books, onStatusChange, onRemove, onAddClick }: ShelfPageProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return books
    return books.filter((b) => b.status === filter)
  }, [books, filter])

  return (
    <Box>
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
        <Chip
          label="All"
          clickable
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
          onClick={() => setFilter('all')}
        />
        {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
          <Chip
            key={status}
            label={STATUS_LABELS[status]}
            clickable
            color={filter === status ? 'primary' : 'default'}
            variant={filter === status ? 'filled' : 'outlined'}
            onClick={() => setFilter(status)}
          />
        ))}
      </Stack>

      {filtered.length === 0 ? (
        <Box
          sx={{
            mt: 6,
            textAlign: 'center',
            px: 2,
          }}
        >
          <Typography variant="h5" gutterBottom>
            {books.length === 0 ? 'Your shelf is empty' : 'Nothing in this filter'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {books.length === 0
              ? 'Search for a book or browse bestsellers to start your collection.'
              : 'Try another status filter.'}
          </Typography>
          {books.length === 0 ? (
            <Chip
              icon={<AddRoundedIcon />}
              label="Add a book"
              color="primary"
              clickable
              onClick={onAddClick}
              sx={{ minHeight: 40, px: 1 }}
            />
          ) : null}
        </Box>
      ) : (
        <Grid container spacing={1.25}>
          {filtered.map((book) => (
            <Grid key={book.id} size={6}>
              <BookCard book={book} onStatusChange={onStatusChange} onRemove={onRemove} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

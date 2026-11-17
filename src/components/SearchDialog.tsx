import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import { useEffect, useState } from 'react'
import { searchBooks } from '../api/openLibrary'
import type { SearchResult } from '../types'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (book: SearchResult) => void
  isOnShelf: (id: string) => boolean
}

export function SearchDialog({ open, onClose, onSelect, isOnShelf }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setError(null)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (!open || q.length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await searchBooks(q, controller.signal)
        setResults(next)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError((err as Error).message || 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, open])

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ pr: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="h6" component="span">
            Search books
          </Typography>
          <IconButton aria-label="Close search" onClick={onClose} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Title or author"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            },
          }}
        />

        {error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : null}

        {!error && query.trim().length >= 2 && !loading && results.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No books found.
          </Typography>
        ) : null}

        <List sx={{ mt: 1 }}>
          {results.map((book) => {
            const onShelf = isOnShelf(book.id)
            return (
              <ListItemButton
                key={book.id}
                disabled={onShelf}
                onClick={() => {
                  onSelect(book)
                  onClose()
                }}
                sx={{ borderRadius: 1, mb: 0.5, minHeight: 64 }}
              >
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={book.coverUrl ?? undefined}
                    alt=""
                    sx={{ width: 44, height: 64, bgcolor: 'rgba(15,61,62,0.08)' }}
                  >
                    <MenuBookRoundedIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={book.title}
                  secondary={
                    onShelf
                      ? 'Already on shelf'
                      : book.authors.join(', ') || 'Unknown author'
                  }
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      },
                    },
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </DialogContent>
    </Dialog>
  )
}

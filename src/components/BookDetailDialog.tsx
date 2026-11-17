import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { fetchBookDetails, type BookDetails } from '../api/openLibrary'
import type { BookDetailSeed, ReadingStatus } from '../types'
import { STATUS_LABELS } from '../types'
import { BookCover } from './BookCover'

interface BookDetailDialogProps {
  open: boolean
  book: BookDetailSeed | null
  onClose: () => void
  onShelf: boolean
  onAdd?: () => void
  onRemove?: () => void
  onStatusChange?: (status: ReadingStatus) => void
}

export function BookDetailDialog({
  open,
  book,
  onClose,
  onShelf,
  onAdd,
  onRemove,
  onStatusChange,
}: BookDetailDialogProps) {
  const [details, setDetails] = useState<BookDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !book) {
      setDetails(null)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setDetails({
      id: book.id,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      description: book.description ?? null,
      subjects: [],
      publishDate: null,
    })

    fetchBookDetails(
      {
        id: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        description: book.description,
      },
      controller.signal,
    )
      .then(setDetails)
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setError(err.message || 'Could not load book details')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [open, book])

  const title = details?.title || book?.title || ''
  const authors = details?.authors?.length ? details.authors : book?.authors || []
  const coverUrl = details?.coverUrl || book?.coverUrl || null
  const description = details?.description || book?.description || null

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ pr: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontFamily: '"Fraunces", Georgia, serif' }}>
            Book details
          </Typography>
          <IconButton aria-label="Close details" onClick={onClose} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {!book ? null : (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 120, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                <BookCover coverUrl={coverUrl} title={title} height={180} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h5" sx={{ fontFamily: '"Fraunces", Georgia, serif', lineHeight: 1.2 }}>
                  {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {authors.join(', ') || 'Unknown author'}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}>
                  {typeof book.rank === 'number' ? <Chip size="small" label={`#${book.rank}`} /> : null}
                  {book.weeksOnList ? (
                    <Chip size="small" variant="outlined" label={`${book.weeksOnList} weeks on list`} />
                  ) : null}
                  {book.source === 'nyt' ? <Chip size="small" variant="outlined" label="NYT" /> : null}
                  {details?.publishDate ? (
                    <Chip size="small" variant="outlined" label={details.publishDate} />
                  ) : null}
                </Stack>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            ) : null}

            {error ? <Alert severity="warning">{error}</Alert> : null}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                Synopsis
              </Typography>
              {description ? (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                  {description}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {loading
                    ? 'Loading synopsis…'
                    : 'No synopsis available for this title yet.'}
                </Typography>
              )}
            </Box>

            {details?.subjects?.length ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Subjects
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                  {details.subjects.map((subject) => (
                    <Chip key={subject} size="small" label={subject} variant="outlined" />
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'stretch',
        }}
      >
        {onShelf && onStatusChange && book?.status ? (
          <Select
            size="small"
            value={book.status}
            onChange={(e) => onStatusChange(e.target.value as ReadingStatus)}
            sx={{ flex: 1, minWidth: 120 }}
            aria-label="Reading status"
          >
            {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
              <MenuItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
        ) : null}

        {onShelf ? (
          <Button color="inherit" variant="outlined" onClick={onRemove} sx={{ flex: 1 }}>
            Remove
          </Button>
        ) : (
          <Button variant="contained" onClick={onAdd} sx={{ flex: 1 }}>
            Add to shelf
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

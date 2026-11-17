import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BookCover } from './BookCover'
import type { ReadingStatus, ShelfBook } from '../types'
import { STATUS_LABELS } from '../types'

interface BookCardProps {
  book: ShelfBook
  onOpen: () => void
  onStatusChange: (id: string, status: ReadingStatus) => void
  onRemove: (id: string) => void
}

export function BookCard({ book, onOpen, onStatusChange, onRemove }: BookCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardActionArea onClick={onOpen} sx={{ alignItems: 'stretch', flexGrow: 1 }}>
        <BookCover coverUrl={book.coverUrl} title={book.title} height={168} />
        <CardContent sx={{ flexGrow: 1, p: 1.25, pb: 0.5, '&:last-child': { pb: 0.5 } }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
            }}
          >
            {book.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5,
            }}
          >
            {book.authors.join(', ') || 'Unknown author'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 1, pb: 1, pt: 0.5, gap: 0.5 }}>
        <Select
          size="small"
          value={book.status}
          onChange={(e) => onStatusChange(book.id, e.target.value as ReadingStatus)}
          onClick={(e) => e.stopPropagation()}
          sx={{
            flex: 1,
            fontSize: 12,
            '.MuiSelect-select': { py: 0.75, px: 1 },
          }}
          aria-label={`Status for ${book.title}`}
        >
          {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </Select>
        <IconButton
          aria-label={`Remove ${book.title}`}
          onClick={() => onRemove(book.id)}
          size="small"
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  )
}

interface DiscoverBookCardProps {
  title: string
  authors: string[]
  coverUrl: string | null
  rank?: number
  weeksOnList?: number
  pastBestSeller?: boolean
  onShelf: boolean
  onOpen: () => void
  onAdd: () => void
}

export function DiscoverBookCard({
  title,
  authors,
  coverUrl,
  rank,
  weeksOnList,
  pastBestSeller,
  onShelf,
  onOpen,
  onAdd,
}: DiscoverBookCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardActionArea onClick={onOpen} sx={{ alignItems: 'stretch', flexGrow: 1 }}>
        <BookCover coverUrl={coverUrl} title={title} height={168} />
        <CardContent sx={{ flexGrow: 1, p: 1.25, pb: 0.75 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
            {pastBestSeller ? <Chip size="small" color="secondary" label="Past NYT" /> : null}
            {!pastBestSeller && typeof rank === 'number' ? (
              <Chip size="small" label={`#${rank}`} />
            ) : null}
            {!pastBestSeller && weeksOnList ? (
              <Chip size="small" variant="outlined" label={`${weeksOnList} wk`} />
            ) : null}
          </Stack>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5,
            }}
          >
            {authors.join(', ') || 'Unknown author'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 1, pb: 1, pt: 0 }}>
        <Chip
          clickable={!onShelf}
          onClick={onShelf ? undefined : onAdd}
          label={onShelf ? 'On shelf' : 'Add'}
          color={onShelf ? 'default' : 'primary'}
          variant={onShelf ? 'outlined' : 'filled'}
          sx={{ width: '100%', minHeight: 36, fontWeight: 600 }}
        />
      </CardActions>
    </Card>
  )
}

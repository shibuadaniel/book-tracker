import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import Box from '@mui/material/Box'

interface BookCoverProps {
  coverUrl: string | null
  title: string
  height?: number | string
}

export function BookCover({ coverUrl, title, height = 180 }: BookCoverProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        bgcolor: 'rgba(15, 61, 62, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {coverUrl ? (
        <Box
          component="img"
          src={coverUrl}
          alt={`${title} cover`}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(event) => {
            const target = event.currentTarget
            target.style.display = 'none'
            const fallback = target.nextElementSibling as HTMLElement | null
            if (fallback) fallback.style.display = 'flex'
          }}
        />
      ) : null}
      <Box
        sx={{
          display: coverUrl ? 'none' : 'flex',
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.light',
          flexDirection: 'column',
          gap: 0.5,
          px: 1,
          textAlign: 'center',
        }}
      >
        <MenuBookRoundedIcon fontSize="large" />
      </Box>
    </Box>
  )
}

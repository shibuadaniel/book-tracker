import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

interface SettingsPageProps {
  apiKey: string
  onSave: (key: string) => void
  onClear: () => void
}

export function SettingsPage({ apiKey, onSave, onClear }: SettingsPageProps) {
  const [draft, setDraft] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(apiKey)
  }, [apiKey])

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Book Tracker is generic — each person uses their own New York Times Books API key.
        Keys stay in this browser only.
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="NYT Books API key"
          type="password"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setSaved(false)
          }}
          fullWidth
          autoComplete="off"
          helperText={
            <>
              Get a free key at{' '}
              <Link
                href="https://developer.nytimes.com/get-started"
                target="_blank"
                rel="noreferrer"
              >
                developer.nytimes.com
              </Link>{' '}
              and enable the Books API.
            </>
          }
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() => {
              onSave(draft)
              setSaved(true)
            }}
          >
            Save key
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            disabled={!apiKey && !draft}
            onClick={() => {
              setDraft('')
              onClear()
              setSaved(false)
            }}
          >
            Clear
          </Button>
        </Stack>

        {saved ? <Alert severity="success">API key saved on this device.</Alert> : null}
        {apiKey ? (
          <Alert severity="info">A key is saved. Discover will use it for bestseller lists.</Alert>
        ) : (
          <Alert severity="warning">No key saved yet. Discover stays locked until you add one.</Alert>
        )}
      </Stack>
    </Box>
  )
}

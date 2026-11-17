import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import AppBar from '@mui/material/AppBar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Fab from '@mui/material/Fab'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { SearchDialog } from './components/SearchDialog'
import { useNytApiKey } from './hooks/useNytApiKey'
import { useShelf } from './hooks/useShelf'
import { DiscoverPage } from './pages/DiscoverPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShelfPage } from './pages/ShelfPage'
import type { SearchResult } from './types'

type Tab = 'shelf' | 'discover' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('shelf')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const { books, addBook, removeBook, setStatus, hasBook } = useShelf()
  const { apiKey, setApiKey, clearApiKey, hasKey } = useNytApiKey()

  const handleSelectSearch = (book: SearchResult) => {
    addBook({
      id: book.id,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      source: 'search',
      status: 'want',
    })
    setToast(`Added “${book.title}”`)
    setTab('shelf')
  }

  return (
    <Box sx={{ pb: '88px', minHeight: '100dvh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(247, 250, 251, 0.85)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontWeight: 700,
              color: 'primary.main',
              flexGrow: 1,
            }}
          >
            Book Tracker
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {books.length} on shelf
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 2, px: 1.5 }}>
        {tab === 'shelf' ? (
          <ShelfPage
            books={books}
            onStatusChange={setStatus}
            onRemove={removeBook}
            onAddClick={() => setSearchOpen(true)}
          />
        ) : null}
        {tab === 'discover' ? (
          <DiscoverPage
            apiKey={apiKey}
            hasKey={hasKey}
            hasBook={hasBook}
            onAdd={(book) => {
              addBook(book)
              setToast(`Added “${book.title}”`)
            }}
            onOpenSettings={() => setTab('settings')}
          />
        ) : null}
        {tab === 'settings' ? (
          <SettingsPage apiKey={apiKey} onSave={setApiKey} onClear={clearApiKey} />
        ) : null}
      </Container>

      {(tab === 'shelf' || tab === 'discover') && (
        <Fab
          color="primary"
          aria-label="Search and add a book"
          onClick={() => setSearchOpen(true)}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          <AddRoundedIcon />
        </Fab>
      )}

      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          showLabels
          value={tab}
          onChange={(_, value: Tab) => setTab(value)}
        >
          <BottomNavigationAction
            label="Shelf"
            value="shelf"
            icon={<MenuBookRoundedIcon />}
          />
          <BottomNavigationAction
            label="Discover"
            value="discover"
            icon={<ExploreRoundedIcon />}
          />
          <BottomNavigationAction
            label="Settings"
            value="settings"
            icon={<SettingsRoundedIcon />}
          />
        </BottomNavigation>
      </Paper>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectSearch}
        isOnShelf={hasBook}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  )
}

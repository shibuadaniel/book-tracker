import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#0f3d3e',
      light: '#2a6a6b',
      dark: '#082728',
      contrastText: '#f4fbfa',
    },
    secondary: {
      main: '#2f6f73',
      contrastText: '#f4fbfa',
    },
    background: {
      default: '#eef3f4',
      paper: '#f7fafb',
    },
    text: {
      primary: '#142022',
      secondary: '#4a5c5e',
    },
    divider: 'rgba(15, 61, 62, 0.12)',
  },
  typography: {
    fontFamily: '"Figtree", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100dvh',
          backgroundImage:
            'radial-gradient(1200px 600px at 10% -10%, rgba(159, 208, 203, 0.5), transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(47, 111, 115, 0.12), transparent 50%), linear-gradient(180deg, #e8f0f1 0%, #eef3f4 40%, #e7ecec 100%)',
          backgroundAttachment: 'fixed',
        },
        '#root': {
          minHeight: '100dvh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(15, 61, 62, 0.1)',
          backgroundImage: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: '1px solid rgba(15, 61, 62, 0.1)',
          backgroundColor: 'rgba(247, 250, 251, 0.92)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 4,
        },
      },
    },
  },
})

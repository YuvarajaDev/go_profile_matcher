import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#282b4a',
      light: '#3d4270',
      dark: '#1a1d32',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f4c310',
      light: '#f7d24a',
      dark: '#c9a00a',
      contrastText: '#282b4a',
    },
    background: {
      default: '#f5f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1d32',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
})

export default theme

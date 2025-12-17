import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4', // Cyan สำหรับปุ่มหรือ Highlight
    },
    background: {
      default: '#0a0e17', // สีพื้นหลังเข้มจัด (Deep Navy/Black)
      paper: '#111625',   // สี Card
    },
    success: {
      main: '#00e676', // เขียวนีออนสำหรับสถานะปกติ
    },
    error: {
      main: '#ff1744', // แดงสดสำหรับ Spark/Alarm
    },
    warning: {
      main: '#ff9100',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.5)',
        },
      },
    },
  },
});
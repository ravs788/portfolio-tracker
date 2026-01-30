import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Wizard from './components/Wizard';
import Results from './components/Results';
import Landing from './components/Landing';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
const Charts = lazy(() => import('./components/Charts'));

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={false} sx={{ p: 0 }}>
        {/* Fixed, viewport-centered header that stays above all content during horizontal scroll */}
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.modal + 1, // above dialogs, tables, etc.
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            align="center"
            sx={{
              pointerEvents: 'auto',
              px: 2,
              borderRadius: 1,
              bgcolor: 'background.paper', // prevent dark/black overlays from covering the text
            }}
          >
            Joint Portfolio Planner
          </Typography>
        </Box>
        {/* Spacer to prevent content from being hidden under the fixed header */}
        <Box sx={{ height: 72 }} />
        <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/results" element={<Results />} />
            <Route path="/charts" element={<Charts />} />
          </Routes>
        </Suspense>
      </Container>
    </ThemeProvider>
  );
}

export default App;

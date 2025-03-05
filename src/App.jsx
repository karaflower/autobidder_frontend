import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box, IconButton } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Cookies from 'js-cookie';
import 'react-toastify/dist/ReactToastify.css';
import TeamManagement from './pages/TeamManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import BidLinks from './pages/BidLinks';
import Resume from './pages/Resume';
import Navigation from './pages/Navigation';
import SearchQueries from './pages/SearchQueries';
import Login from './pages/Login';
import AiPrompts from './pages/AiPrompts';
import Settings from './pages/Settings';
import BidHistory from './pages/BidHistory';
import BossDashboard from './pages/BossDashboard';
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#0ea5e9', // Sky blue
      light: '#38bdf8',
      dark: '#0284c7',
    },
    secondary: {
      main: '#14b8a6', // Teal
      light: '#2dd4bf',
      dark: '#0d9488',
    },
    background: {
      default: mode === 'dark' ? '#0f172a' : '#f8fafc', // Slate dark/light
      paper: mode === 'dark' ? '#1e293b' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f1f5f9' : '#1f293b',
      secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
    },
    error: {
      main: '#ef4444', // Red
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
    },
    info: {
      main: '#3b82f6', // Blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: mode === 'dark' ? '#334155' : '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: mode === 'dark' 
            ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [mode, setMode] = useState(Cookies.get('theme') || 'light');
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    Cookies.set('theme', newMode, { expires: 365 });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1100 }}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Box sx={{ display: 'flex' }}>
                    <Navigation 
                      isNavExpanded={isNavExpanded} 
                      setIsNavExpanded={setIsNavExpanded} 
                    />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        ml: isNavExpanded ? '250px' : '65px',
                        mt: 4,
                        p: 3,
                        minHeight: '100vh',
                        bgcolor: 'background.default',
                        transition: 'margin-left 0.3s ease',
                        width: `calc(100% - ${isNavExpanded ? '250px' : '65px'})`,
                      }}
                    >
                      <Routes>
                        <Route path="/" element={<BidLinks />} />
                        <Route path="/resumes" element={<Resume />} />
                        <Route path="/search-queries" element={<SearchQueries />} />
                        <Route path="/ai-prompts" element={<AiPrompts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/bid-history" element={<BidHistory />} />
                        <Route path="/boss-dashboard" element={
                          <ProtectedRoute requiredRole="boss">
                            <BossDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/team-management" element={
                          <ProtectedRoute requiredRole="boss">
                            <TeamManagement />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Box>
                  </Box>
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastContainer 
            theme={mode} 
            position="top-center"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

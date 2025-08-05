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
import TermsAndPrivacy from './pages/TermsAndPrivacy';
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#00c8ff' : '#0ea5e9', // Bright cyan in dark mode
      light: mode === 'dark' ? '#4dd8ff' : '#38bdf8',
      dark: mode === 'dark' ? '#00a6d6' : '#0284c7',
    },
    secondary: {
      main: mode === 'dark' ? '#4ec9b0' : '#14b8a6', // VS Code teal in dark mode
      light: mode === 'dark' ? '#6de0c5' : '#2dd4bf',
      dark: mode === 'dark' ? '#3aa692' : '#0d9488',
    },
    background: {
      default: mode === 'dark' ? '#1a1a1a' : '#f8fafc', // Slightly darker background
      paper: mode === 'dark' ? '#232323' : '#ffffff', // Refined paper background
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#1f293b', // Pure white text in dark mode
      secondary: mode === 'dark' ? '#e0e0e0' : '#64748b', // Much lighter secondary text
    },
    error: {
      main: mode === 'dark' ? '#ff5252' : '#ef4444', // Brighter red in dark mode
      light: mode === 'dark' ? '#ff7b7b' : '#f87171',
      dark: mode === 'dark' ? '#ff3838' : '#dc2626',
    },
    warning: {
      main: mode === 'dark' ? '#ffab2e' : '#f59e0b', // Brighter amber in dark mode
      light: mode === 'dark' ? '#ffc166' : '#fbbf24',
      dark: mode === 'dark' ? '#ff9900' : '#d97706',
    },
    success: {
      main: mode === 'dark' ? '#2cdb92' : '#10b981', // Brighter emerald in dark mode
      light: mode === 'dark' ? '#4fe7a8' : '#34d399',
      dark: mode === 'dark' ? '#1fcf86' : '#059669',
    },
    info: {
      main: mode === 'dark' ? '#00d9ff' : '#3b82f6', // Brighter cyan in dark mode
      light: mode === 'dark' ? '#73e6ff' : '#60a5fa',
      dark: mode === 'dark' ? '#00afd1' : '#2563eb',
    },
    divider: mode === 'dark' ? '#404040' : '#e2e8f0', // Better divider color
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
    h2: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
    h3: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
    h4: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
    h5: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
    h6: {
      fontWeight: 600,
      ...(mode === 'dark' && { color: '#ffffff' }),
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          ...(mode === 'dark' && {
            color: '#ffffff',
          }),
        },
        containedPrimary: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            boxShadow: '0 2px 10px rgba(0, 200, 255, 0.2)',
            '&:hover': {
              backgroundColor: '#4dd8ff',
              boxShadow: '0 4px 12px rgba(0, 200, 255, 0.3)',
            },
          }),
        }),
        outlined: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            borderColor: '#404040',
            '&:hover': {
              borderColor: '#00c8ff',
              backgroundColor: 'rgba(0, 200, 255, 0.08)',
            },
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          ...(mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0))',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          ...(mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0))',
          }),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundColor: '#1c1c1c',
            backgroundImage: 'none',
          }),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          ...(mode === 'dark' && {
            backgroundColor: '#1c1c1c',
            backgroundImage: 'none',
            borderRight: '1px solid #333333',
          }),
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 200, 255, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(0, 200, 255, 0.2)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }),
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#00c8ff',
          }),
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }),

        }),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          ...(mode === 'dark' && {
            '&.Mui-checked': {
              color: '#00c8ff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#00a6d6',
              },
            },
          }),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundColor: '#333333',
          }),
        },
        colorPrimary: {
          ...(mode === 'dark' && {
            backgroundColor: 'rgba(0, 200, 255, 0.15)',
            color: '#4dd8ff',
          }),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...(mode === 'dark' && {
            backgroundColor: '#333333',
            border: '1px solid #4d4d4d',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }),
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          ...(mode === 'dark' && {
            scrollbarColor: '#4d4d4d #1a1a1a',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#1a1a1a',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#4d4d4d',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#666666',
              },
            },
          }),
        },
      },
    },
  },
});

const ProtectedRoute = ({ children, forbiddenRole, requiredRole }) => {
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

  if (forbiddenRole && user.role === forbiddenRole) {
    return <Navigate to="/" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return typeof children === 'function' ? children({ user }) : children;
};

function App() {
  const [mode, setMode] = useState(Cookies.get('theme') || 'dark');
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
            <Route path="/terms-and-privacy" element={<TermsAndPrivacy />} />
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
                        ml: isNavExpanded ? '220px' : '65px',
                        mt: 1,
                        p: 3,
                        minHeight: '100vh',
                        bgcolor: 'background.default',
                        transition: 'margin-left 0.3s ease',
                        width: `calc(100% - ${isNavExpanded ? '220px' : '65px'})`,
                      }}
                    >
                      <Routes>
                        <Route path="/" element={
                          <ProtectedRoute>
                            {({ user }) => 
                              user.role === 'boss' ? <BossDashboard /> : <BidLinks />
                            }
                          </ProtectedRoute>
                        } />
                        <Route path="/resumes" element={
                          <ProtectedRoute forbiddenRole="bidder">
                            <Resume />
                          </ProtectedRoute>
                        } />
                        <Route path="/search-queries" element={
                          <ProtectedRoute forbiddenRole="bidder">
                            <SearchQueries />
                          </ProtectedRoute>
                        } />
                        <Route path="/ai-prompts" element={
                          <ProtectedRoute forbiddenRole="bidder">
                            <AiPrompts />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/bid-history" element={
                          <ProtectedRoute forbiddenRole="bidder">
                            <BidHistory />
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

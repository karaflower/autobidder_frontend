import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, CircularProgress, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import BidLinks from './components/BidLinks';
import Resume from './components/Resume';
import Navigation from './components/Navigation';
import SearchQueries from './components/SearchQueries';
import Login from './components/Login';
import AiPrompts from './components/AiPrompts';
import Settings from './components/Settings';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children }) => {
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

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                      <Routes>
                        <Route path="/" element={<BidLinks />} />
                        <Route path="/resume" element={<Resume />} />
                        <Route path="/search-queries" element={<SearchQueries />} />
                        <Route path="/ai-prompts" element={<AiPrompts />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </Container>
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

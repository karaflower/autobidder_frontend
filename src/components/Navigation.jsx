import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';

const Navigation = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  const handleLogoutClick = () => {
    setOpenDialog(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
    setOpenDialog(false);
  };

  const handleCancelLogout = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bid Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              startIcon={<LinkIcon />}
            >
              Bid Links
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/bid-history"
              startIcon={<HistoryIcon />}
            >
              Bid History
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/resume"
              startIcon={<DescriptionIcon />}
            >
              Resumes
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/search-queries"
              startIcon={<SearchIcon />}
            >
              Search Queries
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/ai-prompts"
              startIcon={<SmartToyIcon />}
            >
              AI Prompts
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/settings"
              startIcon={<SettingsIcon />}
            >
              Settings
            </Button>
            <IconButton
              color="inherit"
              onClick={handleLogoutClick}
              sx={{ ml: 1 }}
            >
              <LogoutIcon/>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={openDialog} onClose={handleCancelLogout}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to logout?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmLogout} color="primary">
            Logout
          </Button>
          <Button onClick={handleCancelLogout}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navigation; 
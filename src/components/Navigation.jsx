import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
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
          <Box>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
            >
              Bid Links
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/resume"
            >
              Resumes
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/search-queries"
            >
              Search Queries
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/ai-prompts"
            >
              AI Prompts
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/settings"
            >
              Settings
            </Button>
            <IconButton
              color="inherit"
              onClick={handleLogoutClick}
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
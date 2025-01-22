import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: 250,
          flexShrink: 0,
          height: '100vh',
          bgcolor: 'background.paper',
          position: 'fixed',
          left: 0,
          top: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
            Bid Manager
          </Typography>
        </Box>
        
        <List>
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon>
              <LinkIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Bid Links" />
          </ListItemButton>

          <ListItemButton component={RouterLink} to="/bid-history">
            <ListItemIcon>
              <HistoryIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Bid History" />
          </ListItemButton>

          <ListItemButton component={RouterLink} to="/resume">
            <ListItemIcon>
              <DescriptionIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Resumes" />
          </ListItemButton>

          <ListItemButton component={RouterLink} to="/search-queries">
            <ListItemIcon>
              <SearchIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Search Queries" />
          </ListItemButton>

          <ListItemButton component={RouterLink} to="/ai-prompts">
            <ListItemIcon>
              <SmartToyIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="AI Prompts" />
          </ListItemButton>

          <ListItemButton component={RouterLink} to="/settings">
            <ListItemIcon>
              <SettingsIcon sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>

        <Box sx={{ bottom: 0, width: '100%', p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={() => setOpenDialog(true)}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to logout?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            logout();
            navigate('/login');
            setOpenDialog(false);
          }} color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navigation; 
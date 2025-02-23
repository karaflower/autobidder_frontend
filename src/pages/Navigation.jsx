import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';

const Navigation = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const location = useLocation();
  
  const renderNavigationItems = () => {
    if (user?.role === 'boss') {
      return (
        <>
          <ListItemButton
            component={RouterLink}
            to="/boss-dashboard"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "action.selected",
              },
            }}
            selected={location.pathname === "/boss-dashboard"}
          >
            <ListItemIcon>
              <SmartToyIcon sx={{ color: "primary.main" }} />
            </ListItemIcon>
            <ListItemText primary="Bid Histories" />
          </ListItemButton>
          <ListItemButton
            component={RouterLink}
            to="/team-management"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "action.selected",
              },
            }}
            selected={location.pathname === "/team-management"}
          >
            <ListItemIcon>
              <PeopleIcon sx={{ color: "primary.main" }} />
            </ListItemIcon>
            <ListItemText primary="Team Management" />
          </ListItemButton>
        </>
      );
    }

    return (
      <>
        <ListItemButton
          component={RouterLink}
          to="/"
          selected={location.pathname === "/"}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
        >
          <ListItemIcon>
            <LinkIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="Bid Links" />
        </ListItemButton>

        <ListItemButton
          component={RouterLink}
          to="/bid-history"
          selected={location.pathname === "/bid-history"}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
        >
          <ListItemIcon>
            <HistoryIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="Bid History" />
        </ListItemButton>

        <ListItemButton
          component={RouterLink}
          to="/customized-resumes"
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
          selected={location.pathname === "/customized-resumes"}
        >
          <ListItemIcon>
            <DescriptionIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="Customized Resumes" />
        </ListItemButton>

        <ListItemButton
          component={RouterLink}
          to="/resumes"
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
          selected={location.pathname === "/resumes"}
        >
          <ListItemIcon>
            <DescriptionIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="Resumes" />
        </ListItemButton>

        <ListItemButton
          component={RouterLink}
          to="/search-queries"
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
          selected={location.pathname === "/search-queries"}
        >
          <ListItemIcon>
            <SearchIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="Search Queries" />
        </ListItemButton>

        <ListItemButton
          component={RouterLink}
          to="/ai-prompts"
          sx={{
            "&.Mui-selected": {
              backgroundColor: "action.selected",
            },
          }}
          selected={location.pathname === "/ai-prompts"}
        >
          <ListItemIcon>
            <SmartToyIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primary="AI Prompts" />
        </ListItemButton>
      </>
    );
  };

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: 250,
          flexShrink: 0,
          height: "100vh",
          bgcolor: "background.paper",
          position: "fixed",
          left: 0,
          top: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: "primary.main" }}>
            Bid Manager
          </Typography>
        </Box>

        <List>
          {renderNavigationItems()}
          <ListItemButton
            component={RouterLink}
            to="/settings"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "action.selected",
              },
            }}
            selected={location.pathname === "/settings"}
          >
            <ListItemIcon>
              <SettingsIcon sx={{ color: "primary.main" }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>

        <Box sx={{ bottom: 0, width: "100%", p: 2 }}>
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
        <DialogContent>Are you sure you want to logout?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              logout();
              navigate("/login");
              setOpenDialog(false);
            }}
            color="error"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navigation; 
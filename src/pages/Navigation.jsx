import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Badge } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gmailExpiryService } from '../services/gmailExpiryService';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const Navigation = ({ isNavExpanded, setIsNavExpanded }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [expiringTokenCount, setExpiringTokenCount] = useState(0);
  const location = useLocation();
  
  // Check Gmail expiry status on component mount and every hour
  useEffect(() => {
    const checkExpiryStatus = async () => {
      if (user && user.role !== 'bidder') {
        const count = await gmailExpiryService.getExpiringTokenCount();
        setExpiringTokenCount(count);
      }
    };

    // Check immediately on mount
    checkExpiryStatus();

    // Set up interval to check every hour (3600000 ms)
    const interval = setInterval(checkExpiryStatus, 3600000);

    return () => clearInterval(interval);
  }, [user]);

  const renderNavigationItems = () => {
    if (user?.role === 'boss') {
      return (
        <>
          <Tooltip title="Bid Histories" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <SmartToyIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="Bid Histories" />}
            </ListItemButton>
          </Tooltip>
          <Tooltip title="Team Management" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/team-management"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/team-management"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <PeopleIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="Team Management" />}
            </ListItemButton>
          </Tooltip>
        </>
      );
    }

    return (
      <>
        <Tooltip title="Bid Links" placement="right" arrow disableHoverListener={isNavExpanded}>
          <ListItemButton
            component={RouterLink}
            to="/"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "action.selected",
              },
              justifyContent: isNavExpanded ? 'initial' : 'center',
              px: 2.5,
            }}
            selected={location.pathname === "/"}
          >
            <ListItemIcon sx={{ 
              minWidth: isNavExpanded ? 56 : 'auto',
              justifyContent: 'center',
            }}>
              <LinkIcon sx={{ color: "primary.main" }} />
            </ListItemIcon>
            {isNavExpanded && <ListItemText primary="Bid Links" />}
          </ListItemButton>
        </Tooltip>

        {user?.role !== 'bidder' && (
          <Tooltip title="Resumes" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/resumes"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/resumes"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <DescriptionIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && (
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>Resumes</span>
                      {expiringTokenCount > 0 && (
                        <Badge 
                          badgeContent={expiringTokenCount} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              minWidth: '18px',
                              height: '18px',
                              borderRadius: '9px',
                            }
                          }}
                        />
                      )}
                    </Box>
                  } 
                />
              )}
            </ListItemButton>
          </Tooltip>
        )}

        {(user?.role === 'lead' || user?.role === 'boss') && (
          <Tooltip title="Job Search" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/search-queries"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/search-queries"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <SearchIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="Job Search" />}
            </ListItemButton>
          </Tooltip>
        )}

        {/* Bid History - Show to all users including bidders */}
        <Tooltip title="Bid History" placement="right" arrow disableHoverListener={isNavExpanded}>
          <ListItemButton
            component={RouterLink}
            to="/bid-history"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "action.selected",
              },
              justifyContent: isNavExpanded ? 'initial' : 'center',
              px: 2.5,
            }}
            selected={location.pathname === "/bid-history"}
          >
            <ListItemIcon sx={{ 
              minWidth: isNavExpanded ? 56 : 'auto',
              justifyContent: 'center',
            }}>
              <HistoryIcon sx={{ color: "primary.main" }} />
            </ListItemIcon>
            {isNavExpanded && <ListItemText primary="Bid History" />}
          </ListItemButton>
        </Tooltip>

        {user?.role !== 'bidder' && (
          <Tooltip title="AI Prompts" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/ai-prompts"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/ai-prompts"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <SmartToyIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="AI Prompts" />}
            </ListItemButton>
          </Tooltip>
        )}
      </>
    );
  };

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: isNavExpanded ? 220 : 65,
          flexShrink: 0,
          height: "100vh",
          bgcolor: "background.paper",
          position: "fixed",
          left: 0,
          top: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          transition: 'width 0.3s ease',
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {isNavExpanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="logo.png" alt="Bid AI Logo" style={{ height: '24px', width: 'auto' }} />
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Bid AI
              </Typography>
            </Box>
          )}
          <IconButton onClick={() => setIsNavExpanded(!isNavExpanded)}>
            {isNavExpanded ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <List>
          {renderNavigationItems()}
          <Tooltip title="Settings" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              component={RouterLink}
              to="/settings"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
              selected={location.pathname === "/settings"}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <SettingsIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="Settings" />}
            </ListItemButton>
          </Tooltip>
          <Tooltip title="Logout" placement="right" arrow disableHoverListener={isNavExpanded}>
            <ListItemButton
              onClick={() => setOpenDialog(true)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                },
                justifyContent: isNavExpanded ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: isNavExpanded ? 56 : 'auto',
                justifyContent: 'center',
              }}>
                <LogoutIcon sx={{ color: "error.main" }} />
              </ListItemIcon>
              {isNavExpanded && <ListItemText primary="Logout" />}
            </ListItemButton>
          </Tooltip>
        </List>
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
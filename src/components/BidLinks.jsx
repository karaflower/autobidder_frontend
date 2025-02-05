import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Link,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Drawer,
  ListItemButton,
  CircularProgress,
  TextField,
  Tooltip,
  Paper,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import VisibilityIcon from '@mui/icons-material/Visibility';

const BidLinks = () => {
  const [bidLinks, setBidLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState('user123');
  const [users, setUsers] = useState({});  // Add this state for users lookup
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showHiddenLinks, setShowHiddenLinks] = useState(() => {
    const stored = localStorage.getItem('showHiddenLinks');
    return stored ? JSON.parse(stored) : false;
  });
  const [hiddenLinks, setHiddenLinks] = useState(() => {
    const stored = localStorage.getItem('hiddenLinks');
    return stored ? JSON.parse(stored) : [];
  });
  const [showFilter, setShowFilter] = useState(() => {
    const stored = localStorage.getItem('showFilter');
    return stored ? JSON.parse(stored) : 'all'; // 'all', 'mine', 'friends'
  });
  const [selectedFriends, setSelectedFriends] = useState(() => {
    const stored = localStorage.getItem('selectedFriends');
    return stored ? JSON.parse(stored) : [];
  });
  const [showFriendsMenu, setShowFriendsMenu] = useState(false);
  const [showBlacklisted, setShowBlacklisted] = useState(() => {
    const stored = localStorage.getItem('showBlacklisted');
    return stored ? JSON.parse(stored) : false;
  });
  const [openBlacklistDialog, setOpenBlacklistDialog] = useState(false);
  const [blacklists, setBlacklists] = useState([]);
  const [newBlacklist, setNewBlacklist] = useState('');
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filteredBidLinks = useMemo(() => {
    const filterLink = (link) => {
      // Search criteria
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchFields = [
          link.title,
          link.url,
          link.description,
          link.company
        ].filter(Boolean);
        
        const meetsSearchCriteria = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        if (!meetsSearchCriteria) return false;
      }

      // Hidden criteria
      if (!showHiddenLinks && hiddenLinks.includes(link._id)) {
        return false;
      }

      // User filter criteria
      if (showFilter === 'mine' && link.created_by !== currentUserId) {
        return false;
      }

      if (showFilter === 'friends') {
        if (selectedFriends.length === 0) {
          // Show all friends' links
          if (!users[link.created_by]) return false;
        } else {
          // Show only selected friends' links
          if (!selectedFriends.includes(link.created_by)) return false;
        }
      }

      // Date criteria
      const linkDate = new Date(link.created_at);
      if (selectedDate) {
        const selected = new Date(selectedDate);
        if (linkDate < selected) return false;
      }

      return true;
    };

    return bidLinks.filter(filterLink);
  }, [
    bidLinks,
    searchTerm,
    showHiddenLinks,
    hiddenLinks,
    showFilter,
    currentUserId,
    selectedFriends,
    users,
    selectedDate
  ]);

  const fetchBidLinks = async (isLoadMore = false) => {
    try {
      if (!isLoadMore && bidLinks.length === 0) {
        setIsLoading(true);
      }
      if (isLoadMore) {
        setIsLoadingMore(true);
      }

      // Clear existing links before fetching new ones
      setBidLinks([]);

      // Convert selectedDate to local timezone's 00:00:00 to 23:59:59
      const fromDate = new Date(selectedDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(selectedDate);
      toDate.setHours(23, 59, 59, 999);

      // Convert to GMT+0
      const fromGMT = new Date(fromDate.getTime());
      const toGMT = new Date(toDate.getTime());

      const params = new URLSearchParams({
        showBlacklisted: showBlacklisted,
        from: fromGMT.toISOString(),
        to: toGMT.toISOString()
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links?${params.toString()}`
      );

      // Sort by date only
      const sortedLinks = response.data.bidLinks.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setBidLinks(sortedLinks);
    } catch (err) {
      console.error('Failed to fetch bid links:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/friends`);
      const usersMap = response.data.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchBlacklists();
    fetchUsers();
    setCurrentUserId(Cookies.get('userid'));
  }, []);

  useEffect(() => {
    fetchBidLinks();
  }, [selectedDate, showBlacklisted]);

  const fetchBlacklists = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`);
      setBlacklists(response.data.blacklists || []);
    } catch (error) {
      console.error('Failed to fetch blacklists:', error);
      toast.error('Failed to fetch blacklists');
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklist.trim()) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: [newBlacklist.trim()]
      });
      setNewBlacklist('');
      await fetchBlacklists();
      await fetchBidLinks();
      toast.success('URL added to blacklist');
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      toast.error('Failed to add to blacklist');
    }
  };

  const handleAddCompanyToBlacklist = async (company) => {
    if (!company) return;
    
    // Optimistically update UI by filtering out links with this company
    const originalLinks = [...bidLinks];
    setBidLinks(prev => prev.filter(link => link.company !== company));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: [company.trim()]
      });
      await fetchBlacklists(); // Still fetch blacklists to update the count
    } catch (error) {
      console.error('Failed to add company to blacklist:', error);
      toast.error('Failed to add company to blacklist');
      // Revert optimistic update on error
      setBidLinks(originalLinks);
    }
  };

  const handleDeleteBlacklist = async (urlToDelete) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        data: { blacklists: [urlToDelete] }
      });
      await fetchBlacklists();
      await fetchBidLinks();
      toast.success('URL removed from blacklist');
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      toast.error('Failed to remove from blacklist');
    }
  };

  const handleToggleHide = (linkId) => {
    setHiddenLinks(prev => {
      const newHiddenLinks = prev.includes(linkId)
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId];
      localStorage.setItem('hiddenLinks', JSON.stringify(newHiddenLinks));
      return newHiddenLinks;
    });
  };

  const handleHideAll = () => {
    const linksToHide = filteredBidLinks.map(link => link._id);
    setHiddenLinks(prev => {
      const newHiddenLinks = [...new Set([...prev, ...linksToHide])];
      localStorage.setItem('hiddenLinks', JSON.stringify(newHiddenLinks));
      return newHiddenLinks;
    });
    toast.success(`${linksToHide.length} link(s) hidden`);
  };

  const handleGlobalSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links/search`, {
          params: {
            searchTerm: searchTerm,
            showBlacklisted: showBlacklisted
          }
        }
      );
      setGlobalSearchResults(Array.isArray(response.data) ? response.data : []);
      setOpenSearchDialog(true);
    } catch (error) {
      console.error('Failed to perform global search:', error);
      toast.error('Failed to perform global search');
    } finally {
      setIsSearching(false);
    }
  };

  const renderBlacklistPanel = () => (
    <Drawer 
      anchor="right"
      open={openBlacklistDialog} 
      onClose={() => setOpenBlacklistDialog(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: '400px',
          padding: 2,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Manage Blacklisted Words</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Add to blacklist"
            value={newBlacklist}
            onChange={(e) => setNewBlacklist(e.target.value)}
            variant="standard"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAddBlacklist}
          >
            Add
          </Button>
        </Box>
        
        <List sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {blacklists.map((url, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteBlacklist(url)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={url} 
                sx={{ 
                  wordBreak: 'break-all',
                  pr: 2
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  const blacklistButton = (
    <Button
      variant="outlined"
      startIcon={<DoNotTouchIcon />}
      onClick={() => setOpenBlacklistDialog(true)}
      size="small"
    >
      Blacklists ({blacklists.length})
    </Button>
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (openBlacklistDialog && e.key === 'Enter' && newBlacklist.trim()) {
        handleAddBlacklist();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [openBlacklistDialog, newBlacklist, handleAddBlacklist]);

  // Add this useEffect for the keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && searchTerm.trim()) {
        handleGlobalSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchTerm, handleGlobalSearch]);

  return (
    <Grid container spacing={2}>
      <ToastContainer />
      <Grid item xs={12}>
        <Box 
          sx={{ 
            mb: 2, 
            position: 'sticky',
            top: 10,
            zIndex: 1000,
            backgroundColor: 'background.default',
            pt: 2,
            pl: 2,
            pb: 2,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <TextField
                      variant='standard'
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      size="small"
                      sx={{ width: '130px' }}
                    />
                  </Grid>
                  
                  <Grid item>
                    <TextField
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      sx={{ width: '150px' }}
                      variant='standard'
                    />
                  </Grid>
                  
                  <Grid item>
                    <Tooltip title="Global Search (Ctrl+Enter)">
                      <Button
                        variant="outlined"
                        onClick={handleGlobalSearch}
                        disabled={isSearching}
                        startIcon={isSearching ? <CircularProgress size={20} /> : null}
                        size="small"
                      >
                        {isSearching ? 'Searching...' : <ManageSearchIcon />}
                      </Button>
                    </Tooltip>
                  </Grid>

                  <Grid item>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showHiddenLinks}
                          onChange={(e) => {
                            setShowHiddenLinks(e.target.checked);
                            localStorage.setItem('showHiddenLinks', JSON.stringify(e.target.checked));
                          }}
                        />
                      }
                      label="Hidden"
                    />
                  </Grid>

                  <Grid item>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityOffIcon />}
                      onClick={handleHideAll}
                      size="small"
                    >
                      Hide All ({filteredBidLinks.length})
                    </Button>
                  </Grid>

                  <Grid item>
                    {blacklistButton}
                  </Grid>

                  <Grid item>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant={showFilter === 'all' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setShowFilter('all');
                          localStorage.setItem('showFilter', JSON.stringify('all'));
                        }}
                        size="small"
                      >
                        All Links
                      </Button>
                      <Button
                        variant={showFilter === 'mine' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setShowFilter('mine');
                          localStorage.setItem('showFilter', JSON.stringify('mine'));
                        }}
                        size="small"
                      >
                        My Links
                      </Button>
                      <Box sx={{ position: 'relative' }}>
                        <Button
                          variant={showFilter === 'friends' ? 'contained' : 'outlined'}
                          onClick={() => {
                            setShowFilter('friends');
                            localStorage.setItem('showFilter', JSON.stringify('friends'));
                          }}
                          endIcon={<KeyboardArrowDownIcon />}
                          onMouseEnter={() => setShowFriendsMenu(true)}
                          onMouseLeave={() => setShowFriendsMenu(false)}
                          size="small"
                        >
                          Friends' Links {selectedFriends.length > 0 && `(${selectedFriends.length})`}
                        </Button>
                        {showFilter === 'friends' && showFriendsMenu && (
                          <Paper
                            sx={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              zIndex: 1000,
                              minWidth: '200px',
                              maxHeight: '300px',
                              overflow: 'auto'
                            }}
                            onMouseEnter={() => setShowFriendsMenu(true)}
                            onMouseLeave={() => setShowFriendsMenu(false)}
                          >
                            <List dense>
                              <ListItem>
                                <ListItemButton
                                  onClick={() => setSelectedFriends([])}
                                >
                                  <ListItemText primary="All Friends" />
                                  {selectedFriends.length === 0 && <CheckIcon color="primary" />}
                                </ListItemButton>
                              </ListItem>
                              <Divider />
                              {Object.entries(users).map(([userId, userName]) => (
                                userId !== currentUserId && (
                                  <ListItem key={userId}>
                                    <ListItemButton
                                      onClick={() => handleFriendToggle(userId)}
                                    >
                                      <ListItemText primary={userName} />
                                      {selectedFriends.includes(userId) && <CheckIcon color="primary" />}
                                    </ListItemButton>
                                  </ListItem>
                                )
                              ))}
                            </List>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          {isLoading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Grid>
          ) : (
            filteredBidLinks.map((link) => (
              <Grid item xs={12} key={link._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Link 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {link.title}
                        </Link>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        
                      {link.company && (
                          <Tooltip title={`Add ${link.company} to blacklist`}>
                            <Button
                              size="small"
                              onClick={() => handleAddCompanyToBlacklist(link.company)}
                              sx={{ minWidth: 'auto', p: 0.5, marginLeft: "8px" }}
                            >
                              <DoNotTouchIcon color="action" />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title={hiddenLinks.includes(link._id) ? "Show Link" : "Hide Link"}>
                          <Button
                            size="small"
                            onClick={() => handleToggleHide(link._id)}
                            sx={{ minWidth: 'auto', p: 0.5, marginLeft: "8px" }}
                          >
                            {hiddenLinks.includes(link._id) ? <VisibilityOffIcon color="action" /> : <VisibilityIcon color="action" />}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Company: {link.company || 'N/A'} | Posted: {link.date || 'N/A'} | Added: {new Date(link.created_at).toLocaleString()} 
                      {link.created_by && users[link.created_by] && (
                        <> | Searched by: {users[link.created_by]}</>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {link.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Grid>

      {renderBlacklistPanel()}

      <Dialog 
        open={openSearchDialog} 
        onClose={() => setOpenSearchDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Global Search Results ({globalSearchResults.length})
        </DialogTitle>
        <DialogContent>
          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {globalSearchResults.map((link) => (
              <ListItem key={link._id} divider>
                <ListItemText
                  primary={
                    <Link 
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >

                      {link.title}
                    </Link>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Company: {link.company || 'N/A'} | Posted: {link.date || 'N/A'} | 
                        Added: {new Date(link.created_at).toLocaleString()}
                        {link.created_by && users[link.created_by] && (
                          <> | By: {users[link.created_by]}</>
                        )}
                      </Typography>
                      <Typography variant="body2">
                        {link.description}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSearchDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default BidLinks; 
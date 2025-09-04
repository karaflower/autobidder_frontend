import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Link,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import CloseIcon from '@mui/icons-material/Close';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import GridViewIcon from '@mui/icons-material/GridView';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './Dashboard';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  ScatterController,
  BarElement,
  BarController,
  Tooltip as ChartTooltip
} from 'chart.js';
import PeopleIcon from '@mui/icons-material/People';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  BarElement,
  BarController,
  Title,
  ChartTooltip,
  Legend
);

const BidHistory = () => {
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidHistoryLoading, setBidHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA');
  });
  const [selectedUser, setSelectedUser] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [selectedBidIndex, setSelectedBidIndex] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [gridViewOpen, setGridViewOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Add these props to pass to Dashboard
  const [dashboardProps, setDashboardProps] = useState(null);

  // Add global user search state variables
  const [globalUserSearchResults, setGlobalUserSearchResults] = useState([]);
  const [isGlobalUserSearching, setIsGlobalUserSearching] = useState(false);
  const [showGlobalUserResults, setShowGlobalUserResults] = useState(false);

  // Step 1: Load user role and team members first
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data and team members in parallel
        const [userResponse, teamResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/auth/user`),
          axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`)
        ]);

        const userData = userResponse.data;
        const teamData = teamResponse.data;

        setUserRole(userData.role);
        setCurrentUserId(userData._id);
        setSelectedUser(userData._id);

        console.log('User role:', userData.role);

        // Set up users list based on role
        if (userData.role === 'lead') {
          // Lead users can see all team members
          const otherUsers = teamData
            .filter(user => user._id !== userData._id)
            .sort((a, b) => {
              // Sort members first, then bidders
              if (a.role === 'bidder' && b.role !== 'bidder') return 1;
              if (a.role !== 'bidder' && b.role === 'bidder') return -1;
              return 0;
            })
            .map(user => ({
              _id: user._id,
              name: `${user.name || user.email} (${user.role === 'bidder' ? 'Bidder' : 'Member'})`
            }));

          setUsersList([
            { _id: userData._id, name: 'My Applications' },
            ...otherUsers
          ]);
        } else {
          // For non-leads: only show current user and their bidders (master relationship)
          const myBidders = teamData
            .filter(user => user.master && user.master.toString() === userData._id.toString())
            .sort((a, b) => {
              // Sort members first, then bidders
              if (a.role === 'bidder' && b.role !== 'bidder') return 1;
              if (a.role !== 'bidder' && b.role === 'bidder') return -1;
              return 0;
            })
            .map(user => ({
              _id: user._id,
              name: `${user.name || user.email} (${user.role === 'bidder' ? 'Bidder' : 'Member'})`
            }));

          setUsersList([
            { _id: userData._id, name: 'My Applications' },
            ...myBidders
          ]);
        }

        // Prepare dashboard props to avoid double loading
        setDashboardProps({
          userRole: userData.role,
          currentUserId: userData._id,
          teamMembers: teamData,
          preloaded: true
        });

        setUserDataLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load user data:', err);
        toast.error('Failed to load user data');
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Step 2: Load bid history after user data is loaded
  useEffect(() => {
    if (!userDataLoaded) return;

    const fetchBidHistory = async () => {
      setBidHistoryLoading(true);
      try {
        const fromDate = new Date(dateFilter);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateFilter);
        toDate.setHours(23, 59, 59, 999);

        const fromGMT = new Date(fromDate.getTime());
        const toGMT = new Date(toDate.getTime());

        const params = {
          fromDate: fromGMT.toISOString(),
          toDate: toGMT.toISOString(),
          userId: selectedUser
        };

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/applications`,
          { params }
        );
        
        setBidHistory(response.data);
        setBidHistoryLoading(false);
      } catch (err) {
        console.error('Failed to fetch bid history:', err);
        setError('Failed to fetch bid history');
        setBidHistoryLoading(false);
      }
    };

    fetchBidHistory();
  }, [dateFilter, selectedUser, userDataLoaded]);

  // Handle user selection change - clear bid history immediately
  const handleUserChange = (newUserId) => {
    setSelectedUser(newUserId);
    setBidHistory([]); // Clear the bid history immediately
    setGlobalSearchResults([]); // Also clear any search results
  };

  const filteredBids = bidHistory.filter(bid => {
    const matchesTitle = bid.url.toLowerCase().includes(titleFilter.toLowerCase());
    return matchesTitle;
  });

  const handleOpenDetails = (bid) => {
    const index = filteredBids.findIndex(item => item._id === bid._id);
    setSelectedBid(bid);
    setSelectedBidIndex(index);
    setDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDialogOpen(false);
    setSelectedBid(null);
    setSelectedBidIndex(null);
    setImageLoading(true);
  };

  const handlePreviousBid = () => {
    if (selectedBidIndex > 0) {
      const newIndex = selectedBidIndex - 1;
      setSelectedBidIndex(newIndex);
      setSelectedBid(filteredBids[newIndex]);
      setImageLoading(true);
    }
  };

  const handleNextBid = () => {
    if (selectedBidIndex < filteredBids.length - 1) {
      const newIndex = selectedBidIndex + 1;
      setSelectedBidIndex(newIndex);
      setSelectedBid(filteredBids[newIndex]);
      setImageLoading(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialogOpen) return;
      
      if (e.key === 'ArrowLeft') {
        handlePreviousBid();
      } else if (e.key === 'ArrowRight') {
        handleNextBid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, selectedBidIndex, filteredBids]);

  const handleGlobalSearch = async () => {
    if (!titleFilter.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/applications/search`, {
          params: { 
            search: titleFilter,
            userId: selectedUser 
          }
        }
      );
      setGlobalSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to perform global search:', error);
      toast.error('Failed to perform global search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setGlobalSearchResults([]);
    setTitleFilter('');
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && titleFilter.trim()) {
        handleGlobalSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [titleFilter]);

  // Add a function to get user name by userId
  const getUserNameById = (userId) => {
    const user = usersList.find(user => user._id === userId);
    return user ? user.name : 'Unknown User';
  };

  const handleGlobalUserSearch = async () => {
    if (!titleFilter.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsGlobalUserSearching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/applications/global-user-search`, {
          params: { 
            search: titleFilter,
            userId: selectedUser
          }
        }
      );
      
      // Map the response data to include user names
      const resultsWithUserNames = Array.isArray(response.data) 
        ? response.data.map(item => ({
            ...item,
            userName: getUserNameById(item.userId)
          }))
        : [];
      
      setGlobalUserSearchResults(resultsWithUserNames);
      setShowGlobalUserResults(true);
    } catch (error) {
      console.error('Failed to perform global user search:', error);
      toast.error('Failed to perform global user search');
    } finally {
      setIsGlobalUserSearching(false);
    }
  };

  const handleClearGlobalUserSearch = () => {
    setGlobalUserSearchResults([]);
    setShowGlobalUserResults(false);
    setTitleFilter('');
  };

  // Update the displayedBids logic to filter search results for non-leads
  const displayedBids = (() => {
    let bids = showGlobalUserResults 
      ? globalUserSearchResults 
      : (globalSearchResults.length > 0 ? globalSearchResults : filteredBids);
    
    // Apply user filtering for non-leads
    if (userRole !== 'lead') {
      const allowedUserIds = usersList.map(user => user._id);
      bids = bids.filter(bid => 
        allowedUserIds.includes(bid.userId) || allowedUserIds.includes(selectedUser)
      );
    }
    
    return bids;
  })();

  // Add a function to check if we should show the user column
  const shouldShowUserColumn = () => {
    // Show user column if we have global user search results
    if (showGlobalUserResults) return true;
    
    // Show user column if we have any bids with user information
    return displayedBids.some(bid => bid.userName || bid.userEmail || bid.userRole);
  };

  const handleDelete = async (bidId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/applications/${bidId}`);
      setBidHistory(prevBids => prevBids.filter(bid => bid._id !== bidId));
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast.error('Failed to delete application');
    }
  };

  const handleOpenDashboard = () => {
    setOpenDashboard(true);
  };

  const handleCloseDashboard = () => {
    setOpenDashboard(false);
  };

  const getTimeScatterData = (bids) => {
    // Filter bids for chart based on user permissions
    let chartBids = bids;
    if (userRole !== 'lead') {
      const allowedUserIds = usersList.map(user => user._id);
      chartBids = bids.filter(bid => 
        allowedUserIds.includes(bid.userId) || allowedUserIds.includes(selectedUser)
      );
    }
    
    return {
      datasets: [{
        label: 'Bid Times',
        data: chartBids.map(bid => ({
          x: new Date(bid.timestamp).getHours() + (new Date(bid.timestamp).getMinutes() / 60),
          y: 1
        })),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        type: 'bar',
        barThickness: 2,
        barPercentage: 0.1,
      }]
    };
  };

  const timeScatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 24,
        title: {
          display: true,
          text: 'Hour of Day'
        },
        ticks: {
          callback: (value) => {
            return `${Math.floor(value)}:${String(Math.floor((value % 1) * 60)).padStart(2, '0')}`;
          }
        }
      },
      y: {
        min: 0,
        max: 1,
        display: false,
        grid: {
          display: false
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Bid Time Distribution'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const hour = Math.floor(context.parsed.x);
            const minute = Math.floor((context.parsed.x % 1) * 60);
            return `Time: ${hour}:${String(minute).padStart(2, '0')}`;
          }
        }
      }
    }
  };

  const handleOpenGridView = () => {
    setGridViewOpen(true);
  };

  const handleCloseGridView = () => {
    setGridViewOpen(false);
  };

  const handleGridItemClick = (bid) => {
    setGridViewOpen(false);
    const index = filteredBids.findIndex(item => item._id === bid._id);
    setSelectedBid(bid);
    setSelectedBidIndex(index);
    setDialogOpen(true);
  };

  const handleCopyAllLinks = () => {
    if (displayedBids.length === 0) {
      toast.error('No links to copy');
      return;
    }
    const allLinks = displayedBids.map(bid => bid.url).join('\n');
    navigator.clipboard.writeText(allLinks)
      .then(() => toast.success('All links copied!'))
      .catch(() => toast.error('Failed to copy links'));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '80%', mb: 4, height: '200px' }}>
          <Paper sx={{ p: 2 }}>
            <Scatter 
              data={getTimeScatterData(displayedBids)} 
              options={timeScatterOptions}
            />
          </Paper>
        </Box>
        <Box sx={{ width: '80%', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ minWidth: 200 }}>
            {(userRole === 'lead' || userRole === 'member' || userRole === 'bidder') ? (
              <TextField
                select
                label={userRole === 'lead' ? "User" : "Select Applications"}
                value={selectedUser}
                onChange={(e) => handleUserChange(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
              >
                {usersList.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                My Applications
              </Typography>
            )}
          </Box>
          <Typography variant="subtitle1">
            {globalSearchResults.length > 0 ? 'Search Results' : 'Total'}: {displayedBids.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="info"
              onClick={handleCopyAllLinks}
              startIcon={<ContentCopyIcon />}
            >
              Copy All Links
            </Button>
            <Button
              variant="contained" 
              color="primary" 
              onClick={handleOpenDashboard}
            >
              View Chart
            </Button>
            <Button
              variant="contained" 
              color="secondary" 
              onClick={handleOpenGridView}
              startIcon={<GridViewIcon />}
            >
              View All
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ maxWidth: '80%', padding: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px">#</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                    Link
                    <TextField
                      size="small"
                      placeholder="filter..."
                      value={titleFilter}
                      variant="standard"
                      onChange={(e) => setTitleFilter(e.target.value)}
                      sx={{ ml: 1 }}
                    />
                    <Tooltip title={globalSearchResults.length > 0 ? "Clear Search" : "Global Search (Ctrl+Enter)"}>
                      <Button
                        variant="outlined"
                        onClick={globalSearchResults.length > 0 ? handleClearSearch : handleGlobalSearch}
                        disabled={isSearching}
                        sx={{ maxWidth: 'max-content' }}
                      >
                        {isSearching ? (
                          <CircularProgress size={20} />
                        ) : globalSearchResults.length > 0 ? (
                          <CloseIcon sx={{ color: 'red' }}/>
                        ) : (
                          <ManageSearchIcon />
                        )}
                      </Button>
                    </Tooltip>
                    {userRole === 'lead' && (
                      <Tooltip title={showGlobalUserResults ? "Clear Global User Search" : "Global User Search"}>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={showGlobalUserResults ? handleClearGlobalUserSearch : handleGlobalUserSearch}
                          disabled={isGlobalUserSearching}
                          sx={{ maxWidth: 'max-content' }}
                        >
                          {isGlobalUserSearching ? (
                            <CircularProgress size={20} />
                          ) : showGlobalUserResults ? (
                            <CloseIcon sx={{ color: 'red' }}/>
                          ) : (
                            <PeopleIcon />
                          )}
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                {shouldShowUserColumn() && <TableCell>User</TableCell>}
                <TableCell>Profile</TableCell>
                <TableCell sx={{ display: 'flex', placeItems: 'baseline', height: '68.5px' }}>
                  Date
                  <TextField
                    type="date"
                    variant="standard"
                    size="small"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ ml:1, maxWidth: '120px' }}
                  />
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedBids.map((bid, index) => (
                <TableRow key={bid._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Link 
                      href={bid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        "&:visited": (theme) => ({
                          color: theme.palette.mode === 'dark' ? '#e0b0ff' : 'purple'
                        })
                      }}
                    >
                      {bid.url.length > 60 ? bid.url.substring(0, 60) + '...' : bid.url}
                    </Link>
                  </TableCell>
                  {shouldShowUserColumn() && (
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {bid.userName || getUserNameById(bid.userId) || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bid.userRole}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    {bid.profile ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          backgroundColor: '#008B8B',
                          color: 'white', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: '0.75rem'
                        }}
                      >
                        {bid.profile}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No profile
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(bid.timestamp).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Link
                        component="button"
                        onClick={() => handleOpenDetails(bid)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Tooltip title="Details">
                          <ViewHeadlineIcon />
                        </Tooltip>
                      </Link>
                      {selectedUser === currentUserId && (
                        <Link
                          component="button"
                          onClick={() => handleDelete(bid._id)}
                          sx={{ cursor: 'pointer', color: 'error.main' }}
                        >
                          <Tooltip title="Delete">
                            <DeleteIcon />
                          </Tooltip>
                        </Link>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Loading indicator below the table */}
          {bidHistoryLoading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: 4,
              borderTop: '1px solid #e0e0e0',
              mt: 2
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                  Loading bid history...
                </Typography>
              </Box>
            </Box>
          )}
        </TableContainer>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Application Details</Typography>
            <Box>
              <Tooltip title="View All Screenshots">
                <Button 
                  onClick={() => {
                    handleCloseDetails();
                    handleOpenGridView();
                  }}
                  sx={{ minWidth: '40px' }}
                >
                  <GridViewIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Previous (Left Arrow)">
                <span>
                  <Button 
                    onClick={handlePreviousBid} 
                    disabled={selectedBidIndex <= 0}
                    sx={{ minWidth: '40px' }}
                  >
                    <NavigateBeforeIcon />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Next (Right Arrow)">
                <span>
                  <Button 
                    onClick={handleNextBid} 
                    disabled={selectedBidIndex >= displayedBids.length - 1}
                    sx={{ minWidth: '40px' }}
                  >
                    <NavigateNextIcon />
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column', my: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>URL</Typography>
              <Link 
                href={selectedBid?.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  "&:visited": (theme) => ({
                    color: theme.palette.mode === 'dark' ? '#e0b0ff' : 'purple'
                  })
                }}
              >
                {selectedBid?.url}
              </Link>
            </Box>
            {selectedBid?.screenshot && (
              <Box>
                <Typography variant="h6" gutterBottom>Screenshot</Typography>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: '200px' }}>
                  {imageLoading && (
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      <CircularProgress />
                    </Box>
                  )}
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/resumefiles/${selectedBid.screenshot}`}
                    alt="Application Screenshot" 
                    style={{ maxWidth: '100%', height: 'auto', display: imageLoading ? 'none' : 'block' }}
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                      // If the image fails to load from the primary source, try the fallback server
                      e.target.onerror = null; // Prevent infinite error loop
                      e.target.src = `${process.env.REACT_APP_API_URL_PROD}/resumefiles/${selectedBid.screenshot}`;
                      setImageLoading(false);
                    }}
                  />
                </Box>
              </Box>
            )}
            
            {selectedBid?.filledFields && selectedBid.filledFields.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Filled Fields</Typography>
                <List>
                  {selectedBid.filledFields.map((field, index) => (
                    field.trim() !== '' && (
                      <ListItem key={index}>
                        <ListItemText primary={field} />
                      </ListItem>
                    )
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" sx={{ mr: 'auto', color: 'text.secondary' }}>
            {selectedBidIndex !== null ? `${selectedBidIndex + 1} of ${displayedBids.length}` : ''}
          </Typography>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={gridViewOpen}
        onClose={handleCloseGridView}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">All Applications</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <ImageList cols={3} gap={16}>
            {displayedBids.filter(bid => bid.screenshot).map((bid) => (
              <ImageListItem 
                key={bid._id} 
                onClick={() => handleGridItemClick(bid)}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                <img
                  src={`${process.env.REACT_APP_API_URL}/resumefiles/${bid.screenshot}`}
                  alt="Application Screenshot"
                  loading="lazy"
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    // If the image fails to load from the primary source, try the fallback server
                    e.target.onerror = null; // Prevent infinite error loop
                    e.target.src = `${process.env.REACT_APP_API_URL_PROD}/resumefiles/${bid.screenshot}`;
                  }}
                />
                <ImageListItemBar
                  title={bid.url.length > 40 ? bid.url.substring(0, 40) + '...' : bid.url}
                  subtitle={new Date(bid.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
              </ImageListItem>
            ))}
          </ImageList>
          {displayedBids.filter(bid => bid.screenshot).length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Typography variant="h6">No screenshots available</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGridView}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDashboard}
        onClose={handleCloseDashboard}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {dashboardProps ? (
            <Dashboard 
              userRole={dashboardProps.userRole}
              currentUserId={dashboardProps.currentUserId}
              teamMembers={dashboardProps.teamMembers}
              preloaded={dashboardProps.preloaded}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidHistory; 
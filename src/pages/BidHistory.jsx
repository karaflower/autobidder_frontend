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
import GradingIcon from '@mui/icons-material/Grading';
import DeleteIcon from '@mui/icons-material/Delete';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Dashboard from './Dashboard';


const BidHistory = () => {
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`);
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/user`);
        setUsersList([
          { _id: userResponse.data._id, name: 'My Applications' },
          ...response.data
            .filter(user => user._id !== userResponse.data._id)
            .map(user => ({
              _id: user._id,
              name: user.name || user.email
            }))
        ]);
        setSelectedUser(userResponse.data._id);
      } catch (err) {
        console.error('Failed to fetch team members:', err);
        toast.error('Failed to fetch team members list');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
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
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch bid history:', err);
        setError('Failed to fetch bid history');
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, selectedUser]);

  const filteredBids = bidHistory.filter(bid => {
    const matchesTitle = bid.url.toLowerCase().includes(titleFilter.toLowerCase());
    return matchesTitle;
  });

  const handleOpenDetails = (bid) => {
    setSelectedBid(bid);
    setDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDialogOpen(false);
    setSelectedBid(null);
  };

  const handleGlobalSearch = async () => {
    if (!titleFilter.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/applications/search`, {
          params: { search: titleFilter }
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
      if (e.ctrlKey && e.key === 'Enter' && titleFilter.trim()) {
        handleGlobalSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [titleFilter]);

  const displayedBids = globalSearchResults.length > 0 ? globalSearchResults : filteredBids;

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
      <ToastContainer />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '80%', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ minWidth: 200 }}>
            <TextField
              select
              label="User"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
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
          </Box>
          <Typography variant="subtitle1">
            {globalSearchResults.length > 0 ? 'Search Results' : 'Total'}: {displayedBids.length}
          </Typography>
          <Button
            variant="contained" 
            color="primary" 
            onClick={handleOpenDashboard}
          >
            View Chart
          </Button>
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
                  </Box>
                </TableCell>
                <TableCell sx={{ display: 'flex', placeItems: 'baseline' }}>
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
                    >
                      {bid.url.length > 60 ? bid.url.substring(0, 60) + '...' : bid.url}
                    </Link>
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
                          <GradingIcon />
                        </Tooltip>
                      </Link>
                      <Link
                        component="button"
                        onClick={() => handleDelete(bid._id)}
                        sx={{ cursor: 'pointer', color: 'error.main' }}
                      >
                        <Tooltip title="Delete">
                          <DeleteIcon />
                        </Tooltip>
                      </Link>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column', my: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>URL</Typography>
              <Link 
                href={selectedBid?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedBid?.url}
              </Link>
            </Box>
            {selectedBid?.screenshot && (
              <Box>
                <Typography variant="h6" gutterBottom>Screenshot</Typography>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/resumefiles/${selectedBid.screenshot}`}
                    alt="Application Screenshot" 
                    style={{ maxWidth: '100%', height: 'auto' }}
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
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDashboard}
        onClose={handleCloseDashboard}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          <Dashboard />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidHistory; 
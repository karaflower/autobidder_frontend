import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import axios from 'axios';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useAuth } from '../context/AuthContext';


const TIME_OPTIONS = [
  { value: 'd', label: 'Past 24 Hours' },
  { value: 'w', label: 'Past Week' },
  { value: 'm', label: 'Past Month' },
  { value: 'y', label: 'Past Year' },
  { value: '', label: 'All Time' },
];

const JOB_SCRAPING_TIME_OPTIONS = [
  { value: '1', label: '1 Day' },
  { value: '2', label: '2 Days' },
  { value: '3', label: '3 Days' },
  { value: '5', label: '5 Days' },
  { value: '7', label: '1 Week' },
  { value: '14', label: '2 Weeks' },
];

const getRelativeTimeString = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
};

const TimeSelectionDialog = ({
  open,
  onClose,
  title,
  selectedTime,
  onTimeSelect,
  onConfirm,
  options = TIME_OPTIONS,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography gutterBottom>Select Time Limit</Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mt: 2, 
        width: '100%',
        flexWrap: 'wrap',
      }}>
        {options.map((option) => (
          <Button
            key={option.value}
            variant={selectedTime === option.value ? 'contained' : 'outlined'}
            onClick={() => onTimeSelect(option.value)}
            sx={{ 
              width: 'calc(33.33% - 8px)',
              bgcolor: selectedTime === option.value ? undefined : 'background.paper'
            }}
          >
            {option.label}
          </Button>
        ))}
      </Box>
    </DialogContent>
    <DialogActions sx={{ pb: 2 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="primary" variant="contained">
        Search
      </Button>
    </DialogActions>
  </Dialog>
);

const SearchTimeline = ({ queries, users }) => {
  const [dateRange, setDateRange] = useState(2); // Days range instead of search limit
  const containerRef = useRef(null);

  // Modified wheel event handler for date range
  useEffect(() => {
    const chartContainer = containerRef.current;
    if (chartContainer) {
      const handleScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Adjust dateRange based on scroll direction
        const delta = Math.sign(e.deltaY);
        setDateRange(prev => {
          const newRange = prev + (delta * 1); // Change by 1 day at a time
          return Math.max(1, Math.min(10, newRange)); // Keep between 1 and 10 days
        });
        
        return false;
      };

      chartContainer.addEventListener('wheel', handleScroll, { passive: false });
      chartContainer.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

      return () => {
        chartContainer.removeEventListener('wheel', handleScroll);
        chartContainer.removeEventListener('touchmove', e => e.preventDefault());
      };
    }
  }, []);

  const formatChartData = () => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (dateRange * 24 * 60 * 60 * 1000));

    return queries
      .filter(query => query.last_search_info?.[0]?.date)
      .map((query, queryIndex) => {
        // Filter searches within date range instead of taking last N
        const searchHistory = query.last_search_info
          .filter(info => new Date(info.date) >= cutoffDate)
          .map(info => ({
            query: query.link,
            shortQuery: query.link.length > 20 ? query.link.substring(0, 20) + '...' : query.link,
            date: new Date(info.date).getTime(),
            formattedDate: new Date(info.date).toLocaleString(),
            relativeTime: getRelativeTimeString(new Date(info.date)),
            searchedBy: users[info.searchedBy] || 'Unknown User',
            dayRange: info.dayRange,
            jobsFound: info.count || 0,
            yAxis: queryIndex + 1
          }));
        return searchHistory;
      })
      .flat()
      .sort((a, b) => a.date - b.date);
  };

  const data = formatChartData();
  const uniqueQueries = [...new Set(data.map(d => d.query))];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Search Timeline (Last {dateRange} {dateRange === 1 ? 'day' : 'days'})
        </Typography>
        <Box 
          sx={{ height: Math.max(300, uniqueQueries.length * 30), mt: 2 }}
          ref={containerRef}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(unixTime) => getRelativeTimeString(new Date(unixTime))}
                name="Time"
              />
              <YAxis
                dataKey="yAxis"
                type="number"
                domain={[0, uniqueQueries.length + 1]}
                ticks={[...Array(uniqueQueries.length)].map((_, i) => i + 1)}
                tickFormatter={(value) => {
                  const data = formatChartData().find(d => d.yAxis === value);
                  return data ? data.shortQuery : '';
                }}
                width={280}
                tick={{ 
                  textAnchor: 'end',
                  width: 270,
                  fontSize: 12,
                  fill: '#666'
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Box sx={{ bgcolor: 'background.paper', p: 1, border: '1px solid grey' }}>
                        <Typography variant="body2">Query: {data.query}</Typography>
                        <Typography variant="body2">Last Search: {data.relativeTime}</Typography>
                        <Typography variant="body2">Jobs Found: {data.jobsFound}</Typography>
                        {data.searchedBy && data.searchedBy !== 'Unknown User' && (
                          <Typography variant="body2">Searched By: {data.searchedBy}</Typography>
                        )}
                        {data.dayRange && (
                          <Typography variant="body2">Day Range: {data.dayRange}</Typography>
                        )}
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                data={formatChartData()}
                fill="#8884d8"
                isAnimationActive={false}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const radius = Math.max(4, Math.min(12, 4 + (payload.jobsFound / 5)));
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={radius} 
                      fill="#8884d8"
                      opacity={0.8}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

const useSearchQueries = () => {
  const [queries, setQueries] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [autoSearchInProgress, setAutoSearchInProgress] = useState(false);
  const [lastAutoSearch, setLastAutoSearch] = useState(null);
  const { user } = useAuth();

  const pollingInterval = useRef(null);

  const fetchQueries = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/search-queries`);
      setQueries(response.data);
      setLastAutoSearch(user.last_auto_search);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch search queries');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/friends/all`);
      const usersMap = response.data.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Modified polling functions
  const startPolling = () => {
    if (pollingInterval.current) return;
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/search-queries`);
        setQueries(response.data);
      } catch (err) {
        console.error('Polling failed:', err);
      }
    }, 15000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const addQuery = async (newQuery) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/search-queries`, {
        link: newQuery
      });
      await fetchQueries();
      return true;
    } catch (err) {
      setError('Failed to add search query');
      return false;
    }
  };

  const deleteQuery = async (queryId) => {
    // Optimistically remove the query from the UI
    const queryToDelete = queries.find(q => q._id === queryId);
    setQueries(prev => prev.filter(q => q._id !== queryId));
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/search-queries/${queryId}`);
      // Query was successfully deleted, no need for notification
    } catch (err) {
      // Restore the query in case of failure
      setQueries(prev => [...prev, queryToDelete]);
      setSnackbar({
        open: true,
        message: 'Failed to delete search query',
        severity: 'error',
      });
      return false;
    }
    return true;
  };

  const executeSearch = async (queryId, timeUnit) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/search/${queryId}`, { timeUnit }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      throw new Error('Failed to execute search: ' + err.message);
    }
  };

  const executeAutoSearch = async (timeUnit) => {
    try {
      setAutoSearchInProgress(true);
      startPolling();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/auto-bid`,
        { timeUnit }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      console.log(err);
      throw new Error('Failed to execute auto-search: ' + err.response.data.error);
    } finally {
      setAutoSearchInProgress(false);
      stopPolling();
    }
  };

  const [jobScrapingInProgress, setJobScrapingInProgress] = useState(false);

  const executeJobScraping = async (timeUnit) => {
    try {
      setJobScrapingInProgress(true);
      startPolling();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/job-scraper`,
        { timeUnit }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      console.log(err);
      throw new Error('Failed to execute job scraping: ' + err.response?.data?.error);
    } finally {
      setJobScrapingInProgress(false);
      stopPolling();
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    fetchQueries();
    fetchUsers();
  }, []);

  return {
    queries,
    users,
    loading,
    error,
    snackbar,
    setSnackbar,
    addQuery,
    deleteQuery,
    executeSearch,
    executeAutoSearch,
    fetchQueries,
    autoSearchInProgress,
    lastAutoSearch,
    jobScrapingInProgress,
    executeJobScraping,
  };
};

const SearchQueries = () => {
  const {
    queries,
    users,
    loading,
    error,
    snackbar,
    setSnackbar,
    addQuery,
    deleteQuery,
    executeSearch,
    executeAutoSearch,
    fetchQueries,
    autoSearchInProgress,
    lastAutoSearch,
    jobScrapingInProgress,
    executeJobScraping,
  } = useSearchQueries();

  const [openDialog, setOpenDialog] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);
  const [searchLoading, setSearchLoading] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedTimeUnit, setSelectedTimeUnit] = useState('');
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [autoSearchLoading, setAutoSearchLoading] = useState(false);
  const [autoSearchDialogOpen, setAutoSearchDialogOpen] = useState(false);
  const [autoSearchTimeUnit, setAutoSearchTimeUnit] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQuery, setEditQuery] = useState('');
  const [queryToEdit, setQueryToEdit] = useState(null);
  const [nextAutoSearchTime, setNextAutoSearchTime] = useState(null);
  const [canAutoSearch, setCanAutoSearch] = useState(false);
  const [jobScrapingLoading, setJobScrapingLoading] = useState(false);
  const [jobScrapingDialogOpen, setJobScrapingDialogOpen] = useState(false);
  const [jobScrapingTimeUnit, setJobScrapingTimeUnit] = useState('');
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);

  useEffect(() => {
    const calculateNextAutoSearch = () => {
      if (!lastAutoSearch) {
        setCanAutoSearch(true);
        return;
      }

      const lastSearch = new Date(lastAutoSearch);
      const now = new Date();
      const nextSearch = new Date(lastSearch.getTime() + 12 * 60 * 60 * 1000); // Add 24 hours
      const timeDiff = nextSearch.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCanAutoSearch(true);
        setNextAutoSearchTime(null);
      } else {
        setCanAutoSearch(false);
        setNextAutoSearchTime(nextSearch);
      }
    };

    calculateNextAutoSearch();
    const interval = setInterval(calculateNextAutoSearch, 1000);
    return () => clearInterval(interval);
  }, [lastAutoSearch]);

  const getTimeRemaining = () => {
    if (!nextAutoSearchTime) return '';
    const now = new Date();
    const diff = nextAutoSearchTime.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleAddQuery = async () => {
    const success = await addQuery(newQuery);
    if (success) {
      setOpenDialog(false);
      setNewQuery('');
    }
  };

  const handleDeleteQuery = async (queryId) => {
    setDeleteDialogOpen(false);
    setQueryToDelete(null);
    await deleteQuery(queryId);
  };

  const handleSearch = async (queryId) => {
    setSearchDialogOpen(false);
    setSelectedTimeUnit('');
    setSearchLoading(queryId);
    try {
      const response = await executeSearch(queryId, selectedTimeUnit);
      setSnackbar({
        open: true,
        message: `Search completed! Found ${response.jobsFound || 0} new jobs.`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to execute search',
        severity: 'error',
      });
    } finally {
      setSearchLoading(null);
      setSelectedQueryId(null);
    }
  };

  const handleAutoSearch = async () => {
    setAutoSearchDialogOpen(false);
    setAutoSearchTimeUnit('');
    setAutoSearchLoading(true);
    try {
      const response = await executeAutoSearch(autoSearchTimeUnit);
      setSnackbar({
        open: true,
        message: `Auto-search completed! Found ${response.jobsFound || 0} new jobs.`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error',
      });
    } finally {
      setAutoSearchLoading(false);
    }
  };

  const handleJobScraping = async () => {
    setJobScrapingDialogOpen(false);
    setJobScrapingTimeUnit('');
    setJobScrapingLoading(true);
    try {
      const response = await executeJobScraping(jobScrapingTimeUnit);
      setSnackbar({
        open: true,
        message: `Job scraping completed! Found ${response.jobsFound || 0} new jobs.`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error',
      });
    } finally {
      setJobScrapingLoading(false);
    }
  };

  const handleSearchClick = (queryId) => {
    setSelectedQueryId(queryId);
    setSearchDialogOpen(true);
  };

  const handleAutoSearchClick = () => {
    setAutoSearchDialogOpen(true);
  };

  const handleEditQuery = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/search-queries/${queryToEdit}`, {
        link: editQuery
      });
      setEditDialogOpen(false);
      setEditQuery('');
      setQueryToEdit(null);
      await fetchQueries();
      setSnackbar({
        open: true,
        message: 'Search query updated successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update search query',
        severity: 'error',
      });
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress size={25} />
  </Box>;

  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleAutoSearchClick}
            disabled={autoSearchLoading || !canAutoSearch}
            sx={{ minWidth: 200 }}
          >
            {autoSearchLoading ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={24}
                    sx={{
                      color: (theme) => theme.palette.grey[300],
                      position: 'absolute',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={75}
                    size={24}
                    color="inherit"
                  />
                </Box>
                Searching...
              </>
            ) : !canAutoSearch ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={20}
                    sx={{
                      color: (theme) => theme.palette.grey[300],
                      position: 'absolute',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={(nextAutoSearchTime - new Date()) / (24 * 60 * 60 * 1000) * 100}
                    size={20}
                    color="inherit"
                  />
                </Box>
                Next auto search in: {getTimeRemaining()}
              </Box>
            ) : (
              'Run Auto Search'
            )}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setJobScrapingDialogOpen(true)}
            disabled={jobScrapingLoading}
            sx={{ minWidth: 200 }}
          >
            {jobScrapingLoading ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={24}
                    sx={{
                      color: (theme) => theme.palette.grey[300],
                      position: 'absolute',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={75}
                    size={24}
                    color="inherit"
                  />
                </Box>
                Scraping...
              </>
            ) : (
              'Run Web3 Jobsite Scraping'
            )}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setTimelineDialogOpen(true)}
          >
            Activity Timeline
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Add Search Query
        </Button>
      </Box>

      <Grid container spacing={3}>
        {queries
          .filter(query => query.link !== 'web3Jobsites')
          .map((query) => (
          <Grid item xs={12} key={query._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      Search Query
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        wordBreak: 'break-word',
                        mb: 2,
                        fontFamily: 'monospace',
                        color: 'text.primary' 
                      }}
                    >
                      {query.link}
                    </Typography>
                    {query.last_search_info && query.last_search_info.length > 0 && (
                      <Box sx={{ 
                        mt: 1,
                        display: 'flex',
                        gap: 2,
                        '& > div': {
                          flex: 1,
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }
                      }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Last Search
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {query.last_search_info?.[0]?.date ? 
                              getRelativeTimeString(new Date(query.last_search_info[0].date)) : 
                              'Never'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Jobs Found
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {query.last_search_info?.[0]?.count || 0}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Searched By
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {users[query.last_search_info?.[0]?.searchedBy] || 'Unknown User'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Time Range
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {query.last_search_info?.[0]?.dayRange ? 
                              `${query.last_search_info[0].dayRange} ${query.last_search_info[0].dayRange === 1 ? 'day' : 'days'}` :
                              'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSearchClick(query._id)}
                      disabled={searchLoading === query._id}
                    >
                      {searchLoading === query._id ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'SEARCH'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        setQueryToEdit(query._id);
                        setEditQuery(query.link);
                        setEditDialogOpen(true);
                      }}
                    >
                      EDIT
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setQueryToDelete(query._id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      DELETE
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            width: '50%'
          }
        }}
      >
        <DialogTitle>Add New Search Query</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Query"
            fullWidth
            variant="outlined"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddQuery} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setQueryToDelete(null);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this search query?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setQueryToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => queryToDelete && handleDeleteQuery(queryToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <TimeSelectionDialog
        open={searchDialogOpen}
        onClose={() => {
          setSearchDialogOpen(false);
          setSelectedTimeUnit('');
          setSelectedQueryId(null);
        }}
        title="Search Settings"
        selectedTime={selectedTimeUnit}
        onTimeSelect={setSelectedTimeUnit}
        onConfirm={() => selectedQueryId && handleSearch(selectedQueryId)}
      />

      <TimeSelectionDialog
        open={autoSearchDialogOpen}
        onClose={() => {
          setAutoSearchDialogOpen(false);
          setAutoSearchTimeUnit('');
        }}
        title="Auto Search Settings"
        selectedTime={autoSearchTimeUnit}
        onTimeSelect={setAutoSearchTimeUnit}
        onConfirm={handleAutoSearch}
      />

      <Dialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          setEditQuery('');
          setQueryToEdit(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            width: '50%'
          }
        }}
      >
        <DialogTitle>Edit Search Query</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Query"
            fullWidth
            variant="outlined"
            value={editQuery}
            onChange={(e) => setEditQuery(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setEditQuery('');
            setQueryToEdit(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleEditQuery} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <TimeSelectionDialog
        open={jobScrapingDialogOpen}
        onClose={() => {
          setJobScrapingDialogOpen(false);
          setJobScrapingTimeUnit('');
        }}
        title="Job Scraping Settings"
        selectedTime={jobScrapingTimeUnit}
        onTimeSelect={setJobScrapingTimeUnit}
        onConfirm={handleJobScraping}
        options={JOB_SCRAPING_TIME_OPTIONS}
      />

      <TimelineDialog
        open={timelineDialogOpen}
        onClose={() => setTimelineDialogOpen(false)}
        queries={queries}
        users={users}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const TimelineDialog = ({ open, onClose, queries, users }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
  >
    <DialogTitle>Activity Timeline</DialogTitle>
    <DialogContent>
      <SearchTimeline queries={queries} users={users} />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default SearchQueries; 
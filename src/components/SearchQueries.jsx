import React, { useState, useEffect } from 'react';
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


const TIME_OPTIONS = [
  { value: 'd', label: 'Past 24 Hours' },
  { value: 'w', label: 'Past Week' },
  { value: 'm', label: 'Past Month' },
  { value: 'y', label: 'Past Year' },
  { value: '', label: 'All Time' },
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
      }}>
        {TIME_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={selectedTime === option.value ? 'contained' : 'outlined'}
            onClick={() => onTimeSelect(option.value)}
            sx={{ 
              width: '100%',
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

const SearchTimeline = ({ queries }) => {
  const formatChartData = () => {
    // Get all queries with their last search date
    const searchData = queries
      .filter(query => query.last_search_info?.[0]?.date)
      .map(query => ({
        query: query.link,
        shortQuery: query.link.length > 20 ? query.link.substring(0, 20) + '...' : query.link,
        date: new Date(query.last_search_info[0].date).getTime(),
        formattedDate: new Date(query.last_search_info[0].date).toLocaleString(),
        relativeTime: getRelativeTimeString(new Date(query.last_search_info[0].date))
      }))
      .sort((a, b) => a.date - b.date);

    // Find min and max dates for the x-axis
    const minDate = Math.min(...searchData.map(d => d.date));
    const maxDate = Math.max(...searchData.map(d => d.date));

    // Create an array of objects where each query has its own y-axis position
    return searchData.map((item, index) => ({
      ...item,
      yAxis: queries.length - index, // Reverse the index to show queries from top to bottom
    }));
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Last Search Timeline
        </Typography>
        <Box sx={{ height: Math.max(300, queries.length * 40), mt: 2 }}>
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
                domain={[0, queries.length + 1]}
                ticks={formatChartData().map(d => d.yAxis)}
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
                    return (
                      <Box sx={{ bgcolor: 'background.paper', p: 1, border: '1px solid grey' }}>
                        <Typography variant="body2">Query: {payload[0].payload.query}</Typography>
                        <Typography variant="body2">Last Search: {payload[0].payload.relativeTime}</Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                data={formatChartData()}
                fill="#8884d8"
                shape={(props) => {
                  const { cx, cy } = props;
                  return (
                    <circle cx={cx} cy={cy} r={6} fill="#8884d8" />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchQueries = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/search-queries`);
      setQueries(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch search queries');
      setLoading(false);
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
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/search-queries/${queryId}`);
      await fetchQueries();
      return true;
    } catch (err) {
      setError('Failed to delete search query');
      return false;
    }
  };

  const executeSearch = async (queryId, timeUnit) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/search/${queryId}`,
        null,
        { params: { timeUnit: timeUnit || undefined } }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      throw new Error('Failed to execute search');
    }
  };

  const executeAutoSearch = async (timeUnit) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/auto-bid`,
        null,
        { params: { timeUnit: timeUnit || undefined } }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      throw new Error('Failed to execute auto-search');
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  return {
    queries,
    loading,
    error,
    snackbar,
    setSnackbar,
    addQuery,
    deleteQuery,
    executeSearch,
    executeAutoSearch,
    fetchQueries,
  };
};

const SearchQueries = () => {
  const {
    queries,
    loading,
    error,
    snackbar,
    setSnackbar,
    addQuery,
    deleteQuery,
    executeSearch,
    executeAutoSearch,
    fetchQueries,
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

  const handleAddQuery = async () => {
    const success = await addQuery(newQuery);
    if (success) {
      setOpenDialog(false);
      setNewQuery('');
    }
  };

  const handleDeleteQuery = async (queryId) => {
    try {
      await deleteQuery(queryId);
      setDeleteDialogOpen(false);
      setQueryToDelete(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete search query',
        severity: 'error',
      });
    }
  };

  const handleSearch = async (queryId) => {
    setSearchDialogOpen(false);
    setSelectedTimeUnit('');
    setSearchLoading(queryId);
    try {
      const response = await executeSearch(queryId, selectedTimeUnit);
      setSnackbar({
        open: true,
        message: `Search completed! Found ${response.jobsFound} new jobs.`,
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
        message: `Auto-search completed! Found ${response.jobsFound} new jobs.`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to execute auto-search',
        severity: 'error',
      });
    } finally {
      setAutoSearchLoading(false);
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
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAutoSearchClick}
          disabled={autoSearchLoading}
        >
          {autoSearchLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Run Auto Search'
          )}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Add Search Query
        </Button>
      </Box>

      <SearchTimeline queries={queries} />

      <Grid container spacing={3}>
        {queries.map((query) => (
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
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Last Search: {query.last_search_info?.[0]?.date ? 
                            getRelativeTimeString(new Date(query.last_search_info[0].date)) : 
                            'Never'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last Jobs Found: {query.last_search_info?.[0]?.count || 0}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
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

export default SearchQueries; 
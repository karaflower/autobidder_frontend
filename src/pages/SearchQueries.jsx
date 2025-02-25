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
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  ListItemButton,
  Chip,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';


const TIME_OPTIONS = [
  { value: 'd', label: 'Past 24 Hours' },
  { value: 'w', label: 'Past Week' },
  { value: 'm', label: 'Past Month' },
  { value: 'y', label: 'Past Year' },
  { value: '', label: 'All Time' },
  { value: 'a', label: 'All above' },
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
  
  // Handle days + hours specially
  if (diffInSeconds >= 86400) { // More than a day
    const days = Math.floor(diffInSeconds / 86400);
    const remainingHours = Math.floor((diffInSeconds % 86400) / 3600);
    
    if (remainingHours === 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    return days === 1 
      ? `1 day ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'} ago`
      : `${days} days ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const intervals = {
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
  filterClosed = true,
  onFilterClosedChange,
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
      {onFilterClosedChange !== null && (
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filterClosed}
                onChange={(e) => onFilterClosedChange(e.target.checked)}
              />
            }
            label="Filter out closed positions"
          />
        </Box>
      )}
    </DialogContent>

    <DialogActions sx={{ pb: 2 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="primary" variant="contained">
        Search
      </Button>
    </DialogActions>
  </Dialog>
);

const SearchTimeline = ({ queries, users, selectedCategories }) => {
  const [dateRange, setDateRange] = useState(2);
  const containerRef = useRef(null);

  // Modified wheel event handler to check for shift key
  useEffect(() => {
    const chartContainer = containerRef.current;
    if (chartContainer) {
      const handleScroll = (e) => {
        // Only prevent default and adjust date range if shift key is pressed
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          
          // Adjust dateRange based on scroll direction
          const delta = Math.sign(e.deltaY);
          setDateRange(prev => {
            const newRange = prev + (delta * 1); // Change by 1 day at a time
            return Math.max(1, Math.min(10, newRange)); // Keep between 1 and 10 days
          });
          
          return false;
        }
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
      // Filter queries based on selected categories
      .filter(query => 
        query.last_search_info?.[0]?.date && 
        (selectedCategories.length === 0 || selectedCategories.includes(query.category))
      )
      .map((query, queryIndex) => {
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
            yAxis: queryIndex + 1,
            category: query.category // Add category information
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Search Timeline (Last {dateRange} {dateRange === 1 ? 'day' : 'days'})
          </Typography>
          {selectedCategories.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Filtered by categories: {selectedCategories.join(', ')}
            </Typography>
          )}
        </Box>
        <Box 
          sx={{ height: Math.max(300, uniqueQueries.length * 30), mt: 2 }}
          ref={containerRef}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                  if (!data) return '';
                  // Truncate text if longer than 40 characters
                  return data.query.length > 40 ? data.query.substring(0, 37) + '...' : data.query;
                }}
                width={350}
                tick={{ 
                  textAnchor: 'end',
                  width: 340,
                  fontSize: 12,
                  fill: '#666',
                  dx: -10
                }}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Box sx={{ bgcolor: 'background.paper', p: 1, border: '1px solid grey' }}>
                        <Typography variant="body2">Query: {data.query}</Typography>
                        <Typography variant="body2">Category: {data.category}</Typography>
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
      const usersMap = {
        [user._id]: user.name // Add current user
      };

      // Fetch team members
      const teamResponse = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`);
      const teamMembers = teamResponse.data;
      
      // Add team members to usersMap
      teamMembers.forEach(member => {
        if (member._id !== user._id) { // Avoid duplicating current user
          usersMap[member._id] = member.name;
        }
      });

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

  const executeSearch = async (queryId, timeUnit, filterClosed) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/search/${queryId}`, { timeUnit, filterClosed }
      );
      await fetchQueries();
      return response.data;
    } catch (err) {
      throw new Error('Failed to execute search: ' + err.message);
    }
  };

  const executeAutoSearch = async (timeUnit, filterClosed, categories) => {
    try {
      setAutoSearchInProgress(true);
      startPolling();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auto-search/auto-bid`,
        { 
          timeUnit, 
          filterClosed,
          categories,
          userId: user._id
        }
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
  const { user } = useAuth();

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
  const [jobScrapingLoading, setJobScrapingLoading] = useState(false);
  const [jobScrapingDialogOpen, setJobScrapingDialogOpen] = useState(false);
  const [jobScrapingTimeUnit, setJobScrapingTimeUnit] = useState('');
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [filterClosed, setFilterClosed] = useState(true);
  const [autoSearchFilterClosed, setAutoSearchFilterClosed] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCategoriesForSearch, setSelectedCategoriesForSearch] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedTimelineCategories, setSelectedTimelineCategories] = useState([]);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchQueries();
  }, [selectedCategoriesForSearch]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/categories`, {
        category: newCategory.trim()
      });
      setNewCategory('');
      fetchCategories();
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category === 'general') return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/categories/${category}`);
      fetchCategories();
      setSelectedCategoriesForSearch(prev => prev.filter(cat => cat !== category));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
    setDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleAddQuery = async () => {
    if (!newQuery.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/search-queries`, {
        link: newQuery,
        category: selectedCategory
      });
      setNewQuery('');
      fetchQueries();
      toast.success('Query added successfully');
    } catch (error) {
      toast.error('Failed to add query');
    }
  };

  const handleDeleteQuery = async (queryId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/search-queries/${queryId}`);
      fetchQueries();
      toast.success('Query deleted successfully');
    } catch (error) {
      toast.error('Failed to delete query');
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategoriesForSearch([category]);
    setSelectedCategory(category);
  };

  const handleQueryMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuery(null);
  };

  const handleSearch = async (queryId) => {
    setSearchDialogOpen(false);
    setSelectedTimeUnit('');
    setSearchLoading(queryId);
    try {
      const response = await executeSearch(queryId, selectedTimeUnit, filterClosed);
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
      // Get all available categories if none are selected
      const categoriesToSearch = selectedCategoriesForSearch.length === 0 
        ? categories.map(category => category) // Send all categories
        : selectedCategoriesForSearch;
        
      const response = await executeAutoSearch(autoSearchTimeUnit, autoSearchFilterClosed, categoriesToSearch);
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
        link: editQuery,
        category: selectedCategory
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

  // Filter queries based only on selected category
  const filteredQueries = queries.filter(query => {
    // Always exclude web3Jobsites query
    if (query.link === 'web3Jobsites') return false;

    // Only filter by category
    return selectedCategory === 'all' || query.category === selectedCategory;
  });

  // Add this before the categories mapping
  const filteredCategories = categories.filter(category => 
    category.name !== 'general' && // Exclude 'general' category if needed
    (!categorySearch || category.name.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  // Remove user filter initialization
  useEffect(() => {
    setSelectedCategory('all');
  }, []);

  // Add this function to handle opening the timeline dialog
  const handleTimelineOpen = () => {
    setTimelineDialogOpen(true);
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress size={25} />
  </Box>;

  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Left Panel - Categories */}
      <Card sx={{ 
        width: 280, 
        height: 'fit-content',
        position: 'sticky',
        top: 20
      }}>
        <CardContent>
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">Categories</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Add Category">
                  <IconButton
                    onClick={() => setOpenCategoryDialog(true)}
                    size="small"
                    color="primary"
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <TextField
              size="small"
              fullWidth
              placeholder="Search categories..."
              variant="outlined"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              sx={{ mb: 1 }}
            />
          </Box>

          <List sx={{ 
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}>
            {filteredCategories
              .filter(category => 
                category.toLowerCase().includes(categorySearch.toLowerCase())
              )
              .map((category) => {
                const bidLinksCount = queries.filter(q => 
                  q.category === category && 
                  q.link !== 'web3Jobsites'
                ).length;

                return (
                  <ListItem
                    key={category}
                    disablePadding
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemButton
                      selected={selectedCategory === category}
                      onClick={() => handleCategorySelect(category)}
                      sx={{ 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        pl: 0,
                      }}
                    >
                      <Checkbox
                        checked={selectedCategoriesForSearch.includes(category)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedCategoriesForSearch(prev => [...prev, category]);
                          } else {
                            setSelectedCategoriesForSearch(prev => 
                              prev.filter(cat => cat !== category)
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography>{category}</Typography>
                        <Chip
                          size="small"
                          label={bidLinksCount}
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category);
                              setNewCategory(category);
                              setOpenCategoryDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category);
                              setDeleteCategoryDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAutoSearchClick}
              disabled={autoSearchLoading}
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
              ) : selectedCategoriesForSearch.length === 0 ? (
                'Search All'
              ) : (
                `Search ${selectedCategoriesForSearch.length} Categories`
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
              onClick={handleTimelineOpen}
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
          {filteredQueries
            .sort((a, b) => b._id.localeCompare(a._id))
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
                          setSelectedCategory(query.category);
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
          filterClosed={filterClosed}
          onFilterClosedChange={setFilterClosed}
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
          filterClosed={autoSearchFilterClosed}
          onFilterClosedChange={setAutoSearchFilterClosed}
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
              multiline
              value={editQuery}
              onChange={(e) => setEditQuery(e.target.value)}
              sx={{ mb: 2 }}

            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Category</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories
                  .filter(category => category.owner === user._id) // Only show current user's categories
                  .map((category) => (
                  <Chip
                    key={category.name}
                    label={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    color={selectedCategory === category.name ? "primary" : "default"}
                    variant={selectedCategory === category.name ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Box>
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
          onFilterClosedChange={null}
        />

        <TimelineDialog
          open={timelineDialogOpen}
          onClose={() => {
            setTimelineDialogOpen(false);
            setSelectedTimelineCategories([]);
          }}
          queries={queries}
          users={users}
          initialCategory={selectedCategory}
          selectedTimelineCategories={selectedTimelineCategories}
          setSelectedTimelineCategories={setSelectedTimelineCategories}
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

        {/* Add/Edit Category Dialog */}
        <Dialog 
          open={openCategoryDialog} 
          onClose={() => {
            setOpenCategoryDialog(false);
            setNewCategory('');
            setEditingCategory(null);
          }}
        >
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Category Name"
              fullWidth
              variant="outlined"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenCategoryDialog(false);
                setNewCategory('');
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (editingCategory) {
                  try {
                    await axios.put(`${process.env.REACT_APP_API_URL}/categories/${editingCategory}`, {
                      newCategory: newCategory.trim()
                    });
                    toast.success('Category updated successfully');
                    fetchCategories();
                  } catch (error) {
                    toast.error('Failed to update category');
                  }
                } else {
                  await handleAddCategory();
                }
                setOpenCategoryDialog(false);
                setNewCategory('');
                setEditingCategory(null);
              }} 
              variant="contained" 
              color="primary"
            >
              {editingCategory ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Query Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleQueryMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedQuery) handleDeleteQuery(selectedQuery._id);
            handleQueryMenuClose();
          }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete Query
          </MenuItem>
        </Menu>

        {/* Delete Category Dialog */}
        <Dialog
          open={deleteCategoryDialogOpen}
          onClose={() => {
            setDeleteCategoryDialogOpen(false);
            setCategoryToDelete(null);
          }}
        >
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the category "{categoryToDelete}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleteCategoryDialogOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

const TimelineDialog = ({ 
  open, 
  onClose, 
  queries, 
  users, 
  initialCategory,
  selectedTimelineCategories,
  setSelectedTimelineCategories 
}) => {
  // Set 'all' as default when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTimelineCategories([]);
    }
  }, [open, setSelectedTimelineCategories]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Activity Timeline</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[...new Set(queries.map(q => q.category))].map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => {
                  if (category === 'all') {
                    setSelectedTimelineCategories([]);
                  } else {
                    // Only set the clicked category, removing any previous selection
                    setSelectedTimelineCategories([category]);
                  }
                }}
                color={category === 'all' && selectedTimelineCategories.length === 0 ? "primary" : 
                       selectedTimelineCategories.includes(category) ? "primary" : "default"}
                variant={category === 'all' && selectedTimelineCategories.length === 0 ? "filled" :
                        selectedTimelineCategories.includes(category) ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
        <SearchTimeline 
          queries={queries} 
          users={users} 
          selectedCategories={selectedTimelineCategories}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchQueries; 
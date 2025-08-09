import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Tabs,
  Tab,
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
import { Line } from 'react-chartjs-2';
import ScheduledSearchDialog from '../components/ScheduledSearchDialog';
import ScheduledSearchesList from '../components/ScheduledSearchesList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const TIME_OPTIONS = [
  { value: 'd', label: 'Past 24 Hours' },
  { value: 'w', label: 'Past Week' },
  { value: 'm', label: 'Past Month' },
  { value: 'y', label: 'Past Year' },
  { value: '', label: 'Any Time' },
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
  allowMultiple = false, // New prop to enable multiple selection
}) => {
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [localFilterClosed, setLocalFilterClosed] = useState(filterClosed);

  // Initialize selected times when dialog opens
  useEffect(() => {
    if (open) {
      if (allowMultiple) {
        // For multiple selection, initialize with current selection or empty array
        setSelectedTimes(selectedTime ? [selectedTime] : []);
      }
      setLocalFilterClosed(filterClosed);
    }
  }, [open, selectedTime, filterClosed, allowMultiple]);

  const handleTimeSelect = (value) => {
    if (allowMultiple) {
      setSelectedTimes(prev => {
        if (value === 'a') {
          // If "All above" is selected, include all time options except "All above" itself
          return options.filter(opt => opt.value !== 'a').map(opt => opt.value);
        } else if (prev.includes(value)) {
          // Remove if already selected
          return prev.filter(time => time !== value);
        } else {
          // Add to selection
          return [...prev, value];
        }
      });
    } else {
      // Single selection mode (existing behavior)
      onTimeSelect(value);
    }
  };

  const handleConfirm = () => {
    if (allowMultiple) {
      // For multiple selection, pass the array of selected times
      onTimeSelect(selectedTimes);
      onFilterClosedChange?.(localFilterClosed);
    }
    onConfirm();
  };

  const isSelected = (value) => {
    if (allowMultiple) {
      return selectedTimes.includes(value);
    }
    return selectedTime === value;
  };

  const getSelectedCount = () => {
    if (allowMultiple) {
      return selectedTimes.length;
    }
    return selectedTime ? 1 : 0;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Select Time Limit{allowMultiple ? 's' : ''}
          {allowMultiple && getSelectedCount() > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({getSelectedCount()} selected)
            </Typography>
          )}
        </Typography>
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
              variant={isSelected(option.value) ? 'contained' : 'outlined'}
              onClick={() => handleTimeSelect(option.value)}
              sx={{ 
                width: 'calc(33.33% - 8px)',
                bgcolor: isSelected(option.value) ? undefined : 'background.paper'
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
                  checked={localFilterClosed}
                  onChange={(e) => setLocalFilterClosed(e.target.checked)}
                />
              }
              label="Filter out closed positions"
            />
          </Box>
        )}
        {allowMultiple && selectedTimes.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selected: {selectedTimes.map(time => {
                const option = options.find(opt => opt.value === time);
                return option ? option.label : time;
              }).join(', ')}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          color="primary" 
          variant="contained"
          disabled={allowMultiple && selectedTimes.length === 0}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SearchTimeline = React.memo(({ queries, users, selectedCategories }) => {
  const [dateRange, setDateRange] = useState(7); // Default to 7 days
  const containerRef = useRef(null);
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [queriesColors, setQueriesColors] = useState({});
  const [viewMode, setViewMode] = useState('category'); // 'overall', 'category', or 'query'

  // Function to generate random color for queries/categories
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 10)];
    }
    return color;
  };

  // Initialize colors for queries
  useEffect(() => {
    const colors = {};
    queries.forEach(query => {
      colors[query._id] = getRandomColor();
    });
    
    // Also generate colors for categories
    const categoryColors = {};
    const uniqueCategories = [...new Set(queries.map(q => q.category))];
    uniqueCategories.forEach(category => {
      categoryColors[category] = getRandomColor();
    });
    
    setQueriesColors({ ...colors, ...categoryColors });
  }, [queries]);

  // Prepare data for the line chart
  const prepareChartData = useMemo(() => {
    // Create a map of dates to use as labels
    const now = new Date();
    const dateLabels = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dateLabels.push(date);
    }

    // Format dates for chart labels
    const formattedLabels = dateLabels.map(date => 
      date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    );

    let datasets = [];

    if (viewMode === 'overall') {
      // Sum all job counts across all categories and queries
      const overallData = dateLabels.map(label => {
        let totalForDay = 0;
        
        // Filter queries by selected categories
        const filteredQueries = queries.filter(query => 
          selectedCategories.length === 0 || selectedCategories.includes(query.category)
        );
        
        // Sum up counts for each query on this day
        filteredQueries.forEach(query => {
          const searchForDate = query.last_search_info?.find(info => {
            const infoDate = new Date(info.date);
            return infoDate.toDateString() === label.toDateString();
          });
          
          if (searchForDate) {
            totalForDay += searchForDate.count || 0;
          }
        });
        
        return totalForDay;
      });

      datasets = [{
        label: 'All Search Results',
        data: overallData,
        fill: false,
        borderColor: '#3f51b5',
        borderWidth: 3,
        pointRadius: 5,
        tension: 0.1
      }];
    } 
    else if (viewMode === 'category') {
      // Group by category
      const categories = selectedCategories.length > 0 ? 
        selectedCategories : 
        [...new Set(queries.map(q => q.category))];
      
      datasets = categories.map(category => {
        // Get all queries in this category
        const queriesInCategory = queries.filter(q => q.category === category);
        
        // Sum data by date for this category
        const categoryData = dateLabels.map(label => {
          let totalForCategory = 0;
          
          queriesInCategory.forEach(query => {
            const searchForDate = query.last_search_info?.find(info => {
              const infoDate = new Date(info.date);
              return infoDate.toDateString() === label.toDateString();
            });
            
            if (searchForDate) {
              totalForCategory += searchForDate.count || 0;
            }
          });
          
          return totalForCategory;
        });

        return {
          label: `${category}`,
          data: categoryData,
          fill: false,
          borderColor: queriesColors[category] || getRandomColor(),
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.1
        };
      });
    } 
    else if (viewMode === 'query') {
      // Show selected queries or all queries if none selected
      const filteredQueries = queries.filter(query => 
        (selectedCategories.length === 0 || selectedCategories.includes(query.category)) &&
        (selectedQueries.length === 0 || selectedQueries.includes(query._id))
      );
      
      datasets = filteredQueries.map(query => {
        // Build daily counts for each query
        const data = dateLabels.map(label => {
          const searchForDate = query.last_search_info?.find(info => {
            const infoDate = new Date(info.date);
            return infoDate.toDateString() === label.toDateString();
          });
          return searchForDate ? searchForDate.count || 0 : 0;
        });

        const shortenedQuery = query.link.length > 20 ? 
          query.link.substring(0, 20) + '...' : query.link;

        return {
          label: `${shortenedQuery} (${query.category})`,
          data: data,
          fill: false,
          borderColor: queriesColors[query._id],
          borderWidth: selectedQueries.includes(query._id) ? 4 : 2,
          pointRadius: selectedQueries.includes(query._id) ? 6 : 4,
          tension: 0.1,
          order: selectedQueries.includes(query._id) ? 0 : 1,
          opacity: selectedQueries.includes(query._id) ? 1 : (selectedQueries.length === 0 ? 1 : 0.3)
        };
      });
    }

    return {
      labels: formattedLabels,
      datasets
    };
  }, [queries, selectedCategories, dateRange, selectedQueries, queriesColors, viewMode]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        onClick: (e, legendItem, legend) => {
          if (viewMode === 'query') {
            // Find the query ID based on the clicked legend
            const clickedQueryLabel = legendItem.text.split(' (')[0];
            const clickedQuery = queries.find(q => {
              const shortenedQuery = q.link.length > 20 ? 
                q.link.substring(0, 20) + '...' : q.link;
              return shortenedQuery === clickedQueryLabel;
            });
            
            if (clickedQuery) {
              if (selectedQueries.includes(clickedQuery._id)) {
                setSelectedQueries(prev => prev.filter(id => id !== clickedQuery._id));
              } else {
                setSelectedQueries(prev => [...prev, clickedQuery._id]);
              }
            }
          }
        }
      },
      title: {
        display: true,
        text: 'Daily Search Results'
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' jobs';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Jobs Found'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  // Handle scroll to change date range
  const handleScroll = useCallback((e) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = Math.sign(e.deltaY);
      setDateRange(prev => {
        const newRange = prev + (delta * 1);
        return Math.max(3, Math.min(30, newRange));
      });
      
      return false;
    }
  }, []);

  useEffect(() => {
    const chartContainer = containerRef.current;
    if (chartContainer) {
      chartContainer.addEventListener('wheel', handleScroll, { passive: false });
      chartContainer.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

      return () => {
        chartContainer.removeEventListener('wheel', handleScroll);
        chartContainer.removeEventListener('touchmove', e => e.preventDefault());
      };
    }
  }, [handleScroll]);

  // Get all queries for the selected categories
  const availableQueries = useMemo(() => {
    return queries.filter(query => 
      selectedCategories.length === 0 || selectedCategories.includes(query.category)
    );
  }, [queries, selectedCategories]);

  return (
    <Card sx={{ mb: 3, width: '100%' }}>
      <CardContent sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Search Results Timeline (Last {dateRange} {dateRange === 1 ? 'day' : 'days'})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small"
              variant="outlined"
              onClick={() => setDateRange(prev => Math.max(3, prev - 3))}
            >
              Fewer Days
            </Button>
            <Button 
              size="small"
              variant="outlined"
              onClick={() => setDateRange(prev => Math.min(30, prev + 3))}
            >
              More Days
            </Button>
          </Box>
        </Box>

        {/* View mode selection */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'overall' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('overall')}
            >
              Overall
            </Button>
            <Button
              variant={viewMode === 'category' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('category')}
            >
              By Category
            </Button>
            <Button
              variant={viewMode === 'query' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('query')}
            >
              By Query
            </Button>
          </Box>
        </Box>

        {/* Query selection area - only show when in query mode */}
        {viewMode === 'query' && (
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select queries to highlight (Total: {availableQueries.length})
            </Typography>
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mt: 1,
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {availableQueries.map(query => {
                const shortenedQuery = query.link.length > 20 ? 
                  query.link.substring(0, 20) + '...' : query.link;
                
                return (
                  <Chip
                    key={query._id}
                    label={shortenedQuery}
                    size="small"
                    onClick={() => {
                      if (selectedQueries.includes(query._id)) {
                        setSelectedQueries(prev => prev.filter(id => id !== query._id));
                      } else {
                        setSelectedQueries(prev => [...prev, query._id]);
                      }
                    }}
                    color={selectedQueries.includes(query._id) ? "primary" : "default"}
                    variant={selectedQueries.includes(query._id) ? "filled" : "outlined"}
                    sx={{ 
                      borderColor: queriesColors[query._id],
                      "& .MuiChip-label": { 
                        maxWidth: '200px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <Box 
          sx={{ height: 500, width: '100%', mt: 2, position: 'relative' }}
          ref={containerRef}
        >
          <Line data={prepareChartData} options={chartOptions} style={{ width: '100%', height: '100%' }} />
        </Box>

        <Typography variant="body2" color="text.secondary" mt={2}>
          Shift + Scroll to zoom in/out or use the buttons above
        </Typography>
      </CardContent>
    </Card>
  );
});

const useSearchQueries = () => {
  const [queries, setQueries] = useState([]);
  const [queriesWithHistory, setQueriesWithHistory] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [autoSearchInProgress, setAutoSearchInProgress] = useState(false);
  const [lastAutoSearch, setLastAutoSearch] = useState(null);
  const [scheduledSearches, setScheduledSearches] = useState([]);
  const { user } = useAuth();

  const pollingInterval = useRef(null);
  const scheduledSearchesPollingInterval = useRef(null);

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

  const fetchQueriesWithHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/search-queries/history`);
      setQueriesWithHistory(response.data);
      setHistoryLoading(false);
      return response.data;
    } catch (err) {
      setError('Failed to fetch search history');
      setHistoryLoading(false);
      throw err;
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

  const fetchScheduledSearches = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/scheduled-searches`);
      setScheduledSearches(response.data);
    } catch (err) {
      console.error('Failed to fetch scheduled searches:', err);
    }
  };

  const startScheduledSearchesPolling = () => {
    if (scheduledSearchesPollingInterval.current) return;
    scheduledSearchesPollingInterval.current = setInterval(async () => {
      await fetchScheduledSearches();
    }, 60000); // Poll every minute
  };

  const stopScheduledSearchesPolling = () => {
    if (scheduledSearchesPollingInterval.current) {
      clearInterval(scheduledSearchesPollingInterval.current);
      scheduledSearchesPollingInterval.current = null;
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
    }, 60000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Add useEffect for initial fetch and polling setup
  useEffect(() => {
    fetchQueries();
    fetchScheduledSearches(); // Initial fetch of scheduled searches
    startScheduledSearchesPolling(); // Start polling for scheduled searches

    return () => {
      stopPolling();
      stopScheduledSearchesPolling();
    };
  }, []);

  const addQuery = async (newQuery) => {
    if (!newQuery.trim()) return;
    if (selectedCategory === 'all') {
      toast.error('Please select a category');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/search-queries`, {
        link: newQuery,
        category: selectedCategory
      });
      toast.success('Query added successfully');
      await fetchQueries();
    } catch (error) {
      toast.error('Failed to add query');
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

  return {
    queries,
    queriesWithHistory,
    historyLoading,
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
    fetchQueriesWithHistory,
    autoSearchInProgress,
    lastAutoSearch,
    jobScrapingInProgress,
    executeJobScraping,
    scheduledSearches,
    fetchScheduledSearches,
  };
};

const SearchQueries = () => {
  const {
    queries,
    queriesWithHistory,
    historyLoading,
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
    fetchQueriesWithHistory,
    autoSearchInProgress,
    lastAutoSearch,
    jobScrapingInProgress,
    executeJobScraping,
    scheduledSearches,
    fetchScheduledSearches,
  } = useSearchQueries();

  const [openDialog, setOpenDialog] = useState(false);
  const [searchLoading, setSearchLoading] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedTimeUnit, setSelectedTimeUnit] = useState('');
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [autoSearchLoading, setAutoSearchLoading] = useState(false);
  const [autoSearchDialogOpen, setAutoSearchDialogOpen] = useState(false);
  const [autoSearchTimeUnits, setAutoSearchTimeUnits] = useState(['']); // Changed from autoSearchTimeUnit to autoSearchTimeUnits with default ['a']
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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [scheduledSearchDialogOpen, setScheduledSearchDialogOpen] = useState(false);
  const [selectedQueryForSchedule, setSelectedQueryForSchedule] = useState(null);
  const [selectedScheduledSearch, setSelectedScheduledSearch] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Add these new states for pagination
  const [displayCount, setDisplayCount] = useState(25);
  const containerRef = useRef(null);

  // Add scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      // If we're near the bottom (within 100px)
      if (scrollHeight - scrollTop - clientHeight < 10) {
        setDisplayCount(prev => prev + 25);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // This will handle both the initial fetch and subsequent fetches
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
      setOpenCategoryDialog(false);
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category === 'all') return; // Only prevent deletion of 'all' category
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/categories/${category}`);
      fetchCategories();
      setSelectedCategoriesForSearch(prev => prev.filter(cat => cat !== category));
      await fetchQueries();
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
    setDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleAddQuery = async (newQuery) => {
    if (!newQuery.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/search-queries`, {
        link: newQuery,
        category: selectedCategory
      });
      await fetchQueries();
      toast.success('Query added successfully');
    } catch (error) {
      toast.error('Failed to add query');
    }
  };

  const handleDeleteQuery = async (queryId) => {
    setDeleteLoading(queryId);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/search-queries/${queryId}`);
      await fetchQueries();
      toast.success('Query deleted successfully');
    } catch (error) {
      toast.error('Failed to delete query');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCategorySelect = (category) => {
    if (category === 'all') {
      setSelectedCategoriesForSearch([]);
    } else {
      setSelectedCategoriesForSearch([category]);
    }
    setSelectedCategory(category);
    setDisplayCount(25); // Reset display count when changing categories
    window.scrollTo(0, 0); // Reset scroll position to top
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
    setAutoSearchTimeUnits([]);
    setAutoSearchLoading(true);
    try {
      // Get all available categories if none are selected
      const categoriesToSearch = selectedCategoriesForSearch.length === 0 
        ? categories.map(category => category) // Send all categories
        : selectedCategoriesForSearch;
        
      // For multiple time units, we'll process them sequentially
      let totalJobsFound = 0;
      
      if (autoSearchTimeUnits.length > 0) {
        for (const timeUnit of autoSearchTimeUnits) {
          const response = await executeAutoSearch(timeUnit, autoSearchFilterClosed, categoriesToSearch);
          totalJobsFound += response.jobsFound || 0;
        }
      } else {
        // Fallback to default time unit if none selected
        const response = await executeAutoSearch('a', autoSearchFilterClosed, categoriesToSearch);
        totalJobsFound = response.jobsFound || 0;
      }
      
      setSnackbar({
        open: true,
        message: `Auto-search completed! Found ${totalJobsFound} new jobs.`,
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

  // Modify the filteredCategories calculation
  const filteredCategories = ['all', ...categories]
    .filter(category => 
      category && // Add null check
      (!categorySearch || category.toLowerCase().includes(categorySearch.toLowerCase()))
    );

  // Remove user filter initialization
  useEffect(() => {
    setSelectedCategory('all');
  }, []);

  // Modify the handleTimelineOpen function to show loading state
  const handleTimelineOpen = async () => {
    try {
      setTimelineLoading(true);
      // Fetch history data when the dialog is opened
      await fetchQueriesWithHistory();
      setTimelineDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load search history');
    } finally {
      setTimelineLoading(false);
    }
  };

  // Modify the handleAddBulkQueries function
  const handleAddBulkQueries = async () => {
    const bulkQueriesInput = document.getElementById('bulk-queries-input');
    const queries = bulkQueriesInput.value
      .split('\n')
      .map(q => q.trim())
      .filter(q => q); // Filter out empty lines

    if (queries.length === 0) return;
    if (selectedCategory === 'all') {
      toast.error('Please select a category');
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/search-queries/bulk`, {
        links: queries,
        category: selectedCategory
      });
      
      setOpenDialog(false);
      bulkQueriesInput.value = ''; // Clear the input
      
      toast.success(
        `Successfully added ${response.data.totalCreated} queries.`
      );
      await fetchQueries(); // Make sure this is awaited to refresh queries
    } catch (error) {
      toast.error('Failed to add bulk queries');
    }
  };

  // Add this new memoized component for query cards
  const QueryCard = React.memo(({ 
    query, 
    users, 
    searchLoading, 
    handleSearchClick, 
    setQueryToEdit, 
    setEditQuery, 
    setSelectedCategory, 
    setEditDialogOpen, 
    handleDeleteQuery,
    deleteLoading 
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h6">
                Search Query
              </Typography>
              <Chip
                label={query.category}
                size="small"
                sx={{
                  bgcolor: 'success.light',
                  color: 'success.contrastText',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            </Box>
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
                <CircularProgress color="inherit" size={20}/>
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
              onClick={() => handleDeleteQuery(query._id)}
              disabled={deleteLoading === query._id}
            >
              {deleteLoading === query._id ? (
                <CircularProgress  color="inherit" size={20}/>
              ) : (
                'DELETE'
              )}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  ));

  const handleTimelineClose = React.useCallback(() => {
    setTimelineDialogOpen(false);
  }, []);

  // Add new state for query search
  const [querySearch, setQuerySearch] = useState('');

  // Add handler for query search enter key
  const handleQuerySearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      // Reset display count when searching
      setDisplayCount(25);
      window.scrollTo(0, 0);
    }
  };

  const handleScheduleSearch = (query) => {
    setSelectedQueryForSchedule(query);
    setSelectedScheduledSearch(null);
    setScheduledSearchDialogOpen(true);
  };

  const handleEditScheduledSearch = (scheduledSearch) => {
    setSelectedScheduledSearch(scheduledSearch);
    setSelectedQueryForSchedule(scheduledSearch.searchQueryId);
    setScheduledSearchDialogOpen(true);
  };

  const handleDeleteScheduledSearch = async (scheduledSearchId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/scheduled-searches/${scheduledSearchId}`);
      toast.success('Scheduled search deleted');
      fetchScheduledSearches();
    } catch (error) {
      toast.error('Failed to delete scheduled search');
    }
  };

  const handleSaveScheduledSearch = async (data) => {
    try {
      if (selectedScheduledSearch) {
        await axios.put(`${process.env.REACT_APP_API_URL}/scheduled-searches/${selectedScheduledSearch._id}`, data);
        toast.success('Scheduled search updated');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/scheduled-searches`, data);
        toast.success('Search scheduled successfully');
      }
      setScheduledSearchDialogOpen(false);
      fetchScheduledSearches();
    } catch (error) {
      toast.error('Failed to save scheduled search');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>;

  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ display: 'flex', gap: 3 }} ref={containerRef}>
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
              placeholder="Search queries..."
              variant="outlined"
              value={querySearch}
              onChange={(e) => setQuerySearch(e.target.value)}
              onKeyPress={handleQuerySearchKeyPress}
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
              .map((category) => (
                <CategoryListItem
                  key={category}
                  category={category}
                  selectedCategory={selectedCategory}
                  selectedCategoriesForSearch={selectedCategoriesForSearch}
                  handleCategorySelect={handleCategorySelect}
                  setSelectedCategoriesForSearch={setSelectedCategoriesForSearch}
                  queries={queries}
                  setEditingCategory={setEditingCategory}
                  setNewCategory={setNewCategory}
                  setOpenCategoryDialog={setOpenCategoryDialog}
                  setCategoryToDelete={setCategoryToDelete}
                  setDeleteCategoryDialogOpen={setDeleteCategoryDialogOpen}
                />
              ))}
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
              disabled={timelineLoading}
            >
              {timelineLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : (
                'Activity Timeline'
              )}
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

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Search Queries" />
          <Tab label="Scheduled Searches" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            {queries
              .filter(query => {
                // Filter by category
                const categoryMatch = selectedCategory === 'all' || query.category === selectedCategory;
                // Filter by search term
                const searchMatch = !querySearch || 
                  query.link.toLowerCase().includes(querySearch.toLowerCase());
                return categoryMatch && searchMatch;
              })
              .sort((a, b) => b._id.localeCompare(a._id))
              .slice(0, displayCount)
              .map((query) => (
                <Grid item xs={12} key={query._id}>
                  <QueryCard
                    query={query}
                    users={users}
                    searchLoading={searchLoading}
                    handleSearchClick={handleSearchClick}
                    setQueryToEdit={setQueryToEdit}
                    setEditQuery={setEditQuery}
                    setSelectedCategory={setSelectedCategory}
                    setEditDialogOpen={setEditDialogOpen}
                    handleDeleteQuery={handleDeleteQuery}
                    deleteLoading={deleteLoading}
                  />
                </Grid>
              ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Scheduled Searches</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setSelectedQueryForSchedule(null);
                  setSelectedScheduledSearch(null);
                  setScheduledSearchDialogOpen(true);
                }}
              >
                Add Scheduled Search
              </Button>
            </Box>
            <ScheduledSearchesList
              scheduledSearches={scheduledSearches}
              onEdit={handleEditScheduledSearch}
              onDelete={handleDeleteScheduledSearch}
            />
          </Box>
        )}

        <Dialog 
          open={openDialog} 
          onClose={() => {
            setOpenDialog(false);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              width: '50%'
            }
          }}
        >
          <DialogTitle>Add New Search Queries</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Search Queries"
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              id="bulk-queries-input"
              placeholder="Enter one query per line"
              helperText="Enter multiple search queries, one per line"
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Category</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? "primary" : "default"}
                    variant={selectedCategory === category ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              document.getElementById('bulk-queries-input').value = '';
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBulkQueries} 
              variant="contained" 
              color="primary"
            >
              Add
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
            setAutoSearchTimeUnits([]);
          }}
          title="Auto Search Settings"
          selectedTime={autoSearchTimeUnits.length > 0 ? autoSearchTimeUnits[0] : 'a'}
          onTimeSelect={(timeUnits) => {
            setAutoSearchTimeUnits(timeUnits);
          }}
          onConfirm={handleAutoSearch}
          filterClosed={autoSearchFilterClosed}
          onFilterClosedChange={setAutoSearchFilterClosed}
          allowMultiple={true} // Enable multiple selection for auto search
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {categories
                  .map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? "primary" : "default"}
                    variant={selectedCategory === category ? "filled" : "outlined"}
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
          onClose={handleTimelineClose}
          queries={queriesWithHistory}
          loading={historyLoading}
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (editingCategory) {
                    (async () => {
                      try {
                        await axios.put(`${process.env.REACT_APP_API_URL}/categories/${editingCategory}`, {
                          newCategory: newCategory.trim()
                        });
                        toast.success('Category updated successfully');
                        await fetchCategories();
                        await fetchQueries();
                      } catch (error) {
                        toast.error('Failed to update category');
                      }
                      setOpenCategoryDialog(false);
                      setNewCategory('');
                      setEditingCategory(null);
                    })();
                  } else {
                    (async () => {
                      await handleAddCategory();
                      await fetchQueries();
                      setOpenCategoryDialog(false);
                      setNewCategory('');
                    })();
                  }
                }
              }}
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
                    await fetchCategories();
                    await fetchQueries();
                  } catch (error) {
                    toast.error('Failed to update category');
                  }
                } else {
                  await handleAddCategory();
                  await fetchQueries();
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
          <MenuItem onClick={() => handleScheduleSearch(selectedQuery)}>
            <AccessTimeIcon sx={{ mr: 1 }} />
            Schedule Search
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

        <ScheduledSearchDialog
          open={scheduledSearchDialogOpen}
          onClose={() => {
            setScheduledSearchDialogOpen(false);
            setSelectedQueryForSchedule(null);
            setSelectedScheduledSearch(null);
          }}
          onSave={handleSaveScheduledSearch}
          searchQuery={selectedQueryForSchedule}
          initialData={selectedScheduledSearch}
          categories={categories}
        />
      </Box>
    </Box>
  );
};

const CategoryListItem = React.memo(({ 
  category, 
  selectedCategory,
  selectedCategoriesForSearch,
  handleCategorySelect,
  setSelectedCategoriesForSearch,
  queries,
  setEditingCategory,
  setNewCategory,
  setOpenCategoryDialog,
  setCategoryToDelete,
  setDeleteCategoryDialogOpen
}) => (
  <ListItem
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
        checked={category === 'all' ? selectedCategoriesForSearch.length === 0 : selectedCategoriesForSearch.includes(category)}
        onChange={(e) => {
          e.stopPropagation();
          if (category === 'all') {
            setSelectedCategoriesForSearch([]);
          } else if (e.target.checked) {
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
          label={category === 'all' ? queries.length : queries.filter(q => q.category === category).length}
          sx={{ ml: 1, fontSize: '0.7rem' }}
        />
      </Box>
      {category !== 'all' && (
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
      )}
    </ListItemButton>
  </ListItem>
));

const TimelineDialog = React.memo(({ 
  open, 
  onClose, 
  queries, 
  loading,
  users, 
  initialCategory,
  selectedTimelineCategories,
  setSelectedTimelineCategories 
}) => {
  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCategoryClick = React.useCallback((category) => {
    if (category === 'all') {
      setSelectedTimelineCategories([]);
    } else {
      setSelectedTimelineCategories([category]);
    }
  }, [setSelectedTimelineCategories]);

  // Set initial category when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTimelineCategories(initialCategory === 'all' ? [] : [initialCategory]);
    }
  }, [open, initialCategory, setSelectedTimelineCategories]);

  const MemoizedSearchTimeline = React.memo(SearchTimeline);
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(queries.map(q => q.category))];
    return ['all', ...uniqueCategories]; // Add 'all' as the first option
  }, [queries]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      TransitionProps={{
        onExited: () => {
          setSelectedTimelineCategories([]);
        }
      }}
      PaperProps={{
        sx: {
          height: 'calc(90vh)',
          maxHeight: 'calc(90vh)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>Activity Timeline</DialogTitle>
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category === 'all' ? 'All Categories' : category}
                onClick={() => handleCategoryClick(category)}
                color={category === 'all' && selectedTimelineCategories.length === 0 ? "primary" : 
                       selectedTimelineCategories.includes(category) ? "primary" : "default"}
                variant={category === 'all' && selectedTimelineCategories.length === 0 ? "filled" :
                        selectedTimelineCategories.includes(category) ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', width: '100%' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading search history...</Typography>
            </Box>
          ) : (
            <MemoizedSearchTimeline 
              queries={queries} 
              users={users} 
              selectedCategories={selectedTimelineCategories}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
});

const QueryCard = React.memo(({ 
  query, 
  users, 
  searchLoading, 
  handleSearchClick, 
  setQueryToEdit, 
  setEditQuery, 
  setSelectedCategory, 
  setEditDialogOpen, 
  handleDeleteQuery,
  deleteLoading
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setQueryToEdit(query);
    setEditQuery(query.link);
    setSelectedCategory(query.category);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">{query.link}</Typography>
            <Chip label={query.category} size="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              disabled={searchLoading || deleteLoading}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEditClick}>
                <EditIcon sx={{ mr: 1 }} /> Edit
              </MenuItem>
              <MenuItem onClick={() => {
                handleDeleteQuery(query._id);
                handleMenuClose();
              }}>
                <DeleteIcon sx={{ mr: 1 }} /> Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Last Search: {query.last_search_info?.[0]?.date ? getRelativeTimeString(new Date(query.last_search_info[0].date)) : 'Never'}
            </Typography>
            {query.last_search_info?.[0]?.searchedBy && (
              <Typography variant="body2" color="text.secondary">
                by {users[query.last_search_info[0].searchedBy] || 'Unknown User'}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleSearchClick(query._id)}
              disabled={searchLoading || deleteLoading}
            >
              Search
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

export default React.memo(SearchQueries); 
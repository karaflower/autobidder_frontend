import React, { useState, useEffect, useRef } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  BarElement,
  BarController
} from 'chart.js';
import axios from 'axios';
import { 
  Box,
  Container,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link
} from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreditAnalytics from '../components/CreditAnalytics';

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
  Tooltip,
  Legend
);

const BossDashboard = () => {
  const [bidData, setBidData] = useState({});
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [dateRange, setDateRange] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberColors, setMemberColors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailedBidData, setDetailedBidData] = useState([]);
  const [bidDetailsDialog, setBidDetailsDialog] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [isBidDetailsLoading, setIsBidDetailsLoading] = useState(false);
  const [galleryView, setGalleryView] = useState(false);
  const [currentBidIndex, setCurrentBidIndex] = useState(0);
  const thumbnailContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('bids'); // Add this state

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/all`);
        setTeams(response.data);
      } catch (error) {
        const errorMsg = 'Error fetching teams: ' + (error.response?.data?.message || error.message);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    };

    fetchTeams();
  }, []);

  // Fetch team members when a team is selected
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (selectedTeam === 'all') {
        setError(null);
        setIsLoading(true);
        try {
          const promises = teams.map(team =>
            axios.get(`${process.env.REACT_APP_API_URL}/teams/team-members`, {
              params: { teamId: team._id }
            })
          );
          const responses = await Promise.all(promises);
          const allMembers = {};
          teams.forEach((team, index) => {
            allMembers[team._id] = responses[index].data;
          });
          setTeamMembers(allMembers);

          // Generate colors for all members
          const colors = {};
          Object.values(allMembers).flat().forEach(member => {
            colors[member._id] = getRandomColor();
          });
          setMemberColors(colors);
        } catch (error) {
          const errorMsg = 'Error fetching team members: ' + (error.response?.data?.message || error.message);
          setError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setIsLoading(false);
        }
      } else {
        setError(null);
        setIsLoading(true);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/team-members`, {
            params: { teamId: selectedTeam }
          });
          setTeamMembers({ [selectedTeam]: response.data });

          // Generate colors for team members
          const colors = {};
          response.data.forEach(member => {
            colors[member._id] = getRandomColor();
          });
          setMemberColors(colors);
        } catch (error) {
          const errorMsg = 'Error fetching team members: ' + (error.response?.data?.message || error.message);
          setError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (teams.length > 0) {
      fetchTeamMembers();
    }
  }, [selectedTeam, teams]);

  // Fetch bid history
  useEffect(() => {
    const fetchBidHistory = async () => {
      setError(null);
      try {
        let members;
        if (selectedTeam === 'all') {
          members = Object.values(teamMembers).flat();
        } else {
          members = teamMembers[selectedTeam] || [];
        }

        if (selectedMember === 'all') {
          const promises = members.map(member =>
            axios.get(`${process.env.REACT_APP_API_URL}/applications/bid-history/${member._id}`, {
              params: { days: dateRange }
            })
          );
          const responses = await Promise.all(promises);
          const allData = {};
          members.forEach((member, index) => {
            allData[member._id] = responses[index].data;
          });
          setBidData(allData);
        } else {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/applications/bid-history/${selectedMember}`, {
            params: { days: dateRange }
          });
          setBidData({ [selectedMember]: response.data });
        }
      } catch (error) {
        const errorMsg = 'Error fetching bid history: ' + (error.response?.data?.message || error.message);
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setInitialLoading(false);
        setIsLoading(false);
      }
    };

    if (Object.keys(teamMembers).length > 0) {
      fetchBidHistory();
    }
  }, [selectedTeam, selectedMember, teamMembers, dateRange]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 10)];
    }
    return color;
  };

  // Prepare chart data
  const chartData = {
    labels: Object.values(bidData)[0]?.map(item => {
      // Convert date string to shortened weekday name
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + 
             date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: Object.values(teamMembers)
      .flat()
      .filter(member => selectedMember === 'all' || member._id === selectedMember)
      .map(member => ({
        label: `${member.name} (${teams.find(t => t._id === member.team)?.name || 'Unknown Team'} - ${member.role || 'No Role'})`,
        data: bidData[member._id]?.map(item => item.bidCount) || [],
        fill: false,
        borderColor: memberColors[member._id],
        borderWidth: member._id === selectedMember ? 4 : 2,
        pointRadius: member._id === selectedMember ? 6 : 4,
        tension: 0.1,
        // Highlight the selected member with higher z-index and opacity
        order: member._id === selectedMember ? 0 : 1,
        opacity: member._id === selectedMember ? 1 : (selectedMember === 'all' ? 1 : 0.3)
      }))
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        onClick: (e, legendItem, legend) => {
          // Get the clicked dataset index
          const index = legendItem.datasetIndex;
          const clickedMemberId = Object.values(teamMembers)
            .flat()
            .filter(member => selectedMember === 'all' || member._id === selectedMember)[index]._id;
          
          // Set the selected member to the clicked one
          setSelectedMember(clickedMemberId);
        }
      },
      title: {
        display: true,
        text: 'Daily Bid History Across Teams'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bids'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    onClick: async (event, elements) => {
      if (elements.length > 0) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const dateLabel = chartData.labels[index];
        
        // Parse the date correctly from the chart label
        const dateParts = dateLabel.split(' ');
        const monthDay = dateParts[1] + ' ' + dateParts[2];
        const currentYear = new Date().getFullYear();
        const fullDateStr = `${monthDay}, ${currentYear}`;
        const date = new Date(fullDateStr);
        
        const selectedUser = selectedMember === 'all' 
          ? Object.values(teamMembers).flat().filter(member => bidData[member._id])[datasetIndex]
          : Object.values(teamMembers).flat().find(member => member._id === selectedMember);
        const userId = selectedUser._id;

        try {
          setIsBidDetailsLoading(true);
          // Create start and end of day timestamps with correct year
          const fromDate = new Date(date);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(date);
          toDate.setHours(23, 59, 59, 999);

          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/applications/`,
            { 
              params: { 
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                userId: userId 
              } 
            }
          );
          setDetailedBidData(response.data);
          setSelectedDate(dateLabel);
          setSelectedBid({ ...response.data[0], userName: selectedUser.name });
          setDetailDialog(true);
        } catch (error) {
          toast.error('Error fetching bid details: ' + error.message);
        } finally {
          setIsBidDetailsLoading(false);
        }
      }
    }
  };

  const getTimeScatterData = (bids) => {
    // Get current time in hours (e.g., 14.5 for 2:30 PM)
    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    
    return {
      datasets: [
        {
          label: 'Bid Times',
          data: bids.map(bid => ({
            x: new Date(bid.timestamp).getHours() + (new Date(bid.timestamp).getMinutes() / 60),
            y: 1
          })),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          type: 'bar',
          barThickness: 2,
          barPercentage: 0.1,
        },
        {
          label: 'Current Time',
          data: [{ x: currentHour, y: 0 }, { x: currentHour, y: 1 }],
          borderColor: 'red',
          borderWidth: 2,
          pointRadius: 0,
          type: 'line',
          tension: 0
        }
      ]
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

  // Calculate total and average bids for selected member
  const calculateBidStats = () => {
    if (selectedMember === 'all' || !bidData[selectedMember]) {
      return { total: 0, average: 0 };
    }

    const bids = bidData[selectedMember];
    const totalBids = bids.reduce((sum, item) => {
      return sum + item.bidCount;
    }, 0);

    // Calculate average across all days (including weekends)
    const averageBids = bids.length > 0 
      ? (totalBids / bids.length).toFixed(2)
      : 0;

    return { total: totalBids, average: averageBids };
  };

  const bidStats = calculateBidStats();

  // Add a keyboard event listener for gallery navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!galleryView) return;
      
      if (e.key === 'ArrowLeft') {
        // Navigate to previous bid
        setCurrentBidIndex((prev) => 
          prev > 0 ? prev - 1 : detailedBidData.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        // Navigate to next bid
        setCurrentBidIndex((prev) => 
          prev < detailedBidData.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'Escape') {
        // Close gallery view
        setGalleryView(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryView, detailedBidData.length]);

  // Update selected bid when current index changes in gallery view
  useEffect(() => {
    if (galleryView && detailedBidData.length > 0) {
      setSelectedBid({
        ...detailedBidData[currentBidIndex],
        userName: teamMembers[selectedTeam]?.find(m => m._id === selectedMember)?.name || 'Selected Member'
      });
    }
  }, [currentBidIndex, galleryView]);

  // Add this useEffect to handle scrolling
  useEffect(() => {
    if (galleryView && thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current;
      const thumbnailWidth = 120; // Width of each thumbnail
      const gap = 8; // Gap between thumbnails
      const scrollPosition = currentBidIndex * (thumbnailWidth + gap) - (container.clientWidth / 2) + (thumbnailWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentBidIndex, galleryView]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Add Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={activeTab === 'bids' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('bids')}
            size="small"
          >
            Bid Analytics
          </Button>
          <Button
            variant={activeTab === 'credits' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('credits')}
            size="small"
          >
            Credit Analytics
          </Button>
        </Box>
      </Box>

      {activeTab === 'bids' ? (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedMember('all');
                }}
                disabled={isLoading}
                size='small'
              >
                <MenuItem value="all">All Teams</MenuItem>
                {teams.map(team => (
                  <MenuItem key={team._id} value={team._id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                disabled={isLoading}
                size='small'
              >
                <MenuItem value="all">All Members</MenuItem>
                {selectedTeam === 'all'
                  ? Object.values(teamMembers).flat().map(member => (
                      <MenuItem key={member._id} value={member._id}>
                        {member.name} ({teams.find(t => t._id === member.team)?.name})
                      </MenuItem>
                    ))
                  : teamMembers[selectedTeam]?.map(member => (
                      <MenuItem key={member._id} value={member._id}>
                        {member.name}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                disabled={isLoading}
                size='small'
              >
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="14">Last 14 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 3 months</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Display bid stats when a single member is selected */}
          {selectedMember !== 'all' && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bid Statistics for {teamMembers[selectedTeam]?.find(m => m._id === selectedMember)?.name || 'Selected Member'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Bids</Typography>
                  <Typography variant="h4">{bidStats.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Average Bids Per Day</Typography>
                  <Typography variant="h4">{bidStats.average}</Typography>
                </Box>
              </Box>
            </Paper>
          )}

          <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
            {(isLoading || isBidDetailsLoading) ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1
              }}>
                <CircularProgress />
              </Box>
            ) : null}
            {Object.keys(bidData).length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Typography>No bid data available for the selected period</Typography>
            )}
          </Paper>
        </>
      ) : (
        <CreditAnalytics />
      )}
      
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bid Details for {selectedBid?.userName} on {selectedDate}</span>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setGalleryView(true);
                setCurrentBidIndex(0);
              }}
              disabled={detailedBidData.length === 0}
            >
              Gallery View
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailedBidData.length > 0 ? (
            <>
              <Paper sx={{ p: 2, mb: 3, height: '200px' }}>
                <Scatter 
                  data={getTimeScatterData(detailedBidData)} 
                  options={timeScatterOptions}
                />
              </Paper>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>URL</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailedBidData.map((bid, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </TableCell>
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
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => {
                              setSelectedBid(bid);
                              setBidDetailsDialog(true);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Typography>No detailed bid data available for this date.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={bidDetailsDialog} 
        onClose={() => setBidDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bid Details</DialogTitle>
        <DialogContent>
          {selectedBid && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>URL</Typography>
              <Link 
                href={selectedBid.url}
                target="_blank"
                rel="noopener noreferrer"
                display="block"
                mb={3}
              >
                {selectedBid.url}
              </Link>

              {selectedBid.screenshot && (
                <>
                  <Typography variant="h6" gutterBottom>Screenshot</Typography>
                  <Box mb={3}>
                    <img 
                      src={`${process.env.REACT_APP_API_URL}/resumefiles/${selectedBid.screenshot}`}
                      alt="Application Screenshot"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      onError={(e) => {
                        // If the image fails to load from the primary source, try the fallback server
                        e.target.onerror = null; // Prevent infinite error loop
                        e.target.src = `${process.env.REACT_APP_API_URL_PROD}/resumefiles/${selectedBid.screenshot}`;
                      }}
                    />
                  </Box>
                </>
              )}

              <Typography variant="h6" gutterBottom>Filled Fields</Typography>
              <Typography>
                {selectedBid.filledFields ? selectedBid.filledFields.map((field, index) => (
                  <React.Fragment key={index}>
                    {field}
                    <br />
                  </React.Fragment>
                )) : 'No fields data available'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Gallery View Dialog */}
      <Dialog 
        open={galleryView} 
        onClose={() => setGalleryView(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {`Bid ${currentBidIndex + 1} of ${detailedBidData.length} - ${selectedDate}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use arrow keys or buttons to navigate
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailedBidData.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Main Content */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Bid Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>URL</Typography>
                  <Link 
                    href={selectedBid?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    display="block"
                    mb={3}
                  >
                    {selectedBid?.url}
                  </Link>

                  <Typography variant="h6" gutterBottom>Time</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedBid?.timestamp && new Date(selectedBid.timestamp).toLocaleTimeString()}
                  </Typography>

                  <Typography variant="h6" gutterBottom>Filled Fields</Typography>
                  <Typography>
                    {selectedBid?.filledFields ? selectedBid.filledFields.map((field, index) => (
                      <React.Fragment key={index}>
                        {field}
                        <br />
                      </React.Fragment>
                    )) : 'No fields data available'}
                  </Typography>
                </Box>

                {/* Screenshot Display */}
                <Box sx={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {selectedBid?.screenshot ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL}/resumefiles/${selectedBid.screenshot}`}
                      alt="Application Screenshot"
                      style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                      onError={(e) => {
                        // If the image fails to load from the primary source, try the fallback server
                        e.target.onerror = null; // Prevent infinite error loop
                        e.target.src = `${process.env.REACT_APP_API_URL_PROD}/resumefiles/${selectedBid.screenshot}`;
                      }}
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                      No screenshot available
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Thumbnail Navigation */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>All Bids ({detailedBidData.length})</Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  overflowX: 'auto', 
                  pb: 2,
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#888',
                    borderRadius: '4px',
                  },
                }}
                ref={thumbnailContainerRef}
                >
                  {detailedBidData.map((bid, index) => (
                    <Paper
                      key={index}
                      elevation={currentBidIndex === index ? 8 : 1}
                      sx={{
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        border: currentBidIndex === index ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        minWidth: '120px',
                        maxWidth: '120px',
                        backgroundColor: currentBidIndex === index ? 'rgba(63, 81, 181, 0.08)' : 'background.paper',
                      }}
                      onClick={() => setCurrentBidIndex(index)}
                    >
                      <Typography variant="body2" gutterBottom noWrap sx={{ textAlign: 'center' }}>
                        #{index + 1} - {new Date(bid.timestamp).toLocaleTimeString()}
                      </Typography>
                      {bid.screenshot ? (
                        <Box sx={{ 
                          height: '80px', 
                          width: '100%',
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={`${process.env.REACT_APP_API_URL}/resumefiles/${bid.screenshot}`}
                            alt={`Bid ${index + 1} thumbnail`}
                            style={{ 
                              width: '100%',
                              height: '100%', 
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `${process.env.REACT_APP_API_URL_PROD}/resumefiles/${bid.screenshot}`;
                            }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: '80px', 
                          width: '120px', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)'
                        }}>
                          <Typography variant="body2" color="text.secondary">No image</Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>No detailed bid data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCurrentBidIndex((prev) => prev > 0 ? prev - 1 : detailedBidData.length - 1);
            }}
            disabled={detailedBidData.length <= 1}
          >
            Previous
          </Button>
          <Button 
            onClick={() => {
              setCurrentBidIndex((prev) => prev < detailedBidData.length - 1 ? prev + 1 : 0);
            }}
            disabled={detailedBidData.length <= 1}
          >
            Next
          </Button>
          <Button onClick={() => setGalleryView(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BossDashboard;

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
  CircularProgress
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  }, [selectedTeam, selectedMember, dateRange, teamMembers]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Prepare chart data
  const chartData = {
    labels: Object.values(bidData)[0]?.map(item => item.date) || [],
    datasets: selectedMember === 'all'
      ? Object.values(teamMembers)
          .flat()
          .map(member => ({
            label: `${member.name} (${teams.find(t => t._id === member.team)?.name || 'Unknown Team'})`,
            data: bidData[member._id]?.map(item => item.bidCount) || [],
            fill: false,
            borderColor: memberColors[member._id],
            tension: 0.1
          }))
      : [{
          label: 'Number of Bids',
          data: bidData[selectedMember]?.map(item => item.bidCount) || [],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
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
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>          
          <ToastContainer position="top-right" autoClose={5000} />
          
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

          <Paper sx={{ p: 3, mb: 3 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : Object.keys(bidData).length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Typography>No bid data available for the selected period</Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default BossDashboard;

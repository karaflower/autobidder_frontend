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

const Dashboard = () => {
  const [bidData, setBidData] = useState({});
  const [selectedMember, setSelectedMember] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);
  const [dateRange, setDateRange] = useState('14');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberColors, setMemberColors] = useState({});
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Fetch current user info and role
    const fetchCurrentUser = async () => {
      try {
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/user`);
        setUserRole(userResponse.data.role);
        setCurrentUserId(userResponse.data._id);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setError('Error fetching user information');
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Fetch team members only if user is lead
    const fetchTeamMembers = async () => {
      if (userRole !== 'lead') {
        // For non-lead users, only set their own data
        setTeamMembers([{ _id: currentUserId, name: 'My Applications' }]);
        setSelectedMember(currentUserId);
        return;
      }

      setError(null);
      setIsLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`);
        setTeamMembers(response.data);
        
        // Generate and store a color for each team member
        const colors = {};
        response.data.forEach(member => {
          colors[member._id] = getRandomColor();
        });
        setMemberColors(colors);
      } catch (error) {
        setError('Error fetching team members: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId && userRole) {
      fetchTeamMembers();
    }
  }, [userRole, currentUserId]);

  useEffect(() => {
    // Fetch bid history when member or date range changes
    const fetchBidHistory = async () => {
      if (!currentUserId) return;

      setError(null);
      setIsLoading(true);
      try {
        if (userRole === 'lead' && selectedMember === 'all') {
          // Fetch data for all team members (leads only)
          const promises = teamMembers.map(member =>
            axios.get(`${process.env.REACT_APP_API_URL}/applications/bid-history/${member._id}`, {
              params: { days: dateRange }
            })
          );
          const responses = await Promise.all(promises);
          const allData = {};
          teamMembers.forEach((member, index) => {
            allData[member._id] = responses[index].data;
          });
          setBidData(allData);
        } else {
          // Fetch data for single member (either selected member or current user)
          const memberId = selectedMember === 'all' ? currentUserId : selectedMember;
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/applications/bid-history/${memberId}`, {
            params: { days: dateRange }
          });
          setBidData({ [memberId]: response.data });
        }
      } catch (error) {
        setError('Error fetching bid history: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have the necessary data
    if (currentUserId && (teamMembers.length > 0 || userRole !== 'lead')) {
      fetchBidHistory();
    }
  }, [selectedMember, dateRange, teamMembers, userRole, currentUserId]);

  // Generate random color for each member
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
    labels: selectedMember === 'all' && Object.keys(bidData).length > 0
      ? bidData[Object.keys(bidData)[0]]?.map(item => item.date) || []
      : bidData[selectedMember]?.map(item => item.date) || [],
    datasets: selectedMember === 'all' && userRole === 'lead'
      ? teamMembers.map(member => ({
          label: member.name,
          data: bidData[member._id]?.map(item => item.bidCount) || [],
          fill: false,
          borderColor: memberColors[member._id],
          tension: 0.1
        }))
      : [{
          label: userRole === 'lead' ? 'Number of Bids' : 'My Bids',
          data: bidData[selectedMember === 'all' ? currentUserId : selectedMember]?.map(item => item.bidCount) || [],
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
        text: userRole === 'lead' ? 'Team Bid History Dashboard' : 'My Bid History Dashboard'
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
    <div className="dashboard-container">
      <h1>{userRole === 'lead' ? 'Team Bid History Dashboard' : 'My Bid History Dashboard'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-controls">
        {userRole === 'lead' && (
          <select 
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="member-select"
            disabled={isLoading}
          >
            <option value="all">All Members</option>
            {teamMembers.map(member => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="date-range-select"
          disabled={isLoading}
        >
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      <div className="chart-container">
        {isLoading ? (
          <p>Loading...</p>
        ) : Object.keys(bidData).length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p>No bid data available for the selected period</p>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          align-items: center;
        }

        .member-select,
        .date-range-select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          min-width: 200px;
        }

        .user-info {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          min-width: 200px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .error-message {
          color: #dc3545;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

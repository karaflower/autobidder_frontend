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
  const [dateRange, setDateRange] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberColors, setMemberColors] = useState({});

  useEffect(() => {
    // Fetch team members
    const fetchTeamMembers = async () => {
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

    fetchTeamMembers();
  }, []);

  useEffect(() => {
    // Fetch bid history when member or date range changes
    const fetchBidHistory = async () => {
      setError(null);
      setIsLoading(true);
      try {
        if (selectedMember === 'all') {
          // Fetch data for all team members
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
          // Fetch data for single member
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/applications/bid-history/${selectedMember}`, {
            params: { days: dateRange }
          });
          setBidData({ [selectedMember]: response.data });
        }
      } catch (error) {
        setError('Error fetching bid history: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have team members
    if (teamMembers.length > 0) {
      fetchBidHistory();
    }
  }, [selectedMember, dateRange, teamMembers]);

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
      ? bidData[Object.keys(bidData)[0]].map(item => item.date)
      : bidData[selectedMember]?.map(item => item.date) || [],
    datasets: selectedMember === 'all'
      ? teamMembers.map(member => ({
          label: member.name,
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
        text: 'Daily Bid History'
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
      <h1>Team Bid History Dashboard</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-controls">
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
        }

        .member-select,
        .date-range-select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          min-width: 200px;
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

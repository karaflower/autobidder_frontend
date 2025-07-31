import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  FormControl, 
  Select, 
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CreditAnalytics = () => {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [teams, setTeams] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/all`);
        setTeams(response.data);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        const [analyticsRes, breakdownRes, trendsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/credit-analytics/team-credits`, {
            params: {
              teamId: selectedTeam,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              service: selectedService
            }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/credit-analytics/service-breakdown`, {
            params: {
              teamId: selectedTeam,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/credit-analytics/trends`, {
            params: {
              teamId: selectedTeam,
              period: 'daily'
            }
          })
        ]);

        setAnalyticsData(analyticsRes.data);
        setServiceBreakdown(breakdownRes.data);
        setTrends(trendsRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (teams.length > 0) {
      fetchAnalytics();
    }
  }, [selectedTeam, selectedService, dateRange, teams]);

  // Prepare chart data
  const prepareDailyChartData = () => {
    if (!analyticsData?.dailyUsage) return [];
    
    const groupedByDate = {};
    analyticsData.dailyUsage.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = { date: item.date };
      }
      groupedByDate[item.date][item.team] = item.totalCredits;
    });

    return Object.values(groupedByDate);
  };

  const prepareServiceBreakdownData = () => {
    return serviceBreakdown.map(item => ({
      name: item._id,
      value: item.totalCredits,
      searches: item.totalSearches
    }));
  };

  const prepareTrendsData = () => {
    return trends.map(item => ({
      period: item._id.period,
      service: item._id.service,
      credits: item.totalCredits,
      searches: item.searchCount
    }));
  };

  const calculateTotals = () => {
    if (!analyticsData) return { totalCredits: 0, totalSearches: 0 };
    
    const totalCredits = analyticsData.teamTotals.reduce((sum, team) => sum + team.totalCredits, 0);
    const totalSearches = analyticsData.teamTotals.reduce((sum, team) => sum + team.totalSearches, 0);
    
    return { totalCredits, totalSearches };
  };

  const totals = calculateTotals();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Credit Usage Analytics
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            size="small"
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
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            size="small"
          >
            <MenuItem value="all">All Services</MenuItem>
            <MenuItem value="serper">Serper</MenuItem>
            <MenuItem value="openai">OpenAI</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            size="small"
          >
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 3 Months</MenuItem>
            <MenuItem value="365">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Credits Used
                  </Typography>
                  <Typography variant="h4">
                    {totals.totalCredits.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Searches
                  </Typography>
                  <Typography variant="h4">
                    {totals.totalSearches.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Credits per Search
                  </Typography>
                  <Typography variant="h4">
                    {totals.totalSearches > 0 
                      ? (totals.totalCredits / totals.totalSearches).toFixed(2)
                      : '0'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Daily Usage Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Daily Credit Usage
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={prepareDailyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {analyticsData?.teamTotals.map((team, index) => (
                      <Line
                        key={team.teamId}
                        type="monotone"
                        dataKey={team.team}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Service Breakdown */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Service Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={prepareServiceBreakdownData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareServiceBreakdownData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Users */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Users by Credit Usage
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.userCredits || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCredits" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Team Comparison */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Team Credit Usage
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.teamTotals || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCredits" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default CreditAnalytics; 
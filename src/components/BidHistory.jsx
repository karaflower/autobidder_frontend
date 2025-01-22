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
} from '@mui/material';
import axios from 'axios';
import Cookies from 'js-cookie';

const BidHistory = () => {
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        const userId = Cookies.get('userid');
        setCurrentUserId(userId);
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/bid-links`);
        const allBids = response.data;
        
        // Filter bids where the current user has bid
        const userBids = allBids
          .filter(link => link.bidinfo?.some(bid => bid.userid === userId))
          .map(link => ({
            id: link._id,
            title: link.title,
            url: link.url,
            description: link.description,
            date: link.date,
            bidDate: link.bidinfo.find(bid => bid.userid === userId).bid_date,
            created_at: link.created_at,
            disabled: link.disabled
          }))
          .sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));

        setBidHistory(userBids);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch bid history:', err);
        setError('Failed to fetch bid history');
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, []);

  const filteredBids = bidHistory.filter(bid => {
    const matchesTitle = bid.title.toLowerCase().includes(titleFilter.toLowerCase());
    const matchesDate = !dateFilter || 
      new Date(bid.bidDate).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    return matchesTitle && matchesDate;
  });

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
    <Box sx={{ pt: 4 }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Title..."
                  value={titleFilter}
                  variant="standard"
                  onChange={(e) => setTitleFilter(e.target.value)}
                  sx={{ ml: 1 }}
                />
              </TableCell>
              <TableCell s>Post Date</TableCell>
              <TableCell>
                <TextField
                  type="date"
                  variant="standard"
                  size="small"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{ ml: 1 }}
                  InputProps={{ sx: { height: '32px' } }}
                />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBids.map((bid) => (
              <TableRow 
                key={bid.id}
                sx={{ 
                  opacity: bid.disabled ? 0.7 : 1,
                  backgroundColor: bid.disabled ? 'action.disabledBackground' : 'inherit'
                }}
              >
                <TableCell>{bid.title}</TableCell>
                <TableCell>{bid.date || 'N/A'}</TableCell>
                <TableCell>{new Date(bid.bidDate).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</TableCell>
                <TableCell>
                  <Link 
                    href={`${bid.url}${bid.url.includes('?') ? '&' : '?'}bidLinkId=${bid.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Job
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row-reverse'}}>
        <Typography variant="subtitle1" gutterBottom>
          Total: {filteredBids.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default BidHistory; 
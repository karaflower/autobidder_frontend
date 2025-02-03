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
  Chip,
} from '@mui/material';
import axios from 'axios';
import Cookies from 'js-cookie';

const BidHistory = () => {
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = Cookies.get('userid');
        
        // Fetch resumes first to build the lookup map
        const resumesResponse = (await axios.get(`${process.env.REACT_APP_API_URL}/resumes`)).data;
        
        // Calculate the "to" date as one day after the "from" date
        const toDate = new Date(dateFilter);
        toDate.setDate(toDate.getDate() + 1);

        // Format the dates as needed for your API
        const formattedFromDate = dateFilter;
        const formattedToDate = toDate;

        // Update API call to use pagination parameters
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/bid-links`, {
            params: {
              page,
              limit: 1000,
              ...(dateFilter && {
                from: formattedFromDate,
                to: formattedToDate
              }),
              showBlacklisted: true
            }
          }
        );
        
        const { bidLinks, pagination } = response.data;
        
        // Process bid links similar to before
        const userBids = bidLinks
          .filter(link => link.bidinfo?.some(bid => bid.userid === userId))
          .map(link => {
            const userBid = link.bidinfo.find(bid => bid.userid === userId);
            const resumeDetails = userBid.profile?.map(p => {
              const baseResume = resumesResponse.find(resume => resume._id === p.resume);
              return {
                name: baseResume?.content.personal_info.name || 'N/A',
                date: p.bid_date,
                resumeId: p._id,
                useCustomized: p.useCustomized || false,
                path: p.useCustomized ? (link.resumes.find(r => r.resume_id === p.resume)).path || '' : baseResume?.path
              };
            }) || [];
            
            // Sort resumes by date and get the earliest bid date
            resumeDetails.sort((a, b) => new Date(a.date) - new Date(b.date));
            const earliestBidDate = resumeDetails[0]?.date || userBid.bid_date;

            return {
              id: link._id,
              title: link.title,
              url: link.url,
              description: link.description,
              date: link.date,
              resumeDetails,
              bidDate: earliestBidDate,
              created_at: link.created_at,
              disabled: link.disabled
            };
          })
          .sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));

        // Update state with pagination info
        setTotalPages(pagination.totalPages);
        setHasMore(pagination.hasNextPage);
        
        // Append new bids to existing ones if loading more pages
        setBidHistory(prev => page === 1 ? userBids : [...prev, ...userBids]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch bid history:', err);
        setError('Failed to fetch bid history');
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, page]);

  const filteredBids = bidHistory.filter(bid => {
    const matchesTitle = bid.title.toLowerCase().includes(titleFilter.toLowerCase());
    const matchesDate = !dateFilter || 
      new Date(bid.bidDate).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    return matchesTitle && matchesDate;
  });

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleAllRows = () => {
    if (expandedRows.size === filteredBids.length) {
      // If all rows are expanded, collapse all
      setExpandedRows(new Set());
    } else {
      // Expand all rows
      setExpandedRows(new Set(filteredBids.map(bid => bid.id)));
    }
  };

  const handleOpenResume = (path) => {
    console.log(path);
    if (path) {
      window.open(`${process.env.REACT_APP_API_URL}/resumefiles/${path}`, '_blank');
    }
  };

  // Helper function to format the date as required
  function formatDate(date) {
    // Example formatting, adjust as needed
    return date.toISOString().split('T')[0];
  }

  const handleLoadMore = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

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
    <Box sx={{ pt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '80%', mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          component="button"
          underline="hover"
          onClick={toggleAllRows}
          sx={{ cursor: 'pointer' }}
        >
          {expandedRows.size === filteredBids.length ? 'Collapse All' : 'Expand All'}
        </Link>
      </Box>
      <TableContainer component={Paper} sx={{ maxWidth: '80%', padding: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell sx={{ display: 'flex', alignItems: 'center' }}>Title
                <TextField
                  size="small"
                  placeholder="filter..."
                  value={titleFilter}
                  variant="standard"
                  onChange={(e) => setTitleFilter(e.target.value)}
                  sx={{ ml: 1 }}
                />
              </TableCell>
              <TableCell>Post Date</TableCell>
              <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                Date
                <TextField
                  type="date"
                  variant="standard"
                  size="small"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{ ml:1, maxWidth: '20px' }}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBids.map((bid) => (
              <React.Fragment key={bid.id}>
                <TableRow 
                  hover
                  onClick={() => toggleRow(bid.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    {expandedRows.has(bid.id) ? '▼' : '▶'}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`${bid.url}${bid.url.includes('?') ? '&' : '?'}bidLinkId=${bid.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {bid.title}
                    </Link>
                  </TableCell>
                  <TableCell>{bid.date || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(bid.bidDate).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
                {expandedRows.has(bid.id) && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 0 }}>
                      <Box sx={{ margin: 1, display: 'flex', justifyContent: 'flex-end', mr: '20px' }}>
                        <Table size="small" sx={{ width: '60%' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Resume Name</TableCell>
                              <TableCell>Bid Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bid.resumeDetails.map((resume) => (
                              <TableRow 
                                key={resume.resumeId}
                                hover
                                onClick={() => handleOpenResume(resume.path)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {resume.name}
                                    {resume.useCustomized && (
                                      <Chip 
                                        label="Customized" 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {new Date(resume.date).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMore && (
        <Box sx={{ mt: 2 }}>
          <Link
            component="button"
            underline="hover"
            onClick={handleLoadMore}
            sx={{ cursor: 'pointer' }}
          >
            Load More
          </Link>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row-reverse'}}>
        <Typography variant="subtitle1" gutterBottom>
          Total: {filteredBids.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default BidHistory; 
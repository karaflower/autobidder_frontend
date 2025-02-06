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
  Button,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const CustomizedResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlFilter, setUrlFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {};
        if (dateFilter) {
          params.startDate = dateFilter;
          const toDate = new Date(dateFilter);
          toDate.setDate(toDate.getDate() + 1);
          params.endDate = toDate.toISOString().split('T')[0];
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/resumes/customized/by-date`,
          { params }
        );
        
        setResumes(response.data.resumes);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter]);

  const filteredResumes = resumes.filter(resume => {
    const matchesUrl = resume.url.toLowerCase().includes(urlFilter.toLowerCase());
    const matchesDate = !dateFilter || 
      new Date(resume.generated_at).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    return matchesUrl && matchesDate;
  });

  const handleGlobalSearch = async () => {
    if (!urlFilter.trim()) {
      toast.error('Please enter a URL to search');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/resumes/customized`, {
          params: { url: urlFilter }
        }
      );
      setGlobalSearchResults(Array.isArray(response.data.resumes) ? response.data.resumes : []);
    } catch (error) {
    } finally {
      setIsSearching(false);
    }

  };

  const handleClearSearch = () => {
    setGlobalSearchResults([]);
    setUrlFilter('');
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && urlFilter.trim()) {
        handleGlobalSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [urlFilter]);

  const displayedResumes = globalSearchResults.length > 0 ? globalSearchResults : filteredResumes;

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    setDeletingId(resumeId);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/resumes/customized/${resumeId}`);
      setResumes(prevResumes => prevResumes.filter(resume => resume._id !== resumeId));
      setGlobalSearchResults(prevResults => prevResults.filter(resume => resume._id !== resumeId));
      toast.success('Resume deleted successfully');
    } catch (error) {
      toast.error('Failed to delete resume');
    } finally {
      setDeletingId(null);
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
    <>
      <ToastContainer />
      <Box sx={{ pt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TableContainer component={Paper} sx={{ padding: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px">#</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    URL
                    <TextField
                      size="small"
                      placeholder="filter..."
                      value={urlFilter}
                      variant="standard"
                      onChange={(e) => setUrlFilter(e.target.value)}
                      sx={{ ml: 1 }}
                    />
                    <Tooltip title={globalSearchResults.length > 0 ? "Clear Search" : "Global Search (Ctrl+Enter)"}>
                      <Button
                        variant="outlined"
                        onClick={globalSearchResults.length > 0 ? handleClearSearch : handleGlobalSearch}
                        disabled={isSearching}
                        size="small"
                      >
                        {isSearching ? (
                          <CircularProgress size={20} />
                        ) : globalSearchResults.length > 0 ? (
                          <CloseIcon sx={{ color: 'red' }} />
                        ) : (
                          <ManageSearchIcon />
                        )}
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell sx={{ display: 'flex', placeItems: 'baseline' }}>
                  Date
                  <TextField
                    type="date"
                    variant="standard"
                    size="small"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ ml: 1, maxWidth: '120px' }}
                  />
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedResumes.length > 0 ? (
                displayedResumes.map((resume, index) => (
                  <TableRow key={resume._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link 
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resume.url}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {resume.content?.personal_info?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(resume.generated_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View PDF">
                          <Button
                            onClick={() => window.open(`${process.env.REACT_APP_API_URL}/resumefiles/${resume.path}`, '_blank')}
                            size="small"
                          >
                            <PictureAsPdfIcon sx={{ mr: 0.2 }}/>
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <Button
                            onClick={() => handleDelete(resume._id)}
                            size="small"
                            color="error"
                            disabled={deletingId === resume._id}
                          >
                            {deletingId === resume._id ? <CircularProgress size={20} /> : <CloseIcon />}
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No customized resumes found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {displayedResumes.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row-reverse'}}>
            <Typography variant="subtitle1" gutterBottom>
              {globalSearchResults.length > 0 ? 'Search Results' : 'Total'}: {displayedResumes.length}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default CustomizedResumes; 
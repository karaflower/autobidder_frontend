import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Link,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Drawer,
  ListItemButton,
  CircularProgress,
  TextField,
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BidLinks = () => {
  const [bidLinks, setBidLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate());
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableResumes, setAvailableResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openResumePanel, setOpenResumePanel] = useState(false);
  const [selectedBidLinkResumes, setSelectedBidLinkResumes] = useState([]);
  const [showDisabled, setShowDisabled] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('user123'); // Replace with actual user ID
  const [users, setUsers] = useState({});  // Add this state for users lookup

  const fetchBidLinks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bid-links`);
      const sortedLinks = response.data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBidLinks(sortedLinks);
    } catch (err) {
      console.error('Failed to fetch bid links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/friends/all`);
      const usersMap = response.data.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    const fetchAvailableResumes = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/resumes`);
        setAvailableResumes(response.data);
      } catch (err) {
        console.error('Failed to fetch available resumes:', err);
      }
    };

    fetchBidLinks();
    fetchAvailableResumes();
    fetchUsers();  // Add this function call
    setCurrentUserId(Cookies.get('userid'));
  }, []);

  const handleToggleDisabled = async (linkId, currentDisabled) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/bid-links/${linkId}/disabled`, {
        disabled: !currentDisabled
      });
      setBidLinks(prevLinks => prevLinks.map(link => 
        link._id === linkId ? { ...link, disabled: !currentDisabled } : link
      ));
    } catch (err) {
      console.error('Failed to update disabled status:', err);
    }
  };

  const filteredBidLinks = bidLinks.filter(link => {
    const linkDate = new Date(link.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const meetsDateCriteria = (start && end) ? (linkDate >= start && linkDate <= end.setDate(end.getDate() + 1))
      : start ? (linkDate >= start)
      : end ? (linkDate <= end)
      : true;

    const searchLower = searchTerm.toLowerCase();
    const meetsSearchCriteria = searchTerm === '' || 
      link.title.toLowerCase().includes(searchLower) ||
      link.description.toLowerCase().includes(searchLower);

    const meetsDisabledCriteria = showDisabled || !link.disabled;

    return meetsDateCriteria && meetsSearchCriteria && meetsDisabledCriteria;
  });

  const handleGenerateResumes = async () => {
    setGenerating(true);
    setOpenDialog(false);

    try {
      for (const linkId of selectedLinks) {
        const link = bidLinks.find(l => l._id === linkId);
        if (link) {
          for (const resumeId of selectedResumes) {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/generate-resume`, {
              bidLinkId: linkId,
              resumeId: resumeId
            });
            if (response.data.success) {
              await fetchBidLinks();
              toast.success('Resume generated successfully');
            } else {
              toast.error('Failed to generate resume');
            }
          }
        }
      }
    } catch (error) {
      toast.error('Failed to generate resumes');
      console.error('Failed to generate resumes:', error);
    }

    setGenerating(false);
    setSelectedLinks([]);
    setSelectedResumes([]);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLinks([]);
    } else {
      const allVisibleLinkIds = filteredBidLinks.map(link => link._id);
      setSelectedLinks(allVisibleLinkIds);
    }
    setSelectAll(!selectAll);
  };

  const handleLinkSelection = (linkId) => {
    setSelectedLinks(prev => {
      const newSelection = prev.includes(linkId) 
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId];
      setSelectAll(newSelection.length === filteredBidLinks.length);
      return newSelection;
    });
  };

  const handleShowResumes = (resumes) => {
    setSelectedBidLinkResumes(resumes || []);
    setOpenResumePanel(true);
  };

  const handleOpenResume = (file) => {
    window.open(`${process.env.REACT_APP_API_URL}/resumefiles/${file}`, '_blank');
  };

  const getResumeName = (resumeId) => {
    const resume = availableResumes.find(r => r._id === resumeId);
    return resume ? resume.content.personal_info.name : 'Unknown';
  };

  const hasUserBid = (link) => {
    return link.bidinfo?.some(bid => bid.userid === currentUserId);
  };

  const handleBidSubmit = async (linkId) => {
    try {
      const link = bidLinks.find(l => l._id === linkId);
      if (link) {
        const url = new URL(link.url);
        const separator = url.search ? '&' : '?';
        const bidLinkParam = `bidLinkId=${linkId}`;
        window.open(`${link.url}${separator}${bidLinkParam}`, '_blank');
      }
      
      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/${linkId}/bid`);
      
      setBidLinks(prevLinks => prevLinks.map(link => {
        if (link._id === linkId) {
          return {
            ...link,
            bidinfo: [...(link.bidinfo || []), { userid: currentUserId, bid_date: new Date() }]
          };
        }
        return link;
      }));
    } catch (error) {
      console.error('Failed to submit bid:', error);
    }
  };

  const handleCancelBid = async (linkId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/bid-links/${linkId}/bid`);
      
      setBidLinks(prevLinks => prevLinks.map(link => {
        if (link._id === linkId) {
          return {
            ...link,
            bidinfo: (link.bidinfo || []).filter(bid => bid.userid !== currentUserId)
          };
        }
        return link;
      }));
    } catch (error) {
      console.error('Failed to cancel bid:', error);
    }
  };

  return (
    <Grid container spacing={2}>
      <ToastContainer />
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            {/* Date Range Box */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ maxWidth: '200px' }}>
                  <Typography variant="body2">From:</Typography>
                  <TextField
                    variant='standard'
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
                <Box sx={{ maxWidth: '200px' }}>
                  <Typography variant="body2">To:</Typography>
                  <TextField
                    type="date"
                    variant='standard'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
                <Box sx={{ maxWidth: '180px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    }
                    label={`Select All (${filteredBidLinks.length})`}
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showDisabled}
                        onChange={(e) => setShowDisabled(e.target.checked)}
                      />
                    }
                    label="Show Disabled Links"
                  />
                </Box>
                <Box sx={{ maxWidth: '200px' }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenDialog(true)}
                    fullWidth
                    disabled={generating}
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {generating ? 'Generating...' : 'Generate Resumes'}
                  </Button>
                </Box>
                <Box sx={{ maxWidth: '200px', flex: 1 }}>
                  <TextField
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    fullWidth
                    variant='standard'
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          {isLoading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Grid>
          ) : (
            filteredBidLinks.map((link) => (
              <Grid item xs={12} key={link._id}>
                <Card sx={{ opacity: link.disabled ? 0.7 : 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedLinks.includes(link._id)}
                            onChange={() => handleLinkSelection(link._id)}
                          />
                        }
                        label=""
                      />
                      <Typography variant="h6" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Link 
                          href={`${link.url}${link.url.includes('?') ? '&' : '?'}bidLinkId=${link._id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {link.title}
                        </Link>
                        {hasUserBid(link) && (
                          <CheckCircleIcon 
                            color="success" 
                            sx={{ ml: 1, fontSize: 20 }} 
                          />
                        )}
                      </Typography>
                      <Button
                        variant={hasUserBid(link) ? "outlined" : "contained"}
                        color={hasUserBid(link) ? "error" : "success"}
                        size="small"
                        onClick={() => hasUserBid(link) ? handleCancelBid(link._id) : handleBidSubmit(link._id)}
                        startIcon={hasUserBid(link) ? '✓' : null}
                        sx={{ ml: 2 }}
                      >
                        {hasUserBid(link) ? 'Cancel' : 'Apply'}
                      </Button>
                      {(link.resumes || []).length > 0 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleShowResumes(link.resumes)}
                          sx={{ ml: 2 }}
                        >
                          Show Resumes ({(link.resumes || []).length})
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleToggleDisabled(link._id, link.disabled)}
                        sx={{ ml: 2 }}
                      >
                        {link.disabled ? 'Enable' : 'Disable'}
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Posted: {link.date || 'N/A'} | Added: {new Date(link.created_at).toLocaleString()} 
                      {link.created_by && users[link.created_by] && (
                        <> | Searched by: {users[link.created_by]}</>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {link.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Select Resumes to Generate</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Generate resumes for {selectedLinks.length} selected job{selectedLinks.length !== 1 ? 's' : ''}
          </Typography>
          <List>
            {availableResumes.map((resume) => (
              <ListItem key={resume._id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedResumes.includes(resume._id)}
                      onChange={(e) => {
                        setSelectedResumes(prev => 
                          e.target.checked 
                            ? [...prev, resume._id]
                            : prev.filter(id => id !== resume._id)
                        );
                      }}
                    />
                  }
                  label={resume.content.personal_info.name}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateResumes} 
            variant="contained"
            disabled={selectedResumes.length === 0 || generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={openResumePanel}
        onClose={() => setOpenResumePanel(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '300px',
            padding: 2,
          },
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Generated Resumes
        </Typography>
        <List>
          {selectedBidLinkResumes.map((resume) => {
            const resumeName = getResumeName(resume.resume_id);
            if (resumeName != 'Unknown') {
              return (
                <ListItemButton
                  key={resume.resume_id}
                  onClick={() => handleOpenResume(resume.path)}
                >
                  <Typography>{resumeName}</Typography>
                </ListItemButton>
              )
            }
          })}
        </List>
      </Drawer>
    </Grid>
  );
};

export default BidLinks; 
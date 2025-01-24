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
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableResumes, setAvailableResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [openResumePanel, setOpenResumePanel] = useState(false);
  const [selectedBidLinkResumes, setSelectedBidLinkResumes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('user123'); // Replace with actual user ID
  const [users, setUsers] = useState({});  // Add this state for users lookup
  const [showDownvoted, setShowDownvoted] = useState(() => {
    const stored = localStorage.getItem('showDownvoted');
    return stored ? JSON.parse(stored) : false;
  });
  const [sortByVote, setSortByVote] = useState(() => {
    const stored = localStorage.getItem('sortByVote');
    return stored ? JSON.parse(stored) : true;
  });
  const [showHiddenLinks, setShowHiddenLinks] = useState(() => {
    const stored = localStorage.getItem('showHiddenLinks');
    return stored ? JSON.parse(stored) : false;
  });
  const [hiddenLinks, setHiddenLinks] = useState(() => {
    const stored = localStorage.getItem('hiddenLinks');
    return stored ? JSON.parse(stored) : [];
  });

  const fetchBidLinks = async () => {
    try {
      if (bidLinks.length == 0) {
        setIsLoading(true);
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bid-links`);
      const sortedLinks = response.data.sort((a, b) => {
        if (sortByVote) {
          // Sort by votes (recommended first)
          const aScore = (a.votes || []).reduce((acc, v) => acc + v.vote, 0);
          const bScore = (b.votes || []).reduce((acc, v) => acc + v.vote, 0);
          if (bScore !== aScore) return bScore - aScore;
        }
        // Then by date
        return new Date(b.created_at) - new Date(a.created_at);
      });
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

  useEffect(() => {
    fetchBidLinks();
  }, [sortByVote]);

  const handleVote = async (linkId, vote) => {
    try {
      const link = bidLinks.find(l => l._id === linkId);
      const userVote = link.votes?.find(v => v.userid === currentUserId);
      
      // Optimistically update the UI
      setBidLinks(prevLinks => prevLinks.map(link => {
        if (link._id === linkId) {
          let newVotes = [...(link.votes || [])];
          const existingVoteIndex = newVotes.findIndex(v => v.userid === currentUserId);
          
          if (userVote && userVote.vote === vote) {
            // Remove vote if clicking same button
            newVotes = newVotes.filter(v => v.userid !== currentUserId);
          } else {
            // Add or update vote
            if (existingVoteIndex !== -1) {
              newVotes[existingVoteIndex] = { ...newVotes[existingVoteIndex], vote };
            } else {
              newVotes.push({ userid: currentUserId, vote });
            }
          }
          
          return { ...link, votes: newVotes };
        }
        return link;
      }));

      // Make API call
      if (userVote && userVote.vote === vote) {
        axios.delete(`${process.env.REACT_APP_API_URL}/bid-links/${linkId}/vote`);
      } else {
        axios.post(`${process.env.REACT_APP_API_URL}/bid-links/${linkId}/vote`, {
          vote: vote
        });
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error('Failed to vote');
      // Revert optimistic update on error
      fetchBidLinks();
    }
  };

  const handleToggleHide = (linkId) => {
    setHiddenLinks(prev => {
      const newHiddenLinks = prev.includes(linkId)
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId];
      localStorage.setItem('hiddenLinks', JSON.stringify(newHiddenLinks));
      return newHiddenLinks;
    });
  };

  const filteredBidLinks = bidLinks.filter(link => {
    const searchLower = searchTerm.toLowerCase();
    const meetsSearchCriteria = searchTerm === '' || 
      link.title.toLowerCase().includes(searchLower) ||
      link.description.toLowerCase().includes(searchLower);

    const downvoteCount = (link.votes || []).filter(v => v.vote === -1).length;
    const upvoteCount = (link.votes || []).filter(v => v.vote === 1).length;
    const isDownvoted = downvoteCount > upvoteCount;

    const meetsVoteCriteria = showDownvoted || !isDownvoted;
    const meetsHiddenCriteria = showHiddenLinks || !hiddenLinks.includes(link._id);

    // Add date filtering
    const linkDate = new Date(link.created_at);
    const meetsDateCriteria = (() => {
      if (startDate) {
        const start = new Date(startDate);
        if (linkDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setDate(new Date(endDate).getDate() + 1);
        if (linkDate > end) return false;
      }
      return true;
    })();

    return meetsSearchCriteria && meetsVoteCriteria && meetsDateCriteria && meetsHiddenCriteria;
  });

  const handleGenerateResumes = async () => {
    // Get all checked checkboxes by their IDs when needed
    const checkedBoxes = document.querySelectorAll('input[name="bid-checkbox"]:checked');
    const selectedLinks = Array.from(checkedBoxes).map(checkbox => checkbox.value);

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
    // Clear checkboxes after generating
    document.querySelectorAll('input[name="bid-checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    setSelectedResumes([]);
  };

  const handleSelectAll = () => {
    const checkboxes = document.querySelectorAll('input[name="bid-checkbox"]');
    const someChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    checkboxes.forEach(checkbox => {
      checkbox.checked = !someChecked;
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
                        name="bid-checkbox"
                        value="all"
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
                        checked={showDownvoted}
                        onChange={(e) => {
                          setShowDownvoted(e.target.checked);
                          localStorage.setItem('showDownvoted', JSON.stringify(e.target.checked));
                        }}
                      />
                    }
                    label="Show Downvoted Links"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showHiddenLinks}
                        onChange={(e) => {
                          setShowHiddenLinks(e.target.checked);
                          localStorage.setItem('showHiddenLinks', JSON.stringify(e.target.checked));
                        }}
                      />
                    }
                    label="Show Hidden Links"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sortByVote}
                        onChange={(e) => {
                          setSortByVote(e.target.checked);
                          localStorage.setItem('sortByVote', JSON.stringify(e.target.checked));
                        }}
                      />
                    }
                    label="Sort by Votes"
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
                <Card sx={{
                  opacity: (() => {
                    const downvoteCount = (link.votes || []).filter(v => v.vote === -1).length;
                    const upvoteCount = (link.votes || []).filter(v => v.vote === 1).length;
                    const isDownvoted = downvoteCount > upvoteCount;
                    const isHidden = hiddenLinks.includes(link._id);
                    
                    if ((isDownvoted && showDownvoted) || (isHidden && showHiddenLinks)) {
                      return 0.6;
                    }
                    return 1;
                  })()
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="bid-checkbox"
                            value={link._id}
                          />
                        }
                        label=""
                      />
                      <Typography variant="h6" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Link 
                          href={`${link.url}${link.url.includes('?') ? '&' : '?'}bidLinkId=${link._id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{
                            '&:visited': {
                              color: '#7c37c0'
                            }
                          }}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                      {(link.resumes || []).filter(resume => resume.owner === currentUserId).length > 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleShowResumes(link.resumes)}
                            sx={{ ml: 2 }}
                          >
                            Show Resumes ({(link.resumes || []).filter(resume => resume.owner === currentUserId).length})
                          </Button>
                        )}
                        <Tooltip title={(() => {
                          const upvoters = (link.votes || [])
                            .filter(v => v.vote === 1 && v.userid !== currentUserId)
                            .map(v => users[v.userid] || 'Unknown')
                            .join(', ');
                          return upvoters || '';
                        })()}>
                          <Button
                            size="small"
                            onClick={() => handleVote(link._id, 1)}
                            sx={{ minWidth: 'auto', p: 0.5, gap: 0.5 }}
                          >
                            <ThumbUpIcon color={(link.votes || []).some(v => v.vote === 1 && v.userid === currentUserId) ? "primary" : "action"} />
                            {(() => {
                              const upvotes = (link.votes || []).reduce((acc, v) => acc + (v.vote === 1 ? 1 : 0), 0);
                              const userIsOnlyUpvote = upvotes === 1 && (link.votes || []).some(v => v.vote === 1 && v.userid === currentUserId);
                              return upvotes > 0 && !userIsOnlyUpvote && (
                                <Typography>
                                  {upvotes}
                                </Typography>
                              );
                            })()}
                          </Button>
                        </Tooltip>
                        <Tooltip title={(() => {
                          const downvoters = (link.votes || [])
                            .filter(v => v.vote === -1 && v.userid !== currentUserId)
                            .map(v => users[v.userid] || 'Unknown')
                            .join(', ');
                          return downvoters || '';
                        })()}>
                          <Button
                            size="small"
                            onClick={() => handleVote(link._id, -1)}
                            sx={{ minWidth: 'auto', p: 0.5, marginLeft: "8px", gap: 0.5 }}
                          >
                            <ThumbDownIcon color={(link.votes || []).some(v => v.vote === -1 && v.userid === currentUserId) ? "primary" : "action"} />
                            {(() => {
                              const downvotes = (link.votes || []).reduce((acc, v) => acc + (v.vote === -1 ? 1 : 0), 0);
                              const userIsOnlyDownvote = downvotes === 1 && (link.votes || []).some(v => v.vote === -1 && v.userid === currentUserId);
                              return downvotes > 0 && !userIsOnlyDownvote && (
                                <Typography>
                                  {downvotes}
                                </Typography>
                              );
                            })()}
                          </Button>
                        </Tooltip>
                        <Tooltip title={hiddenLinks.includes(link._id) ? "Show Link" : "Hide Link"}>
                          <Button
                            size="small"
                            onClick={() => handleToggleHide(link._id)}
                            sx={{ minWidth: 'auto', p: 0.5, marginLeft: "8px" }}
                          >
                            {hiddenLinks.includes(link._id) ? <VisibilityOffIcon color="action" /> : <VisibilityIcon color="action" />}
                          </Button>
                        </Tooltip>
                      </Box>
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
          {selectedBidLinkResumes
            .filter(resume => resume.owner === currentUserId)
            .map((resume) => {
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
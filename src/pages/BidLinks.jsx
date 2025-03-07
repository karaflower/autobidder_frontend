import React, { useState, useEffect, useMemo } from "react";
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
  Paper,
  ListItemText,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TablePagination,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import DoNotTouchIcon from "@mui/icons-material/DoNotTouch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SegmentIcon from '@mui/icons-material/Segment';

const ConfidenceIndicator = React.memo(({ confidence }) => {
  // Convert confidence from 0-1 to 0-100
  const score = Math.round((confidence || 0) * 100);
  
  // Color gradient: red (0-40), yellow (40-80), green (80-100)
  const getColor = (score) => {
    if (score < 40) {
      return 'hsl(0, 100%, 50%)'; // Red
    } else if (score < 80) {
      return 'hsl(60, 100.00%, 30.90%)'; // Yellow
    }
    return 'hsl(120, 100%, 40%)'; // Green
  };

  return (
    <Tooltip title={`Recommended: ${score}%`}>
      <Box
        sx={{
          display: 'inline-flex',
          position: 'relative',
          width: 16,
          height: 16,
          ml: 1,
          verticalAlign: 'text-bottom'
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          sx={{
            position: 'absolute',
            color: (theme) => theme.palette.grey[200]
          }}
          size={16}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          sx={{
            color: getColor(score),
            position: 'absolute'
          }}
          size={16}
        />
      </Box>
    </Tooltip>
  );
});

const BidLinks = () => {
  const [bidLinks, setBidLinks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("user123");
  const [users, setUsers] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString("en-CA");
  });
  const [showFilter, setShowFilter] = useState(() => {
    const stored = localStorage.getItem("showFilter");
    return stored ? JSON.parse(stored) : "all";
  });
  const [openBlacklistDialog, setOpenBlacklistDialog] = useState(false);
  const [blacklists, setBlacklists] = useState([]);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isReloadingBids, setIsReloadingBids] = useState(false);
  const [isSearchInputLoading, setIsSearchInputLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const stored = localStorage.getItem("rowsPerPage");
    return stored ? parseInt(stored, 10) : 50;
  });
  const [teamMembers, setTeamMembers] = useState({});
  const [queryDateLimit, setQueryDateLimit] = useState(() => {
    const stored = localStorage.getItem("queryDateLimit");
    return stored ? parseInt(stored, 10) : -1;
  });
  const [visitedLinks, setVisitedLinks] = useState(() => {
    const stored = localStorage.getItem("visitedLinks");
    return stored ? JSON.parse(stored) : [];
  });
  const [viewMode, setViewMode] = useState('categories');
  const [selectedQueries, setSelectedQueries] = useState([]);

  const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle days + hours specially
    if (diffInSeconds >= 86400) { // More than a day
      const days = Math.floor(diffInSeconds / 86400);
      const remainingHours = Math.floor((diffInSeconds % 86400) / 3600);
      
      if (remainingHours === 0) {
        return days === 1 ? '1 day ago' : `${days} days ago`;
      }
      return days === 1 
        ? `1 day ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'} ago`
        : `${days} days ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'} ago`;
    }
    const intervals = {
      hour: 3600,
      minute: 60
    };
  
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  };
  

  const getQueriesForCategory = (category) => {
    const queries = bidLinks
      .filter(link => {
        // First apply date filter
        if (queryDateLimit !== -1) {
          if (queryDateLimit === 0) {
            if (link.queryDateLimit != null) return false;
          } else if (link.queryDateLimit !== queryDateLimit) {
            return false;
          }
        }
        
        // Then apply category filter
        return category === 'all' || link.queryId?.category === category;
      })
      .reduce((acc, link) => {
        if (link.queryId?.link) {
          acc.add(link.queryId.link);
        }
        return acc;
      }, new Set());
    return Array.from(queries);
  };

  const filteredBidLinks = useMemo(() => {
    const filterLink = (link) => {
      // Date limit filter
      if (queryDateLimit !== -1) {
        if (queryDateLimit === 0) {
          if (link.queryDateLimit != null) return false;
        } else if (link.queryDateLimit !== queryDateLimit) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && link.queryId?.category !== selectedCategory) {
        return false;
      }

      // Query filter - only apply if specific queries are selected
      if (selectedQueries.length > 0) {
        return selectedQueries.includes(link.queryId?.link);
      }

      // User filter criteria
      if (showFilter === "mine" && link.created_by !== currentUserId) {
        return false;
      }

      return true;
    };

    return bidLinks.filter(filterLink);
  }, [
    bidLinks,
    showFilter,
    currentUserId,
    selectedCategory,
    queryDateLimit,
    selectedQueries,
  ]);

  // Add these useEffects to reset page when category, viewMode, or queryDateLimit changes
  useEffect(() => {
    setPage(0);
  }, [selectedCategory, viewMode, queryDateLimit]);

  const fetchBidLinks = async () => {
    try {
      setIsReloadingBids(true);
      // Clear existing links before fetching new ones
      setBidLinks([]);

      // Convert selectedDate to local timezone's 00:00:00 to 23:59:59
      const fromDate = new Date(selectedDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(selectedDate);
      toDate.setHours(23, 59, 59, 999);

      // Convert to GMT+0
      const fromGMT = new Date(fromDate.getTime());
      const toGMT = new Date(toDate.getTime());

      const params = new URLSearchParams({
        showBlacklisted: false,
        from: fromGMT.toISOString(),
        to: toGMT.toISOString(),
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links?${params.toString()}`
      );

      // Sort by date only
      const sortedLinks = response.data.bidLinks.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setBidLinks(sortedLinks);
    } catch (err) {
      console.error("Failed to fetch bid links:", err);
    } finally {
      setIsReloadingBids(false);
    }
  };

  useEffect(() => {
    fetchBidLinks();
  }, [selectedDate]);

  useEffect(() => {
    // Extract unique categories from bidLinks
    const uniqueCategories = [...new Set(bidLinks
      .filter(link => link.queryId?.category) // Only include links with queryId.category
      .map(link => link.queryId.category)
    )].sort();
    
    setCategories(uniqueCategories);
  }, [bidLinks]);

  useEffect(() => {
    fetchBlacklists();
  }, []);

  const fetchBlacklists = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links/blacklist`
      );
      setBlacklists(response.data.blacklists || []);
    } catch (error) {
      console.error("Failed to fetch blacklists:", error);
      toast.error("Failed to fetch blacklists");
    }
  };

  const handleAddBlacklist = async (newBlackWords) => {
    if (!newBlackWords.trim()) return;
    try {
      // Split by comma and trim each entry
      const blacklistArray = newBlackWords
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0); // Filter out empty strings

      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: blacklistArray,
      });
      await fetchBlacklists();
      await fetchBidLinks();
      toast.success(`${blacklistArray.length} item(s) added to blacklist`);
    } catch (error) {
      console.error("Failed to add to blacklist:", error);
      toast.error("Failed to add to blacklist");
    }
  };

  const handleAddCompanyToBlacklist = async (company) => {
    if (!company) return;

    // Optimistically update UI by filtering out links with this company
    const originalLinks = [...bidLinks];
    setBidLinks((prev) => prev.filter((link) => link.company !== company));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: [company.trim()],
      });
      await fetchBlacklists(); // Still fetch blacklists to update the count
    } catch (error) {
      console.error("Failed to add company to blacklist:", error);
      toast.error("Failed to add company to blacklist");
      // Revert optimistic update on error
      setBidLinks(originalLinks);
    }
  };

  const handleDeleteBlacklist = async (urlToDelete) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/bid-links/blacklist`,
        {
          data: { blacklists: [urlToDelete] },
        }
      );
      await fetchBlacklists();
      await fetchBidLinks();
      toast.success("URL removed from blacklist");
    } catch (error) {
      console.error("Failed to remove from blacklist:", error);
      toast.error("Failed to remove from blacklist");
    }
  };

  const handleGlobalSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsSearchInputLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links/search`,
        {
          params: {
            searchTerm: searchTerm,
            showBlacklisted: false,
          },
        }
      );
      setGlobalSearchResults(Array.isArray(response.data) ? response.data : []);
      setOpenSearchDialog(true);
    } catch (error) {
      console.error("Failed to perform global search:", error);
      toast.error("Failed to perform global search");
    } finally {
      setIsSearchInputLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`);
      const membersMap = {};
      response.data.forEach(member => {
        membersMap[member._id] = member.name;
      });
      setTeamMembers(membersMap);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to fetch team members');
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Add this useEffect to scroll to top when page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [page]);

  const handleLinkClick = (linkId) => {
    setVisitedLinks(prev => {
      const newVisited = [...new Set([...prev, linkId])];
      localStorage.setItem("visitedLinks", JSON.stringify(newVisited));
      return newVisited;
    });
  };

  const renderBlacklistPanel = () => {
    const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);

    const handleBlacklistSubmit = async (value) => {
      if (!value.trim()) return;
      setIsAddingBlacklist(true);
      try {
        await handleAddBlacklist(value);
        // Clear the input value after successful addition
        return true; // Return true to indicate success
      } finally {
        setIsAddingBlacklist(false);
      }
    };

    return (
      <Drawer
        anchor="right"
        open={openBlacklistDialog}
        onClose={() => setOpenBlacklistDialog(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: "400px",
            padding: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Manage Blacklisted Words
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Enter blacklists"
              variant="standard"
              size="small"
              helperText="Separate multiple items with commas"
              disabled={isAddingBlacklist}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const success = await handleBlacklistSubmit(e.target.value);
                  if (success) {
                    e.target.value = '';
                  }
                }
              }}
              InputProps={{
                endAdornment: isAddingBlacklist && (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ),
              }}
            />
          </Box>

          <List sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
            {[...blacklists].reverse().map((url, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteBlacklist(url)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={url}
                  sx={{
                    wordBreak: "break-all",
                    pr: 2,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    );
  };

  const blacklistButton = (
    <Button
      variant="outlined"
      startIcon={<DoNotTouchIcon />}
      onClick={() => setOpenBlacklistDialog(true)}
      size="small"
    >
      Blacklists ({blacklists.length})
    </Button>
  );

  const DetailDialog = React.memo(({ open, onClose, link }) => {
    if (!link) return null;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Link Details</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText 
                primary="Title"
                secondary={link.title || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="URL"
                secondary={
                  <Link href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.url}
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Company"
                secondary={link.company || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Description"
                secondary={link.description || 'N/A'}
                secondaryTypographyProps={{ 
                  style: { whiteSpace: 'pre-wrap' } 
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Posted Date"
                secondary={link.date || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Indexed By"
                secondary={teamMembers[link.created_by] || 'Unknown'}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Indexed"
                secondary={getRelativeTimeString(new Date(link.created_at))}
              />
            </ListItem>
            {link.queryId && (
              <>
                <ListItem>
                  <ListItemText 
                    primary="Query Used"
                    secondary={link.queryId.link}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Category"
                    secondary={link.queryId.category || 'N/A'}
                  />
                </ListItem>
              </>
            )}
            {link.confidence && (
              <>
                <ListItem>
                  <ListItemText 
                    primary="Confidence"
                    secondary={link.confidence || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Reason"
                    secondary={link.reason || 'N/A'}
                  />
                </ListItem>
              </>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  });

  const FilteredBidLinks = React.memo(
    ({ filteredBidLinks, users }) => {
      const [selectedLink, setSelectedLink] = useState(null);
      const [goToPage, setGoToPage] = useState('');
      const emptyRows = page > 0 
        ? Math.max(0, (1 + page) * rowsPerPage - filteredBidLinks.length) 
        : 0;

      if (filteredBidLinks.length === 0) {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No links
            </Typography>
          </Box>
        );
      }

      const PaginationComponent = () => {
        const totalPages = Math.ceil(filteredBidLinks.length / rowsPerPage);

        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            p: 2,
            gap: 2
          }}>
            <TablePagination
              component="div"
              count={filteredBidLinks.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                const newRowsPerPage = parseInt(event.target.value, 10);
                setRowsPerPage(newRowsPerPage);
                localStorage.setItem("rowsPerPage", newRowsPerPage.toString());
                setPage(0);
              }}
              showFirstButton
              showLastButton
            />
          </Box>
        );
      };

      return (
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ 
            ml: 2,
            mb: 2,
            mt: 2,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <PaginationComponent />
            <TableContainer sx={{ minWidth: "100%" }}>
              <Table aria-labelledby="tableTitle">
                <TableBody>
                  {filteredBidLinks
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((link, index) => {
                      const fullIndex = page * rowsPerPage + index + 1;
                      return (
                        <TableRow 
                          hover 
                          key={link._id}
                          sx={{ 
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02) !important',
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: 'rgba(0, 0, 0, 0.01)'
                            }
                          }}
                        >
                          <TableCell sx={{ py: 1.5, px: 3 }}>{fullIndex}</TableCell>
                          <TableCell 
                            sx={{ py: 1.5, px: 3 }}
                          >
                            <Link
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleLinkClick(link._id)}
                              sx={{ 
                                fontSize: "1.1rem",
                                fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: visitedLinks.includes(link._id) 
                                  ? (theme) => theme.palette.mode === 'dark' ? '#e0b0ff' : 'purple'
                                  : 'primary.main',
                                display: 'inline-flex',
                                alignItems: 'center',
                                '&:hover': {
                                  textDecoration: 'underline'
                                },
                                "&:visited": (theme) => ({
                                  color: theme.palette.mode === 'dark' ? '#e0b0ff' : 'purple'
                                })
                              }}
                            >
                              {link.title}
                              {link.confidence && <ConfidenceIndicator confidence={link.confidence} />}
                            </Link>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mt: 1,
                                lineHeight: 1.6
                              }}
                            >
                              {(link.company || link.date) && (
                                <>
                                  {link.company && (
                                    <><strong>Company:</strong> {link.company}</>
                                  )}
                                  {link.company && link.date && " | "}
                                  {link.date && (
                                    <><strong>Posted:</strong> {link.date}</>
                                  )}
                                  <br />
                                </>
                              )}
                              {link.description}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1, px: 3 }}>
                            <Box sx={{ 
                              display: "flex",
                              flexDirection: "column",
                              gap: 1
                            }}>
                              <Tooltip title="Show Details" placement="left">
                                <Button
                                  size="small"
                                  onClick={() => setSelectedLink(link)}
                                  sx={{ 
                                    minWidth: "40px",
                                    height: "40px",
                                    borderRadius: 1
                                  }}
                                >
                                  <InfoIcon color="action" />
                                </Button>
                              </Tooltip>
                              {link.company && (
                                <Tooltip title={`Add ${link.company} to blacklist`} placement="left">                                  
                                  <Button
                                    size="small"
                                    onClick={() => handleAddCompanyToBlacklist(link.company)}
                                    sx={{ 
                                      minWidth: "40px",
                                      height: "40px",
                                      borderRadius: 1
                                    }}
                                  >
                                    <DoNotTouchIcon color="action" />
                                  </Button>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationComponent />
          </Paper>
          
          <DetailDialog 
            open={Boolean(selectedLink)}
            onClose={() => setSelectedLink(null)}
            link={selectedLink}
          />
        </Box>
      );
    }
  );

  const renderSettingsBar = () => {
    // Update the count calculation to consider selected queries
    const getCountForDateLimit = (limit) => {
      return bidLinks.filter(link => {
        // First apply date filter
        if (limit === -1) {
          // No date filter
        } else if (limit === 0) {
          if (link.queryDateLimit != null) return false;
        } else if (link.queryDateLimit !== limit) {
          return false;
        }
        
        // Then apply category filter
        if (selectedCategory !== 'all' && link.queryId?.category !== selectedCategory) {
          return false;
        }

        // Finally apply query filter if in query mode with selected queries
        if (viewMode === 'queries' && selectedQueries.length > 0) {
          return selectedQueries.includes(link.queryId?.link);
        }
        
        return true;
      }).length;
    };

    const handleOpenAllLinks = () => {
      const visibleLinks = filteredBidLinks
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(link => link.url);

      visibleLinks.forEach(url => {
        window.open(url, '_blank');
      });

      toast.info(`Opened ${visibleLinks.length} links`);
    };

    return (
      <Box
        sx={{
          mb: 2,
          position: "sticky",
          top: 20,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          padding: "16px",
          paddingTop: "10px",
          paddingLeft: "16px",
          paddingBottom: "16px",
          boxShadow: (theme) => theme.palette.mode === 'light' 
            ? ["0 4px 6px -1px rgba(0, 0, 0, 0.1)", "0 2px 4px -1px rgba(0, 0, 0, 0.1)"]
            : ["0 4px 6px -1px rgba(0, 0, 0, 0.5)", "0 2px 4px -1px rgba(0, 0, 0, 0.5)"],
        }}
      >
        <Grid container spacing={2}>
          {/* First Row */}
          <Grid item xs={12}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TextField
                  variant="standard"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  size="small"
                  sx={{ width: "130px" }}
                />
              </Grid>

              <Grid item>
                <TextField
                  select
                  variant="standard"
                  size="small"
                  value={queryDateLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setQueryDateLimit(value);
                    localStorage.setItem("queryDateLimit", value.toString());
                  }}
                  sx={{ width: "200px" }}
                >
                  <MenuItem value={-1}>
                    {viewMode === 'queries' && selectedQueries.length > 0
                      ? `Selected Query (${getCountForDateLimit(-1)})`
                      : selectedCategory === 'all'
                        ? `All (${getCountForDateLimit(-1)})`
                        : `All in ${selectedCategory} (${getCountForDateLimit(-1)})`}
                  </MenuItem>
                  <MenuItem value={0}>Any time ({getCountForDateLimit(0)})</MenuItem>
                  <MenuItem value={1}>Past 24 hours ({getCountForDateLimit(1)})</MenuItem>
                  <MenuItem value={7}>Past week ({getCountForDateLimit(7)})</MenuItem>
                  <MenuItem value={30}>Past month ({getCountForDateLimit(30)})</MenuItem>
                  <MenuItem value={365}>Past year ({getCountForDateLimit(365)})</MenuItem>
                </TextField>
              </Grid>

              <Grid item>
                <TextField
                  size="small"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await handleGlobalSearch(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  placeholder="Enter Search Term..."
                  sx={{ width: "150px" }}
                  variant="standard"
                  InputProps={{
                    endAdornment: isSearchInputLoading && (
                      <CircularProgress size={16} />
                    ),
                  }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleOpenAllLinks}
                  size="small"
                >
                  Open All ({Math.min(rowsPerPage, filteredBidLinks.length - (page * rowsPerPage))})
                </Button>
              </Grid>

              <Grid item>{blacklistButton}</Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderLeftPanel = () => {
    const queries = getQueriesForCategory(selectedCategory);
    
    // Calculate total links for current category with date filter
    const totalQueryLinks = bidLinks.filter(link => {
      // First apply date filter
      if (queryDateLimit !== -1) {
        if (queryDateLimit === 0) {
          if (link.queryDateLimit != null) return false;
        } else if (link.queryDateLimit !== queryDateLimit) {
          return false;
        }
      }
      
      // Then apply category filter
      return selectedCategory === 'all' || link.queryId?.category === selectedCategory;
    }).length;

    return (
      <Card sx={{ 
        width: 250, 
        height: 'calc(100vh - 80px)',
        position: 'sticky',
        top: 20,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': { pb: 2 }
        }}>
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6">
                {viewMode === 'categories' ? 'Categories' : 'Queries'}
              </Typography>
              {viewMode === 'queries' && (
                <Button
                  size="small"
                  onClick={() => {
                    setViewMode('categories');
                    setSelectedQueries([]);
                  }}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
              )}
            </Box>
          </Box>

          <List sx={{ 
            flexGrow: 1,
            overflow: 'auto'
          }}>
            {viewMode === 'categories' ? (
              <>
                <ListItemButton
                  selected={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  sx={{ pr: 8 }} // Add padding for the icon button
                >
                  <ListItemText 
                    primary="All"
                    secondary={`${bidLinks.filter(link => {
                      if (queryDateLimit !== -1) {
                        if (queryDateLimit === 0) {
                          if (link.queryDateLimit != null) return false;
                        } else if (link.queryDateLimit !== queryDateLimit) {
                          return false;
                        }
                      }
                      return true;
                    }).length} links`}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent ListItemButton click
                      setSelectedCategory('all');
                      setViewMode('queries');
                    }}
                    sx={{ position: 'absolute', right: 8 }}
                  >
                    <SegmentIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
                {categories.map((category) => {
                  const categoryCount = bidLinks.filter(link => 
                    link.queryId?.category === category &&
                    (queryDateLimit === -1 || 
                      (queryDateLimit === 0 ? link.queryDateLimit == null : 
                        link.queryDateLimit === queryDateLimit))
                  ).length;

                  return (
                    <ListItemButton
                      key={category}
                      selected={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                      sx={{ pr: 8 }} // Add padding for the icon button
                    >
                      <ListItemText 
                        primary={category}
                        secondary={`${categoryCount} links`}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ListItemButton click
                          setSelectedCategory(category);
                          setViewMode('queries');
                        }}
                        sx={{ position: 'absolute', right: 8 }}
                      >
                        <SegmentIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  );
                })}
              </>
            ) : (
              <>
                <ListItemButton
                  selected={selectedQueries.length === 0}
                  onClick={() => {
                    setSelectedQueries([]);
                    setPage(0);
                  }}
                >
                  <ListItemText 
                    primary="All Queries"
                    secondary={`${totalQueryLinks} links`}
                  />
                </ListItemButton>
                {queries.map((query) => {
                  const queryCount = bidLinks.filter(link => 
                    link.queryId?.link === query &&
                    (queryDateLimit === -1 || 
                      (queryDateLimit === 0 ? link.queryDateLimit == null : 
                        link.queryDateLimit === queryDateLimit))
                  ).length;

                  return (
                    <ListItemButton
                      key={query}
                      selected={selectedQueries.includes(query)}
                      onClick={() => {
                        setSelectedQueries([query]);
                        setPage(0);
                      }}
                    >
                      <ListItemText 
                        primary={query}
                        secondary={`${queryCount} links`}
                      />
                    </ListItemButton>
                  );
                })}
              </>
            )}
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {renderLeftPanel()}
      <Box sx={{ flex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {renderSettingsBar()}
            {isReloadingBids ? (
              <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Grid>
            ) : (
              <FilteredBidLinks
                filteredBidLinks={filteredBidLinks}
                users={users}
              />
            )}
          </Grid>
        </Grid>

        {renderBlacklistPanel()}

        <Dialog
          open={openSearchDialog}
          onClose={() => setOpenSearchDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Global Search Results ({globalSearchResults.length})
          </DialogTitle>
          <DialogContent>
            <List sx={{ maxHeight: "60vh", overflow: "auto" }}>
              {globalSearchResults.map((link) => (
                <ListItem key={link._id} divider>
                  <ListItemText
                    primary={
                      <Link
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.title}
                      </Link>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Company: {link.company || "N/A"} | Posted:{" "}
                          {link.date || "N/A"} | Added:{" "}
                          {getRelativeTimeString(new Date(link.created_at))}
                          {link.created_by && users[link.created_by] && (
                            <> | By: {users[link.created_by]}</>
                          )}
                        </Typography>
                        <Typography variant="body2">
                          {link.description}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSearchDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default BidLinks;

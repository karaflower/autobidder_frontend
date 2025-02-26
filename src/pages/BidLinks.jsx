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
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import DoNotTouchIcon from "@mui/icons-material/DoNotTouch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoIcon from '@mui/icons-material/Info';

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
    <Tooltip title={`Confidence: ${score}%`}>
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
  const [users, setUsers] = useState({}); // Add this state for users lookup
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone
  });
  const [showHiddenLinks, setShowHiddenLinks] = useState(() => {
    const stored = localStorage.getItem("showHiddenLinks");
    return stored ? JSON.parse(stored) : false;
  });
  const [hiddenLinks, setHiddenLinks] = useState(() => {
    const stored = localStorage.getItem("hiddenLinks");
    return stored ? JSON.parse(stored) : [];
  });
  const [showFilter, setShowFilter] = useState(() => {
    const stored = localStorage.getItem("showFilter");
    return stored ? JSON.parse(stored) : "all"; // 'all', 'mine', 'team'
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
  const [teamMembers, setTeamMembers] = useState({}); // Add this state for team members lookup

  const filteredBidLinks = useMemo(() => {
    const filterLink = (link) => {
      // Hidden criteria
      if (!showHiddenLinks && hiddenLinks.includes(link._id)) {
        return false;
      }

      // User filter criteria
      if (showFilter === "mine" && link.created_by !== currentUserId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && link.queryId?.category !== selectedCategory) {
        return false;
      }

      return true;
    };

    return bidLinks.filter(filterLink);
  }, [
    bidLinks,
    showHiddenLinks,
    hiddenLinks,
    showFilter,
    currentUserId,
    selectedCategory,
  ]);

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
    console.log("Selected Date:", selectedDate);
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

  // Add this new useEffect to reset page when category changes
  useEffect(() => {
    setPage(0);
  }, [selectedCategory]);

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

  const handleToggleHide = useMemo(() => (linkId) => {
    setHiddenLinks((prev) => {
      const newHiddenLinks = prev.includes(linkId)
        ? prev.filter((id) => id !== linkId)
        : [...prev, linkId];
      localStorage.setItem("hiddenLinks", JSON.stringify(newHiddenLinks));
      return newHiddenLinks;
    });
  }, []);

  const handleHideAll = () => {
    const linksToHide = filteredBidLinks.map((link) => link._id);
    setHiddenLinks((prev) => {
      const newHiddenLinks = [...new Set([...prev, ...linksToHide])];
      localStorage.setItem("hiddenLinks", JSON.stringify(newHiddenLinks));
      return newHiddenLinks;
    });
    toast.success(`${linksToHide.length} link(s) hidden`);
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

  const renderBlacklistPanel = () => (
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
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await handleAddBlacklist(e.target.value);
                e.target.value = '';
              }
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

  // Add this useEffect for the keyboard shortcut
  const VisibilityToggleButton = React.memo(({ linkId, isHidden, onToggle }) => {
    return (
      <Tooltip title={isHidden ? "Show Link" : "Hide Link"} placement="left">
        <Button
          size="small"
          onClick={() => onToggle(linkId)}
          sx={{ minWidth: "auto", p: 0.5 }}
        >
          {isHidden ? (
            <VisibilityOffIcon color="action" />
          ) : (
            <VisibilityIcon color="action" />
          )}
        </Button>
      </Tooltip>
    );
  });

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
                primary="Found By"
                secondary={teamMembers[link.created_by] || 'Unknown'}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Found At"
                secondary={new Date(link.created_at).toLocaleString()}
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
    ({ filteredBidLinks, hiddenLinks, users, onToggleHide }) => {
      const [selectedLink, setSelectedLink] = useState(null);
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

      const PaginationComponent = () => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
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
          />
        </Box>
      );

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
                              sx={{ 
                                fontSize: "1.1rem",
                                fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: 'primary.main',
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
                              <VisibilityToggleButton 
                                linkId={link._id}
                                isHidden={hiddenLinks.includes(link._id)}
                                onToggle={onToggleHide}
                              />
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

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Left Panel - Categories */}
      <Card sx={{ 
        width: 250, 
        height: 'fit-content',
        position: 'sticky',
        top: 20
      }}>
        <CardContent>
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            // bgcolor: 'background.paper',
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
              <Typography variant="h6">Categories</Typography>
            </Box>
          </Box>

          <List>
            <ListItemButton
              selected={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              <ListItemText 
                primary="All"
                secondary={`${bidLinks.length} links`}
              />
            </ListItemButton>
            {categories.map((category) => {
              const categoryCount = bidLinks.filter(link => 
                link.queryId?.category === category
              ).length;

              return (
                <ListItemButton
                  key={category}
                  selected={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  <ListItemText 
                    primary={category}
                    secondary={`${categoryCount} links`}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
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
                  ? [
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      "0 2px 4px -1px rgba(0, 0, 0, 0.1)"
                    ]
                  : [
                      "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
                      "0 2px 4px -1px rgba(0, 0, 0, 0.5)"
                    ],
              }}
            >
              <Grid container spacing={2}>
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
                        size="small"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleGlobalSearch(e.target.value);
                          }
                        }}
                        placeholder="Enter Search Term..."
                        sx={{ width: "150px" }}
                        variant="standard"
                        InputProps={{
                          endAdornment: isSearchInputLoading && (
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={showHiddenLinks}
                            onChange={(e) => {
                              setShowHiddenLinks(e.target.checked);
                              localStorage.setItem(
                                "showHiddenLinks",
                                JSON.stringify(e.target.checked)
                              );
                            }}
                          />
                        }
                        label="Hidden"
                      />
                    </Grid>

                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityOffIcon />}
                        onClick={handleHideAll}
                        size="small"
                      >
                        Hide All ({filteredBidLinks.length})
                      </Button>
                    </Grid>

                    <Grid item>{blacklistButton}</Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>

            <Grid container spacing={2}>
              {isReloadingBids ? (
                <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Grid>
              ) : (
                <FilteredBidLinks
                  filteredBidLinks={filteredBidLinks}
                  hiddenLinks={hiddenLinks}
                  users={users}
                  onToggleHide={handleToggleHide}
                />
              )}
            </Grid>
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
                          {new Date(link.created_at).toLocaleString()}
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

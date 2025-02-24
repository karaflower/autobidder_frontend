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
  const [rowsPerPage, setRowsPerPage] = useState(50);

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

  const handleAddBlacklist = async (newBlackWord) => {
    if (!newBlackWord.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: [newBlackWord.trim()],
      });
      await fetchBlacklists();
      await fetchBidLinks();
      toast.success("URL added to blacklist");
    } catch (error) {
      console.error("Failed to add to blacklist:", error);
      toast.error("Failed to add to blacklist");
    } finally {
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
            label="Enter blacklist"
            variant="standard"
            size="small"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await handleAddBlacklist(e.target.value);
                e.target.value = ''
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
      <Tooltip title={isHidden ? "Show Link" : "Hide Link"}>
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

  const FilteredBidLinks = React.memo(
    ({ filteredBidLinks, hiddenLinks, users, onToggleHide }) => {
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

      return (
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ 
            ml: 2,
            mb: 2,
            mt: 2,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <TableContainer sx={{ minWidth: "100%" }}>
              <Table aria-labelledby="tableTitle">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      py: 3,
                      px: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>#</TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      px: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>Title</TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      px: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>Company</TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      px: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>Posted</TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      px: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
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
                              backgroundColor: 'rgba(0, 0, 0, 0.02) !important'
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: 'rgba(0, 0, 0, 0.01)'
                            }
                          }}
                        >
                          <TableCell sx={{ py: 3, px: 3 }}>{fullIndex}</TableCell>
                          <TableCell sx={{ py: 3, px: 3 }}>
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
                                '&:hover': {
                                  textDecoration: 'underline'
                                },
                                "&:visited": { 
                                  color: 'purple'
                                }
                              }}
                            >
                              {link.title}
                            </Link>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mt: 1,
                                lineHeight: 1.6
                              }}
                            >
                              {link.description}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: 3,
                            px: 3,
                            fontSize: '0.95rem'
                          }}>
                            {link.company || "N/A"}
                          </TableCell>
                          <TableCell sx={{ 
                            py: 3,
                            px: 3,
                            fontSize: '0.95rem'
                          }}>
                            {link.date || "N/A"}
                          </TableCell>
                          <TableCell sx={{ py: 3, px: 3 }}>
                            <Box sx={{ 
                              display: "flex",
                              gap: 2
                            }}>
                              {link.company && (
                                <Tooltip title={`Add ${link.company} to blacklist`}>                                  
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <TablePagination
                component="div"
                count={filteredBidLinks.length}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </Box>
          </Paper>
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
            bgcolor: 'background.paper',
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
                backgroundColor: "#f8fafc",
                padding: "16px",
                paddingTop: "10px",
                paddingLeft: "16px",
                paddingBottom: "16px",
                boxShadow: [
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

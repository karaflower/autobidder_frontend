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
  Divider,
  IconButton,
} from "@mui/material";
import axios from "axios";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
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
  const [showFriendsMenu, setShowFriendsMenu] = useState(false);
  const [openBlacklistDialog, setOpenBlacklistDialog] = useState(false);
  const [blacklists, setBlacklists] = useState([]);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isReloadingBids, setIsReloadingBids] = useState(false);
  const [isSearchInputLoading, setIsSearchInputLoading] = useState(false);

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

      return true;
    };

    return bidLinks.filter(filterLink);
  }, [
    bidLinks,
    showHiddenLinks,
    hiddenLinks,
    showFilter,
    currentUserId,
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

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/friends/added-me`
      );
      const usersMap = response.data.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchBlacklists();
    fetchUsers();
    setCurrentUserId(Cookies.get("userid"));
  }, []);

  useEffect(() => {
    console.log("Selected Date:", selectedDate);
    fetchBidLinks();
  }, [selectedDate]);

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
          sx={{ minWidth: "auto", p: 0.5, marginLeft: "8px" }}
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
      console.log("FilteredBidLinks rendered");
      return filteredBidLinks.map((link) => {
        const fullIndex = bidLinks.findIndex(item => item._id === link._id);
        
        return (
          <Grid item xs={12} key={link._id}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="h6"
                    sx={{ flex: 1, display: "flex", alignItems: "center" }}
                  >
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: 'text.disabled',
                        minWidth: '30px',
                        mr: 1
                      }}
                    >
                      {fullIndex + 1}.
                    </Typography>
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ "&:visited": { color: "purple" } }}
                    >
                      {link.title}
                    </Link>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {link.company && (
                      <Tooltip title={`Add ${link.company} to blacklist`}>
                        <Button
                          size="small"
                          onClick={() =>
                            handleAddCompanyToBlacklist(link.company)
                          }
                          sx={{ minWidth: "auto", p: 0.5, marginLeft: "8px" }}
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
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Company: {link.company || "N/A"} | Posted: {link.date || "N/A"}{" "}
                  | Added: {new Date(link.created_at).toLocaleString()}
                  {link.created_by && users[link.created_by] && (
                    <> | Searched by: {users[link.created_by]}</>
                  )}
                  <Tooltip title={link.queryId?.link}>
                    {link.queryId?.link && (
                      <> | Query Source: {link.queryId.link.slice(0, 30)}{link.queryId.link.length > 30 ? "..." : ""}</>
                    )}
                  </Tooltip>
                  {link.queryDateLimit && (
                    <> | Query Date Limit: {link.queryDateLimit}</>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {link.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      });
    }
  );

  return (
    <Grid container spacing={2}>
      <ToastContainer />
      <Grid item xs={12}>
        <Box
          sx={{
            mb: 2,
            position: "sticky",
            top: 10,
            zIndex: 1000,
            backgroundColor: "background.default",
            pt: 2,
            pl: 2,
            pb: 2,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "center", p: 4 }}
            >
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
    </Grid>
  );
};

export default BidLinks;

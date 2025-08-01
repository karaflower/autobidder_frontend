import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Menu,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  ListItemIcon,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import DoNotTouchIcon from "@mui/icons-material/DoNotTouch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SegmentIcon from "@mui/icons-material/Segment";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Slider from "@mui/material/Slider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "../context/AuthContext";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import NotificationsIcon from "@mui/icons-material/Notifications";
const OPENED_LINKS_STORAGE_KEY = "openedBidLinks";
const MAX_STORED_LINKS = 10000;
const LINK_EXPIRY_DAYS = 30;
const STRICT_TAGS = [
  "All",
  "Email Found",
  "Remote Job",
  "Non Remote Job",
  "Other Relevant",
  "Login Required",
  "Verification Required",
  "Expired",
  "Irrelevant",
  "Uncategorized",
];
const TAG_PRIORITY = {
  "Email Found": 1,
  "Remote Job": 2,
  "Non Remote Job": 3,
  "Login Required": 4,
  "Other Relevant": 5,
  "Verification Required": 6,
  Expired: 7,
  Irrelevant: 8,
  Uncategorized: 9,
};

const getOpenedLinks = () => {
  try {
    const stored = localStorage.getItem(OPENED_LINKS_STORAGE_KEY);
    if (!stored) return [];

    const links = JSON.parse(stored);
    const now = new Date().getTime();

    // Filter out expired links
    const validLinks = links.filter((link) => {
      const expiryDate =
        new Date(link.timestamp).getTime() +
        LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      return now < expiryDate;
    });

    // If we filtered out any expired links, update storage
    if (validLinks.length !== links.length) {
      localStorage.setItem(
        OPENED_LINKS_STORAGE_KEY,
        JSON.stringify(validLinks)
      );
    }

    return validLinks;
  } catch (error) {
    console.error("Error reading opened links:", error);
    return [];
  }
};

const addOpenedLinks = (newLinks) => {
  try {
    const currentLinks = getOpenedLinks();
    const now = new Date().getTime();

    // Add new links with timestamp
    const linksToAdd = newLinks.map((url) => ({
      url,
      timestamp: now,
    }));

    // Combine with existing links and limit to MAX_STORED_LINKS
    const updatedLinks = [...linksToAdd, ...currentLinks].slice(
      0,
      MAX_STORED_LINKS
    );

    localStorage.setItem(
      OPENED_LINKS_STORAGE_KEY,
      JSON.stringify(updatedLinks)
    );
    return updatedLinks;
  } catch (error) {
    console.error("Error saving opened links:", error);
    return currentLinks;
  }
};

const ConfidenceIndicator = React.memo(({ confidence }) => {
  // Convert confidence from 0-1 to 0-100
  const score = Math.round((confidence || 0) * 100);

  // Color gradient with theme-aware colors
  const getColor = (score, theme) => {
    const isDarkMode = theme?.palette?.mode === "dark";

    if (score < 40) {
      return isDarkMode ? "#ff5252" : "hsl(0, 100%, 50%)"; // Red - brighter in dark mode
    } else if (score < 80) {
      return isDarkMode ? "#ffab2e" : "hsl(60, 100.00%, 30.90%)"; // Yellow - brighter in dark mode
    }
    return isDarkMode ? "#2cdb92" : "hsl(120, 100%, 40%)"; // Green - brighter in dark mode
  };

  return (
    <Tooltip title={`Recommended: ${score}%`}>
      <Box
        sx={{
          display: "inline-flex",
          position: "relative",
          width: 16,
          height: 16,
          ml: 1,
          verticalAlign: "text-bottom",
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          sx={{
            position: "absolute",
            color: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.2)"
                : theme.palette.grey[200],
          }}
          size={16}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          sx={{
            color: (theme) => getColor(score, theme),
            position: "absolute",
          }}
          size={16}
        />
      </Box>
    </Tooltip>
  );
});

// Move NotificationConfigDialog outside of BidLinks component
const NotificationConfigDialog = React.memo(
  ({
    open,
    onClose,
    notificationConfig,
    onConfigChange,
    categories,
    notificationsEnabled,
    handleNotificationToggle,
  }) => {
    // Add local state to track temporary changes
    const [tempConfig, setTempConfig] = useState(notificationConfig);

    // Update tempConfig when notificationConfig prop changes
    useEffect(() => {
      setTempConfig(notificationConfig);
    }, [notificationConfig]);

    const handleSaveConfig = () => {
      onConfigChange(tempConfig);
      onClose();
      toast.success("Notification settings saved");
    };

    const handleCancel = () => {
      setTempConfig(notificationConfig); // Reset to original config
      onClose();
    };

    return (
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              pt: 3,
              pr: 3,
              pl: 3,
            }}
          >
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationsEnabled}
                    onChange={handleNotificationToggle}
                    color="primary"
                  />
                }
                label="Enable Notifications"
              />
            </Box>
            <>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Categories to Notify
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => {
                        setTempConfig({
                          ...tempConfig,
                          categories: tempConfig.categories.includes(category)
                            ? tempConfig.categories.filter(
                                (c) => c !== category
                              )
                            : [...tempConfig.categories, category],
                        });
                      }}
                      color={
                        tempConfig.categories.includes(category)
                          ? "primary"
                          : "default"
                      }
                      variant={
                        tempConfig.categories.includes(category)
                          ? "filled"
                          : "outlined"
                      }
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Confidence Threshold
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={tempConfig.confidenceThreshold}
                  onChange={(e) => {
                    setTempConfig({
                      ...tempConfig,
                      confidenceThreshold: parseFloat(e.target.value),
                    });
                  }}
                  variant="outlined"
                  size="small"
                >
                  {[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0].map(
                    (value) => (
                      <MenuItem key={value} value={value}>
                        {Math.round(value * 100)}%
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Date Limits
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {[
                    { value: 0, label: "Any time" },
                    { value: 1, label: "Past 24 hours" },
                    { value: 7, label: "Past week" },
                    { value: 30, label: "Past month" },
                    { value: 365, label: "Past year" },
                  ].map(({ value, label }) => (
                    <Chip
                      key={value}
                      label={label}
                      onClick={() => {
                        setTempConfig({
                          ...tempConfig,
                          dateLimits: tempConfig.dateLimits.includes(value)
                            ? tempConfig.dateLimits.filter((d) => d !== value)
                            : [...tempConfig.dateLimits, value],
                        });
                      }}
                      color={
                        tempConfig.dateLimits.includes(value)
                          ? "primary"
                          : "default"
                      }
                      variant={
                        tempConfig.dateLimits.includes(value)
                          ? "filled"
                          : "outlined"
                      }
                    />
                  ))}
                </Box>
              </Box>
            </>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

const getTagColor = (tag) => {
  switch (tag) {
    case "Email Found":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#1b5e20" : "#4caf50",
          color: "#fff",
        },
      };
    case "Remote Job":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#1565c0" : "#1976d2",
          color: "#fff",
        },
      };
    case "Non Remote Job":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#e65100" : "#ff9800",
          color: "#fff",
        },
      };
    case "Verification Required":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#b71c1c" : "#f44336",
          color: "#fff",
        },
      };
    case "Login Required":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#b71c1c" : "#f44336",
          color: "#fff",
        },
      };
    case "Other Relevant":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#01579b" : "#03a9f4",
          color: "#fff",
        },
      };
    case "Irrelevant":
      return {
        sx: {
          backgroundColor: "transparent",
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "#f44336" : "#d32f2f",
          color: (theme) =>
            theme.palette.mode === "dark" ? "#f44336" : "#d32f2f",
        },
      };
    case "Uncategorized":
      return {
        sx: {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#424242" : "#9e9e9e",
          color: "#fff",
        },
      };
    default:
      return {
        sx: {
          backgroundColor: "transparent",
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "#757575" : "#9e9e9e",
          color: (theme) =>
            theme.palette.mode === "dark" ? "#757575" : "#9e9e9e",
        },
      };
  }
};

const BidLinks = () => {
  const { user } = useAuth();
  const [bidLinks, setBidLinks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("user123");
  const [users, setUsers] = useState({});
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const stored = localStorage.getItem("rowsPerPage");
    return stored ? parseInt(stored, 10) : 50;
  });
  const [teamMembers, setTeamMembers] = useState({});
  const [teamInfo, setTeamInfo] = useState(null); // Add team info state
  const [queryDateLimit, setQueryDateLimit] = useState(() => {
    const stored = localStorage.getItem("queryDateLimit");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [-1];
      }
    }
    return [-1];
  });
  const [viewMode, setViewMode] = useState("categories");
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [openChartDialog, setOpenChartDialog] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [selectedLink, setSelectedLink] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState(-1); // -1 means no filter
  const [sortBy, setSortBy] = useState("confidence"); // 'date' or 'confidence'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [anchorEl, setAnchorEl] = useState(null);
  const [confidenceRange, setConfidenceRange] = useState([0.2, 1]); // Range from 0 to 1
  const [hiddenCategories, setHiddenCategories] = useState(() => {
    const stored = localStorage.getItem("hiddenCategories");
    return stored ? JSON.parse(stored) : [];
  });
  const [notifiedJobs, setNotifiedJobs] = useState(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem("notificationsEnabled");
    return stored ? JSON.parse(stored) : false;
  });
  const lastFetchTime = useRef(null);
  const lastNotificationCheck = useRef(new Date());
  const [openedLinks, setOpenedLinks] = useState(() => getOpenedLinks());
  const [notificationConfig, setNotificationConfig] = useState(() => {
    const stored = localStorage.getItem("notificationConfig");
    return stored
      ? JSON.parse(stored)
      : {
          categories: [],
          confidenceThreshold: 0.7,
          dateLimits: [],
        };
  });
  const [openNotificationConfig, setOpenNotificationConfig] = useState(false);
  const [searchResultsPage, setSearchResultsPage] = useState(0);
  const [searchResultsRowsPerPage, setSearchResultsRowsPerPage] = useState(10);
  const [strictlyFilteredJobs, setStrictlyFilteredJobs] = useState(() => {
    const stored = localStorage.getItem("strictlyFilteredJobs");
    return stored ? JSON.parse(stored) : false;
  });
  // Add new state for tag visibility
  const [visibleTags, setVisibleTags] = useState(() => {
    const stored = localStorage.getItem("visibleTags");
    return stored
      ? JSON.parse(stored)
      : STRICT_TAGS.reduce((acc, tag) => {
          acc[tag] = tag === "All" ? true : false; // Default to "All" selected, others unchecked
          return acc;
        }, {});
  });

  // Add new state for sidebar sections
  const [expandedSections, setExpandedSections] = useState({
    dateTimeFilter: true, // Replace dateFilter and timeRange with dateTimeFilter
    categoryFilter: true,
    search: true,
    actions: true,
    confidence: true,
    sorting: true,
    strictFiltering: true,
    location: true,
  });

  // Add location filter state
  const [locationFilter, setLocationFilter] = useState(() => {
    const stored = localStorage.getItem("locationFilter");
    return stored ? JSON.parse(stored) : [];
  });

  // Add location options
  const locationOptions = [
    { value: "all", label: "Anywhere", count: 0 },
    { value: "USA", label: "USA", count: 0 },
    { value: "Europe", label: "Europe", count: 0 },
    { value: "Asia", label: "Asia", count: 0 },
    { value: "Africa", label: "Africa", count: 0 },
    { value: "Anonymous", label: "Anonymous", count: 0 },
  ];

  // Add new state for sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const stored = localStorage.getItem("sidebarVisible");
    return stored ? JSON.parse(stored) : false; // Change default to false
  });

  // Update the state to use single date instead of date range
  const [dateTimeFilter, setDateTimeFilter] = useState(() => {
    const stored = localStorage.getItem("dateTimeFilter");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          selectedDate: new Date().toLocaleDateString("en-CA"),
          timeRange: [-1], // Default to "All"
        };
      }
    }
    return {
      selectedDate: new Date().toLocaleDateString("en-CA"),
      timeRange: [-1], // Default to "All"
    };
  });

  const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle days + hours specially
    if (diffInSeconds >= 86400) {
      // More than a day
      const days = Math.floor(diffInSeconds / 86400);
      const remainingHours = Math.floor((diffInSeconds % 86400) / 3600);

      if (remainingHours === 0) {
        return days === 1 ? "1 day ago" : `${days} days ago`;
      }
      return days === 1
        ? `1 day ${remainingHours} ${
            remainingHours === 1 ? "hour" : "hours"
          } ago`
        : `${days} days ${remainingHours} ${
            remainingHours === 1 ? "hour" : "hours"
          } ago`;
    }
    const intervals = {
      hour: 3600,
      minute: 60,
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }

    return "just now";
  };

  const getQueriesForCategory = (category) => {
    const timeLimits = Array.isArray(dateTimeFilter.timeRange)
      ? dateTimeFilter.timeRange
      : [dateTimeFilter.timeRange];
    const queries = bidLinks
      .filter((link) => {
        // First apply time range filter
        if (timeLimits.length > 0) {
          const matchesTimeLimit = timeLimits.some((limit) => {
            if (limit === -1) return true;
            if (limit === 0) return link.queryDateLimit == null;
            return link.queryDateLimit === limit;
          });
          if (!matchesTimeLimit) return false;
        }

        // Then apply category filter
        return category === "all" || link.queryId?.category === category;
      })
      .reduce((acc, link) => {
        if (link.queryId?.link) {
          acc.add(link.queryId.link);
        }
        return acc;
      }, new Set());
    return Array.from(queries);
  };

  // 1. Create a centralized filtering function
  const applyBehaviorFilter = (link) => {
    if (!strictlyFilteredJobs) {
      return true; // No filtering when strictlyFilteredJobs is false
    }

    const tag = link.final_details?.tag;
    
    // If "All" is selected, show everything
    if (visibleTags["All"]) {
      return true;
    }
    
    // If "Uncategorized" is selected, only show links without valid tags
    if (visibleTags["Uncategorized"]) {
      return !tag || !STRICT_TAGS.includes(tag);
    }
    
    // Filter by specific tags - must have a valid tag and it must be visible
    return tag && STRICT_TAGS.includes(tag) && visibleTags[tag];
  };

  // 2. Simplify the handleTagFilterChange function
  const handleTagFilterChange = (tag) => {
    let newVisibleTags;

    if (tag === "All") {
      // Select only "All" and turn OFF strictlyFilteredJobs
      newVisibleTags = STRICT_TAGS.reduce((acc, t) => {
        acc[t] = t === "All";
        return acc;
      }, {});
      
      // Turn OFF strictlyFilteredJobs when "All" is selected
      setStrictlyFilteredJobs(false);
      localStorage.setItem("strictlyFilteredJobs", JSON.stringify(false));
    } else if (tag === "Uncategorized") {
      // Select only "Uncategorized" and turn ON strictlyFilteredJobs
      newVisibleTags = STRICT_TAGS.reduce((acc, t) => {
        acc[t] = t === "Uncategorized";
        return acc;
      }, {});
      
      // Turn ON strictlyFilteredJobs when "Uncategorized" is selected
      setStrictlyFilteredJobs(true);
      localStorage.setItem("strictlyFilteredJobs", JSON.stringify(true));
    } else {
      // For specific tags, deselect "All" and toggle the specific tag
      const isCurrentlySelected = visibleTags[tag];
      
      if (isCurrentlySelected) {
        // Deselect this tag, if no tags selected, select "All"
        newVisibleTags = {
          ...visibleTags,
          All: false,
          [tag]: false,
        };
        
        // If no tags are selected, default to "All" and turn OFF strictlyFilteredJobs
        if (!Object.values(newVisibleTags).some(v => v)) {
          newVisibleTags["All"] = true;
          setStrictlyFilteredJobs(false);
          localStorage.setItem("strictlyFilteredJobs", JSON.stringify(false));
        } else {
          // Keep strictlyFilteredJobs ON when specific tags are selected
          setStrictlyFilteredJobs(true);
          localStorage.setItem("strictlyFilteredJobs", JSON.stringify(true));
        }
      } else {
        // Select this tag and deselect "All"
        newVisibleTags = {
          ...visibleTags,
          All: false,
          [tag]: true,
        };
        
        // Turn ON strictlyFilteredJobs when specific tags are selected
        setStrictlyFilteredJobs(true);
        localStorage.setItem("strictlyFilteredJobs", JSON.stringify(true));
      }
    }

    setVisibleTags(newVisibleTags);
    localStorage.setItem("visibleTags", JSON.stringify(newVisibleTags));
    setPage(0);
  };

  // 3. Update the filterLink function to use centralized logic
  const filterLink = (link) => {
    // Add hidden category filter
    if (hiddenCategories.includes(link.queryId?.category)) {
      return false;
    }

    // Time range filter
    const timeLimits = Array.isArray(dateTimeFilter.timeRange)
      ? dateTimeFilter.timeRange
      : [dateTimeFilter.timeRange];
    if (timeLimits.length > 0) {
      const matchesTimeLimit = timeLimits.some((limit) => {
        if (limit === -1) return true;
        if (limit === 0) return link.queryDateLimit == null;
        return link.queryDateLimit === limit;
      });
      if (!matchesTimeLimit) return false;
    }

    // Category filter
    if (
      selectedCategory !== "all" &&
      link.queryId?.category !== selectedCategory
    ) {
      return false;
    }

    // Query filter - only apply if specific queries are selected
    if (selectedQueries.length > 0) {
      if (!selectedQueries.includes(link.queryId?.link)) return false;
    }

    // Confidence range filter
    const confidence = link.confidence || 0;
    if (confidence < confidenceRange[0] || confidence > confidenceRange[1]) {
      return false;
    }

    // Location filter
    if (locationFilter.length > 0 && !locationFilter.includes("all")) {
      const linkLocation = link.location || "Unknown";

      const matchesLocation = locationFilter.some((filter) => {
        return linkLocation === filter;
      });

      if (!matchesLocation) return false;
    }

    // User filter criteria
    if (showFilter === "mine" && link.created_by !== currentUserId) {
      return false;
    }

    // Apply behavior filtering using centralized function
    if (!applyBehaviorFilter(link)) {
      return false;
    }

    return true;
  };

  const filteredBidLinks = useMemo(() => {
    // Filter the links first
    const filtered = bidLinks.filter(filterLink);

    // Then apply sorting
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "confidence") {
        const confidenceA = a.confidence || 0;
        const confidenceB = b.confidence || 0;
        comparison = confidenceA - confidenceB;
      } else if (sortBy === "date") {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        comparison = dateA - dateB;
      }

      // If primary sort values are equal, apply secondary sorting by behavior (tag priority)
      if (comparison === 0) {
        const tagA = a.final_details?.tag;
        const tagB = b.final_details?.tag;
        
        // Get priority values, defaulting to lowest priority for uncategorized items
        const priorityA = TAG_PRIORITY[tagA] || TAG_PRIORITY["Uncategorized"];
        const priorityB = TAG_PRIORITY[tagB] || TAG_PRIORITY["Uncategorized"];
        
        // Lower priority number = higher priority (1 is highest, 9 is lowest)
        comparison = priorityB - priorityA;
      }

      // Apply sort order
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [
    bidLinks,
    selectedCategory,
    selectedQueries,
    confidenceRange,
    locationFilter,
    showFilter,
    currentUserId,
    strictlyFilteredJobs,
    visibleTags,
    hiddenCategories,
    dateTimeFilter.timeRange,
    sortBy, // Add sorting dependencies
    sortOrder, // Add sorting dependencies
  ]);

  // Calculate location counts
  const locationCounts = useMemo(() => {
    const counts = {};
    locationOptions.forEach((option) => {
      if (option.value === "all") {
        counts[option.value] = bidLinks.length;
      } else {
        counts[option.value] = bidLinks.filter(
          (link) => link.location === option.value
        ).length;
      }
    });
    return counts;
  }, [bidLinks]);

  // Add these useEffects to reset page when category, viewMode, or dateTimeFilter changes
  useEffect(() => {
    setPage(0);
  }, [
    selectedCategory,
    viewMode,
    dateTimeFilter.timeRange,
    dateTimeFilter.selectedDate,
  ]);

  // Function to handle notification toggle
  const handleNotificationToggle = async (event) => {
    const enabled = event.target.checked;
    setNotificationsEnabled(enabled);
    localStorage.setItem("notificationsEnabled", JSON.stringify(enabled));

    if (enabled) {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        setNotificationsEnabled(false);
        localStorage.setItem("notificationsEnabled", JSON.stringify(false));
        toast.error("Please enable notifications in your browser settings");
      }
    }
  };

  // Function to request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  // Function to show notification
  const showNotification = (job) => {
    if (!notificationsEnabled) return;

    if (Notification.permission === "granted") {
      const notification = new Notification("New High-Confidence Job Found", {
        body: `${job.title || "Untitled"} - ${
          job.company || "Unknown Company"
        }`,
        icon: "/favicon.ico",
        tag: job._id,
        requireInteraction: true,
        data: { url: job.url },
      });

      notification.onclick = function () {
        window.focus();
        window.open(job.url, "_blank");
        notification.close();
      };
    }
  };

  // Function to check for new high-confidence jobs
  const checkNewHighConfidenceJobs = (newBidLinks) => {
    if (!notificationsEnabled) return;

    const currentTime = new Date();

    // Filter jobs that were indexed after the last notification check
    const newJobs = newBidLinks.filter((job) => {
      const jobCreatedAt = new Date(job.created_at);
      return jobCreatedAt > lastNotificationCheck.current;
    });

    // Check each new job against notification config
    newJobs.forEach((job) => {
      // Check category
      if (
        notificationConfig.categories.length > 0 &&
        !notificationConfig.categories.includes(job.queryId?.category)
      ) {
        return;
      }

      // Check confidence
      if (job.confidence < notificationConfig.confidenceThreshold) {
        return;
      }

      // Check date limits
      if (notificationConfig.dateLimits.length > 0) {
        const jobDate = new Date(job.date);
        const now = new Date();
        const daysDiff = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));

        const matchesDateLimit = notificationConfig.dateLimits.some((limit) => {
          if (limit === 0) return true;
          return daysDiff <= limit;
        });

        if (!matchesDateLimit) return;
      }

      // If we get here, the job matches all criteria
      if (!notifiedJobs.has(job._id)) {
        showNotification(job);
        setNotifiedJobs((prev) => new Set([...prev, job._id]));
      }
    });

    // Update the last notification check time
    lastNotificationCheck.current = currentTime;
  };

  // Modified fetchBidLinks function
  const fetchBidLinks = async () => {
    try {
      setIsReloadingBids(true);

      // Convert selectedDate to local timezone's 00:00:00 to 23:59:59
      const fromDate = new Date(dateTimeFilter.selectedDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTimeFilter.selectedDate);
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

      // Check for new high-confidence jobs
      if (lastFetchTime.current) {
        checkNewHighConfidenceJobs(sortedLinks);
      }

      lastFetchTime.current = new Date();
      setBidLinks(sortedLinks);

      // Show sidebar when links are loaded for the first time
      if (!lastFetchTime.current || bidLinks.length === 0) {
        setSidebarVisible(true);
        localStorage.setItem("sidebarVisible", JSON.stringify(true));
      }
    } catch (err) {
      console.error("Failed to fetch bid links:", err);
    } finally {
      setIsReloadingBids(false);
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Set up auto-refresh every 30 minutes
  useEffect(() => {
    fetchBidLinks(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchBidLinks();
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => clearInterval(intervalId);
  }, [dateTimeFilter.selectedDate]); // Re-run when selected date changes

  useEffect(() => {
    // Extract unique categories from bidLinks
    const uniqueCategories = [
      ...new Set(
        bidLinks
          .filter((link) => link.queryId?.category) // Only include links with queryId.category
          .map((link) => link.queryId.category)
      ),
    ].sort();

    setCategories(uniqueCategories);
  }, [bidLinks]);

  const fetchBlacklists = async (isTeam = false) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links/blacklist`,
        {
          params: { isTeam: isTeam },
        }
      );
      setBlacklists(response.data.blacklists || []);
    } catch (error) {
      console.error("Failed to fetch blacklists:", error);
      toast.error("Failed to fetch blacklists");
    }
  };

  const handleAddBlacklist = async (newBlackWords, isTeam = false) => {
    if (!newBlackWords.trim()) return;
    try {
      // Split by comma and trim each entry
      const blacklistArray = newBlackWords
        .split(",")
        .map((word) => word.trim())
        .filter((word) => word.length > 0); // Filter out empty strings

      // Process each blacklist entry
      const processedBlacklists = blacklistArray.map((entry) => {
        // Check if it's a company blacklist
        if (entry.toLowerCase().startsWith("company:")) {
          // Keep the exact format for company blacklists
          return entry.trim();
        }
        return entry;
      });

      await axios.post(`${process.env.REACT_APP_API_URL}/bid-links/blacklist`, {
        blacklists: processedBlacklists,
        isTeam: isTeam,
      });
      await fetchBlacklists(isTeam);
      await fetchBidLinks();
      toast.success(
        `${processedBlacklists.length} item(s) added to ${
          isTeam ? "team" : "personal"
        } blacklist`
      );
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
        blacklists: [`company:${company.trim()}`],
        isTeam: true, // Always add to team blacklist
      });
      await fetchBlacklists(true); // Fetch team blacklists to update the count
      toast.success(`Added ${company} to team blacklist`);
    } catch (error) {
      console.error("Failed to add company to blacklist:", error);
      toast.error("Failed to add company to blacklist");
      // Revert optimistic update on error
      setBidLinks(originalLinks);
    }
  };

  const handleDeleteBlacklist = async (urlToDelete, isTeam = false) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/bid-links/blacklist`,
        {
          data: {
            blacklists: [urlToDelete],
            isTeam: isTeam,
          },
        }
      );
      await fetchBlacklists(isTeam);
      await fetchBidLinks();
      toast.success(
        `URL removed from ${isTeam ? "team" : "personal"} blacklist`
      );
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
      const params = new URLSearchParams({
        searchTerm: searchTerm,
        showBlacklisted: false,
      });

      params.append("confidenceMin", confidenceRange[0].toString());
      params.append("confidenceMax", confidenceRange[1].toString());

      // Check if all visible tags are true
      const allTagsVisible = Object.values(visibleTags).every(value => value === true);
      
      // Add strict filtering parameters - turn off if all tags are visible
      if (strictlyFilteredJobs && !allTagsVisible) {
        params.append("strictlyFilteredJobs", "true");
        params.append("visibleTags", JSON.stringify(visibleTags));
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bid-links/search?${params.toString()}`
      );
      setGlobalSearchResults(Array.isArray(response.data) ? response.data : []);
      setSearchResultsPage(0);
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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/teams/my-team`
      );
      const membersMap = {};
      response.data.forEach((member) => {
        membersMap[member._id] = member.name;
      });
      setTeamMembers(membersMap);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      toast.error("Failed to fetch team members");
    }
  };

  // Add new function to fetch team information
  const fetchTeamInfo = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/teams/my-team-info`
      );
      setTeamInfo(response.data.team);
    } catch (error) {
      console.error("Failed to fetch team info:", error);
      // Don't show error toast as this is not critical
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchTeamInfo(); // Add this call
  }, []);

  // Add this useEffect to scroll to top when page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  const generateChartData = () => {
    // Set the dialog to open first
    setOpenChartDialog(true);

    // We'll let the ChartDialog component handle data fetching
    // No need to set chart data here anymore
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderBlacklistPanel = () => {
    const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);
    const [blacklistType, setBlacklistType] = useState("team"); // Default to team blacklist

    // Add this useEffect to fetch the blacklists when the panel opens
    useEffect(() => {
      if (openBlacklistDialog) {
        fetchBlacklists(blacklistType === "team");
      }
    }, [openBlacklistDialog]);

    const handleBlacklistSubmit = async (value) => {
      if (!value.trim()) return;
      setIsAddingBlacklist(true);
      try {
        await handleAddBlacklist(value, blacklistType === "team");
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

          {/* Add tabs for My/Team selection */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Box sx={{ display: "flex" }}>
              <Button
                variant={blacklistType === "personal" ? "contained" : "text"}
                onClick={() => {
                  setBlacklistType("personal");
                  fetchBlacklists(false);
                }}
                sx={{ flex: 1, borderRadius: "4px 0 0 4px" }}
              >
                My Blacklist
              </Button>
              <Button
                variant={blacklistType === "team" ? "contained" : "text"}
                onClick={() => {
                  setBlacklistType("team");
                  fetchBlacklists(true);
                }}
                sx={{ flex: 1, borderRadius: "0 4px 4px 0" }}
              >
                Team Blacklist
              </Button>
            </Box>
          </Box>

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
                    e.target.value = "";
                  }
                }
              }}
              InputProps={{
                endAdornment: isAddingBlacklist && (
                  <CircularProgress size={20} />
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
                    onClick={() =>
                      handleDeleteBlacklist(url, blacklistType === "team")
                    }
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
      Blacklists
    </Button>
  );

  const DetailDialog = React.memo(({ open, onClose, link }) => {
    if (!link) return null;

    // Helper function to format queryDateLimit
    const formatQueryDateLimit = (days) => {
      if (days === null || days === undefined) return "Any time";

      switch (days) {
        case 1:
          return "Past 24 hours";
        case 7:
          return "Past week";
        case 30:
          return "Past month";
        case 365:
          return "Past year";
        default:
          return `${days} days`;
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Link Details</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText primary="Title" secondary={link.title || "N/A"} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Original URL"
                secondary={
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.url}
                  </Link>
                }
              />
            </ListItem>
            {strictlyFilteredJobs && link.final_details?.finalUrl && (
              <ListItem>
                <ListItemText
                  primary="Final URL"
                  secondary={
                    <Link
                      href={link.final_details.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.final_details.finalUrl}
                    </Link>
                  }
                />
              </ListItem>
            )}
            <ListItem>
              <ListItemText
                primary="Company"
                secondary={link.company || "N/A"}
              />
            </ListItem>
            {/* Add Location field */}
            <ListItem>
              <ListItemText
                primary="Location"
                secondary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={link.location || "Anonymous"}
                      size="small"
                      color={
                        link.location === "USA"
                          ? "primary"
                          : link.location === "Europe"
                          ? "secondary"
                          : link.location === "Asia"
                          ? "warning"
                          : link.location === "Africa"
                          ? "success"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Box>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Description"
                secondary={link.description || "N/A"}
                secondaryTypographyProps={{
                  style: { whiteSpace: "pre-wrap" },
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Posted Date"
                secondary={link.date || "N/A"}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Indexed By"
                secondary={teamMembers[link.created_by] || "Unknown"}
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
                    primary="Query Date Limit"
                    secondary={formatQueryDateLimit(link.queryDateLimit)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Category"
                    secondary={link.queryId.category || "N/A"}
                  />
                </ListItem>
              </>
            )}
            {link.confidence && (
              <>
                <ListItem>
                  <ListItemText
                    primary="Confidence"
                    secondary={link.confidence || "N/A"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Reason"
                    secondary={link.reason || "N/A"}
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

  const FilteredBidLinks = React.memo(({ filteredBidLinks, users }) => {
    const [goToPage, setGoToPage] = useState("");
    const emptyRows =
      page > 0
        ? Math.max(0, (1 + page) * rowsPerPage - filteredBidLinks.length)
        : 0;

    if (filteredBidLinks.length === 0) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No links
          </Typography>
        </Box>
      );
    }

    const PaginationComponent = () => {
      const totalPages = Math.ceil(filteredBidLinks.length / rowsPerPage);

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            p: 2,
            gap: 2,
          }}
        >
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
      <Box sx={{ width: "100%" }}>
        <Paper
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <PaginationComponent />
          <TableContainer sx={{ minWidth: "100%" }}>
            <Table aria-labelledby="tableTitle">
              <TableBody>
                {filteredBidLinks
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((link, index) => {
                    const fullIndex = page * rowsPerPage + index + 1;
                    const displayUrl =
                      strictlyFilteredJobs && link.final_details?.finalUrl
                        ? link.final_details.finalUrl
                        : link.url;
                    return (
                      <TableRow
                        hover
                        key={link._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.02) !important",
                          },
                          "&:nth-of-type(even)": {
                            backgroundColor: "rgba(0, 0, 0, 0.01)",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 1.5, px: 3 }}>
                          {fullIndex}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, px: 3 }}>
                          <Link
                            href={displayUrl}
                            target="_blank"
                            sx={{
                              fontSize: "1.1rem",
                              fontFamily:
                                '"Inter","Roboto","Helvetica","Arial",sans-serif',
                              fontWeight: 500,
                              textDecoration: "none",
                              color: "primary.main",
                              display: "inline-flex",
                              alignItems: "center",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                              "&:visited": {
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "#e0b0ff" // Light purple for dark mode
                                    : "#551A8B", // Standard visited purple for light mode
                              },
                              ...(openedLinks.some(
                                (openedLink) => openedLink.url === displayUrl
                              ) && {
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "#e0b0ff" // Light purple for dark mode
                                    : "#551A8B", // Standard visited purple for light mode
                              }),
                            }}
                          >
                            {link.title}
                            {link.confidence && (
                              <ConfidenceIndicator
                                confidence={link.confidence}
                              />
                            )}
                          </Link>
                          {link.final_details?.tag && (
                            <Chip
                              label={link.final_details.tag}
                              size="small"
                              sx={{
                                ml: 1,
                                ...getTagColor(link.final_details.tag).sx,
                              }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              lineHeight: 1.6,
                            }}
                          >
                            {(link.company || link.date) && (
                              <>
                                {link.company && <>Company: {link.company}</>}
                                {link.company && link.date && " | "}
                                {link.date && <>Posted: {link.date}</>}
                                <br />
                              </>
                            )}
                            {link.description}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Tooltip title="Show Details" placement="left">
                              <Button
                                size="small"
                                onClick={() => setSelectedLink(link)}
                                sx={{
                                  minWidth: "40px",
                                  height: "40px",
                                  borderRadius: 1,
                                }}
                              >
                                <InfoIcon color="action" />
                              </Button>
                            </Tooltip>
                            {link.company && (
                              <Tooltip
                                title={`Add ${link.company} to blacklist`}
                                placement="left"
                              >
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleAddCompanyToBlacklist(link.company)
                                  }
                                  sx={{
                                    minWidth: "40px",
                                    height: "40px",
                                    borderRadius: 1,
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
      </Box>
    );
  });

  const ChartDialog = () => {
    const [dateRange, setDateRange] = useState(7); // Default to 7 days
    const [isLoading, setIsLoading] = useState(true); // Start with loading state
    const [localChartData, setLocalChartData] = useState([]); // Local chart data state
    const [error, setError] = useState(null);

    // Fetch data when date range changes or dialog opens
    const fetchChartData = async (range) => {
      setIsLoading(true);
      setError(null);

      try {
        const toDate = new Date();
        const fromDate = new Date();

        // If range is 0 (all time), use a far past date
        if (range === 0) {
          fromDate.setFullYear(fromDate.getFullYear() - 5); // Go back 5 years
        } else {
          fromDate.setDate(fromDate.getDate() - range);
        }

        // Get the current user's team ID from the backend
        // We don't need to pass teamId as the backend will get it from the user's session
        const params = new URLSearchParams({
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        });

        const response = await axios.get(
          `${
            process.env.REACT_APP_API_URL
          }/bid-links/daily-count?${params.toString()}`
        );

        // Transform the data to match the chart format
        const transformedData = response.data.dailyCounts
          .map((item) => ({
            date: new Date(item._id).toLocaleDateString(),
            count: item.count,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setLocalChartData(transformedData);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        setError("Failed to fetch chart data. Please try again.");
        toast.error(
          "Failed to load chart data: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data when dialog opens or date range changes
    useEffect(() => {
      if (openChartDialog) {
        fetchChartData(dateRange);
      }
    }, [dateRange, openChartDialog]);

    // Custom tooltip component for the chart
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <Paper
            elevation={3}
            sx={{ p: 1.5, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          >
            <Typography variant="body2">
              <strong>Date:</strong> {label}
            </Typography>
            <Typography variant="body2">
              <strong>Count:</strong> {payload[0].value}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Dialog
        open={openChartDialog}
        onClose={() => setOpenChartDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span>Bid Links Distribution</span>
            <TextField
              select
              variant="standard"
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              sx={{ minWidth: 150 }}
              disabled={isLoading}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={14}>Last 2 weeks</MenuItem>
              <MenuItem value={30}>Last month</MenuItem>
              <MenuItem value={90}>Last 3 months</MenuItem>
              <MenuItem value={0}>All time</MenuItem>
            </TextField>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, pt: 2 }}>
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography color="error">{error}</Typography>
                <Button
                  variant="outlined"
                  onClick={() => fetchChartData(dateRange)}
                >
                  Retry
                </Button>
              </Box>
            ) : localChartData.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography>
                  No data available for the selected time range
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={localChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChartDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const handleNotificationConfigChange = (newConfig) => {
    setNotificationConfig(newConfig);
    localStorage.setItem("notificationConfig", JSON.stringify(newConfig));
  };

  const handleLocationFilterChange = (location) => {
    let newLocationFilter;
    if (location === "all") {
      newLocationFilter = ["all"];
    } else if (locationFilter.includes("all")) {
      newLocationFilter = [location];
    } else if (locationFilter.includes(location)) {
      newLocationFilter = locationFilter.filter((l) => l !== location);
      if (newLocationFilter.length === 0) {
        newLocationFilter = ["all"];
      }
    } else {
      newLocationFilter = [...locationFilter, location];
    }

    setLocationFilter(newLocationFilter);
    localStorage.setItem("locationFilter", JSON.stringify(newLocationFilter));
    setPage(0);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSidebarSection = (title, isExpanded, onToggle, children) => (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        onClick={onToggle}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "cyan" }}>
          {title}
        </Typography>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      {isExpanded && (
        <Box
          sx={{
            p: 2,
            backgroundColor: "background.paper",
            borderRadius: 1,
            mt: 1,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );

  const renderSidebar = () => (
    <Card
      sx={{
        width: 320,
        height: "calc(100vh - 60px)",
        position: "sticky",
        top: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <CardContent sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Reload links">
              <IconButton
                size="small"
                onClick={fetchBidLinks}
                disabled={isReloadingBids}
                sx={{ ml: 1 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => {
                const newVisible = !sidebarVisible;
                setSidebarVisible(newVisible);
                localStorage.setItem(
                  "sidebarVisible",
                  JSON.stringify(newVisible)
                );
              }}
              sx={{ ml: 1 }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Date and Time Filter Section */}
        {renderSidebarSection(
          "Date and Time Filter",
          expandedSections.dateTimeFilter,
          () => toggleSection("dateTimeFilter"),
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Single Date Selection */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Date
              </Typography>
              <TextField
                variant="standard"
                type="date"
                value={dateTimeFilter.selectedDate}
                onChange={(e) => {
                  const newFilter = {
                    ...dateTimeFilter,
                    selectedDate: e.target.value,
                  };
                  setDateTimeFilter(newFilter);
                  localStorage.setItem(
                    "dateTimeFilter",
                    JSON.stringify(newFilter)
                  );
                }}
                size="small"
                fullWidth
              />
            </Box>

            {/* Time Range */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Time Range
              </Typography>
              <TextField
                select
                SelectProps={{
                  multiple: true,
                  value: Array.isArray(dateTimeFilter.timeRange)
                    ? dateTimeFilter.timeRange
                    : [dateTimeFilter.timeRange],
                  onChange: (e) => {
                    const values = e.target.value;
                    let newValues = [...values];

                    const wasAllSelected =
                      dateTimeFilter.timeRange.includes(-1);
                    const isAllSelected = values.includes(-1);

                    if (isAllSelected && !wasAllSelected) {
                      newValues = [-1];
                    } else if (
                      values.some((v) => [0, 1, 7, 30, 365].includes(v))
                    ) {
                      newValues = newValues.filter((v) => v !== -1);
                    } else if (values.includes(-1)) {
                      newValues = [-1];
                    }

                    if (newValues.length === 0) {
                      newValues = [-1];
                    }

                    const newFilter = {
                      ...dateTimeFilter,
                      timeRange: newValues,
                    };
                    setDateTimeFilter(newFilter);
                    localStorage.setItem(
                      "dateTimeFilter",
                      JSON.stringify(newFilter)
                    );
                  },
                  renderValue: (selected) => {
                    if (!selected || selected.length === 0)
                      return "Select time ranges";
                    return selected
                      .map((value) => {
                        switch (value) {
                          case -1:
                            return "All";
                          case 0:
                            return "Any time";
                          case 1:
                            return "Past 24 hours";
                          case 7:
                            return "Past week";
                          case 30:
                            return "Past month";
                          case 365:
                            return "Past year";
                          default:
                            return `${value} days`;
                        }
                      })
                      .join(", ");
                  },
                }}
                variant="standard"
                size="small"
                fullWidth
              >
                <MenuItem value={-1}>All</MenuItem>
                <MenuItem value={0}>Any time</MenuItem>
                <MenuItem value={1}>Past 24 hours</MenuItem>
                <MenuItem value={7}>Past week</MenuItem>
                <MenuItem value={30}>Past month</MenuItem>
                <MenuItem value={365}>Past year</MenuItem>
              </TextField>
            </Box>
          </Box>
        )}

        {/* Location Filter Section - Only show if team has 'special' role */}
        {teamInfo?.role?.includes("special") &&
          renderSidebarSection(
            "Location",
            expandedSections.location,
            () => toggleSection("location"),
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {locationOptions.map((option) => (
                <Box
                  key={option.value}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    cursor: "pointer",
                    backgroundColor: locationFilter.includes(option.value)
                      ? "action.selected"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => handleLocationFilterChange(option.value)}
                >
                  <Checkbox
                    checked={locationFilter.includes(option.value)}
                    size="small"
                    sx={{ pointerEvents: "none" }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {option.label}
                  </Typography>
                  <Chip
                    label={locationCounts[option.value] || 0}
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 40, height: 20, fontSize: "0.75rem" }}
                  />
                </Box>
              ))}
            </Box>
          )}

        {/* Category Filter Section */}
        {renderSidebarSection(
          "Category Filter",
          expandedSections.categoryFilter,
          () => toggleSection("categoryFilter"),
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 1,
                cursor: "pointer",
                backgroundColor:
                  selectedCategory === "all"
                    ? "action.selected"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                transition: "background-color 0.2s",
              }}
              onClick={() => {
                setSelectedCategory("all");
                setPage(0);
              }}
            >
              <Checkbox
                checked={selectedCategory === "all"}
                size="small"
                sx={{ pointerEvents: "none" }}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>
                All Categories
              </Typography>
              <Chip
                label={
                  bidLinks.filter((link) => {
                    // Apply date filter
                    if (dateTimeFilter.timeRange.length > 0) {
                      const matchesTimeLimit = dateTimeFilter.timeRange.some(
                        (limit) => {
                          if (limit === -1) return true;
                          if (limit === 0) return link.queryDateLimit == null;
                          return link.queryDateLimit === limit;
                        }
                      );
                      if (!matchesTimeLimit) return false;
                    }

                    // Apply category visibility filter
                    if (hiddenCategories.includes(link.queryId?.category)) {
                      return false;
                    }

                    // Apply confidence range filter
                    const confidence = link.confidence || 0;
                    if (
                      confidence < confidenceRange[0] ||
                      confidence > confidenceRange[1]
                    ) {
                      return false;
                    }

                    // Apply location filter
                    if (
                      locationFilter.length > 0 &&
                      !locationFilter.includes("all")
                    ) {
                      const linkLocation = link.location || "Unknown";
                      const matchesLocation = locationFilter.some((filter) => {
                        return linkLocation === filter;
                      });
                      if (!matchesLocation) return false;
                    }

                    // Apply user filter criteria
                    if (
                      showFilter === "mine" &&
                      link.created_by !== currentUserId
                    ) {
                      return false;
                    }

                    // Apply behavior filtering using centralized function
                    return applyBehaviorFilter(link);
                  }).length
                }
                size="small"
                variant="outlined"
                sx={{ minWidth: 40, height: 20, fontSize: "0.75rem" }}
              />
            </Box>
            {categories
              .filter((category) => !hiddenCategories.includes(category))
              .map((category) => {
                const categoryCount = bidLinks.filter((link) => {
                  // Apply date filter
                  if (dateTimeFilter.timeRange.length > 0) {
                    const matchesTimeLimit = dateTimeFilter.timeRange.some(
                      (limit) => {
                        if (limit === -1) return true;
                        if (limit === 0) return link.queryDateLimit == null;
                        return link.queryDateLimit === limit;
                      }
                    );
                    if (!matchesTimeLimit) return false;
                  }

                  // Apply category filter
                  if (link.queryId?.category !== category) {
                    return false;
                  }

                  // Apply confidence range filter
                  const confidence = link.confidence || 0;
                  if (
                    confidence < confidenceRange[0] ||
                    confidence > confidenceRange[1]
                  ) {
                    return false;
                  }

                  // Apply location filter
                  if (
                    locationFilter.length > 0 &&
                    !locationFilter.includes("all")
                  ) {
                    const linkLocation = link.location || "Unknown";
                    const matchesLocation = locationFilter.some((filter) => {
                      return linkLocation === filter;
                    });
                    if (!matchesLocation) return false;
                  }

                  // Apply user filter criteria
                  if (
                    showFilter === "mine" &&
                    link.created_by !== currentUserId
                  ) {
                    return false;
                  }

                  // Apply behavior filtering using centralized function
                  return applyBehaviorFilter(link);
                }).length;

                return (
                  <Box
                    key={category}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      cursor: "pointer",
                      backgroundColor:
                        selectedCategory === category
                          ? "action.selected"
                          : "transparent",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(0);
                    }}
                  >
                    <Checkbox
                      checked={selectedCategory === category}
                      size="small"
                      sx={{ pointerEvents: "none" }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {category}
                    </Typography>
                    <Chip
                      label={categoryCount}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 40, height: 20, fontSize: "0.75rem" }}
                    />
                  </Box>
                );
              })}
            {hiddenCategories.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 1 }}
                >
                  Hidden Categories
                </Typography>
                {categories
                  .filter((category) => hiddenCategories.includes(category))
                  .map((category) => (
                    <ListItemButton
                      key={category}
                      sx={{ pr: 16, opacity: 0.6 }}
                    >
                      <ListItemIcon>
                        <VisibilityOffIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={category}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                      <IconButton
                        size="small"
                        onClick={(event) =>
                          handleToggleCategoryVisibility(category, event)
                        }
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  ))}
              </>
            )}
          </Box>
        )}

        {/* Confidence Range & Sorting Section */}
        {renderSidebarSection(
          "Confidence & Sorting",
          expandedSections.confidence,
          () => toggleSection("confidence"),
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Confidence Range */}
            <Box sx={{ width: "90%" }}>
              <Typography variant="subtitle2" gutterBottom>
                Confidence Range
              </Typography>
              <Slider
                sx={{ marginLeft: 2, marginRight: 2 }}
                value={confidenceRange}
                onChange={(event, newValue) => {
                  setConfidenceRange(newValue);
                  setPage(0);
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                min={0.3}
                max={1}
                step={0.1}
                marks={[
                  { value: 0.3, label: "30%" },
                  { value: 0.6, label: "60%" },
                  { value: 1, label: "100%" },
                ]}
              />
            </Box>

            {/* Sorting */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                variant="standard"
                size="small"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                label="Sort by"
                fullWidth
              >
                <MenuItem value="confidence">Confidence</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </TextField>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant={sortOrder === "desc" ? "contained" : "outlined"}
                  onClick={() => {
                    setSortOrder("desc");
                    setPage(0);
                  }}
                  size="small"
                  startIcon={<ArrowDownwardIcon />}
                  fullWidth
                >
                  Desc
                </Button>
                <Button
                  variant={sortOrder === "asc" ? "contained" : "outlined"}
                  onClick={() => {
                    setSortOrder("asc");
                    setPage(0);
                  }}
                  size="small"
                  startIcon={<ArrowUpwardIcon />}
                  fullWidth
                >
                  Asc
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Behavior Filtering Section - Only show if team has 'special' role */}
        {teamInfo?.role?.includes("special") &&
          renderSidebarSection(
            "Behavior Filtering",
            expandedSections.strictFiltering,
            () => toggleSection("strictFiltering"),
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {STRICT_TAGS.map((tag) => {
                  const tagCount = bidLinks.filter((link) => {
                    // Apply date filter
                    if (dateTimeFilter.timeRange.length > 0) {
                      const matchesTimeLimit = dateTimeFilter.timeRange.some(
                        (limit) => {
                          if (limit === -1) return true;
                          if (limit === 0) return link.queryDateLimit == null;
                          return link.queryDateLimit === limit;
                        }
                      );
                      if (!matchesTimeLimit) return false;
                    }

                    // Apply category visibility filter
                    if (hiddenCategories.includes(link.queryId?.category)) {
                      return false;
                    }

                    // Apply category filter
                    if (
                      selectedCategory !== "all" &&
                      link.queryId?.category !== selectedCategory
                    ) {
                      return false;
                    }

                    // Apply confidence range filter
                    const confidence = link.confidence || 0;
                    if (
                      confidence < confidenceRange[0] ||
                      confidence > confidenceRange[1]
                    ) {
                      return false;
                    }

                    // Apply location filter
                    if (
                      locationFilter.length > 0 &&
                      !locationFilter.includes("all")
                    ) {
                      const linkLocation = link.location || "Unknown";
                      const matchesLocation = locationFilter.some((filter) => {
                        return linkLocation === filter;
                      });
                      if (!matchesLocation) return false;
                    }

                    // Apply user filter criteria
                    if (
                      showFilter === "mine" &&
                      link.created_by !== currentUserId
                    ) {
                      return false;
                    }

                    // Apply tag filter - special handling for "All" and "Uncategorized"
                    if (tag === "All") {
                      // For "All", count all links (including uncategorized)
                      return true;
                    } else if (tag === "Uncategorized") {
                      // For "Uncategorized", count links that have no tag or an invalid tag
                      const linkTag = link.final_details?.tag;
                      return !linkTag || !STRICT_TAGS.includes(linkTag);
                    } else {
                      // For specific tags, count only links with that exact tag
                      const linkTag = link.final_details?.tag;
                      return linkTag === tag;
                    }
                  }).length;

                  return (
                    <Box
                      key={tag}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        cursor: "pointer",
                        backgroundColor: visibleTags[tag]
                          ? "action.selected"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                        transition: "background-color 0.2s",
                      }}
                      onClick={() => handleTagFilterChange(tag)}
                    >
                      <Checkbox
                        checked={visibleTags[tag]}
                        size="small"
                        sx={{ pointerEvents: "none" }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {tag === "Email Found"
                          ? "Email"
                          : tag === "Verification Required"
                          ? "Captcha Check"
                          : tag}
                      </Typography>
                      {tag === "Email Found" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            extractEmails();
                          }}
                        >
                          Extract
                        </Button>
                      )}
                      <Chip
                        label={tagCount}
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 40, height: 20, fontSize: "0.75rem" }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
      </CardContent>
    </Card>
  );

  const renderSidebarToggle = () => (
    <IconButton
      size="small"
      onClick={() => {
        const newVisible = !sidebarVisible;
        setSidebarVisible(newVisible);
        localStorage.setItem("sidebarVisible", JSON.stringify(newVisible));
      }}
      sx={{
        position: "absolute",
        left: 0,
        top: 60,
        zIndex: 1001, // Increased from 1000 to be above the headbar
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <ChevronRightIcon />
    </IconButton>
  );

  const handleToggleCategoryVisibility = (category, event) => {
    event.stopPropagation(); // Prevent ListItemButton click
    const newHiddenCategories = hiddenCategories.includes(category)
      ? hiddenCategories.filter((c) => c !== category)
      : [...hiddenCategories, category];

    setHiddenCategories(newHiddenCategories);
    localStorage.setItem(
      "hiddenCategories",
      JSON.stringify(newHiddenCategories)
    );

    // If we're hiding the currently selected category, switch to 'all'
    if (newHiddenCategories.includes(selectedCategory)) {
      setSelectedCategory("all");
    }
  };

  const renderLeftPanel = () => {
    const queries = getQueriesForCategory(selectedCategory);

    // 4. Update the passesAllFilters function
    const passesAllFilters = (link) => {
      // Check confidence range
      const confidence = link.confidence || 0;
      if (confidence < confidenceRange[0] || confidence > confidenceRange[1]) {
        return false;
      }

      // Apply behavior filtering using centralized function
      return applyBehaviorFilter(link);
    };

    // Calculate total links for current category with all filters
    const totalQueryLinks = bidLinks.filter((link) => {
      // First apply date filter
      if (dateTimeFilter.timeRange.length > 0) {
        const matchesTimeLimit = dateTimeFilter.timeRange.some((limit) => {
          if (limit === -1) return true;
          if (limit === 0) return link.queryDateLimit == null;
          return link.queryDateLimit === limit;
        });
        if (!matchesTimeLimit) return false;
      }

      // Then apply category filter
      if (
        selectedCategory !== "all" &&
        link.queryId?.category !== selectedCategory
      ) {
        return false;
      }

      // Finally apply all other filters
      return passesAllFilters(link);
    }).length;

    return (
      <Card
        sx={{
          width: 250,
          height: "calc(100vh - 80px)",
          position: "sticky",
          top: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            p: 2,
            "&:last-child": { pb: 2 },
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              pb: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" style={{ fontWeight: "normal" }}>
                {viewMode === "categories" ? "Categories" : "Queries"}
              </Typography>
              {viewMode === "queries" && (
                <Button
                  size="small"
                  onClick={() => {
                    setViewMode("categories");
                    setSelectedQueries([]);
                  }}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
              )}
            </Box>
          </Box>

          <List
            sx={{
              flexGrow: 1,
              overflow: "auto",
            }}
          >
            {viewMode === "categories" ? (
              <>
                <ListItemButton
                  selected={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                  sx={{ pr: 8 }}
                >
                  <ListItemText
                    primary="All"
                    secondary={`${
                      bidLinks.filter((link) => {
                        // Apply date filter
                        if (dateTimeFilter.timeRange.length > 0) {
                          const matchesTimeLimit =
                            dateTimeFilter.timeRange.some((limit) => {
                              if (limit === -1) return true;
                              if (limit === 0)
                                return link.queryDateLimit == null;
                              return link.queryDateLimit === limit;
                            });
                          if (!matchesTimeLimit) return false;
                        }

                        // Apply category visibility filter
                        if (hiddenCategories.includes(link.queryId?.category)) {
                          return false;
                        }

                        // Apply all other filters
                        return passesAllFilters(link);
                      }).length
                    } links`}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory("all");
                      setViewMode("queries");
                    }}
                    sx={{ position: "absolute", right: 8 }}
                  >
                    <SegmentIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
                {categories
                  .filter((category) => !hiddenCategories.includes(category))
                  .map((category) => {
                    const categoryCount = bidLinks.filter(
                      (link) =>
                        link.queryId?.category === category &&
                        (dateTimeFilter.timeRange.length === 0 ||
                          dateTimeFilter.timeRange.some((limit) => {
                            if (limit === -1) return true;
                            if (limit === 0) return link.queryDateLimit == null;
                            return link.queryDateLimit === limit;
                          })) &&
                        passesAllFilters(link)
                    ).length;

                    return (
                      <ListItemButton
                        key={category}
                        selected={selectedCategory === category}
                        onClick={() => setSelectedCategory(category)}
                        sx={{ pr: 16 }}
                      >
                        <ListItemText
                          primary={category}
                          secondary={`${categoryCount} links`}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            handleToggleCategoryVisibility(category, e)
                          }
                          sx={{ position: "absolute", right: 48 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                            setViewMode("queries");
                          }}
                          sx={{ position: "absolute", right: 8 }}
                        >
                          <SegmentIcon fontSize="small" />
                        </IconButton>
                      </ListItemButton>
                    );
                  })}
                {/* For hidden categories section, update the visibility icon position */}
                {hiddenCategories.length > 0 && (
                  <>
                    <ListItemText
                      primary="Hidden Categories"
                      sx={{ px: 2, pt: 2, pb: 1, color: "text.secondary" }}
                    />
                    {categories
                      .filter((category) => hiddenCategories.includes(category))
                      .map((category) => (
                        <ListItemButton
                          key={category}
                          sx={{ pr: 16, opacity: 0.6 }}
                        >
                          <ListItemText primary={category} />
                          <IconButton
                            size="small"
                            onClick={(e) =>
                              handleToggleCategoryVisibility(category, e)
                            }
                            sx={{ position: "absolute", right: 48 }}
                          >
                            <VisibilityOffIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(category);
                              setViewMode("queries");
                            }}
                            sx={{ position: "absolute", right: 8 }}
                          >
                            <SegmentIcon fontSize="small" />
                          </IconButton>
                        </ListItemButton>
                      ))}
                  </>
                )}
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
                  const queryCount = bidLinks.filter(
                    (link) =>
                      link.queryId?.link === query &&
                      (dateTimeFilter.timeRange.length === 0 ||
                        dateTimeFilter.timeRange.some((limit) => {
                          if (limit === -1) return true;
                          if (limit === 0) return link.queryDateLimit == null;
                          return link.queryDateLimit === limit;
                        })) &&
                      passesAllFilters(link)
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

  const extractEmails = () => {
    // Use original bidLinks instead of filteredBidLinks to get emails from non-filtered links
    const emails = bidLinks
      .filter(
        (link) => link.final_details?.applicationMethods?.applicationEmail
      )
      .map((link) => link.final_details.applicationMethods.applicationEmail);

    if (emails.length === 0) {
      toast.info("No emails found in the original bid links");
      return;
    }

    // Join emails with commas
    const emailList = emails.join(", ");

    // Copy to clipboard
    navigator.clipboard.writeText(emailList);
    toast.success(`Copied ${emails.length} emails to clipboard`);
  };

  const handleOpenAllLinks = () => {
    const visibleLinks = filteredBidLinks
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((link) =>
        strictlyFilteredJobs && link.final_details?.finalUrl
          ? link.final_details.finalUrl
          : link.url
      );

    // Save opened links to localStorage and update state
    const updatedLinks = addOpenedLinks(visibleLinks);
    setOpenedLinks(updatedLinks);

    visibleLinks.forEach((url) => {
      window.open(url, "_blank");
    });

    toast.info(`Opened ${visibleLinks.length} links`);
  };

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {sidebarVisible && renderSidebar()}
      <Box sx={{ flex: 1, position: "relative" }}>
        {!sidebarVisible && renderSidebarToggle()}

        {/* Headbar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            backgroundColor: "background.paper",
            borderRadius: 2,
            boxShadow: 2,
            flexWrap: "wrap",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await handleGlobalSearch(e.target.value);
                e.target.value = "";
              }
            }}
            placeholder="Enter Search Term..."
            sx={{ minWidth: "150px", maxWidth: "200px", flex: 1, borderRadius: 2 }}
            variant="standard"
            InputProps={{
              endAdornment: isSearchInputLoading && (
                <CircularProgress size={20} />
              ),
            }}
          />
          <Button
            variant="outlined"
            onClick={handleOpenAllLinks}
            size="small"
            startIcon={<VisibilityIcon />}
          >
            Open All (
            {Math.min(
              rowsPerPage,
              filteredBidLinks.length - page * rowsPerPage
            )}
            )
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              const allLinks = filteredBidLinks.map((link) =>
                strictlyFilteredJobs && link.final_details?.finalUrl
                  ? link.final_details.finalUrl
                  : link.url
              );
              navigator.clipboard.writeText(allLinks.join("\n"));
              toast.success(`Copied ${allLinks.length} links to clipboard`);
            }}
            size="small"
            startIcon={<ContentCopyIcon />}
          >
            Copy All ({filteredBidLinks.length})
          </Button>

          <Button
            variant="outlined"
            onClick={generateChartData}
            startIcon={<BarChartIcon />}
            size="small"
          >
            Links Stats
          </Button>

          <Button
            variant="outlined"
            onClick={() => setOpenBlacklistDialog(true)}
            startIcon={<DoNotTouchIcon />}
            size="small"
          >
            Blacklists
          </Button>

          <Button
            variant="outlined"
            onClick={() => setOpenNotificationConfig(true)}
            startIcon={<NotificationsIcon />}
            size="small"
          >
            Notifications
          </Button>
        </Box>

        {/* Add top margin to content to account for absolute positioned headbar */}
        <Box sx={{ mt: 10 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
                  users={users}
                />
              )}
            </Grid>
          </Grid>
        </Box>

        {renderBlacklistPanel()}
        <ChartDialog />

        <DetailDialog
          open={Boolean(selectedLink)}
          onClose={() => setSelectedLink(null)}
          link={selectedLink}
        />

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
            <TableContainer>
              <Table>
                <TableBody>
                  {globalSearchResults
                    .slice(
                      searchResultsPage * searchResultsRowsPerPage,
                      searchResultsPage * searchResultsRowsPerPage +
                        searchResultsRowsPerPage
                    )
                    .map((link) => (
                      <TableRow key={link._id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Link
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  color: "primary.main",
                                  textDecoration: "none",
                                  fontSize: "1.1rem",
                                  fontFamily:
                                    '"Inter","Roboto","Helvetica","Arial",sans-serif',
                                  fontWeight: 500,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  "&:hover": {
                                    textDecoration: "underline",
                                  },
                                  "&:visited": {
                                    color: (theme) =>
                                      theme.palette.mode === "dark"
                                        ? "#e0b0ff"
                                        : "#551A8B",
                                  },
                                }}
                              >
                                {link.title}
                                {link.confidence && (
                                  <ConfidenceIndicator
                                    confidence={link.confidence}
                                  />
                                )}
                              </Link>
                              {link.final_details?.tag && (
                                <Chip
                                  label={link.final_details.tag}
                                  size="small"
                                  sx={{
                                    ...getTagColor(link.final_details.tag).sx,
                                  }}
                                />
                              )}
                            </Box>
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
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ width: "60px" }}>
                          <Tooltip title="Show Details" placement="left">
                            <Button
                              size="small"
                              onClick={() => setSelectedLink(link)}
                              sx={{
                                minWidth: "40px",
                                height: "40px",
                                borderRadius: 1,
                              }}
                            >
                              <InfoIcon color="action" />
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={globalSearchResults.length}
              page={searchResultsPage}
              onPageChange={(event, newPage) => setSearchResultsPage(newPage)}
              rowsPerPage={searchResultsRowsPerPage}
              onRowsPerPageChange={(event) => {
                setSearchResultsRowsPerPage(parseInt(event.target.value, 10));
                setSearchResultsPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSearchDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <NotificationConfigDialog
          open={openNotificationConfig}
          onClose={() => setOpenNotificationConfig(false)}
          notificationConfig={notificationConfig}
          onConfigChange={handleNotificationConfigChange}
          categories={categories}
          notificationsEnabled={notificationsEnabled}
          handleNotificationToggle={handleNotificationToggle}
        />
      </Box>
    </Box>
  );
};

export default BidLinks;

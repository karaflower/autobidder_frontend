import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Grid,
  Checkbox,
  Slider,
  Collapse
} from "@mui/material";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import * as pdfjsLib from "pdfjs-dist";
import CloseIcon from "@mui/icons-material/Close";
import CustomizedResumes from "./CustomizedResumes";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleIcon from "@mui/icons-material/Google";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from "@mui/icons-material/FilterList";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import PsychologyIcon from "@mui/icons-material/Psychology";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import TitleIcon from "@mui/icons-material/Title";

// Set the worker source using a local path instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";


const locationOptions = [
  { value: "all", label: "Anywhere", count: 0 },
  { value: "USA", label: "USA", count: 0 },
  { value: "Canada", label: "Canada", count: 0 },
  { value: "Europe", label: "Europe", count: 0 },
  { value: "Asia", label: "Asia", count: 0 },
  { value: "LATAM", label: "LATAM", count: 0 },
  { value: "Australia", label: "Australia", count: 0 },
  { value: "Africa", label: "Africa", count: 0 },
  { value: "Anonymous", label: "Anonymous", count: 0 },
];


const Resume = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeIndex, setSelectedResumeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customizedResumesOpen, setCustomizedResumesOpen] = useState(false);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
  const [coverLetterTitle, setCoverLetterTitle] = useState("");
  const [coverLetterContent, setCoverLetterContent] = useState("");
  const [savingAutoEmail, setSavingAutoEmail] = useState(false);
  const [savingAutoEmailSettings, setSavingAutoEmailSettings] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [generatingAuthUrl, setGeneratingAuthUrl] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [removingGmail, setRemovingGmail] = useState(false);
  const [gmailTokenExpiryDate, setGmailTokenExpiryDate] = useState(null);
  const [gmailCleanup, setGmailCleanup] = useState(false);
  const [loadingCleanup, setLoadingCleanup] = useState(false);
  const [cleanupError, setCleanupError] = useState("");
  const [savingGmailCleanup, setSavingGmailCleanup] = useState(false);
  const [emailSendFrequencyDays, setEmailSendFrequencyDays] = useState(1.5);
  const [scheduledEmails, setScheduledEmails] = useState(null);
  const [loadingScheduledEmails, setLoadingScheduledEmails] = useState(false);
  const [scheduledEmailsError, setScheduledEmailsError] = useState("");
  const [additionalEmailInput, setAdditionalEmailInput] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(false);
  const [removingBidEmail, setRemovingBidEmail] = useState(false);
  const [removeEmailDialog, setRemoveEmailDialog] = useState({
    open: false,
    email: null,
    scheduleId: null,
    emailType: null // 'additional' or 'bid_list'
  });
  const { user } = useAuth();
  const [showToBidder, setShowToBidder] = useState(false);
  const [savingShowToBidder, setSavingShowToBidder] = useState(false);
  const [editingNicknameId, setEditingNicknameId] = useState(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [bidderSelectOpen, setBidderSelectOpen] = useState(false);

  // Define selectedResume here so it's available throughout the component
  const selectedResume = resumes[selectedResumeIndex] || null;

  // Add new state for filters
  const [locationFilter, setLocationFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [queryDateLimit, setQueryDateLimit] = useState([-1]);

  // Date limit options - reduced to 5 options
  const dateLimitOptions = [
    { value: -1, label: "All" },
    { value: 1, label: "1 day" },
    { value: 3, label: "3 days" },
    { value: 7, label: "7 days" },
    { value: 30, label: "30 days" },
  ];

  // Add new state for filters dialog
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    location: [],
    category: [],
    dateLimit: [-1]
  });

  // State for team categories
  const [teamCategories, setTeamCategories] = useState([]);

  // Add new state for bidder visibility
  const [visibleToBidders, setVisibleToBidders] = useState([]);
  const [teamBidders, setTeamBidders] = useState([]);
  const [savingBidderVisibility, setSavingBidderVisibility] = useState(false);

  // Add function to handle opening filters dialog
  const handleOpenFiltersDialog = () => {
    setTempFilters({
      location: [...locationFilter],
      category: [...categoryFilter],
      dateLimit: [...queryDateLimit]
    });
    setFiltersDialogOpen(true);
  };

  // Add function to handle saving filters
  const handleSaveFilters = async () => {
    if (!selectedResume) return;
    
    try {
      // Save filters to backend using the existing auto-email-settings endpoint
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/auto-email-settings`,
        {
          cover_letter_title: coverLetterTitle,
          cover_letter_content: coverLetterContent,
          email_send_frequency_days: emailSendFrequencyDays,
          location_filter: locationFilter,
          category_filter: categoryFilter,
          confidence_range: [0.3, 1],
          query_date_limit: queryDateLimit,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setLocationFilter([...tempFilters.location]);
      setCategoryFilter([...tempFilters.category]);
      setQueryDateLimit([...tempFilters.dateLimit]);
      
      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        auto_email_filters: {
          ...updatedResumes[selectedResumeIndex].auto_email_filters,
          location_filter: tempFilters.location,
          category_filter: tempFilters.category,
          query_date_limit: tempFilters.dateLimit,
        }
      };
      setResumes(updatedResumes);
      
      setFiltersDialogOpen(false);
      toast.success("Filters updated successfully!");
    } catch (err) {
      console.error('Failed to save filters:', err);
      toast.error("Failed to save filters. Please try again.");
    }
  };

  // Add function to handle canceling filters
  const handleCancelFilters = () => {
    setFiltersDialogOpen(false);
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/resumes`
      );
      if (Array.isArray(response.data) && response.data.length > 0) {
        const formattedResumes = response.data.map((resumeData) => {
          const content = resumeData.content;
          const experienceEntries = content.experience.map((exp, index) => ({
            id: index + 1,
            company: exp.company,
            position: exp.position,
            duration: exp.duration,
            description: exp.description,
          }));

          const summarizedExperienceEntries = content.summarized_experience ? content.summarized_experience.map((exp, index) => ({
            id: index + 1,
            company: exp.company,
            position: exp.position,
            duration: exp.duration,
            description: exp.description,
          })) : [];

          const educationEntries = content.education.map((edu, index) => ({
            id: index + 1,
            institution: edu.institution,
            degree: edu.degree,
            year: edu.year,
          }));

          const skillEntries = content.skillset.map((skill, index) => ({
            id: index + 1,
            category: skill.category,
            skills: skill.skills,
          }));

          return {
            _id: resumeData._id,
            owner: resumeData.owner,
            nickname: resumeData.nickname || null,
            personal_info: content.personal_info,
            profile: content.profile,
            education: educationEntries,
            experience: experienceEntries,
            summarized_experience: summarizedExperienceEntries,
            skillset: skillEntries,
            additional_info: content.additional_info || "",
            path: resumeData.path,
            auto_email_application: resumeData.auto_email_application || false,
            cover_letter_title: resumeData.cover_letter?.title || "",
            cover_letter_content: resumeData.cover_letter?.content || "",
            email_send_frequency_days:
              resumeData.email_send_frequency_days || 1.5,
            gmail_credentials_setup:
              resumeData.gmail_credentials_setup || false,
            gmail_email: resumeData.gmail_email || "",
            gmail_status: resumeData.gmail_status || {
              connected: false,
              email: "",
              hasToken: false,
              tokenExpiryDate: null,
              isNearExpiry: false,
            },
            gmail_cleanup_status: resumeData.gmail_cleanup_status || {
              gmail_auto_cleanup: false,
            },
            showToBidder: resumeData.showToBidder || false,
            auto_email_filters: resumeData.auto_email_filters || {
              location_filter: [],
              category_filter: [],
              confidence_range: [0.3, 1],
              query_date_limit: [-1]
            },
            visibleToBidders: resumeData.visibleToBidders || []
          };
        });

        setResumes(formattedResumes);
      } else {
        setError("No resume data found");
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError("Failed to fetch resumes");
      setLoading(false);
    }
  };

  // Fetch team categories
  const fetchTeamCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
      setTeamCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch team categories:', error);
      // Fallback to default categories if API fails
      setTeamCategories(['general']);
    }
  };

  // Add function to fetch team bidders
  const fetchTeamBidders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`);
      // Filter bidders who have the current user as their master
      const bidders = response.data.filter(member => 
        member.role === 'bidder' && 
        member.master && 
        member.master == user._id
      );
      setTeamBidders(bidders);
    } catch (error) {
      console.error('Error fetching team bidders:', error);
      toast.error('Failed to fetch team bidders');
    }
  };

  // Add function to handle bidder visibility changes
  const handleBidderVisibilityChange = async (bidderIds) => {
    try {
      setSavingBidderVisibility(true);
      
      await axios.put(`${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/bidder-visibility`, {
        visibleToBidders: bidderIds
      });
      
      // Update local state
      const updatedResumes = resumes.map(resume => 
        resume._id === selectedResume._id 
          ? { ...resume, visibleToBidders: bidderIds }
          : resume
      );
      setResumes(updatedResumes);
      
      setVisibleToBidders(bidderIds);
      setBidderSelectOpen(false); // Close the select after selection
      toast.success('Bidder visibility updated successfully');
    } catch (error) {
      console.error('Error updating bidder visibility:', error);
      toast.error('Failed to update bidder visibility');
    } finally {
      setSavingBidderVisibility(false);
    }
  };

  useEffect(() => {
    fetchResumes();
    fetchTeamCategories();
    fetchTeamBidders();
  }, []);

  // Add a new useEffect to fetch scheduled emails when selected resume changes
  useEffect(() => {
    if (selectedResume) {
      setShowToBidder(!!selectedResume.showToBidder);
      setVisibleToBidders(selectedResume.visibleToBidders || []);
      // Add this line to fetch scheduled emails
      fetchScheduledEmailApplications();
    }
  }, [selectedResume]);

  // Add useEffect to update Gmail and auto email settings when selected resume changes
  useEffect(() => {
    if (selectedResume) {
      // Update auto email settings
      setAutoEmailEnabled(!!selectedResume.auto_email_application);
      setCoverLetterTitle(selectedResume.cover_letter_title || "");
      setCoverLetterContent(selectedResume.cover_letter_content || "");
      setEmailSendFrequencyDays(selectedResume.email_send_frequency_days || 1.5);
      
      // Update Gmail connection status
      setGmailConnected(!!selectedResume.gmail_status?.connected);
      setGmailEmail(selectedResume.gmail_status?.email || selectedResume.gmail_email || "");
      setGmailTokenExpiryDate(
        selectedResume.gmail_status?.tokenExpiryDate 
          ? new Date(selectedResume.gmail_status.tokenExpiryDate) 
          : null
      );
      
      // Update Gmail cleanup settings
      setGmailCleanup(!!selectedResume.gmail_cleanup_status?.gmail_auto_cleanup);
      
      // Update filters
      if (selectedResume.auto_email_filters) {
        setLocationFilter(selectedResume.auto_email_filters.location_filter || []);
        setCategoryFilter(selectedResume.auto_email_filters.category_filter || []);
        setQueryDateLimit(selectedResume.auto_email_filters.query_date_limit || [-1]);
      }
    }
  }, [selectedResume]);

  const handleSave = async () => {
    if (!editedResume) return;

    try {
      const formData = new FormData();
      formData.append("owner", editedResume.owner);
      formData.append(
        "content",
        JSON.stringify({
          personal_info: editedResume.personal_info,
          profile: editedResume.profile,
          education: editedResume.education,
          experience: editedResume.experience,
          summarized_experience: editedResume.summarized_experience,
          skillset: editedResume.skillset,
          additional_info: editedResume.additional_info,
        })
      );

      if (fileToUpload) {
        formData.append("resume", fileToUpload);
      }

      // If it's a new resume (has temporary ID)
      if (editedResume._id.startsWith("temp-")) {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/resumes`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        // Update the resume with the real ID from the server
        editedResume._id = response.data._id;
        editedResume.path = response.data.path;
      } else {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/resumes/${editedResume._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = editedResume;
      setResumes(updatedResumes);
      setIsEditing(false);
      setFileToUpload(null);
      setError("");
      await fetchResumes();
    } catch (err) {
      setError("Failed to save resume");
    }
  };

  const handleEdit = () => {
    setEditedResume(JSON.parse(JSON.stringify(resumes[selectedResumeIndex])));
    setIsEditing(true);
  };

  const handleFieldChange = (section, field, value) => {
    if (!editedResume) return;

    if (field === "") {
      // Direct update for non-nested fields like 'profile'
      setEditedResume({
        ...editedResume,
        [section]: value,
      });
    } else {
      // Nested update for fields like personal_info.name
      setEditedResume({
        ...editedResume,
        [section]: {
          ...editedResume[section],
          [field]: value,
        },
      });
    }
  };

  const handleExperienceChange = (id, field, value) => {
    if (!editedResume) return;

    setEditedResume({
      ...editedResume,
      experience: editedResume.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const handleEducationChange = (id, field, value) => {
    if (!editedResume) return;

    setEditedResume({
      ...editedResume,
      education: editedResume.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const handleSkillChange = (id, field, value) => {
    if (!editedResume) return;

    setEditedResume({
      ...editedResume,
      skillset: editedResume.skillset.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    });
  };

  const handleAddSkill = () => {
    if (!editedResume) return;

    const newSkill = {
      id: editedResume.skillset.length + 1,
      category: "",
      skills: "",
    };

    setEditedResume({
      ...editedResume,
      skillset: [...editedResume.skillset, newSkill],
    });
  };

  const createNewResume = async () => {
    const emptyResume = {
      _id: `temp-${Date.now()}`, // Temporary ID for local state
      owner: user._id,
      nickname: null,
      personal_info: {
        name: "",
        title: "",
        email: "",
        phone_number: "",
        location: "",
        linkedin: "",
      },
      profile: "",
      education: [
        {
          id: 1,
          institution: "",
          degree: "",
          year: "",
        },
      ],
      experience: [],
      summarized_experience: [],
      skillset: [],
      additional_info: "",
      gmail_credentials_setup: false,
      gmail_email: "",
    };

    setResumes([...resumes, emptyResume]);
    setSelectedResumeIndex(resumes.length);
    setIsEditing(true);
    setEditedResume(emptyResume);
  };

  const handleDeleteClick = (resumeId, index) => {
    setResumeToDelete({ id: resumeId, index });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/resumes/${resumeToDelete.id}`
      );
      const updatedResumes = resumes.filter(
        (_, i) => i !== resumeToDelete.index
      );
      setResumes(updatedResumes);

      if (resumeToDelete.index === selectedResumeIndex) {
        setSelectedResumeIndex(Math.min(0, updatedResumes.length - 1));
      } else if (resumeToDelete.index < selectedResumeIndex) {
        setSelectedResumeIndex(selectedResumeIndex - 1);
      }
    } catch (err) {
      setError("Failed to delete resume");
    } finally {
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleAddExperience = () => {
    if (!editedResume) return;

    const newExperience = {
      id: editedResume.experience.length + 1,
      company: "",
      position: "",
      duration: "",
      description: "",
    };

    setEditedResume({
      ...editedResume,
      experience: [...editedResume.experience, newExperience],
    });
  };

  const handleRemoveSkill = (id) => {
    if (!editedResume) return;

    setEditedResume({
      ...editedResume,
      skillset: editedResume.skillset.filter((skill) => skill.id !== id),
    });
  };

  const handleRemoveExperience = (id) => {
    if (!editedResume) return;

    setEditedResume({
      ...editedResume,
      experience: editedResume.experience.filter((exp) => exp.id !== id),
    });
  };

  const handleCancel = () => {
    if (editedResume?._id.startsWith("temp-")) {
      // Remove the temporary resume from the list
      const updatedResumes = resumes.filter(
        (_, index) => index !== selectedResumeIndex
      );
      setResumes(updatedResumes);
      setSelectedResumeIndex(Math.max(0, updatedResumes.length - 1));
    }
    setIsEditing(false);
    setEditedResume(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      setIsAnalyzing(true);

      try {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        // Send the extracted text to backend for analysis
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/analyze`,
          { type: "extractResumeInfo", data: { resumeText: fullText } },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Update the edited resume with the analyzed data
        if (response.data) {
          const analyzedResume = response.data;
          setEditedResume((prev) => ({
            ...prev,
            personal_info: {
              name:
                analyzedResume.personal_info.name || prev.personal_info.name,
              title:
                analyzedResume.personal_info.title || prev.personal_info.title,
              email:
                analyzedResume.personal_info.email || prev.personal_info.email,
              phone_number:
                analyzedResume.personal_info.phone_number ||
                prev.personal_info.phone_number,
              location:
                analyzedResume.personal_info.location ||
                prev.personal_info.location,
              linkedin:
                analyzedResume.personal_info.linkedin ||
                prev.personal_info.linkedin,
            },
            profile: analyzedResume.profile || prev.profile,
            experience: analyzedResume.experience.map((exp, index) => ({
              id: index + 1,
              company: exp.company,
              position: exp.position,
              duration: exp.duration,
              description: exp.description,
            })),
            summarized_experience: analyzedResume.summarized_experience.map(
              (exp, index) => ({
                id: index + 1,
                company: exp.company,
                position: exp.position,
                duration: exp.duration,
                description: exp.description,
              })
            ),
            education: analyzedResume.education.map((edu, index) => ({
              id: index + 1,
              institution: edu.institution,
              degree: edu.degree,
              year: edu.year,
            })),
            skillset: analyzedResume.skillset.map((skill, index) => ({
              id: index + 1,
              category: skill.category,
              skills: skill.skills,
            })),
            additional_info: prev.additional_info || "",
          }));
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError("Failed to process resume file");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleAutoEmailToggle = async (checked) => {
    if (!selectedResume) return;

    setAutoEmailEnabled(checked);
    setSavingAutoEmail(true);

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/auto-email-application`,
        { auto_email_application: checked },
        { headers: { "Content-Type": "application/json" } }
      );

      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        auto_email_application: checked, // Changed from auto_email_enabled
        cover_letter_title: coverLetterTitle,
        cover_letter_content: coverLetterContent,
        email_send_frequency_days: emailSendFrequencyDays,
        auto_email_filters: {
          location_filter: locationFilter,
          category_filter: categoryFilter,
          confidence_range: [0.3, 1],
          query_date_limit: queryDateLimit,
        }
      };
      setResumes(updatedResumes);

      setError("");
      toast.success(
        checked
          ? "Automatic email applications enabled successfully!"
          : "Automatic email applications disabled successfully!"
      );
    } catch (err) {
      setError("Failed to update automatic email application settings");
      toast.error("Failed to update automatic email application settings");
      setAutoEmailEnabled(!checked); // Revert the change
    } finally {
      setSavingAutoEmail(false); // Moved to finally block
    }
  };

  const handleSaveAutoEmailSettings = async () => {
    if (!selectedResume) return;

    setSavingAutoEmailSettings(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/auto-email-settings`,
        {
          cover_letter_title: coverLetterTitle,
          cover_letter_content: coverLetterContent,
          email_send_frequency_days: emailSendFrequencyDays,
          location_filter: locationFilter,
          category_filter: categoryFilter,
          confidence_range: [0.3, 1],
          query_date_limit: queryDateLimit,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        cover_letter_title: coverLetterTitle,
        cover_letter_content: coverLetterContent,
        email_send_frequency_days: emailSendFrequencyDays,
        auto_email_filters: {
          location_filter: locationFilter,
          category_filter: categoryFilter,
          confidence_range: [0.3, 1],
          query_date_limit: queryDateLimit,
        }
      };
      setResumes(updatedResumes);

      setError("");
      toast.success("Settings saved successfully!");
    } catch (err) {
      setError("Failed to save automatic email application settings");
      toast.error("Failed to save automatic email application settings");
    } finally {
      setSavingAutoEmailSettings(false);
    }
  };

  const handleGenerateAuthUrl = async () => {
    if (!selectedResume) return;

    setGeneratingAuthUrl(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/gmail/url/${selectedResume._id}`
      );

      setAuthUrl(response.data.authUrl);
      setShowAuthDialog(true);
    } catch (error) {
      console.error("Error generating auth URL:", error);
      toast.error("Failed to generate Gmail authorization URL");
    } finally {
      setGeneratingAuthUrl(false);
    }
  };

  const handleRemoveGmailCredentials = async () => {
    if (!selectedResume) return;

    setRemovingGmail(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/gmail-credentials`
      );

      // Refresh the resume data from server to get updated Gmail status
      await fetchResumes();

      toast.success("Gmail credentials removed successfully");
    } catch (error) {
      console.error("Error removing Gmail credentials:", error);
      toast.error("Failed to remove Gmail credentials");
    } finally {
      setRemovingGmail(false);
    }
  };

  const handleRefreshGmailStatus = async () => {
    if (!selectedResume) return;

    try {
      await fetchResumes();
      toast.success("Gmail status refreshed");
    } catch (error) {
      console.error("Error refreshing Gmail status:", error);
      toast.error("Failed to refresh Gmail status");
    }
  };

  // Add a function to check if token is about to expire
  const isTokenNearExpiry = () => {
    if (!gmailTokenExpiryDate) return false;

    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return gmailTokenExpiryDate - now <= oneDayInMs;
  };

  const fetchScheduledEmailApplications = async () => {
    if (!selectedResume) return;

    setLoadingScheduledEmails(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/applications/scheduled/${selectedResume._id}`
      );
      setScheduledEmails(response.data);
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
    } finally {
      setLoadingScheduledEmails(false);
    }
  };

  const handleShowToBidderToggle = async (checked) => {
    try {
      setSavingShowToBidder(true);
      
      await axios.put(`${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/toggle-bidder-visibility`);
      
      // Update local state
      const updatedResumes = resumes.map(resume => 
        resume._id === selectedResume._id 
          ? { ...resume, showToBidder: checked, visibleToBidders: checked ? [] : [] }
          : resume
      );
      setResumes(updatedResumes);
      
      setShowToBidder(checked);
      setVisibleToBidders(checked ? [] : []);
      toast.success(`Resume ${checked ? 'made visible' : 'hidden'} to bidders`);
    } catch (error) {
      console.error('Error updating showToBidder:', error);
      toast.error('Failed to update bidder visibility');
    } finally {
      setSavingShowToBidder(false);
    }
  };

  const handleSaveNickname = async (resumeId) => {
    setSavingNickname(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${resumeId}/nickname`,
        { nickname: nicknameInput.trim() || null },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      const updatedResumes = resumes.map(resume => 
        resume._id === resumeId 
          ? { ...resume, nickname: nicknameInput.trim() || null }
          : resume
      );
      setResumes(updatedResumes);

      setEditingNicknameId(null);
      setNicknameInput("");
      toast.success("Nickname updated successfully!");
    } catch (err) {
      console.error('Failed to save nickname:', err);
      toast.error("Failed to save nickname. Please try again.");
    } finally {
      setSavingNickname(false);
    }
  };

  const handleCancelNickname = () => {
    setEditingNicknameId(null);
    setNicknameInput("");
  };

  const handleEditNickname = (resume) => {
    setEditingNicknameId(resume._id);
    setNicknameInput(resume.nickname || "");
  };

  const handleStartEditNickname = (resume) => {
    setEditingNicknameId(resume._id);
    setNicknameInput(resume.nickname || "");
  };

  const handleGmailCleanupToggle = async (checked) => {
    if (!selectedResume) return;

    setSavingGmailCleanup(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/gmail-cleanup`,
        { enabled: checked },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        gmail_cleanup_status: {
          ...updatedResumes[selectedResumeIndex].gmail_cleanup_status,
          gmail_auto_cleanup: checked,
        },
      };
      setResumes(updatedResumes);

      setGmailCleanup(checked);
      setCleanupError("");
    } catch (err) {
      setCleanupError("Failed to update Gmail cleanup setting");
      // Revert the toggle if the API call failed
      setGmailCleanup(!checked);
    } finally {
      setSavingGmailCleanup(false);
    }
  };

  // Add additional email to scheduled application
  const handleAddAdditionalEmail = async (scheduleId) => {
    if (!additionalEmailInput.trim()) {
      return;
    }

    setAddingEmail(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/applications/scheduled/${scheduleId}/add-email`,
        { email: additionalEmailInput.trim() }
      );

      if (response.status === 200) {
        setAdditionalEmailInput('');
        await fetchScheduledEmailApplications();
      }
    } catch (error) {
      console.error('Error adding additional email:', error);
      toast.error(error.response?.data?.message || 'Failed to add email');
    } finally {
      setAddingEmail(false);
    }
  };

  // Remove additional email from scheduled application
  const handleRemoveAdditionalEmail = async (scheduleId, email) => {
    setRemovingEmail(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/applications/scheduled/${scheduleId}/remove-email`,
        { data: { email } }
      );

      if (response.status === 200) {
        await fetchScheduledEmailApplications();
      }
    } catch (error) {
      console.error('Error removing additional email:', error);
      toast.error(error.response?.data?.message || 'Failed to remove email');
    } finally {
      setRemovingEmail(false);
    }
  };

  // Remove bid list email from scheduled application
  const handleRemoveBidEmail = async (scheduleId, bidId) => {
    setRemovingBidEmail(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/applications/scheduled/${scheduleId}/remove-bid-email`,
        { data: { bidId } }
      );

      if (response.status === 200) {
        const result = response.data;
        if (result.deleted) {
          // Schedule was deleted entirely, refresh the list
          await fetchScheduledEmailApplications();
        } else {
          // Just refresh to show updated list
          await fetchScheduledEmailApplications();
        }
      }
    } catch (error) {
      console.error('Error removing bid email:', error);
      toast.error(error.response?.data?.message || 'Failed to remove email');
    } finally {
      setRemovingBidEmail(false);
    }
  };

  // Handle remove email with confirmation
  const handleRemoveEmailClick = (email, scheduleId, emailType) => {
    setRemoveEmailDialog({
      open: true,
      email,
      scheduleId,
      emailType
    });
  };

  const handleRemoveEmailConfirm = async () => {
    const { email, scheduleId, emailType } = removeEmailDialog;
    
    if (emailType === 'additional') {
      await handleRemoveAdditionalEmail(scheduleId, email.applicationEmail);
    } else if (emailType === 'bid_list') {
      await handleRemoveBidEmail(scheduleId, email.id);
    }
    
    setRemoveEmailDialog({ open: false, email: null, scheduleId: null, emailType: null });
  };

  const handleRemoveEmailCancel = () => {
    setRemoveEmailDialog({ open: false, email: null, scheduleId: null, emailType: null });
  };

  // Add filter handlers
  const handleLocationFilterChange = (location) => {
    let newLocationFilter;
    
    if (location === "all") {
      // If "Anywhere" is selected, deselect all other locations
      newLocationFilter = ["all"];
    } else {
      // If a specific location is selected, remove "Anywhere" and add the location
      if (locationFilter.includes("all")) {
        // Remove "all" and add the specific location
        newLocationFilter = [location];
      } else if (locationFilter.includes(location)) {
        // Remove the specific location
        newLocationFilter = locationFilter.filter((loc) => loc !== location);
        // If no locations left, default to "all"
        if (newLocationFilter.length === 0) {
          newLocationFilter = ["all"];
        }
      } else {
        // Add the specific location (removing "all" if it exists)
        newLocationFilter = locationFilter.filter((loc) => loc !== "all");
        newLocationFilter.push(location);
      }
    }
    
    setLocationFilter(newLocationFilter);
  };

  const handleCategoryFilterChange = (category) => {
    let newCategoryFilter;
    if (category === "all") {
      newCategoryFilter = ["all"];
    } else if (categoryFilter.includes("all")) {
      newCategoryFilter = [category];
    } else if (categoryFilter.includes(category)) {
      newCategoryFilter = categoryFilter.filter((c) => c !== category);
      if (newCategoryFilter.length === 0) {
        newCategoryFilter = ["all"];
      }
    } else {
      newCategoryFilter = [...categoryFilter, category];
    }

    setCategoryFilter(newCategoryFilter);
  };

  const handleQueryDateLimitChange = (event) => {
    const value = event.target.value;
    setQueryDateLimit(Array.isArray(value) ? value : [value]);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Remove the duplicate selectedResume definition
  const displayedResume = isEditing ? editedResume : selectedResume;

  return (
    <Box sx={{ display: "flex", gap: 2, p: 2, maxWidth: 1200, mx: "auto" }}>
      {/* Left sidebar with resume list */}
      <Paper sx={{ width: 300, p: 2, position: "fixed", height: "90%", overflowY: "auto" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Resumes</Typography>
          <Button variant="contained" size="small" onClick={createNewResume}>
            <AddIcon />
            Add
          </Button>
        </Box>
        {resumes.length === 0 ? (
          <Typography align="center" sx={{ mt: 2 }}>
            No resumes found. Click 'Add' to create one.
          </Typography>
        ) : (
          <List>
            {resumes.map((resume, index) => {
              // Check if Gmail token is near expiry
              const isNearExpiry = resume.gmail_status?.isNearExpiry || false;
              const isEditingNickname = editingNicknameId === resume._id;
              
              return (
                <ListItemButton
                  key={index}
                  selected={index === selectedResumeIndex}
                  onClick={() => setSelectedResumeIndex(index)}
                  sx={{ 
                    flexDirection: 'column', 
                    alignItems: 'stretch',
                    p: 1
                  }}
                >
                  {/* Resume Selection Area */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    width: '100%',
                    mb: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontWeight: 'bold' }}>
                        {resume.nickname || resume.personal_info?.name || "Untitled Resume"}
                      </span>
                    </Box>
                    {isNearExpiry && (
                      <Badge 
                        badgeContent="!"
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '9px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: '15px'
                          }
                        }}
                      />
                    )}
                  </Box>

                  {/* Nickname Display/Edit Area */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    width: '100%'
                  }}>
                    {isEditingNickname ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Enter nickname..."
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          sx={{ flex: 1 }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveNickname(resume._id);
                            }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleSaveNickname(resume._id)}
                          disabled={savingNickname}
                          color="primary"
                        >
                          {savingNickname ? (
                            <CircularProgress size={16} />
                          ) : (
                            <SaveIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCancelNickname}
                          color="default"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%'
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography variant="caption" color="text.secondary">
                            {resume.personal_info?.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditNickname(resume);
                          }}
                          color="primary"
                          title="Edit nickname"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Right side with resume details */}
      {displayedResume && resumes.length > 0 && (
        <Paper sx={{ flex: 1, p: 4, marginLeft: "320px" }}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            {!isEditing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setCustomizedResumesOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Customized Resumes
                </Button>
                {selectedResume?.path && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      window.open(
                        `${process.env.REACT_APP_API_URL}/resumefiles/${selectedResume.path}`,
                        "_blank"
                      )
                    }
                    sx={{ mr: 1 }}
                  >
                    View Resume File
                  </Button>
                )}
                <Button
                  startIcon={<EditIcon />}
                  variant="contained"
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    handleDeleteClick(selectedResume._id, selectedResumeIndex)
                  }
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="resume-file-input"
                />
                <label htmlFor="resume-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={
                      isAnalyzing ? <CircularProgress size={20} /> : <AddIcon />
                    }
                    sx={{ mr: 1 }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? "Analyzing Resume..."
                      : fileToUpload
                      ? fileToUpload.name
                      : "Upload Resume File"}
                  </Button>
                </label>
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  onClick={handleSave}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>

          <Box mb={4}>
            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  label="Name"
                  value={displayedResume.personal_info.name}
                  onChange={(e) =>
                    handleFieldChange("personal_info", "name", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Title"
                  value={displayedResume.personal_info.title}
                  onChange={(e) =>
                    handleFieldChange("personal_info", "title", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={displayedResume.personal_info.email}
                  onChange={(e) =>
                    handleFieldChange("personal_info", "email", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={displayedResume.personal_info.phone_number}
                  onChange={(e) =>
                    handleFieldChange(
                      "personal_info",
                      "phone_number",
                      e.target.value
                    )
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Location"
                  value={displayedResume.personal_info.location}
                  onChange={(e) =>
                    handleFieldChange(
                      "personal_info",
                      "location",
                      e.target.value
                    )
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={displayedResume.personal_info.linkedin}
                  onChange={(e) =>
                    handleFieldChange(
                      "personal_info",
                      "linkedin",
                      e.target.value
                    )
                  }
                  sx={{ mb: 2 }}
                />
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  {displayedResume.personal_info.name}
                </Typography>
                <Typography variant="h6" gutterBottom color="text.secondary">
                  {displayedResume.personal_info.title}
                </Typography>
                <Typography variant="body1">
                  {displayedResume.personal_info.email}
                </Typography>
                <Typography variant="body1">
                  {displayedResume.personal_info.phone_number}
                </Typography>
                <Typography variant="body1">
                  {displayedResume.personal_info.location}
                </Typography>
                <Typography variant="body1">
                  {displayedResume.personal_info.linkedin}
                </Typography>
              </>
            )}
          </Box>

          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Profile
            </Typography>
            <Divider />
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={Infinity}
                label="Profile"
                value={displayedResume.profile}
                onChange={(e) =>
                  handleFieldChange("profile", "", e.target.value)
                }
                sx={{ mt: 2 }}
              />
            ) : (
              <Typography variant="body1" sx={{ mt: 2 }}>
                {displayedResume.profile}
              </Typography>
            )}
          </Box>

          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Experience
            </Typography>
            <Divider />
            <List>
              {displayedResume.experience.map((exp) => (
                <ListItem key={exp.id}>
                  {isEditing ? (
                    <Box sx={{ width: "100%" }}>
                      <Box display="flex" justifyContent="flex-end" mb={1}>
                        <IconButton
                          onClick={() => handleRemoveExperience(exp.id)}
                          color="error"
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                      <TextField
                        fullWidth
                        label="Company"
                        value={exp.company}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "company",
                            e.target.value
                          )
                        }
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Position"
                        value={exp.position}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "position",
                            e.target.value
                          )
                        }
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Duration"
                        value={exp.duration}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "duration",
                            e.target.value
                          )
                        }
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={Infinity}
                        label="Description"
                        value={exp.description}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </Box>
                  ) : (
                    <ListItemText
                      primary={`${exp.position} at ${exp.company}`}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {exp.duration}
                          </Typography>
                          <br />
                          {exp.description && typeof exp.description === 'string' 
                            ? exp.description.split("\n").map((line, index) => (
                                <React.Fragment key={index}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))
                            : exp.description || ''}
                        </>
                      }
                    />
                  )}
                </ListItem>
              ))}
              {isEditing && (
                <ListItem>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddExperience}
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Add Experience
                  </Button>
                </ListItem>
              )}
            </List>
          </Box>

          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Education
            </Typography>
            <Divider />
            <List>
              {displayedResume.education.map((edu) => (
                <ListItem key={edu.id}>
                  {isEditing ? (
                    <Box sx={{ width: "100%" }}>
                      <TextField
                        fullWidth
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "institution",
                            e.target.value
                          )
                        }
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(
                            edu.id,
                            "degree",
                            e.target.value
                          )
                        }
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Year"
                        value={edu.year}
                        onChange={(e) =>
                          handleEducationChange(edu.id, "year", e.target.value)
                        }
                      />
                    </Box>
                  ) : (
                    <ListItemText
                      primary={edu.institution}
                      secondary={`${edu.degree} - ${edu.year}`}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h5" gutterBottom>
                Skills
              </Typography>
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddSkill}
                  startIcon={<AddIcon />}
                >
                  Add Skill Category
                </Button>
              )}
            </Box>
            <Divider />
            <List>
              {displayedResume.skillset.map((skill) => (
                <ListItem key={skill.id}>
                  {isEditing ? (
                    <Box sx={{ width: "100%" }}>
                      <Box display="flex" gap={2}>
                        <TextField
                          label="Category"
                          value={skill.category}
                          onChange={(e) =>
                            handleSkillChange(
                              skill.id,
                              "category",
                              e.target.value
                            )
                          }
                          sx={{ width: "30%" }}
                        />
                        <TextField
                          label="Skills (comma-separated)"
                          value={skill.skills}
                          onChange={(e) =>
                            handleSkillChange(
                              skill.id,
                              "skills",
                              e.target.value
                            )
                          }
                          sx={{ width: "70%" }}
                        />
                        <IconButton
                          onClick={() => handleRemoveSkill(skill.id)}
                          color="error"
                          size="small"
                          sx={{ height: "100%", alignSelf: "center" }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ width: "100%" }}>
                      <Typography variant="h6" gutterBottom>
                        {skill.category}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {skill.skills &&
                          skill.skills.split(", ").map((item, index) => (
                            <Typography
                              key={index}
                              component="span"
                              sx={{
                                display: "inline-block",
                                bgcolor: "primary.main",
                                color: "white",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {item}
                            </Typography>
                          ))}
                      </Box>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>

          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Additional Information
            </Typography>
            <Divider />
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={Infinity}
                label="Additional Information"
                value={displayedResume.additional_info || ""}
                onChange={(e) =>
                  handleFieldChange("additional_info", "", e.target.value)
                }
                sx={{ mt: 2 }}
                placeholder="Add any additional information, certifications, awards, or other relevant details"
              />
            ) : (
              displayedResume.additional_info && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {displayedResume.additional_info
                    .split("\n")
                    .map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                </Typography>
              )
            )}
          </Box>

          {/* Bidder Visibility Section */}
          <Box sx={{ mt: 3, mb: 4 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6" gutterBottom>
                Bidder Visibility
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showToBidder}
                    onChange={(e) => handleShowToBidderToggle(e.target.checked)}
                    color="primary"
                    disabled={savingShowToBidder}
                  />
                }
                label=""
              />
            </Box>
            <Divider />
            
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  When enabled, this resume will be visible to bidders who have you as their master. 
                  Bidders will be able to use this resume for their applications.
                </Typography>
              </Alert>
              
              {showToBidder && teamBidders.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Visible to specific bidders</InputLabel>
                    <Select
                      multiple
                      open={bidderSelectOpen}
                      onOpen={() => setBidderSelectOpen(true)}
                      onClose={() => setBidderSelectOpen(false)}
                      value={visibleToBidders}
                      onChange={(e) => handleBidderVisibilityChange(e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((bidderId) => {
                            const bidder = teamBidders.find(b => b._id === bidderId);
                            return (
                              <Chip 
                                key={bidderId} 
                                label={bidder ? bidder.name : bidderId} 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                      disabled={savingBidderVisibility}
                    >
                      {teamBidders.map((bidder) => (
                        <MenuItem key={bidder._id} value={bidder._id}>
                          <Checkbox checked={visibleToBidders.indexOf(bidder._id) > -1} />
                          <ListItemText primary={bidder.name} secondary={bidder.email} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {visibleToBidders.length === 0 
                      ? 'Leave empty to make visible to all bidders in your team'
                      : `Visible to ${visibleToBidders.length} selected bidder(s)`
                    }
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary">
                <strong>Current status:</strong> {showToBidder ? 'Visible to bidders' : 'Hidden from bidders'}
                {showToBidder && visibleToBidders.length > 0 && (
                  <span> - Limited to {visibleToBidders.length} specific bidder(s)</span>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Gmail API Integration Section - Always visible */}
          <Box sx={{ mt: 3, mb: 4 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6" gutterBottom>
                Gmail API Integration
              </Typography>
              <Chip
                label={gmailConnected ? "Connected" : "Not Connected"}
                color={gmailConnected ? "success" : "default"}
                sx={{
                  backgroundColor: gmailConnected ? "success.main" : "default",
                }}
                icon={gmailConnected ? <LinkIcon /> : <LinkOffIcon />}
              />
            </Box>
            <Divider />

            {gmailConnected ? (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Connected to:</strong> {gmailEmail}
                  </Typography>
                  {gmailTokenExpiryDate && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Token expires:</strong>{" "}
                      {gmailTokenExpiryDate.toLocaleString()}
                    </Typography>
                  )}
                </Alert>

                {isTokenNearExpiry() && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Your Gmail connection will expire soon. Please reconnect
                      your Gmail account to ensure uninterrupted service.
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<LinkOffIcon />}
                    onClick={handleRemoveGmailCredentials}
                    disabled={removingGmail}
                  >
                    {removingGmail ? "Removing..." : "Disconnect Gmail"}
                  </Button>
                  <Button variant="outlined" onClick={handleRefreshGmailStatus}>
                    Refresh Status
                  </Button>
                  {isTokenNearExpiry() && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<GoogleIcon />}
                      onClick={handleGenerateAuthUrl}
                    >
                      Reconnect Gmail
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Connect your Gmail account to use Gmail API for sending
                    emails. This provides better reliability and includes
                    automatic PDF attachments.
                  </Typography>
                </Alert>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    onClick={handleGenerateAuthUrl}
                    disabled={generatingAuthUrl}
                  >
                    {generatingAuthUrl
                      ? "Generating..."
                      : "Connect Gmail Account"}
                  </Button>
                  <Button variant="outlined" onClick={handleRefreshGmailStatus}>
                    Refresh Status
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  <strong>Note:</strong> The Gmail account email must match your
                  resume email address:{" "}
                  <strong>{selectedResume?.personal_info?.email}</strong>
                </Typography>
              </Box>
            )}
          </Box>

          {/* Automatic Email Applications Section */}
          <Box mb={4}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h5" gutterBottom>
                Automatic Email Applications (beta testing version)
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoEmailEnabled}
                    onChange={(e) => handleAutoEmailToggle(e.target.checked)}
                    color="primary"
                    disabled={savingAutoEmail}
                  />
                }
                label=""
              />
            </Box>
            <Divider />

            {autoEmailEnabled && (
              <>
                {/* Email Frequency Section */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Email Sending Frequency
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Send every * days</InputLabel>
                    <Select
                      value={emailSendFrequencyDays}
                      onChange={(e) =>
                        setEmailSendFrequencyDays(e.target.value)
                      }
                      label="Send every * days"
                    >
                      <MenuItem value={1.5}>1.5 days</MenuItem>
                      <MenuItem value={2}>2 days</MenuItem>
                      <MenuItem value={3}>3 days</MenuItem>
                      <MenuItem value={4}>4 days</MenuItem>
                      <MenuItem value={5}>5 days</MenuItem>
                      <MenuItem value={6}>6 days</MenuItem>
                      <MenuItem value={7}>7 days</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    <strong>Note:</strong>
                    • 1.5-2 days: Emails will be sent within 12 hours of the
                    scheduled time
                    <br />
                    • 3-4 days: Emails will be sent within 24 hours of the
                    scheduled time
                    <br />• 5-7 days: Emails will be sent within 48 hours of the
                    scheduled time
                  </Typography>
                </Box>

                {/* Email Filters Section */}
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Email Filters
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FilterListIcon />}
                      onClick={handleOpenFiltersDialog}
                      sx={{ 
                        backgroundColor: "primary.main",
                        "&:hover": { backgroundColor: "primary.dark" }
                      }}
                    >
                      Set Filters
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure filters to control which job opportunities are included in automatic email applications. Click "Set Filters" to configure your preferences.
                  </Typography>
                </Box>

                {/* Next Scheduled Email Section */}
                <Box sx={{ mt: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Typography variant="h6" gutterBottom>
                      Next Scheduled Email Applications
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={fetchScheduledEmailApplications}
                      disabled={loadingScheduledEmails}
                      startIcon={
                        loadingScheduledEmails ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ScheduleIcon />
                        )
                      }
                    >
                      Refresh
                    </Button>
                  </Box>

                  {scheduledEmailsError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="body2">{scheduledEmailsError}</Typography>
                    </Alert>
                  )}

                  {scheduledEmails && scheduledEmails.schedules.length > 0 ? (
                    <Box 
                      sx={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1
                      }}
                    >
                      {scheduledEmails.schedules.map((schedule, index) => (
                        <Paper key={schedule.id} sx={{ p: 3, mb: 2 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={2}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <ScheduleIcon color="primary" />
                              <Typography variant="h6">
                                {index === 0 ? "Next Schedule" : `Schedule ${index + 1}`}
                              </Typography>
                            </Box>
                              <Chip 
                              label={`${schedule.totalEmails} emails`}
                              color="primary"
                              variant="outlined"
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" mb={2}>
                            <strong>Scheduled for:</strong>{" "}
                            {new Date(schedule.scheduledTime).toLocaleString()}
                          </Typography>

                          {/* Additional Email Input */}
                          <Box sx={{ mb: 2, borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Add Additional Email:
                            </Typography>
                            <Box display="flex" gap={1}>
                              <TextField
                                size="small" 
                                placeholder="Enter email address"
                                value={additionalEmailInput}
                                onChange={(e) => setAdditionalEmailInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddAdditionalEmail(schedule.id);
                                  }
                                }}
                                sx={{ flexGrow: 1 }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddAdditionalEmail(schedule.id)}
                                disabled={addingEmail || !additionalEmailInput.trim()}
                                startIcon={<AddIcon />}
                              >
                                Add
                              </Button>
                        </Box>
                          </Box>

                          <Typography variant="subtitle2" gutterBottom>
                            Emails to be sent:
                          </Typography>

                          <List dense>
                            {schedule.emailsToSend.map((email, emailIndex) => (
                              <ListItem key={email.id} sx={{ pl: 0 }}>
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <EmailIcon fontSize="small" color="action" />
                                      <Typography variant="body2">
                                        {email.title || "Untitled Position"}
                                      </Typography>
                                      {email.source === 'additional' && (
                                        <Chip
                                          label="Additional"
                                          size="small"
                                          color="secondary"
                                          variant="outlined"
                                        />
                                      )}
                                      {email.source === 'bid_list' && (
                                        <Chip
                                          label="From Job"
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <BusinessIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          {email.company || "Unknown Company"}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Email:</strong> {email.applicationEmail}
                                      </Typography>
                                      <br />
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Found:</strong>{" "}
                                        {new Date(email.created_at).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                {/* Remove button for both additional and bid list emails */}
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveEmailClick(email, schedule.id, email.source)}
                                  disabled={removingEmail || removingBidEmail}
                                  color="error"
                                  title={email.source === 'additional' ? 'Remove additional email' : 'Remove from schedule'}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      <Typography variant="body2">
                        No scheduled email applications found. Emails will be scheduled automatically 
                        when new job opportunities are found that match your criteria.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Cover Letter Section */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Cover Letter
                  </Typography>

                  <TextField
                    fullWidth
                    label="Cover Letter Title"
                    value={coverLetterTitle}
                    onChange={(e) => setCoverLetterTitle(e.target.value)}
                    placeholder="e.g., Application for Software Engineer Position"
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    maxRows={Infinity}
                    label="Cover Letter Content"
                    value={coverLetterContent}
                    onChange={(e) => setCoverLetterContent(e.target.value)}
                    placeholder="Write your cover letter content here. You can use placeholders like {company_name}, {position_title}, {job_description} that will be automatically replaced with actual values."
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveAutoEmailSettings}
                      disabled={savingAutoEmailSettings}
                      startIcon={
                        savingAutoEmailSettings ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SaveIcon />
                        )
                      }
                    >
                      {savingAutoEmailSettings
                        ? "Saving..."
                        : "Save All Settings"}
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {/* Automatic Gmail Management Section */}
          <Box mb={4}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h5" gutterBottom>
                Automatic Gmail Management
                  </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={gmailCleanup}
                    onChange={(e) => handleGmailCleanupToggle(e.target.checked)}
                    color="primary"
                    disabled={savingGmailCleanup}
                  />
                }
                label=""
              />
            </Box>
            <Divider />
            {cleanupError && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="error">
                  <Typography variant="body2">{cleanupError}</Typography>
                </Alert>
                </Box>
              )}
          </Box>

          {/* Add new Dialog for Customized Resumes */}
          <Dialog
            open={customizedResumesOpen}
            onClose={() => setCustomizedResumesOpen(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">Customized Resumes</Typography>
                <IconButton onClick={() => setCustomizedResumesOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {customizedResumesOpen && selectedResume && (
                <CustomizedResumes
                  baseResumeId={selectedResume._id}
                  dialogMode={true}
                />
              )}
            </DialogContent>
          </Dialog>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this resume? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify the Auth URL Dialog */}
      <Dialog
        open={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <GoogleIcon color="primary" />
            Connect Gmail Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            To use Gmail API for sending emails, you need to authorize this
            application to access your Gmail account.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Please use the Gmail account that
              matches your resume email address:{" "}
              <strong>{selectedResume?.personal_info?.email}</strong>
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Copy the authorization URL below and open it in the browser profile
            where you're signed in with your Gmail account.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              value={authUrl}
              variant="outlined"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(authUrl);
                      toast.success("URL copied to clipboard!");
                    }}
                    size="small"
                    sx={{
                      ml: 1,
                      color: "primary.main",
                      "&:hover": { color: "primary.dark" },
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            After authorization, return to this page and click "Refresh Status"
            to see the updated connection status.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              setShowAuthDialog(false);
              await handleRefreshGmailStatus();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for removing emails */}
      <Dialog
        open={removeEmailDialog.open}
        onClose={handleRemoveEmailCancel}
        aria-labelledby="remove-email-dialog-title"
        aria-describedby="remove-email-dialog-description"
      >
        <DialogTitle id="remove-email-dialog-title">
          Remove Email from Schedule
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-email-dialog-description">
            Are you sure you want to remove this email from the scheduled application?
            <br />
            <strong>Email:</strong> {removeEmailDialog.email?.applicationEmail}
            <br />
            <strong>Type:</strong> {removeEmailDialog.emailType === 'additional' ? 'Additional Email' : 'Job Application'}
            {removeEmailDialog.email?.title && (
              <>
                <br />
                <strong>Position:</strong> {removeEmailDialog.email.title}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveEmailCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveEmailConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filters Configuration Dialog */}
      <Dialog
        open={filtersDialogOpen}
        onClose={handleCancelFilters}
        maxWidth="md"
        fullWidth
        aria-labelledby="filters-dialog-title"
      >
        <DialogTitle id="filters-dialog-title" sx={{
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
          <FilterListIcon />
          Configure Email Filters
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Location Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
              <LocationOnIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Location Filter
            </Typography>
            <Grid container spacing={1}>
              {locationOptions.map((option) => (
                <Grid item xs={6} sm={4} key={option.value}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tempFilters.location.includes(option.value)}
                        onChange={(e) => {
                          if (option.value === "all") {
                            // If "Anywhere" is selected, deselect all others
                            if (e.target.checked) {
                              setTempFilters(prev => ({
                                ...prev,
                                location: ["all"]
                              }));
                            } else {
                              setTempFilters(prev => ({
                                ...prev,
                                location: []
                              }));
                            }
                          } else {
                            // If a specific location is selected
                            if (e.target.checked) {
                              // Remove "all" and add the specific location
                              const newLocations = tempFilters.location.filter(loc => loc !== "all");
                              setTempFilters(prev => ({
                                ...prev,
                                location: [...newLocations, option.value]
                              }));
                            } else {
                              // Remove the specific location
                              const newLocations = tempFilters.location.filter(loc => loc !== option.value);
                              if (newLocations.length === 0) {
                                // If no locations left, default to "all"
                                setTempFilters(prev => ({
                                  ...prev,
                                  location: ["all"]
                                }));
                              } else {
                                setTempFilters(prev => ({
                                  ...prev,
                                  location: newLocations
                                }));
                              }
                            }
                          }
                        }}
                        size="small"
                      />
                    }
                    label={option.label}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Category Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
              <CategoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Category Filter
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={tempFilters.category.includes("all")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempFilters(prev => ({
                            ...prev,
                            category: ["all"]
                          }));
                        } else {
                          setTempFilters(prev => ({
                            ...prev,
                            category: []
                          }));
                        }
                      }}
                      size="small"
                    />
                  }
                  label="All Categories"
                />
              </Grid>
              {teamCategories.slice(0, 4).map((category) => (
                <Grid item xs={6} sm={4} key={category}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tempFilters.category.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Remove "all" if it exists and add the specific category
                            const newCategories = tempFilters.category.filter(cat => cat !== "all");
                            setTempFilters(prev => ({
                              ...prev,
                              category: [...newCategories, category]
                            }));
                          } else {
                            // Remove the specific category
                            const newCategories = tempFilters.category.filter(cat => cat !== category);
                            if (newCategories.length === 0) {
                              // If no categories selected, default to "all"
                              setTempFilters(prev => ({
                                ...prev,
                                category: ["all"]
                              }));
                            } else {
                              setTempFilters(prev => ({
                                ...prev,
                                category: newCategories
                              }));
                            }
                          }
                        }}
                        size="small"
                      />
                    }
                    label={category}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Query Date Limit Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Query Date Limit
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Date Limit</InputLabel>
              <Select
                multiple
                value={tempFilters.dateLimit}
                onChange={(e) => {
                  setTempFilters(prev => ({
                    ...prev,
                    dateLimit: e.target.value
                  }));
                }}
                label="Date Limit"
              >
                {dateLimitOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCancelFilters} 
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveFilters} 
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ 
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" }
            }}
          >
            Save Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resume;

import React, { useState, useEffect } from 'react';
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
  FormControlLabel
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import * as pdfjsLib from 'pdfjs-dist';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedResumes from './CustomizedResumes';
import { useAuth } from '../context/AuthContext';

// Set the worker source using a local path instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const Resume = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeIndex, setSelectedResumeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customizedResumesOpen, setCustomizedResumesOpen] = useState(false);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
  const [appPassword, setAppPassword] = useState('');
  const [coverLetterTitle, setCoverLetterTitle] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [savingAutoEmail, setSavingAutoEmail] = useState(false);
  const [savingAutoEmailSettings, setSavingAutoEmailSettings] = useState(false);
  const { user } = useAuth();

  const fetchResumes = async () => {
    try { 
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/resumes`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        const formattedResumes = response.data.map((resumeData) => {
          const content = resumeData.content;
          const experienceEntries = content.experience.map((exp, index) => ({
            id: index + 1,
            company: exp.company,
            position: exp.position,
            duration: exp.duration,
            description: exp.description
          }));

          const educationEntries = content.education.map((edu, index) => ({
            id: index + 1,
            institution: edu.institution,
            degree: edu.degree,
            year: edu.year
          }));

          const skillEntries = content.skillset.map((skill, index) => ({
            id: index + 1,
            category: skill.category,
            skills: skill.skills
          }));

          return {
            _id: resumeData._id,
            owner: resumeData.owner,
            personal_info: content.personal_info,
            profile: content.profile,
            education: educationEntries,
            experience: experienceEntries,
            skillset: skillEntries,
            additional_info: content.additional_info || '',
            path: resumeData.path,
            auto_email_application: resumeData.auto_email_application || false,
            app_password: resumeData.app_password || '',
            cover_letter_title: resumeData.cover_letter?.title || '',
            cover_letter_content: resumeData.cover_letter?.content || ''
          };
        });

        setResumes(formattedResumes);
      } else {
        setError('No resume data found');
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError('Failed to fetch resumes');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleSave = async () => {
    if (!editedResume) return;
    
    try {
      const formData = new FormData();
      formData.append('owner', editedResume.owner);
      formData.append('content', JSON.stringify({
        personal_info: editedResume.personal_info,
        profile: editedResume.profile,
        education: editedResume.education,
        experience: editedResume.experience,
        summarized_experience: editedResume.summarized_experience,
        skillset: editedResume.skillset,
        additional_info: editedResume.additional_info
      }));

      if (fileToUpload) {
        formData.append('resume', fileToUpload);
      }

      // If it's a new resume (has temporary ID)
      if (editedResume._id.startsWith('temp-')) {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/resumes`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
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
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }
      
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = editedResume;
      setResumes(updatedResumes);
      setIsEditing(false);
      setFileToUpload(null);
      setError('');
      await fetchResumes();
    } catch (err) {
      setError('Failed to save resume');
    }
  };

  const handleEdit = () => {
    setEditedResume(JSON.parse(JSON.stringify(resumes[selectedResumeIndex])));
    setIsEditing(true);
  };

  const handleFieldChange = (section, field, value) => {
    if (!editedResume) return;
    
    if (field === '') {
      // Direct update for non-nested fields like 'profile'
      setEditedResume({
        ...editedResume,
        [section]: value
      });
    } else {
      // Nested update for fields like personal_info.name
      setEditedResume({
        ...editedResume,
        [section]: {
          ...editedResume[section],
          [field]: value
        }
      });
    }
  };

  const handleExperienceChange = (id, field, value) => {
    if (!editedResume) return;
    
    setEditedResume({
      ...editedResume,
      experience: editedResume.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  const handleEducationChange = (id, field, value) => {
    if (!editedResume) return;
    
    setEditedResume({
      ...editedResume,
      education: editedResume.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    });
  };

  const handleSkillChange = (id, field, value) => {
    if (!editedResume) return;
    
    setEditedResume({
      ...editedResume,
      skillset: editedResume.skillset.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    });
  };

  const handleAddSkill = () => {
    if (!editedResume) return;
    
    const newSkill = {
      id: editedResume.skillset.length + 1,
      category: '',
      skills: ''
    };

    setEditedResume({
      ...editedResume,
      skillset: [...editedResume.skillset, newSkill]
    });
  };

  const createNewResume = async () => {
    const emptyResume = {
      _id: `temp-${Date.now()}`, // Temporary ID for local state
      owner: user._id,
      personal_info: {
        name: '',
        title: '',
        email: '',
        phone_number: '',
        location: '',
        linkedin: ''
      },
      profile: '',
      education: [{
        id: 1,
        institution: '',
        degree: "",
        year: ''
      }],
      experience: [],
      summarized_experience: [],
      skillset: [],
      additional_info: ''
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/resumes/${resumeToDelete.id}`);
      const updatedResumes = resumes.filter((_, i) => i !== resumeToDelete.index);
      setResumes(updatedResumes);
      
      if (resumeToDelete.index === selectedResumeIndex) {
        setSelectedResumeIndex(Math.min(0, updatedResumes.length - 1));
      } else if (resumeToDelete.index < selectedResumeIndex) {
        setSelectedResumeIndex(selectedResumeIndex - 1);
      }
    } catch (err) {
      setError('Failed to delete resume');
    } finally {
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleAddExperience = () => {
    if (!editedResume) return;
    
    const newExperience = {
      id: editedResume.experience.length + 1,
      company: '',
      position: '',
      duration: '',
      description: ''
    };

    setEditedResume({
      ...editedResume,
      experience: [...editedResume.experience, newExperience]
    });
  };

  const handleRemoveSkill = (id) => {
    if (!editedResume) return;
    
    setEditedResume({
      ...editedResume,
      skillset: editedResume.skillset.filter(skill => skill.id !== id)
    });
  };

  const handleRemoveExperience = (id) => {
    if (!editedResume) return;
    
    setEditedResume({
      ...editedResume,
      experience: editedResume.experience.filter(exp => exp.id !== id)
    });
  };

  const handleCancel = () => {
    if (editedResume?._id.startsWith('temp-')) {
      // Remove the temporary resume from the list
      const updatedResumes = resumes.filter((_, index) => index !== selectedResumeIndex);
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
        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        // Send the extracted text to backend for analysis
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/analyze`,
          { type: 'extractResumeInfo', data: { resumeText: fullText } },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // Update the edited resume with the analyzed data
        if (response.data) {
          const analyzedResume = response.data;
          setEditedResume(prev => ({
            ...prev,
            personal_info: {
              name: analyzedResume.personal_info.name || prev.personal_info.name,
              title: analyzedResume.personal_info.title || prev.personal_info.title,
              email: analyzedResume.personal_info.email || prev.personal_info.email,
              phone_number: analyzedResume.personal_info.phone_number || prev.personal_info.phone_number,
              location: analyzedResume.personal_info.location || prev.personal_info.location,
              linkedin: analyzedResume.personal_info.linkedin || prev.personal_info.linkedin,
            },
            profile: analyzedResume.profile || prev.profile,
            experience: analyzedResume.experience.map((exp, index) => ({
              id: index + 1,
              company: exp.company,
              position: exp.position,
              duration: exp.duration,
              description: exp.description
            })),
            summarized_experience: analyzedResume.summarized_experience.map((exp, index) => ({
              id: index + 1,
              company: exp.company,
              position: exp.position,
              duration: exp.duration,
              description: exp.description
            })),
            education: analyzedResume.education.map((edu, index) => ({
              id: index + 1,
              institution: edu.institution,
              degree: edu.degree,
              year: edu.year
            })),
            skillset: analyzedResume.skillset.map((skill, index) => ({
              id: index + 1,
              category: skill.category,
              skills: skill.skills
            })),
            additional_info: prev.additional_info || ''
          }));
        }

      } catch (error) {
        console.error('Error processing PDF:', error);
        setError('Failed to process resume file');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleAutoEmailToggle = async (checked) => {
    if (!selectedResume) return;
    
    setSavingAutoEmail(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/auto-email-application`,
        { auto_email_application: checked },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        auto_email_application: checked
      };
      setResumes(updatedResumes);
      
      setAutoEmailEnabled(checked);
      setError('');
    } catch (err) {
      setError('Failed to update auto email application status');
      // Revert the toggle if the API call failed
      setAutoEmailEnabled(!checked);
    } finally {
      setSavingAutoEmail(false);
    }
  };

  const handleSaveAutoEmailSettings = async () => {
    if (!selectedResume) return;
    
    setSavingAutoEmailSettings(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${selectedResume._id}/auto-email-settings`,
        { 
          app_password: appPassword,
          cover_letter_title: coverLetterTitle,
          cover_letter_content: coverLetterContent
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Update the local resume data
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = {
        ...updatedResumes[selectedResumeIndex],
        app_password: appPassword,
        cover_letter_title: coverLetterTitle,
        cover_letter_content: coverLetterContent
      };
      setResumes(updatedResumes);
      
      setError('');
    } catch (err) {
      setError('Failed to save auto email settings');
    } finally {
      setSavingAutoEmailSettings(false);
    }
  };

  useEffect(() => {
    const currentResume = resumes[selectedResumeIndex];
    if (currentResume) {
      setAutoEmailEnabled(!!currentResume.auto_email_application);
      setAppPassword(currentResume.app_password || '');
      setCoverLetterTitle(currentResume.cover_letter_title || '');
      setCoverLetterContent(currentResume.cover_letter_content || '');
    }
  }, [selectedResumeIndex, resumes]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedResume = resumes[selectedResumeIndex] || null;
  const displayedResume = isEditing ? editedResume : selectedResume;

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2, maxWidth: 1200, mx: 'auto' }}>
      {/* Left sidebar with resume list */}
      <Paper sx={{ width: 300, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Resumes</Typography>
          <Button
            variant="contained"
            size="small"
            onClick={createNewResume}
          >
            <AddIcon />Add
          </Button>
        </Box>
        {resumes.length === 0 ? (
          <Typography align="center" sx={{ mt: 2 }}>
            No resumes found. Click 'Add' to create one.
          </Typography>
        ) : (
          <List>
            {resumes.map((resume, index) => (
              <ListItemButton 
                key={index}
                selected={index === selectedResumeIndex}
                onClick={() => setSelectedResumeIndex(index)}
              >
                <ListItemText primary={resume.personal_info?.name || 'Untitled Resume'} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {/* Right side with resume details */}
      {displayedResume && resumes.length > 0 && (
        <Paper sx={{ flex: 1, p: 4 }}>
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
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}/resumefiles/${selectedResume.path}`, '_blank')}
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
                  onClick={() => handleDeleteClick(selectedResume._id, selectedResumeIndex)}
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
                  style={{ display: 'none' }}
                  id="resume-file-input"
                />
                <label htmlFor="resume-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={isAnalyzing ? <CircularProgress size={20} /> : <AddIcon />}
                    sx={{ mr: 1 }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing Resume...' : (fileToUpload ? fileToUpload.name : 'Upload Resume File')}
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
                  onChange={(e) => handleFieldChange('personal_info', 'name', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Title"
                  value={displayedResume.personal_info.title}
                  onChange={(e) => handleFieldChange('personal_info', 'title', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={displayedResume.personal_info.email}
                  onChange={(e) => handleFieldChange('personal_info', 'email', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={displayedResume.personal_info.phone_number}
                  onChange={(e) => handleFieldChange('personal_info', 'phone_number', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Location"
                  value={displayedResume.personal_info.location}
                  onChange={(e) => handleFieldChange('personal_info', 'location', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={displayedResume.personal_info.linkedin}
                  onChange={(e) => handleFieldChange('personal_info', 'linkedin', e.target.value)}
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
                <Typography variant="body1">{displayedResume.personal_info.email}</Typography>
                <Typography variant="body1">{displayedResume.personal_info.phone_number}</Typography>
                <Typography variant="body1">{displayedResume.personal_info.location}</Typography>
                <Typography variant="body1">{displayedResume.personal_info.linkedin}</Typography>
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
                onChange={(e) => handleFieldChange('profile', '', e.target.value)}
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
                    <Box sx={{ width: '100%' }}>
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
                        onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Position"
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(exp.id, 'position', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Duration"
                        value={exp.duration}
                        onChange={(e) => handleExperienceChange(exp.id, 'duration', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={Infinity}
                        label="Description"
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
                      />
                    </Box>
                  ) : (
                    <ListItemText
                      primary={`${exp.position} at ${exp.company}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {exp.duration}
                          </Typography>
                          <br />
                          {exp.description.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
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
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Year"
                        value={edu.year}
                        onChange={(e) => handleEducationChange(edu.id, 'year', e.target.value)}
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
            <Box display="flex" alignItems="center" justifyContent="space-between">
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
            <Divider/>
            <List>
              {displayedResume.skillset.map((skill) => (
                <ListItem key={skill.id}>
                  {isEditing ? (
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" gap={2}>
                        <TextField
                          label="Category"
                          value={skill.category}
                          onChange={(e) => handleSkillChange(skill.id, 'category', e.target.value)}
                          sx={{ width: '30%' }}
                        />
                        <TextField
                          label="Skills (comma-separated)"
                          value={skill.skills}
                          onChange={(e) => handleSkillChange(skill.id, 'skills', e.target.value)}
                          sx={{ width: '70%' }}
                        />
                        <IconButton 
                          onClick={() => handleRemoveSkill(skill.id)}
                          color="error"
                          size="small"
                          sx={{ height: '100%', alignSelf: 'center' }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        {skill.category}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skill.skills && skill.skills.split(', ').map((item, index) => (
                          <Typography
                            key={index}
                            component="span"
                            sx={{
                              display: 'inline-block',
                              bgcolor: 'primary.main',
                              color: 'white',
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
                value={displayedResume.additional_info || ''}
                onChange={(e) => handleFieldChange('additional_info', '', e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Add any additional information, certifications, awards, or other relevant details"
              />
            ) : (
              displayedResume.additional_info && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {displayedResume.additional_info.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
              )
            )}
          </Box>

          {/* Automatic Email Applications Section */}
          <Box mb={4}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Email Settings
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                  <TextField
                    type="password"
                    label="App Password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Enter your app password"
                    sx={{ flex: 1 }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 1 }}>
                  Can be acquired from <a style={{color: 'cyan', textDecoration: 'underline'}} href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/apppasswords</a>
                </Typography>

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

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveAutoEmailSettings}
                    disabled={savingAutoEmailSettings}
                    startIcon={savingAutoEmailSettings ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {savingAutoEmailSettings ? 'Saving...' : 'Save All Settings'}
                  </Button>
                </Box>
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
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Customized Resumes
                </Typography>
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
            Are you sure you want to delete this resume? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resume; 
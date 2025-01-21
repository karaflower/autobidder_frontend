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
  DialogContentText
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import Cookies from 'js-cookie';
const Resume = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeIndex, setSelectedResumeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);

  useEffect(() => {
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
              skillset: skillEntries
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

    fetchResumes();
  }, []);

  const handleSave = async () => {
    if (!editedResume) return;
    
    try {
      const formattedResume = {
        owner: editedResume.owner,
        content: {
          personal_info: editedResume.personal_info,
          profile: editedResume.profile,
          education: editedResume.education,
          experience: editedResume.experience,
          skillset: editedResume.skillset
        }
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/resumes/${editedResume._id}`,
        formattedResume
      );
      
      const updatedResumes = [...resumes];
      updatedResumes[selectedResumeIndex] = editedResume;
      setResumes(updatedResumes);
      setIsEditing(false);
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
      owner: Cookies.get('userid'),
      content: {
        personal_info: {
          name: 'John Doe',
          title: 'Blockchain and Fullstack Developer',
          email: '',
          phone_number: '',
          location: '',
        },
        profile: '',
        education: [{
          id: 1,
          institution: '',
          degree: "Bachelor's Degree of Computer Science",
          year: ''
        }],
        experience: [{
          id: 1,
          company: '',
          position: '',
          duration: '',
          description: ''
        }],
        skillset: [
          { category: 'Languages', skills: '' },
          { category: 'Cloud Services', skills: '' },
          { category: 'Databases', skills: '' },
          { category: 'Web Development', skills: '' },
          { category: 'Web3/Blockchain Development', skills: '' }
        ]
      }
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/resumes`,
        emptyResume
      );
      
      const newResume = {
        _id: response.data._id,
        owner: emptyResume.owner,
        ...emptyResume.content,
        skills: emptyResume.content.skillset
      };
      
      setResumes([...resumes, newResume]);
      setSelectedResumeIndex(resumes.length);
      setIsEditing(true);
      setEditedResume(newResume);
    } catch (err) {
      setError('Failed to create new resume');
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedResume = resumes[selectedResumeIndex];
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
        {error ? (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : (
          <List>
            {resumes.map((resume, index) => (
              <ListItemButton 
                key={index}
                selected={index === selectedResumeIndex}
                onClick={() => setSelectedResumeIndex(index)}
              >
                <ListItemText primary={resume.personal_info.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {/* Right side with resume details */}
      {resumes.length > 0 && (
        <Paper sx={{ flex: 1, p: 4 }}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            {!isEditing ? (
              <>
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
                  onClick={() => setIsEditing(false)}
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
                />
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  {displayedResume.personal_info.name}
                </Typography>
                <Typography variant="body1">{displayedResume.personal_info.email}</Typography>
                <Typography variant="body1">{displayedResume.personal_info.phone_number}</Typography>
                <Typography variant="body1">{displayedResume.personal_info.location}</Typography>
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
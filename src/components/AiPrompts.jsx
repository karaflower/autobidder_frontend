import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Slider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AiPrompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTemperature, setEditTemperature] = useState(1);
  const [deletePromptId, setDeletePromptId] = useState(null);
  const [collapsedPrompts, setCollapsedPrompts] = useState({});

  const modelOptions = ['gpt-4o-mini', 'gpt-4o', 'gpt-4'];

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/ai-prompts`);
      setPrompts(response.data);
    } catch (err) {
      toast.error('Failed to fetch prompts');
      console.error('Failed to fetch prompts:', err);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    const initialCollapsedState = prompts.reduce((acc, prompt) => {
      if (prompt.customized_contents) {
        acc[prompt._id] = true;
      }
      return acc;
    }, {});
    setCollapsedPrompts(initialCollapsedState);
  }, [prompts]);

  const handleEdit = (prompt) => {
    setEditingId(prompt._id);
    if (prompt.customized_contents) {
      setEditContent(prompt.customized_contents.content);
      setEditModel(prompt.customized_contents.model);
      setEditTemperature(prompt.customized_contents.temperature);
    } else {
      setEditContent(prompt.content);
      setEditModel(prompt.model);
      setEditTemperature(prompt.temperature);
    }
  };

  const handleSave = async (promptId) => {
    try {
      if (editContent.trim() === '') {
        await handleDelete(promptId);
        return;
      }

      const method = prompts.find(p => p._id === promptId).customized_contents ? 'put' : 'post';
      const url = `${process.env.REACT_APP_API_URL}/ai-prompts${method === 'put' ? `/${promptId}` : ''}`;
      
      await axios[method](url, {
        _id: promptId,
        content: editContent,
        model: editModel,
        temperature: editTemperature
      });

      await fetchPrompts();
      setEditingId(null);
      setEditContent('');
      setEditModel('');
      setEditTemperature(1);
      toast.success('Prompt updated successfully');
    } catch (err) {
      toast.error('Failed to update prompt');
      console.error('Failed to update prompt:', err);
    }
  };

  const handleDelete = async (promptId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/ai-prompts/${promptId}`);
      await fetchPrompts();
      setDeletePromptId(null);
      toast.success('Custom prompt deleted successfully');
    } catch (err) {
      toast.error('Failed to delete prompt');
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleDeleteClick = (promptId) => {
    setDeletePromptId(promptId);
  };

  const toggleCollapse = (promptId) => {
    setCollapsedPrompts(prev => ({
      ...prev,
      [promptId]: !prev[promptId]
    }));
  };

  return (
    <Grid container spacing={2}>
      <ToastContainer />
      <Grid item xs={12}>
        {prompts.map((prompt) => (
          <Card key={prompt._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {prompt.description}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Base Prompt
                  {prompt.customized_contents && (
                    <IconButton 
                      size="small" 
                      onClick={() => toggleCollapse(prompt._id)}
                      sx={{ ml: 1 }}
                    >
                      {collapsedPrompts[prompt._id] ? 
                        <ExpandMoreIcon /> : 
                        <ExpandLessIcon />
                      }
                    </IconButton>
                  )}
                </Typography>
                {(!prompt.customized_contents || !collapsedPrompts[prompt._id]) && (
                  <>
                    <Typography variant="body1" sx={{ ml: 2, whiteSpace: 'pre-wrap' }}>
                      {prompt.content}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                      Model: {prompt.model} | Temperature: {prompt.temperature}
                    </Typography>
                  </>
                )}
              </Box>

              <Box>
                <Typography variant="h6" color="secondary">
                  Custom Prompt
                  {editingId !== prompt._id && (
                    <>
                        <IconButton 
                        size="small" 
                        onClick={() => handleEdit(prompt)}
                        sx={{ ml: 1 }}
                        >
                        <EditIcon />
                        </IconButton>
                        {prompt.customized_contents && (
                            <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(prompt._id)}
                            color="error"
                            >
                            <DeleteIcon />
                            </IconButton>
                        )}
                    </>
                  )}
                </Typography>
                {editingId === prompt._id ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      maxRows={Infinity}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      select
                      label="Model"
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      sx={{ mb: 2, mr: 2, minWidth: 200 }}
                    >
                      {modelOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Box sx={{ width: 300 }}>
                      <Typography>Temperature: {editTemperature}</Typography>
                      <Slider
                        value={editTemperature}
                        onChange={(e, newValue) => setEditTemperature(newValue)}
                        min={0}
                        max={2}
                        step={0.1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={() => handleSave(prompt._id)}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {prompt.customized_contents 
                        ? prompt.customized_contents.content 
                        : 'No custom prompt set'}
                    </Typography>
                    {prompt.customized_contents && (
                      <Typography variant="body2" color="textSecondary">
                        Model: {prompt.customized_contents.model} | 
                        Temperature: {prompt.customized_contents.temperature}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Grid>
      <Dialog
        open={deletePromptId !== null}
        onClose={() => setDeletePromptId(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this custom prompt?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePromptId(null)}>Cancel</Button>
          <Button 
            onClick={() => handleDelete(deletePromptId)} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default AiPrompts; 
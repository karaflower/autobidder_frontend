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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AiPrompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deletePromptId, setDeletePromptId] = useState(null);
  const [collapsedPrompts, setCollapsedPrompts] = useState({});

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
      acc[prompt._id] = true;
      return acc;
    }, {});
    setCollapsedPrompts(initialCollapsedState);
  }, [prompts]);

  const handleEdit = (prompt) => {
    setEditingId(prompt._id);
    if (prompt.customized_contents) {
      setEditContent(prompt.customized_contents.content);
    } else {
      setEditContent('');
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
      });

      await fetchPrompts();
      setEditingId(null);
      setEditContent('');
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
                </Typography>
                {!collapsedPrompts[prompt._id] && (
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
                  User Instruction
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
                        : 'No user instruction set'}
                    </Typography>
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
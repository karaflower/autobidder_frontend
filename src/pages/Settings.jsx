import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user } = useAuth();
  console.log(user);
  const [apiKeys, setApiKeys] = useState({
    serper_api_key: "",
    openai_api_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [teamlessUsers, setTeamlessUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [teamName, setTeamName] = useState('');

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api-keys`);
      if (response.data) {
        setApiKeys(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      if (user.role === 'lead') {
        const [teamlessRes, teamMembersRes, teamRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/teams/teamless`),
          axios.get(`${process.env.REACT_APP_API_URL}/teams/my-team`),
          axios.get(`${process.env.REACT_APP_API_URL}/teams/all`),
        ]);
        setTeamlessUsers(teamlessRes.data);
        setTeamMembers(teamMembersRes.data);
        setTeamName(teamRes.data.find(team => team._id === user.team).name || "");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch team data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api-keys`, apiKeys);
      toast.success("API keys updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update API keys");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your API keys?")) return;

    setLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api-keys`);
      setApiKeys({
        serper_api_key: "",
        openai_api_key: "",
      });
      toast.success("API keys deleted successfully");
    } catch (error) {
      toast.error("Failed to delete API keys");
    }
    setLoading(false);
  };

  const handleAddMember = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/teams/add-member`, {
        userId: selectedUser,
        teamId: user.team
      });
      setSelectedUser('');
      fetchTeamData();
      toast.success("Team member added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add team member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/teams/remove-member`, {
        memberId
      });
      fetchTeamData();
      toast.success("Team member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove team member");
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/change-role/${memberId}`, {
        newRole
      });
      fetchTeamData();
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    }
    setLoading(false);
  };

  return (
    <Grid container justifyContent="center" spacing={2}>
      <Grid item xs={12} md={8} lg={6}>
        {user.role === 'lead' && (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  API Keys Management
                </Typography>

                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Serper API Key"
                    fullWidth
                    margin="normal"
                    value={apiKeys.serper_api_key}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        serper_api_key: e.target.value,
                      }))
                    }
                  />

                  <TextField
                    label="OpenAI API Key"
                    fullWidth
                    margin="normal"
                    value={apiKeys.openai_api_key}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        openai_api_key: e.target.value,
                      }))
                    }
                  />

                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save API Keys"}
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Delete API Keys
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Team Management ({teamName})
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Select
                    fullWidth
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select user to add
                    </MenuItem>
                    {teamlessUsers.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    variant="contained"
                    onClick={handleAddMember}
                    disabled={!selectedUser}
                    sx={{ mt: 1 }}
                  >
                    Add to Team
                  </Button>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Team Members
                </Typography>
                <List>
                  {teamMembers
                    .filter(member => member._id !== user._id && member.role === 'member')
                    .map((member) => (
                      <ListItem key={member._id}>
                        <ListItemText 
                          primary={member.name} 
                          secondary={`Role: ${member.role}`} 
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleChangeRole(member._id, 'bidder')}
                            sx={{ mr: 1 }}
                          >
                            Make Bidder
                          </Button>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>

                <Box sx={{ my: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Bidders
                  </Typography>
                </Box>

                <List>
                  {teamMembers
                    .filter(member => member._id !== user._id && member.role === 'bidder')
                    .map((member) => (
                      <ListItem key={member._id}>
                        <ListItemText 
                          primary={member.name} 
                          secondary={`Role: ${member.role}`} 
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleChangeRole(member._id, 'member')}
                            sx={{ mr: 1 }}
                          >
                            Make Member
                          </Button>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </>
        )}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Change Password
            </Typography>
            <form onSubmit={handlePasswordChange}>
              <TextField
                type="password"
                label="Current Password"
                fullWidth
                margin="normal"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
              <TextField
                type="password"
                label="New Password"
                fullWidth
                margin="normal"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
              <TextField
                type="password"
                label="Confirm New Password"
                fullWidth
                margin="normal"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Chrome Extension
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Download and install our Chrome extension to enhance your job application experience.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href={`${process.env.REACT_APP_API_URL}/bidext/bidext.zip`}
              download
            >
              Download Extension
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Settings; 
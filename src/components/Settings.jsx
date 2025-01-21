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
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import axios from "axios";

const Settings = () => {
  const [apiKeys, setApiKeys] = useState({
    serper_api_key: "",
    openai_api_key: "",
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friends, setFriends] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/friends/all`);
      setUsers(response.data);
    } catch (error) {
      setStatus({
        message: "Failed to fetch users",
        type: "error",
      });
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/friends`);
      setFriends(response.data);
    } catch (error) {
        console.log(error);
    }
  };
  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api-keys`);
      if (response.data) {
        setApiKeys(response.data);
      } else if (response.message) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    fetchUsers();
    fetchFriends();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api-keys`, apiKeys);
      setStatus({
        message: "API keys updated successfully",
        type: "success",
      });
    } catch (error) {
      setStatus({
        message: error.response?.data?.message || "Failed to update API keys",
        type: "error",
      });
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
      setStatus({
        message: "API keys deleted successfully",
        type: "success",
      });
    } catch (error) {
      setStatus({
        message: "Failed to delete API keys",
        type: "error",
      });
    }
    setLoading(false);
  };


  const handleAddFriend = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/friends/${selectedUser.name}`);
      setStatus({
        message: "Friend added successfully",
        type: "success",
      });
      fetchFriends();
      setSelectedUser(null);
    } catch (error) {
      setStatus({
        message: error.response?.data?.message || "Failed to add friend",
        type: "error",
      });
    }
  };

  const handleRemoveFriend = async (friendName) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/friends/${friendName}`);
      setStatus({
        message: "Friend removed successfully",
        type: "success",
      });
      fetchFriends();
    } catch (error) {
      setStatus({
        message: error.response?.data?.message || "Failed to remove friend",
        type: "error",
      });
    }
  };

  return (
    <Grid container justifyContent="center" spacing={2}>
      <Grid item xs={12} md={8} lg={6}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              API Keys Management
            </Typography>

            {status.message && (
              <Alert
                severity={status.type}
                sx={{ mb: 2 }}
                onClose={() => setStatus({ message: "", type: "" })}
              >
                {status.message}
              </Alert>
            )}

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

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Friends Management
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.name}
                value={selectedUser}
                onChange={(event, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Add Friend" fullWidth />
                )}
              />
              <Button
                variant="contained"
                onClick={handleAddFriend}
                disabled={!selectedUser}
                sx={{ mt: 1 }}
              >
                Add Friend
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List>
              {friends.map((friend) => (
                <ListItem key={friend._id}>
                  <ListItemText primary={friend.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFriend(friend.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Settings; 
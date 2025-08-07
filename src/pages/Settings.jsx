import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user } = useAuth();
  console.log(user);
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [teamlessUsers, setTeamlessUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedMaster, setSelectedMaster] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showMasterDialog, setShowMasterDialog] = useState(false);
  const [pendingBidderId, setPendingBidderId] = useState(null);
  const [isEditingExistingBidder, setIsEditingExistingBidder] = useState(false);

  useEffect(() => {
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
      if (newRole === 'bidder') {
        // Show master selection dialog
        setPendingBidderId(memberId);
        setIsEditingExistingBidder(false);
        setShowMasterDialog(true);
        return;
      }
      
      await axios.put(`${process.env.REACT_APP_API_URL}/users/change-role/${memberId}`, {
        newRole
      });
      fetchTeamData();
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleSetMaster = async (bidderId) => {
    setPendingBidderId(bidderId);
    setIsEditingExistingBidder(true);
    setShowMasterDialog(true);
  };

  const handleMakeBidder = async () => {
    if (!selectedMaster) {
      toast.error("Please select a master");
      return;
    }
    
    try {
      if (isEditingExistingBidder) {
        // Update existing bidder's master
        await axios.put(`${process.env.REACT_APP_API_URL}/users/${pendingBidderId}/set-master`, {
          masterId: selectedMaster
        });
        toast.success("Master updated successfully");
      } else {
        // Make new bidder
        await axios.put(`${process.env.REACT_APP_API_URL}/users/change-role/${pendingBidderId}`, {
          newRole: 'bidder',
          masterId: selectedMaster
        });
        toast.success("User made bidder successfully");
      }
      
      setShowMasterDialog(false);
      setSelectedMaster('');
      setPendingBidderId(null);
      setIsEditingExistingBidder(false);
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bidder");
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
          <Card sx={{ mb: 2 }}>
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
                  .map((member) => {
                    const master = teamMembers.find(m => m._id === member.master);
                    return (
                      <ListItem key={member._id}>
                        <ListItemText 
                          primary={member.name} 
                          secondary={
                            <>
                              Role: {member.role}
                              {master && <br />}
                              {master && `Master: ${master.name}`}
                              {!master && <br />}
                              {!master && 'No master assigned'}
                            </>
                          } 
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSetMaster(member._id)}
                            sx={{ mr: 1 }}
                          >
                            Set Master
                          </Button>
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
                    );
                  })}
              </List>
            </CardContent>
          </Card>
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
      </Grid>

      {/* Master Selection Dialog */}
      <Dialog open={showMasterDialog} onClose={() => setShowMasterDialog(false)}>
        <DialogTitle>
          {isEditingExistingBidder ? 'Set Master for Bidder' : 'Select Master for Bidder'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {isEditingExistingBidder 
              ? 'Select a team member who will be the master for this bidder. The bidder will use the master\'s resumes.'
              : 'Select a team member who will be the master for this bidder. The bidder will use the master\'s resumes.'
            }
          </Typography>
          <Select
            fullWidth
            value={selectedMaster}
            onChange={(e) => setSelectedMaster(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select master
            </MenuItem>
            {teamMembers
              .filter(member => member.role !== 'bidder')
              .map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </MenuItem>
              ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMasterDialog(false)}>Cancel</Button>
          <Button onClick={handleMakeBidder} variant="contained">
            {isEditingExistingBidder ? 'Update Master' : 'Make Bidder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Settings; 
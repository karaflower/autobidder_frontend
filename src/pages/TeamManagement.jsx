import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  ListItemButton,
  Menu,
  MenuItem,
  Select
} from '@mui/material';
import { Edit, Delete, Lock, PersonRemove, PersonAdd, SupervisorAccount, SwapHoriz, MoreVert } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({ name: '', password: '' });
  const [teamlessUsers, setTeamlessUsers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const [showMasterDialog, setShowMasterDialog] = useState(false);
  const [pendingBidderId, setPendingBidderId] = useState(null);
  const [isEditingExistingBidder, setIsEditingExistingBidder] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchTeamlessUsers();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam._id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/all`);
      const sortedTeams = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);
      if (!selectedTeam && sortedTeams.length > 0) {
        setSelectedTeam(sortedTeams[0]);
      }
    } catch (error) {
      toast.error('Error fetching teams');
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/team-members`, {
        params: { teamId }
      });
      setTeamMembers({ ...teamMembers, [teamId]: response.data });
    } catch (error) {
      toast.error('Error fetching team members');
    }
  };

  const fetchTeamlessUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/teamless`);
      setTeamlessUsers(response.data);
    } catch (error) {
      toast.error('Error fetching teamless users');
    }
  };

  const handleDialog = (type, data = null) => {
    setDialogType(type);
    if (type === 'resetPassword') {
      setDialogData({ ...data, password: '' });
    } else {
      setDialogData(data || { name: '', password: '' });
    }
    setDialogOpen(true);
  };

  const handleAddMember = async (user) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/teams/add-member`, {
        teamId: selectedTeam._id,
        userId: user._id
      });
      toast.success('Member added successfully');
      fetchTeamMembers(selectedTeam._id);
      fetchTeamlessUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    try {
      switch (dialogType) {
        case 'addTeam':
          await axios.post(`${process.env.REACT_APP_API_URL}/teams/add-team`, { 
            name: dialogData.name 
          });
          break;
        case 'editTeam':
          await axios.put(
            `${process.env.REACT_APP_API_URL}/teams/update-team/${dialogData._id}`, 
            { name: dialogData.name }
          );
          break;
      }
      toast.success('Operation completed successfully');
      fetchTeams();
      if (selectedTeam && dialogType === 'editTeam' && selectedTeam._id === dialogData._id) {
        setSelectedTeam({ ...selectedTeam, name: dialogData.name });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
    setDialogOpen(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/teams/delete-team/${teamId}`);
        toast.success('Team deleted successfully');
        
        // Fetch updated teams list
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/all`);
        const sortedTeams = response.data.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(sortedTeams);
        
        // If the deleted team was selected, select another team if available
        if (selectedTeam?._id === teamId) {
          if (sortedTeams.length > 0) {
            setSelectedTeam(sortedTeams[0]);
          } else {
            setSelectedTeam(null);
          }
        }
      } catch (error) {
        toast.error('Error deleting team');
      }
    }
  };

  const handleMoveToTeam = async (user, newTeamId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/teams/change-team/${user._id}`,
        { newTeamId }
      );
      toast.success('Team changed successfully');
      fetchTeamMembers(selectedTeam._id);
      fetchTeamlessUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change team');
    }
    setDialogOpen(false);
  };

  const handleSetLead = async (user) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/teams/set-team-lead/${selectedTeam._id}`,
        { userId: user._id }
      );
      toast.success('Team lead set successfully');
      fetchTeamMembers(selectedTeam._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set team lead');
    }
  };

  const handleResetPassword = async (user, newPassword) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/teams/reset-password/${user._id}`,
        { newPassword }
      );
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
    setDialogOpen(false);
  };

  const handleDeleteUser = async (user) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/users/delete-user/${user._id}`);
      toast.success('User deleted successfully');
      fetchTeamlessUsers();
      if (selectedTeam) {
        fetchTeamMembers(selectedTeam._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRemoveFromTeam = async (user) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/teams/change-team/${user._id}`,
        { newTeamId: null }
      );
      toast.success('User removed from team successfully');
      fetchTeamMembers(selectedTeam._id);
      fetchTeamlessUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user from team');
    }
  };

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      if (newRole === 'bidder') {
        // Show master selection dialog
        setPendingBidderId(user._id);
        setIsEditingExistingBidder(false);
        setShowMasterDialog(true);
        return;
      }
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/change-role/${user._id}`,
        { newRole }
      );
      toast.success('Role updated successfully');
      fetchTeamMembers(selectedTeam._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
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
      fetchTeamMembers(selectedTeam._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bidder');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Team Management</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ width: '40%', p: 2 }}>
          <Typography variant="h6" gutterBottom>Teams</Typography>
          <List>
            {teams.map((team) => (
              <ListItem
                key={team._id}
                disablePadding
                selected={selectedTeam?._id === team._id}
              >
                <ListItemButton
                  onClick={() => setSelectedTeam(team)}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "action.selected",
                    },
                  }}
                >
                  <ListItemText primary={team.name} />
                  <Box sx={{ display: 'flex' }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDialog('editTeam', team);
                      }}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team._id);
                      }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleDialog('addTeam')}
                startIcon={<PersonAdd />}
              >
                Add Team
              </Button>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding selected={selectedTeam === null}>
              <ListItemButton
                onClick={() => setSelectedTeam(null)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "action.selected",
                  },
                }}
              >
                <ListItemText primary="Teamless" />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ width: '60%', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedTeam ? `${selectedTeam.name} Members` : 'Teamless Users'}
          </Typography>
          
          {selectedTeam ? (
            <List>
              {/* Display Team Lead and Members */}
              {teamMembers[selectedTeam._id]
                ?.filter(member => member.role !== 'bidder')
                .map((member) => (
                <ListItem key={member._id}>
                  <ListItemText 
                    primary={member.name} 
                    secondary={
                      <>
                        {member.email}
                        <br />
                        Role: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </>
                    } 
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={(e) => handleMenuOpen(e, member)}
                    >
                      <MoreVert />
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}

              {/* Divider and Bidders Section */}
              {teamMembers[selectedTeam._id]?.some(member => member.role === 'bidder') && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ ml: 2, mb: 1 }}>Bidders</Typography>
                  {teamMembers[selectedTeam._id]
                    ?.filter(member => member.role === 'bidder')
                    .map((member) => {
                      const master = teamMembers[selectedTeam._id]?.find(m => m._id === member.master);
                      return (
                        <ListItem key={member._id}>
                          <ListItemText 
                            primary={member.name} 
                            secondary={
                              <>
                                {member.email}
                                <br />
                                Role: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
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
                              size="small"
                              onClick={(e) => handleMenuOpen(e, member)}
                            >
                              <MoreVert />
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                </>
              )}

              <ListItem>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleDialog('addMember')}
                  startIcon={<PersonAdd />}
                >
                  Add Member
                </Button>
              </ListItem>
            </List>
          ) : (
            <List>
              {teamlessUsers.map((user) => (
                <ListItem key={user._id}>
                  <ListItemText 
                    primary={user.name} 
                    secondary={user.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                          handleDeleteUser(user);
                        }
                      }}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedMember && (
          <>
            <MenuItem 
              onClick={(event) => {
                event.stopPropagation();
                setRoleAnchorEl(event.currentTarget);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupervisorAccount />
                <Typography>Change Role</Typography>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleDialog('changeTeam', { user: selectedMember });
                handleMenuClose();
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHoriz />
                <Typography>Change Team</Typography>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleDialog('resetPassword', selectedMember);
                handleMenuClose();
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock />
                <Typography>Reset Password</Typography>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedMember.name}? This action cannot be undone.`)) {
                  handleDeleteUser(selectedMember);
                }
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Delete />
                <Typography>Delete User</Typography>
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>

      <Menu
        anchorEl={roleAnchorEl}
        open={Boolean(roleAnchorEl)}
        onClose={() => setRoleAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem 
          onClick={() => {
            handleChangeRole(selectedMember, 'lead');
            setRoleAnchorEl(null);
            handleMenuClose();
          }}
        >
          Team Lead
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleChangeRole(selectedMember, 'member');
            setRoleAnchorEl(null);
            handleMenuClose();
          }}
        >
          Member
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleChangeRole(selectedMember, 'bidder');
            setRoleAnchorEl(null);
            handleMenuClose();
          }}
        >
          Bidder
        </MenuItem>
      </Menu>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth={dialogType === 'addMember' ? 'sm' : 'xs'}
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'addTeam' ? 'Add Team' :
           dialogType === 'editTeam' ? 'Edit Team' :
           dialogType === 'addMember' ? 'Add Team Member' :
           dialogType === 'changeTeam' ? 'Change Team' :
           'Reset Password'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'addMember' ? (
            <List>
              {teamlessUsers.length > 0 ? (
                teamlessUsers.map((user) => (
                  <ListItem key={user._id}>
                    <ListItemText 
                      primary={user.name}
                      secondary={user.email}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddMember(user)}
                    >
                      Add to Team
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No users available to add" />
                </ListItem>
              )}
            </List>
          ) : dialogType === 'changeTeam' ? (
            <List>
              <ListItem>
                <ListItemText
                  primary={`Change team for ${dialogData.user.name}`}
                  secondary="Select a new team or remove from current team"
                />
              </ListItem>
              <ListItem>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => handleMoveToTeam(dialogData.user, null)}
                >
                  Remove from Current Team
                </Button>
              </ListItem>
              <Divider sx={{ my: 2 }} />
              {teams
                .filter(team => team._id !== selectedTeam._id)
                .map((team) => (
                  <ListItem key={team._id}>
                    <ListItemText primary={team.name} />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleMoveToTeam(dialogData.user, team._id)}
                    >
                      Move to Team
                    </Button>
                  </ListItem>
              ))}
            </List>
          ) : dialogType === 'resetPassword' ? (
            <>
              <TextField
                type="password"
                margin="dense"
                label="New Password"
                fullWidth
                value={dialogData.password}
                onChange={(e) => setDialogData({ ...dialogData, password: e.target.value })}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleResetPassword(dialogData, dialogData.password)}
                >
                  Reset Password
                </Button>
              </Box>
            </>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="Team Name"
              fullWidth
              value={dialogData.name}
              onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          {(dialogType === 'addTeam' || dialogType === 'editTeam') && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogType === 'addTeam' ? 'Add' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
            {teamMembers[selectedTeam?._id]
              ?.filter(member => member.role !== 'bidder')
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
    </Container>
  );
};

export default TeamManagement;

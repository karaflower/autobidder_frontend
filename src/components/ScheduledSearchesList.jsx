import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Box,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  // Create a UTC date object
  const date = new Date(Date.UTC(2025, 0, 1, parseInt(hours), parseInt(minutes)));
  // Format in UTC/GMT
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

const formatFrequency = (schedule) => {
  switch (schedule.frequency) {
    case 'hourly':
      return `Every ${schedule.hourInterval} hour${schedule.hourInterval > 1 ? 's' : ''}`;
    case 'daily':
      return 'Daily';
    case 'weekly':
      const days = schedule.daysOfWeek
        .map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
        .join(', ');
      return `Weekly (${days})`;
    case 'monthly':
      return `Monthly (Day ${schedule.dayOfMonth})`;
    default:
      return schedule.frequency;
  }
};

const getElapsedTime = (startTime) => {
  if (!startTime) return null;
  
  const start = new Date(startTime);
  const now = new Date();
  const elapsed = now - start;
  
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const ScheduledSearchesList = ({
  scheduledSearches,
  onEdit,
  onDelete,
}) => {
  return (
    <List>
      {scheduledSearches.map((scheduled) => (
        <ListItem
          key={scheduled._id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">
                  {scheduled.settings.categoryType === 'all' 
                    ? 'All Categories' 
                    : `Categories: ${scheduled.settings.categories.join(', ')}`}
                </Typography>
                {/* <Chip
                  size="small"
                  label={scheduled.isActive ? 'Active' : 'Inactive'}
                  color={scheduled.isActive ? 'success' : 'default'}
                /> */}
                <Chip
                  size="small"
                  label={scheduled.state === 'running' ? 'Running' : 'Scheduled'}
                  color={scheduled.state === 'running' ? 'primary' : 'default'}
                  icon={scheduled.state === 'running' ? <CircularProgress size={16} /> : null}
                />
              </Box>
            }
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {formatFrequency(scheduled.schedule)} at {formatTime(scheduled.schedule.time)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next run: {new Date(scheduled.nextRun).toLocaleString([], {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} UTC
                </Typography>
                {scheduled.state === 'running' && scheduled.progress && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={scheduled.progress.percentage} 
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {scheduled.progress.percentage}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Processing {scheduled.progress.current} of {scheduled.progress.total} queries
                      </Typography>
                      {scheduled.startTime && (
                        <Typography variant="caption" color="text.secondary">
                          Elapsed: {getElapsedTime(scheduled.startTime)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </>
            }
          />
          <ListItemSecondaryAction>
            <Tooltip title="Edit Schedule">
              <IconButton edge="end" onClick={() => onEdit(scheduled)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Schedule">
              <IconButton edge="end" onClick={() => onDelete(scheduled._id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default ScheduledSearchesList;

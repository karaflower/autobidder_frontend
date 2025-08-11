import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
  OutlinedInput,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOUR_INTERVALS = [
  { value: 1, label: 'Every 1 hour' },
  { value: 2, label: 'Every 2 hours' },
  { value: 3, label: 'Every 3 hours' },
  { value: 4, label: 'Every 4 hours' },
  { value: 6, label: 'Every 6 hours' },
  { value: 8, label: 'Every 8 hours' },
  { value: 12, label: 'Every 12 hours' },
];

const generateTimeFromTeamName = (teamName) => {
  const sum = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hours = sum % 24;
  return `${hours.toString().padStart(2, '0')}:00`;  // Add seconds to the time string
};

const ScheduledSearchDialog = ({
  open,
  onClose,
  onSave,
  initialData = null,
  categories = [],
  teamName = 'default',
}) => {
  console.log(initialData);
  const [schedule, setSchedule] = useState({
    frequency: initialData?.schedule?.frequency || 'daily',
    time: initialData?.schedule?.time || generateTimeFromTeamName(teamName),
    daysOfWeek: initialData?.schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    dayOfMonth: initialData?.schedule?.dayOfMonth || 1,
    hourInterval: initialData?.schedule?.hourInterval || 1,
  });

  const [settings, setSettings] = useState({
    timeUnits: initialData?.settings?.timeUnits || ['d'], // Changed default from ['a', 'd', 'w', 'm', 'y'] to ['d']
    filterClosed: initialData?.settings?.filterClosed ?? true,
    categories: initialData?.settings?.categories || ["all"],
    categoryType: initialData?.settings?.categoryType || 
      (initialData?.settings?.categories?.includes('all') ? 'all' : 'specific')
  });

  // Add useEffect to update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setSchedule({
        frequency: initialData.schedule?.frequency || 'daily',
        time: initialData.schedule?.time || generateTimeFromTeamName(teamName),
        daysOfWeek: initialData.schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        dayOfMonth: initialData.schedule?.dayOfMonth || 1,
        hourInterval: initialData.schedule?.hourInterval || 1,
      });

      setSettings({
        timeUnits: initialData.settings?.timeUnits || ['d'], // Changed default
        filterClosed: initialData.settings?.filterClosed ?? true,
        categories: initialData.settings?.categories || ["all"],
        categoryType: initialData.settings?.categoryType || 
          (initialData.settings?.categories?.includes('all') ? 'all' : 'specific')
      });
    }
  }, [initialData, teamName]);

  const handleSave = () => {
    onSave({
      schedule,
      settings,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Scheduled Search' : 'Schedule Search'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={schedule.frequency}
                  onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {schedule.frequency === 'hourly' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Interval</InputLabel>
                  <Select
                    value={schedule.hourInterval}
                    onChange={(e) => setSchedule({ ...schedule, hourInterval: e.target.value })}
                  >
                    {HOUR_INTERVALS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {schedule.frequency !== 'hourly' && (
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    size="small"
                    label="Time (UTC)"
                    value={schedule.time ? new Date(`2025-01-01T${schedule.time}:00Z`) : new Date()}
                    onChange={(newValue) => {
                      const timeString = newValue?.toISOString().slice(11, 16);
                      setSchedule({ ...schedule, time: timeString });
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            )}

            {schedule.frequency === 'weekly' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Days of Week
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={schedule.daysOfWeek.includes(day.value)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...schedule.daysOfWeek, day.value]
                              : schedule.daysOfWeek.filter((d) => d !== day.value);
                            setSchedule({ ...schedule, daysOfWeek: newDays });
                          }}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {schedule.frequency === 'monthly' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Day of Month"
                  value={schedule.dayOfMonth}
                  onChange={(e) => {
                    const value = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                    setSchedule({ ...schedule, dayOfMonth: value });
                  }}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Search Settings
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  multiple
                  value={settings.timeUnits}
                  onChange={(e) => setSettings({ ...settings, timeUnits: e.target.value })}
                  input={<OutlinedInput label="Time Range" />}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return 'Select time ranges';
                    }
                    return selected.map(unit => {
                      const labels = {
                        'd': 'Past 24 Hours',
                        'w': 'Past Week', 
                        'm': 'Past Month',
                        'y': 'Past Year',
                        '': 'Any Time'
                      };
                      return labels[unit] || unit;
                    }).join(', ');
                  }}
                >
                  <MenuItem value="d">Past 24 Hours</MenuItem>
                  <MenuItem value="w">Past Week</MenuItem>
                  <MenuItem value="m">Past Month</MenuItem>
                  <MenuItem value="y">Past Year</MenuItem>
                  <MenuItem value="">Any Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.filterClosed}
                    onChange={(e) => setSettings({ ...settings, filterClosed: e.target.checked })}
                  />
                }
                label="Filter out closed positions"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={settings.categories}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const lastSelected = newValue[newValue.length - 1];
                    
                    if (lastSelected === 'all') {
                      setSettings({ 
                        ...settings, 
                        categories: ['all'],
                        categoryType: 'all' // Set categoryType
                      });
                    } else {
                      const filteredValue = newValue.filter(cat => cat !== 'all');
                      setSettings({ 
                        ...settings, 
                        categories: filteredValue,
                        categoryType: 'specific' // Set categoryType
                      });
                    }
                  }}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => {
                    if (selected.includes('all')) {
                      return 'All Categories';
                    }
                    return selected.join(', ');
                  }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {initialData ? 'Update' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduledSearchDialog;

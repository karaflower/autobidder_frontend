import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const TermsAndPrivacy = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        py: '[32px]'
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ p: '[32px]' }}>
          <Typography variant="h4" gutterBottom>
            Terms of Service & Privacy Policy
          </Typography>
          
          <Typography variant="h5" sx={{ mt: '[24px]', mb: '[16px]' }}>
            1. Terms of Service
          </Typography>
          
          <Typography variant="body1" paragraph>
            By accessing and using this application, you agree to comply with and be bound by these terms and conditions.
          </Typography>

          <Typography variant="body1" paragraph>
            The service is provided "as is" without any warranties, expressed or implied. We do not guarantee that the service will be uninterrupted or error-free.
          </Typography>

          <Typography variant="h6" sx={{ mt: '[16px]', mb: '[8px]' }}>
            1.1 User Accounts
          </Typography>
          
          <Typography variant="body1" paragraph>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Typography>

          <Typography variant="h5" sx={{ mt: '[24px]', mb: '[16px]' }}>
            2. Privacy Policy
          </Typography>

          <Typography variant="body1" paragraph>
            We take your privacy seriously and are committed to protecting your personal information.
          </Typography>

          <Typography variant="h6" sx={{ mt: '[16px]', mb: '[8px]' }}>
            2.1 Information Collection
          </Typography>

          <Typography variant="body1" paragraph>
            We collect information that you provide directly to us, including but not limited to:
          </Typography>

          <ul>
            <Typography component="li" variant="body1">Account information (username, password)</Typography>
            <Typography component="li" variant="body1">Profile information</Typography>
            <Typography component="li" variant="body1">Usage data and analytics</Typography>
          </ul>

          <Typography variant="h6" sx={{ mt: '[16px]', mb: '[8px]' }}>
            2.2 Data Usage
          </Typography>

          <Typography variant="body1" paragraph>
            We use the collected information to:
          </Typography>

          <ul>
            <Typography component="li" variant="body1">Provide and maintain our services</Typography>
            <Typography component="li" variant="body1">Improve user experience</Typography>
            <Typography component="li" variant="body1">Send important notifications about our services</Typography>
          </ul>

          <Typography variant="h6" sx={{ mt: '[16px]', mb: '[8px]' }}>
            2.3 Data Protection
          </Typography>

          <Typography variant="body1" paragraph>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, modification, or destruction.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TermsAndPrivacy; 
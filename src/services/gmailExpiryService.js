import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const gmailExpiryService = {
  // Check Gmail token expiry status for team members
  async checkExpiryStatus() {
    try {
      const response = await axios.get(`${API_URL}/auth/gmail/expiry-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking Gmail expiry status:', error);
      return { expiringTokens: [], totalCount: 0 };
    }
  },

  // Check if any tokens are expiring soon (within 1 day)
  async hasExpiringTokens() {
    const { expiringTokens } = await this.checkExpiryStatus();
    return expiringTokens.length > 0;
  },

  // Get the count of expiring tokens
  async getExpiringTokenCount() {
    const { totalCount } = await this.checkExpiryStatus();
    return totalCount;
  }
};
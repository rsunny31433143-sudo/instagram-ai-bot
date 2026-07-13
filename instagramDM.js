const axios = require('axios');

const GRAPH_API_VERSION = 'v21.0';

/**
 * Sends a text reply DM to a user via the Instagram Graph API.
 * Only works within the 24-hour messaging window from the user's last message.
 */
async function sendTextMessage(recipientId, text) {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.IG_BUSINESS_ACCOUNT_ID}/messages`;

  return axios.post(
    url,
    {
      recipient: { id: recipientId },
      message: { text }
    },
    {
      headers: { Authorization: `Bearer ${process.env.IG_PAGE_ACCESS_TOKEN}` }
    }
  );
}

module.exports = { sendTextMessage };

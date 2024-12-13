const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Slack Bot Token (Replace with your bot token)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Middleware to parse JSON requests
app.use(express.json());

// Slack Event Endpoint
app.post('/slack/events', async (req, res) => {
  const { type, event } = req.body;

  // Respond to Slack's URL verification challenge
  if (type === 'url_verification') {
    return res.send(req.body.challenge);
  }

  // Respond to messages
  if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
    try {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: event.channel,
          text: `You said: "${event.text}"`,
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  }

  // Acknowledge the event
  res.status(200).send();
});

// Default Route
app.get('/', (req, res) => {
  res.send('Slack Bot is running!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

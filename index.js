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

  // Respond to user messages (ignore bot messages)
  if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
    const userMessage = event.text; // User's original message
    const channelId = event.channel; // Channel where the message was sent

    try {
      // Post the response to the same channel
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: `You said: "${userMessage}"`,
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // Log the bot's response
      console.log('Message sent successfully:', response.data);
    } catch (error) {
      // Log detailed error information for debugging
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

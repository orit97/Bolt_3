const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Slack Bot Token (Replace with your bot token)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Mock data for users and their goals
const usersGoals = {
  U12345: {
    name: "John Doe",
    goals: ["Finish project X", "Prepare presentation", "Learn React"],
  },
  U67890: {
    name: "Jane Smith",
    goals: ["Write blog post", "Complete marketing plan"],
  },
};

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
    const userId = event.user; // User ID
    const userMessage = event.text.toLowerCase(); // User's original message in lowercase
    const channelId = event.channel; // Channel where the message was sent

    let botResponse = "I didn't understand your request.";

    // Handle user goals
    if (usersGoals[userId]) {
      if (userMessage.includes("what are my goals")) {
        const userGoals = usersGoals[userId].goals.join(", ");
        botResponse = `Here are your current goals: ${userGoals}`;
      } else if (userMessage.startsWith("add goal ")) {
        const newGoal = userMessage.replace("add goal ", "").trim();
        usersGoals[userId].goals.push(newGoal);
        botResponse = `Added a new goal: "${newGoal}"`;
      } else {
        botResponse =
          "You can ask me: 'What are my goals?' or 'Add goal [goal description]'.";
      }
    } else {
      botResponse =
        "I don't have any goals saved for you. Try adding a goal by saying 'Add goal [goal description]'.";
    }

    try {
      // Post the response to the same channel
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: botResponse,
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

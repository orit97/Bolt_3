const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Slack Bot Token (Replace with your bot token)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Mock data for user goals
const usersGoals = {
  U12345: { name: "John Doe", goals: ["Finish project X", "Learn React"] },
  U67890: { name: "Jane Smith", goals: ["Write a blog post", "Complete marketing plan"] },
};

// Middleware to parse JSON requests
app.use(express.json());

// Function to fetch user info from Slack
async function fetchUserInfo(userId) {
  try {
    const response = await axios.get('https://slack.com/api/users.info', {
      params: { user: userId },
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
    });
    if (response.data.ok) {
      return {
        id: response.data.user.id,
        name: response.data.user.real_name || response.data.user.profile.display_name,
      };
    }
    console.error('Failed to fetch user info:', response.data);
    return null;
  } catch (error) {
    console.error('Error fetching user info:', error.message);
    return null;
  }
}

// Slack Event Endpoint
app.post('/slack/events', async (req, res) => {
  const { type, event } = req.body;

  // Respond to Slack's URL verification challenge
  if (type === 'url_verification') {
    return res.send(req.body.challenge);
  }

  // Handle user messages (ignore bot messages)
  if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
    const userId = event.user; // Slack User ID of the sender
    const userMessage = event.text.toLowerCase(); // User's original message in lowercase
    const channelId = event.channel; // Channel where the message was sent

    let botResponse = "I didn't understand your request.";

    // Handle personal and third-party goals
    if (userMessage.includes("what are")) {
      const mentionedName = userMessage.replace("what are", "").replace("'s goals?", "").trim();

      if (mentionedName) {
        // Check if we already know this user
        const user = Object.values(usersGoals).find(
          (entry) => entry.name.toLowerCase() === mentionedName.toLowerCase()
        );

        if (user) {
          // Respond with their goals
          const goals = user.goals.join(", ");
          botResponse = `${user.name}'s goals are: ${goals}`;
        } else {
          botResponse = `I don't have any goals saved for ${mentionedName}.`;
        }
      } else {
        // If no specific person is mentioned, assume it's the sender
        if (usersGoals[userId]) {
          const userGoals = usersGoals[userId].goals.join(", ");
          botResponse = `Your goals are: ${userGoals}`;
        } else {
          botResponse = "I don't have any goals saved for you. Try adding one by saying 'Add goal [goal description]'.";
        }
      }
    } else if (userMessage.startsWith("add goal ")) {
      const newGoal = userMessage.replace("add goal ", "").trim();
      if (!usersGoals[userId]) {
        const userInfo = await fetchUserInfo(userId);
        if (userInfo) {
          usersGoals[userId] = { name: userInfo.name, goals: [] };
        }
      }
      if (newGoal) {
        usersGoals[userId].goals.push(newGoal);
        botResponse = `Added a new goal: "${newGoal}"`;
      } else {
        botResponse = "Please specify a goal after 'Add goal'. For example: 'Add goal Finish my report'.";
      }
    } else {
      botResponse = "You can ask me: 'What are my goals?' or 'What are [username]'s goals?' or 'Add goal [goal description]'.";
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

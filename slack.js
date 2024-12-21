const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Slack Config
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Verify Slack Signature
function verifySlackRequest(req) {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];

  // Prevent replay attacks
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (timestamp < fiveMinutesAgo) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${req.rawBody}`;
  const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(sigBaseString).digest('hex');
  const calculatedSignature = `v0=${hmac}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

// Handle Slack Events
async function handleEvent(req, res, db) {
  const { type, event } = req.body;

  if (type === 'url_verification') {
    // Respond to Slack's URL verification challenge
    return res.status(200).send(req.body.challenge);
  }

  if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
    const userId = event.user;
    const userMessage = event.text;
    const channelId = event.channel;

    let responseText = `You said: "${userMessage}"`;

    try {
      // Send a message back to Slack
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: responseText,
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }
      );
      res.status(200).send();
    } catch (error) {
      console.error("Error responding to Slack message:", error.message);
      res.status(500).send("Error processing event");
    }
  }
}

// Handle Slash Commands
async function handleCommand(req, res, db) {
  const { command, text, user_id, user_name } = req.body;

  const goalsCollection = db.collection("goals");
  let responseText = "I didn't understand that command.";

  if (text.startsWith("add ")) {
    const newGoal = text.replace("add ", "").trim();
    await goalsCollection.updateOne(
      { userId: user_id },
      { $set: { userName: user_name }, $push: { goals: newGoal } },
      { upsert: true }
    );
    responseText = `Added a new goal: "${newGoal}"`;
  } else if (text === "list") {
    const user = await goalsCollection.findOne({ userId: user_id });
    responseText = user?.goals?.length
      ? `Your goals are: ${user.goals.join(", ")}`
      : "You don't have any goals yet.";
  } else if (text.startsWith("remove ")) {
    const goalToRemove = text.replace("remove ", "").trim();
    await goalsCollection.updateOne(
      { userId: user_id },
      { $pull: { goals: goalToRemove } }
    );
    responseText = `Removed the goal: "${goalToRemove}"`;
  } else {
    responseText = `Available commands:
    - /goals add [goal description]
    - /goals list
    - /goals remove [goal description]`;
  }

  res.json({
    response_type: "ephemeral",
    text: responseText,
  });
}

module.exports = {
  verifySlackRequest,
  handleEvent,
  handleCommand,
};

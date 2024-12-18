const axios = require('axios');
const { addGoal, listGoals, removeGoal } = require('./db');

// Slack Bot Token
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function handleCommand(req, res) {
  const { command, text, user_id, user_name } = req.body;

  let responseText = "I didn't understand that command.";

  if (text.startsWith("add ")) {
    const newGoal = text.replace("add ", "").trim();
    if (newGoal) {
      await addGoal(user_id, user_name, newGoal);
      responseText = `Added a new goal: "${newGoal}"`;
    } else {
      responseText = "Please specify a goal after 'add'. For example: '/goals add Finish my project'.";
    }
  } else if (text === "list") {
    const goals = await listGoals(user_id);
    if (goals.length > 0) {
      responseText = `Your current goals are: ${goals.join(", ")}`;
    } else {
      responseText = "You don't have any goals yet. Add one with '/goals add [goal description]'.";
    }
  } else if (text.startsWith("remove ")) {
    const goalToRemove = text.replace("remove ", "").trim();
    await removeGoal(user_id, goalToRemove);
    responseText = `Removed the goal: "${goalToRemove}"`;
  } else {
    responseText = `Available commands:
    - /goals add [goal description]: Add a new goal
    - /goals list: List your current goals
    - /goals remove [goal description]: Remove a specific goal`;
  }

  res.json({
    response_type: "ephemeral", // Only visible to the user who sent the command
    text: responseText,
  });
}

module.exports = {
  handleCommand,
};

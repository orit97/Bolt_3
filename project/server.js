const express = require('express');
require('dotenv').config();
const { connectToDB } = require('./db');
const { handleCommand } = require('./slack');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/slack/commands', handleCommand);

// Default Route
app.get('/', (req, res) => {
  res.send('Slack Bot with MongoDB is running!');
});

// Start the Server
connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

const express = require('express');
require('dotenv').config();
const { connectToDB } = require('./db');
const { configureRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    // Connect to MongoDB
    const db = await connectToDB();

    app.get('/', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Slack Bot Server</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h1>🚀 Server is Running!</h1>
            <p>Slack Bot API is active and ready to accept requests.</p>
            <p><strong>Endpoints:</strong></p>
            <ul style="list-style-type: none; padding: 0;">
              <li><strong>/slack/commands</strong>: Slack commands</li>
              <li><strong>/slack/events</strong>: Slack events</li>
            </ul>
          </body>
        </html>
      `);
    });

    // Configure Routes
    app.use('/', configureRoutes(db));

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
}

startServer();

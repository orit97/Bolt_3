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

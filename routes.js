const express = require('express');
const { verifySlackRequest, handleEvent, handleCommand } = require('./slack');

function configureRoutes(db) {
  const router = express.Router();

  // Middleware to parse raw body for signature verification
  router.use((req, res, next) => {
    req.rawBody = '';
    req.on('data', (chunk) => {
      req.rawBody += chunk.toString();
    });
    req.on('end', next);
  });

  // Slack Events Endpoint
  router.post('/slack/events', (req, res) => {
    if (!verifySlackRequest(req)) {
      return res.status(400).send('Verification failed');
    }
    handleEvent(req, res, db);
  });

  // Slack Commands Endpoint
  router.post('/slack/commands', (req, res) => {
    handleCommand(req, res, db);
  });

  return router;
}

module.exports = { configureRoutes };

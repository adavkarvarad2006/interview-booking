const express = require('express');
const router = express.Router();
const { handleCalendlyWebhook, simulateWebhook } = require('../controllers/webhookController');
const { verifyCalendlySignature } = require('../middleware/webhookSignature');

// Calendly production webhook endpoint
router.post('/webhook', verifyCalendlySignature, handleCalendlyWebhook);

// Webhook simulation / testing endpoint
router.post('/webhook/simulate', simulateWebhook);

module.exports = router;

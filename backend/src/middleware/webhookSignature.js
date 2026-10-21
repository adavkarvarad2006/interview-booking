const crypto = require('crypto');
const CalendlyIntegration = require('../models/CalendlyIntegration');

/**
 * Validates Calendly webhook signatures.
 * Header format: Calendly-Webhook-Signature: t=1612345678,v1=abcdef...
 */
const verifyCalendlySignature = async (req, res, next) => {
  try {
    const signatureHeader = req.headers['calendly-webhook-signature'] || req.headers['x-calendly-signature'];

    // In development or test simulator mode, allow if specified by header or env
    if (req.headers['x-simulation-request'] === 'true' || process.env.NODE_ENV === 'development' && !signatureHeader) {
      req.isSimulatedWebhook = true;
      return next();
    }

    if (!signatureHeader) {
      return res.status(401).json({
        success: false,
        message: 'Missing Calendly-Webhook-Signature header'
      });
    }

    // Fetch signing key from DB or ENV
    const integration = await CalendlyIntegration.findOne({ isActive: true });
    const signingKey = (integration && integration.webhookSigningKey) || process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

    if (!signingKey) {
      console.warn('[Webhook Warning] No webhook signing key configured, allowing in permissive mode');
      return next();
    }

    // Parse header
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let receivedSignature = '';

    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key.trim() === 't') timestamp = val.trim();
      if (key.trim() === 'v1') receivedSignature = val.trim();
    }

    if (!timestamp || !receivedSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Calendly signature format'
      });
    }

    // Check timestamp tolerance (e.g. within 5 minutes)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTimestamp - parseInt(timestamp, 10));
    if (timeDiff > 300) {
      console.warn(`[Webhook Warning] Timestamp drift: ${timeDiff}s`);
    }

    // Compute expected signature
    const payload = `${timestamp}.${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(payload)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) {
      return next();
    } else {
      console.error('[Webhook Error] Signature mismatch');
      return res.status(403).json({
        success: false,
        message: 'Calendly webhook signature verification failed'
      });
    }
  } catch (error) {
    console.error('[Webhook Verification Error]', error);
    return res.status(500).json({ success: false, message: 'Error verifying webhook signature' });
  }
};

module.exports = { verifyCalendlySignature };

const mongoose = require('mongoose');

const calendlyIntegrationSchema = new mongoose.Schema(
  {
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    personalAccessToken: {
      type: String,
      default: ''
    },
    organizationUri: {
      type: String,
      default: 'https://api.calendly.com/organizations/SAMPLE_ORG_ID'
    },
    userUri: {
      type: String,
      default: 'https://api.calendly.com/users/SAMPLE_USER_ID'
    },
    webhookSigningKey: {
      type: String,
      default: 'calendly_whsec_sample_secret_key_2026'
    },
    webhookSubscriptionUri: {
      type: String,
      default: 'https://api.calendly.com/webhook_subscriptions/SAMPLE_WEBHOOK_SUB_ID'
    },
    webhookCallbackUrl: {
      type: String,
      default: 'http://localhost:5000/api/calendly/webhook'
    },
    calendly15MinUrl: {
      type: String,
      default: 'https://calendly.com/interview-counsellor/15-min-interview-counselling'
    },
    calendly30MinUrl: {
      type: String,
      default: 'https://calendly.com/interview-counsellor/30-min-mock-interview-training'
    },
    googleCalendarEmail: {
      type: String,
      default: 'counsellor.interviews@gmail.com'
    },
    googleCalendarSyncStatus: {
      type: String,
      enum: ['CONNECTED', 'NEEDS_REAUTH', 'DISCONNECTED'],
      default: 'CONNECTED'
    },
    googleCalendarName: {
      type: String,
      default: 'Primary Google Calendar'
    },
    lastWebhookReceivedAt: {
      type: Date
    },
    lastWebhookEvent: {
      type: String,
      default: 'None yet'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CalendlyIntegration', calendlyIntegrationSchema);

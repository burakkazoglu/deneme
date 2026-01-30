const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    logoUrl: {
      type: String,
      default: '/public-logo.svg'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

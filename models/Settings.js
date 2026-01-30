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
    },
    taskTypes: {
      type: [String],
      default: [
        'Hook İçerik',
        'Trend İçerik',
        'Post İçerik',
        'Anketli Post İçeriği',
        'Reels',
        'Story',
        'Soru-Cevap Story'
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

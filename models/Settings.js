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
      type: [
        {
          name: { type: String, required: true },
          isActive: { type: Boolean, default: true }
        }
      ],
      default: [
        { name: 'Hook Ýçerik', isActive: true },
        { name: 'Trend Ýçerik', isActive: true },
        { name: 'Post Ýçerik', isActive: true },
        { name: 'Anketli Post Ýçeriði', isActive: true },
        { name: 'Reels', isActive: true },
        { name: 'Story', isActive: true },
        { name: 'Soru-Cevap Story', isActive: true }
      ]
    },
    announcementText: {
      type: String,
      default: 'Yeni duyuru eklemek için ayarlara gidin.'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

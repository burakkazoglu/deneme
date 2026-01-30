const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  taskType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'paused', 'done'], default: 'pending' },
  dueDate: { type: Date }
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'influencer'], required: true },
    permissions: {
      type: [String],
      default: []
    },
    category: { type: String },
    platforms: {
      type: [String],
      default: []
    },
    tasks: {
      type: [taskSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

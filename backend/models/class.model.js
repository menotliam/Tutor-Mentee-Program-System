const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  maxCapacity: { type: Number, default: 2 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isCancelled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
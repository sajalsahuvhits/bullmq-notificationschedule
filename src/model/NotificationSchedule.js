// NotificationSchedule.js
import mongoose from 'mongoose';

const NotificationScheduleSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  scheduledAt: { type: Date, required: true }, // target execution time
  isScheduled: { type: Boolean, default: false }, // marked true when added to BullMQ
});

export default mongoose.model('NotificationSchedule', NotificationScheduleSchema);

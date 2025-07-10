import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: {
      type: String,
      required: [true, "Notification message is  required"],
    },
    deliveryChannels: {
      web: { type: Boolean, default: false },
      mobilePush: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
    scheduleAt: {
      type: Date,
      required: [true, "Schedule date and time is required"],
    },
    link: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Scheduled", "Sent"],
      default: "Scheduled",
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

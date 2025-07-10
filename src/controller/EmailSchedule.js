import { addNotificationInQueue, cancelScheduledJob } from "../services/NotificationQueue.js";
import moment from "moment-timezone";

import NotificationSchedule from '../model/NotificationSchedule.js';

export const scheduleNotification = async (notificationId, scheduleTime) => {
  try {
    await NotificationSchedule.create({
      notificationId,
      scheduledAt: new Date(scheduleTime),
    });
    console.log(`Notification ${notificationId} stored for future scheduling.`);
  } catch (err) {
    console.error('scheduleNotification error:', err.message);
  }
};

export const emailSchedule = async (req, res) => {
  try {
    const { to, subject, html, scheduleDateTime, emailList } = req.body;
    console.log("req.body: ", req.body);
    const queueResp = await addNotificationInQueue(
      { emailList, to, subject, html },
      { scheduleDateTime }
    );
    if (queueResp?.success) {
      console.log("Email scheduled successfully.");
      res.status(200).send({
        message: "Email scheduled successfully.",
      });
    } else {
      res.status(400).send({
        message: queueResp.message,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      data: error?.message,
    });
  }
};
export const cancelNotification = async (req, res) => {
  try {
    const resp = await cancelScheduledJob(req.body.jobId);
    res.status(200).send({
      message: "Notification cancelled successfully.",
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      data: error?.message,
    });
  }
};

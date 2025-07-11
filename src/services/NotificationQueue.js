// import { Queue } from "bullmq";
// import RedisConnection from "../config/Redis.config.js";
// import moment from "moment-timezone";
// import pLimit from "p-limit";
// // import { v4 as uuidv4 } from "uuid";
// const limit = pLimit(20);
// const notificationQueue = new Queue("notificationQueue", {
//   connection: RedisConnection,
// });

// // @params notificationData = { emailList, to, subject, html }
// // @params option = { scheduleDateTime }
// export const addNotificationInQueue = async (notificationData, option) => {
//   try {
//     const sendDateTime = moment.tz(
//       option.scheduleDateTime,
//       "YYYY-MM-DD HH:mm",
//       "Asia/Kolkata"
//     );

//     if (!sendDateTime.isValid()) {
//       return { message: "Invalid date format. Use 'YYYY-MM-DD HH:mm'" };
//     }

//     const delay = sendDateTime.valueOf() - Date.now();

//     if (delay <= 0) {
//       return { message: "Schedule time must be in the future" };
//     }
//     console.log("addNotificationInQueue: start: ", delay);
//     const { emailList, to, subject, html, notificationId="" } = notificationData;
//     // await notificationQueue.add(
//     //   "sendEmail",
//     //   { to, subject, html },
//     //   {
//     //     delay,
//     //     attempts: 3,
//     //     backoff: { type: "exponential", delay: 5000 },
//     //   }
//     // );
//     const jobs = emailList.map((to) =>
//       limit(() =>
//         notificationQueue.add(
//           "sendNotification",
//           { to, subject, html },
//           {
//             jobId: `${notificationId}-${to}`,
//             delay,
//             attempts: 3,
//             backoff: { type: "exponential", delay: 5000 },
//           }
//         )
//       )
//     );

//     await Promise.allSettled(jobs);

//     console.log("Job added to emailQueue");
//     return { success: true };
//   } catch (error) {
//     throw error;
//   }
// };

// export const cancelScheduledJob = async (jobId) => {
//   const job = await notificationQueue.getJob(jobId);
//   console.log("Cancel Job: ", job)
//   if (job) {
//     await job.remove();
//     console.log(`Job ${jobId} cancelled`);
//   }
// };

import { Queue } from "bullmq";
import RedisConnection from "../config/Redis.config.js";
import moment from "moment-timezone";
import pLimit from "p-limit";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

import NotificationSchedule from '../model/NotificationSchedule.js';
import Notification from '../model/Notification.js';
import sendEmail from "../config/Email.config.js";
// import { messaging } from '../config/Firebase.config.js';

const limit = pLimit(20);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redis = RedisConnection;
const notificationQueue = new Queue("notificationQueue", {
  connection: RedisConnection,
});

export const addNotificationInQueue = async (notificationId, scheduleTime) => {
  try {
    const notification = await Notification.findById(notificationId);
    const userList = await getNotificationUserList(notification);

    // CASE 1: No users – schedule dummy job to mark as 'Sent' later
    if (!userList || userList.length === 0) {
      await notificationQueue.add(
        "markAsSent",
        { notificationId },
        {
          delay: scheduleTime,
          jobId: `MarkAsSent-${notificationId}`,
        }
      );
      console.log(
        `No users for notification ${notificationId}. Scheduled markAsSent job.`
      );
      return;
    }

    // CASE 2: There are users – send notification jobs
    const { deliveryChannels, title, description, link } =
      notification.toObject();
    let notificationBody = description;
    let notificationType;

    if (deliveryChannels.email) {
      // notificationBody = await ejs.renderFile(
      //   path.join(__dirname, "../views/NotificationEmail.ejs"),
      //   {
      //     link: link || "",
      //     logoURL: logoURL,
      //     text: description,
      //   }
      // );
      notificationType = "email";
    } else if (deliveryChannels.mobilePush) {
      notificationType = "mobilePush";
    } else if (deliveryChannels.web) {
      notificationType = "web";
    } else if (deliveryChannels.whatsapp) {
      notificationType = "whatsapp";
    }

    const pendingKey = `notification:${notificationId}:pendingCount`;
    await redis.set(pendingKey, userList.length);
    const jobs = userList.map((user) => ({
      name: "sendNotification",
      data: {
        to: user.email,
        subject: title,
        body: notificationBody,
        notificationType,
        link: "",
        notificationId,
        fcmToken: user.fcmToken,
        mobileNumber: user.mobile,
      },
      opts: {
        jobId: `Notification-${notificationId}-${user._id}`,
        delay: scheduleTime,
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
      },
    }));

    await notificationQueue.addBulk(jobs);
    console.log(
      `Bulk scheduled ${jobs.length} notification jobs for notificationId: ${notificationId}`
    );
  } catch (error) {
    console.log("addNotificationInQueue error:", error.message);
  }
};

// export const cancelScheduledJob = async (notificationId) => {
//   const job = await notificationQueue.getJob(`Notification-${notificationId}`);
//   if (job) {
//     await job.remove();
//     console.log(`Job Notification-${notificationId} cancelled`);
//   }
// };
export const cancelScheduledJob = async (notificationId) => {
  try {
    const userList = await getNotificationUserList();
    let cancelCount = 0;
    await Promise.allSettled(
      userList.map(async (user) => {
        const jobId = `Notification-${notificationId}-${user._id}`;
        const job = await notificationQueue.getJob(jobId);
        if (job) {
          await job.remove();
          cancelCount++;
        }
      })
    );
    console.log(
      `Cancelled ${cancelCount} notification jobs for notificationId: ${notificationId}`
    );
  } catch (error) {
    console.error("cancelScheduledJob error:", error.message);
  }
};

export const getNotificationUserList = async (notification = {}) => {
  try {
    let notificationUserList = [
      {
        _id: "testid1",
        email: "test1122@yopmail.com",
        mobile: "",
        fcmToken:
          "fBRiAJeXg9ld619eV-nmZg:APA91bGFsg72lNw3DOQKG94IlAwW_Cu6r8-yJcG0BXagC_mGYwVWxIV66U9dcidUmIsSW49J9rl6m5rLtY-jC7b5L8IPm7T2zJys3p9Q5mg6FWbzl91jAf4",
      },
    ];

    return notificationUserList;
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

// const MAX_BULLMQ_DELAY_MS = 2147483647; // ~24.8 days
export const MAX_BULLMQ_DELAY_MS = {ms: 1728000000, days: 20}; // 20 days -> 20 days × 24 hours × 60 minutes × 60 seconds × 1000 ms
const POLLING_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

export const processFutureNotifications = async () => {
  try {
    const now = new Date();
    const limitDate = new Date(Date.now() + MAX_BULLMQ_DELAY_MS.ms);

    const notificationsToSchedule = await Notification.find({
      addedToQueue: false,
      scheduleAt: { $lte: limitDate },
    });
    console.log(`Found ${notificationsToSchedule.length} notifications to schedule.`);
    await Promise.all(
      notificationsToSchedule.map(async (entry) => {
        const delay = new Date(entry.scheduleAt).getTime() - Date.now();

        await addNotificationInQueue(entry.notificationId.toString(), delay);

        entry.addedToQueue = true;
        await entry.save();

        console.log(`Queued ${entry.notificationId} to BullMQ with delay ${delay}ms`);
      })
    );
  } catch (error) {
    console.error('Error processing future notifications:', error.message);
  }
};


export const sendNotification = async (data) => {
  const {
    to,
    subject,
    body,
    notificationType,
    link,
    notificationId,
    fcmToken,
  } = data;
  switch (notificationType) {
    case "email":
      await sendEmail(to, subject, body);
      break;

    case "mobilePush":
      // if (fcmToken) {
      //   await messaging.send({
      //     token: fcmToken,
      //     notification: { title: subject, body },
      //     data: { link: link || '' },
      //   });
      // }
      console.log("mobile push notification");
      break;

    case "web":
      console.log("Web notification");
      break;

    case "whatsapp":
      console.log("whatsapp notification");
      break;

    default:
      console.warn(`Unsupported notification type: ${notificationType}`);
  }
};

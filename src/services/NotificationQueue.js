import { Queue } from "bullmq";
import RedisConnection from "../config/Redis.config.js";
import moment from "moment-timezone";
import pLimit from "p-limit";
// import { v4 as uuidv4 } from "uuid";
const limit = pLimit(20);
const notificationQueue = new Queue("notificationQueue", {
  connection: RedisConnection,
});

// @params notificationData = { emailList, to, subject, html }
// @params option = { scheduleDateTime }
export const addNotificationInQueue = async (notificationData, option) => {
  try {
    const sendDateTime = moment.tz(
      option.scheduleDateTime,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );

    if (!sendDateTime.isValid()) {
      return { message: "Invalid date format. Use 'YYYY-MM-DD HH:mm'" };
    }

    const delay = sendDateTime.valueOf() - Date.now();

    if (delay <= 0) {
      return { message: "Schedule time must be in the future" };
    }
    console.log("addNotificationInQueue: start: ", delay);
    const { emailList, to, subject, html, notificationId="" } = notificationData;
    // await notificationQueue.add(
    //   "sendEmail",
    //   { to, subject, html },
    //   {
    //     delay,
    //     attempts: 3,
    //     backoff: { type: "exponential", delay: 5000 },
    //   }
    // );
    const jobs = emailList.map((to) =>
      limit(() =>
        notificationQueue.add(
          "sendNotification",
          { to, subject, html },
          {
            jobId: `${notificationId}-${to}`,
            delay,
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          }
        )
      )
    );

    await Promise.allSettled(jobs);

    console.log("Job added to emailQueue");
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const cancelScheduledJob = async (jobId) => {
  const job = await notificationQueue.getJob(jobId);
  console.log("Cancel Job: ", job)
  if (job) {
    await job.remove();
    console.log(`Job ${jobId} cancelled`);
  }
};

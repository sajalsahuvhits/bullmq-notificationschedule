// import { Worker } from "bullmq";
// import sendEmail from "../config/Email.config.js";
// import RedisConnection from "../config/Redis.config.js";

// const startNotificationWorker = () => {
//     const worker = new Worker(
//       "notificationQueue",
//       async (job) => {
//         console.log("EmailProcessor: ", job.data);
//         const { to, subject, html, type } = job.data;
//         await sendEmail( to, subject, html );
//       },
//       { connection: RedisConnection }
//     );
    
//     worker.on("completed", (job) => {
//       // console.log(`Job details: `, job);
//       console.log(`Job ${job.id} completed`);
//     });
    
//     worker.on("failed", (job, err) => {
//       console.error(`Job ${job.id} failed: `, err);
//     });
// }

// export default startNotificationWorker




import { Worker } from 'bullmq';
import RedisConnection from '../config/Redis.config.js';
import { sendNotification } from '../services/NotificationQueue.js';
import Redis from 'ioredis';
import Notification from '../model/Notification.js';

const redis = RedisConnection;
const startNotificationWorker = () => {
  const worker = new Worker(
    'notificationQueue',
    async (job) => {
      const { name, data } = job;

      if (name === 'sendNotification') {
        await sendNotification(data);
      }

      if (name === 'markAsSent') {
        const { notificationId } = data;
        await Notification.findByIdAndUpdate(notificationId, {
          status: 'Sent',
        });
        console.log(`Notification ${notificationId} marked as Sent (no users case).`);
      }
    },
    {
      connection: RedisConnection,
      concurrency: 20,
    }
  );

  worker.on('completed', async (job) => {
    if (job.name === 'sendNotification') {
      try {
        const { notificationId } = job.data;
        const pendingKey = `notification:${notificationId}:pendingCount`;
        const remaining = await redis.decr(pendingKey);

        if (remaining === 0) {
          // await Notification.findByIdAndUpdate(notificationId, {
          //   status: 'Sent',
          // });
          await redis.del(pendingKey);
          console.log(`Notification ${notificationId} fully processed — status marked as Sent.`);
        }
      } catch (error) {
        console.error('Error on sendNotification job completion:', error.message);
      }
    }
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
  });
};

export default startNotificationWorker;

import { Worker } from "bullmq";
import sendEmail from "../config/Email.config.js";
import RedisConnection from "../config/Redis.config.js";

const startNotificationWorker = () => {
    const worker = new Worker(
      "notificationQueue",
      async (job) => {
        console.log("EmailProcessor: ", job.data);
        const { to, subject, html, type } = job.data;
        await sendEmail( to, subject, html );
      },
      { connection: RedisConnection }
    );
    
    worker.on("completed", (job) => {
      // console.log(`Job details: `, job);
      console.log(`Job ${job.id} completed`);
    });
    
    worker.on("failed", (job, err) => {
      console.error(`Job ${job.id} failed: `, err);
    });
}

export default startNotificationWorker

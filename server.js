import express from "express";
import cors from "cors";
import { cancelNotification, emailSchedule } from "./src/controller/EmailSchedule.js";
import startNotificationWorker from "./src/worker/NotificationWorker.js";
import { dbConnection } from "./src/config/Db.config.js";

import cron from 'node-cron';
import { processFutureNotifications } from "./src/services/NotificationQueue.js";
import { addEditNotification } from "./src/controller/NotificationController.js";
const app = express();
const port = process.env.PORT;
startNotificationWorker();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type", [
    "application/form-data",
    "multipart/form-data",
    "application/json",
  ]);
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
// app.use("/api/admin", AdminRoutes);
app.get("/api", (req, res) => {
  res.send("Working...");
});
app.post("/api/schedule-email", emailSchedule);
app.post("/api/cancel-schedule-email", cancelNotification);

app.post("/api/add-edit-notification", addEditNotification);

cron.schedule('*/10 * * * *', async () => {
  console.log('⏱ Running future notification scheduler...');
  await processFutureNotifications();
});
app.listen(port, () => {
  dbConnection();
  console.log(`Server started on port ${port}`);
});

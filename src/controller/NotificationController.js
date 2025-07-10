import MomentTimezone from "moment-timezone";
import {
  addNotificationInQueue,
  cancelScheduledJob,
} from "../services/NotificationQueue.js";
import { isMoreThanGivenDaysFromNow } from "../utils/CommonFunctions.js";

export const addEditNotification = async (req, res) => {
  try {
    let {
      id,
      title,
      deliveryChannels,
      scheduleAt,
      description,
      link,
    } = req.body;

    // Parse deliveryChannels if it’s a string (from URLSearchParams)
    if (typeof deliveryChannels === "string") {
      try {
        deliveryChannels = JSON.parse(deliveryChannels);
      } catch (err) {
        console.error("❌ Invalid deliveryChannels format", err.message);
        return res.status(400).send({
          message: "Invalid deliveryChannels format",
        });
      }
    }

    // Basic validations
    if (!title || !scheduleAt || !description) {
      return res.status(400).send({
        message: "Required missing field",
      });
    }

    // Validate deliveryChannels
    // if (!deliveryChannels || Object.values(deliveryChannels).every((v) => !v)) {
    //   return sendResponse(
    //     res,
    //     StatusCodes.BAD_REQUEST,
    //     ResponseMessage.AT_LEAST_ONE_CHANNEL,
    //     []
    //   );
    // }
    const sendDateTime = MomentTimezone.tz(
      scheduleAt,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );

    if (!sendDateTime.isValid()) {
      return res.status(400).send({
        message: "Invalid date format. Use 'YYYY-MM-DD HH:mm'",
      });
    }

    const delay = sendDateTime.valueOf() - Date.now();

    if (delay <= 0) {
      return res.status(400).send({
        message: "Schedule time must be in the future",
      });
    }
    
    const updatedData = {
      title,
      deliveryChannels,
      scheduleAt,
      description,
      link,
    };
    let isLongFutureDate = isMoreThanGivenDaysFromNow(scheduleAt, 20);
    if(isLongFutureDate){
      updatedData.status = "Pending"
    }

    if (id) {
      const existingNotification = await Notification.findById(id);
      if (!existingNotification || existingNotification.isDelete) {
        return res.status(400).send({
          message: "Notification not found",
        });
      }
      if (existingNotification.status == "Sent") {
        return res.status(400).send({
          message: "Can not update as notification already sent",
        });
      }
      await cancelScheduledJob(id);
      const updatedNotification = await Notification.findByIdAndUpdate(
        id,
        updatedData,
        {
          new: true,
        }
      );
      await addNotificationInQueue(id, delay);
      return res.status(200).send({
        message: "Notification updated successfully.",
      });
    }

    const newNotification = new Notification(updatedData);

    await newNotification.save();
    await addNotificationInQueue(newNotification?._id, delay);

    res.status(200).send({
      message: "Notification scheduled successfully.",
    });
  } catch (error) {
    console.error("Notification add/edit error:", error);
    return res.status(500).send({
      message: error.message,
    });
  }
};

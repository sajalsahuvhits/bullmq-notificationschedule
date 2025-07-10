import moment from "moment";

/**
 * Checks if a given date-time is more than given days ahead of now.
 * @param {string} dateTimeStr - Date-time in "YYYY-MM-DD HH:mm" format
 * @param {number} days - number of days to check from now. Default is 0.
 * @returns {boolean} - true if it's more than given days in the future
 */
export const isMoreThanGivenDaysFromNow = (dateTimeStr, days = 0) => {
  const targetTime = moment(dateTimeStr, "YYYY-MM-DD HH:mm");
  let compareDate = moment().add(days, "days").startOf("day");
  return targetTime.isAfter(compareDate);
};

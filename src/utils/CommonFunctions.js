import moment from "moment";

/**
 * Checks if a given date-time is more than 20 days ahead of now.
 * @param {string} dateTimeStr - Date-time in "YYYY-MM-DD HH:mm" format
 * @returns {boolean} - true if it's more than 20 days in the future
 */
export const isMoreThanGivenDaysFromNow = (dateTimeStr, days = 0) => {
  const targetTime = moment(dateTimeStr, "YYYY-MM-DD HH:mm");

  let compareDate = moment();
  if (days) {
    compareDate = compareDate.add(parseInt(days), "days");
  }
  return targetTime.isAfter(compareDate);
};

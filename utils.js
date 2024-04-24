const util = require("util");
const { List } = require("./mongo");

const getDateStringFromDateObject = (date) => {
  return (
    date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear()
  );
};
const increaseDate = (date, numOfDays) => {
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numOfDays);
  return newDate;
};
const decreaseDate = (date, numOfDays) => {
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() - numOfDays);
  return newDate;
};
const isSameDate = (date1, date2) =>
  date1.getDate() === date2.getDate() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getFullYear() === date2.getFullYear();

const findOneAsync = util.promisify(List.findOne).bind(List);

const getPreviousDayItem = async (
  newListItems,
  itemsListTitle,
  numOfDays = 3
) => {
  let today = new Date();
  let tomorrow = increaseDate(today, 1);
  let startDate = decreaseDate(today, numOfDays);
  while (!isSameDate(startDate, tomorrow)) {
    let ListName = getDateStringFromDateObject(startDate);

    try {
      const foundList = await findOneAsync({ name: ListName });
      if (foundList) {
        // go over each item and add them to our new list if not done
        foundList.items
          .filter((item) => !item.done)
          .forEach((item) => {
            newListItems.push(item);
            itemsListTitle.push(ListName);
          });
      }
    } catch (err) {
      console.error(err);
    }

    startDate = increaseDate(startDate, 1);
  }
};

module.exports = {
  getDateStringFromDateObject,
  increaseDate,
  decreaseDate,
  isSameDate,
  findOneAsync,
  getPreviousDayItem
};

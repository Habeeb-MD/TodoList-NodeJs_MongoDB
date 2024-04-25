const util = require("util");
const { List } = require("./mongo");

const getDateStringFromDateObject = (date) => {
  return (
    date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear()
  );
};
const increaseDate = (date, numOfDays) => {
  console.log("inside increaseDate");
  numOfDays = Number(numOfDays);
  console.log("params :- ", date, numOfDays);
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numOfDays);
  console.log("newDate :- ", newDate);
  return newDate;
};
const decreaseDate = (date, numOfDays) => {
  let newDate = new Date(date);
  numOfDays = Number(numOfDays);
  newDate.setDate(newDate.getDate() - numOfDays);
  return newDate;
};
const isSameDate = (date1, date2) =>
  date1.getDate() === date2.getDate() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getFullYear() === date2.getFullYear();

const findOneAsync = util.promisify(List.findOne).bind(List);

const convert_DDMMYYYY_StringTo_YYYYMMDD = (inputDateStr) =>
  inputDateStr.split("-").reverse().join("-");

const getPreviousDayItem = async (
  newListItems,
  itemsListTitle,
  numOfDays = 3
) => {
  let today = new Date();
  let tomorrow = increaseDate(today, 1);
  let startDate = decreaseDate(today, numOfDays);
  const dateList = [];

  while (!isSameDate(startDate, tomorrow)) {
    dateList.push(getDateStringFromDateObject(startDate));
    startDate = increaseDate(startDate, 1);
  }
  const records = await List.find().where("name").in(dateList).exec();
  // console.log("records", records);
  records.sort(
    (a, b) =>
      new Date(convert_DDMMYYYY_StringTo_YYYYMMDD(b.name)) -
      new Date(convert_DDMMYYYY_StringTo_YYYYMMDD(a.name))
  );
  // console.log("sorted records", records);
  for (let i = 0; i < records.length; i++) {
    const foundList = records[i];
    // go over each item and add them to our new list if not done
    foundList.items
      .filter((item) => !item.done)
      .forEach((item) => {
        newListItems.push(item);
        itemsListTitle.push(foundList.name);
      });
  }
  // console.log("newListItems", newListItems);
};

module.exports = {
  getDateStringFromDateObject,
  increaseDate,
  decreaseDate,
  isSameDate,
  findOneAsync,
  getPreviousDayItem,
  convert_DDMMYYYY_StringTo_YYYYMMDD,
};

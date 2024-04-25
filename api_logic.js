const {
  increaseDate,
  getPreviousDayItem,
  getDateStringFromDateObject,
} = require("./utils");
const { Item, List } = require("./mongo");
const _ = require("lodash");

const getTodaysList = (req, res) => {
  //get the current date
  const currentDate = getDateStringFromDateObject(new Date());

  let query = req.originalUrl;
  if (query.includes("selected_date")) {
    let selected_date = query.substring("/?selected_date=".length);
    selected_date = selected_date.split("-");
    if (selected_date[1] < 10) selected_date[1] = selected_date[1][1];
    if (selected_date[2] < 10) selected_date[2] = selected_date[2][1];
    selected_date = selected_date.reverse().join("-");
    //redirect it to selected_date
    res.redirect("/" + selected_date);
  } else {
    //redirect it to current date list
    res.redirect("/" + currentDate);
  }
};

const addNewItem = (req, res) => {
  console.log("Adding new Item");
  let itemName = req.body.newItem;
  const listName = req.body.listName;
  const revisionNeeded = Number(req.body.revision || 0);
  console.log("revisionNeeded:- ", revisionNeeded);

  if (itemName.startsWith("https://leetcode.com/problems/")) {
    const startIndex = itemName.indexOf("/problems/") + 10;
    let endIndex = itemName.indexOf("/", startIndex);
    if (endIndex < 0) {
      endIndex = itemName.length;
    }
    itemName = itemName.substring(0, endIndex);
    // console.log(endIndex,itemName);
  }

  //make a new item
  const itemObj = {
    done: false,
    name: itemName,
    timesSeen: 1,
    gap: revisionNeeded,
  };
  var item = new Item(itemObj);
  console.log("new item:- ", itemObj);

  const date = new Date();
  var month = date.getMonth() + 1;
  const currentDate = date.getDate() + "-" + month + "-" + date.getFullYear();

  //add a new item to the list
  List.findOne(
    {
      name: listName,
    },
    function (err, foundList) {
      foundList.items.push(item);
      foundList.newItem = foundList.newItem + 1;
      foundList.save();
      res.redirect("/" + listName);
    }
  );
};

const markItemAsDone = (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log("mark item as done :- ");
  console.log("req.query :- ", req.body);
  let revisionGap = Number(req.body.revisionGap);
  List.findOne(
    {
      name: listName,
    },
    function (err, curList) {
      if (!err) {
        var element = curList.items.find(function (element) {
          return element.id == checkedItemId;
        });
        element.done = true;
        element.gap = revisionGap;
        curList.save();
        res.redirect("/" + listName);

        //also add it to the revision list in list collection and insert there
        if (revisionGap > 0) {
          const _revDate = increaseDate(new Date(), revisionGap);
          const revDate = getDateStringFromDateObject(_revDate);

          const itemObj = {
            done: false,
            name: element.name,
            timesSeen: element.timesSeen + 1,
            gap: Math.min(30, revisionGap * 2),
          };
          var item = new Item(itemObj);
          console.log("adding below item for revision on Date :-", revDate);
          console.log("revison Item :- ", itemObj);

          List.findOne(
            {
              name: revDate,
            },
            function (err, revList) {
              if (!revList) {
                //create a new list
                const list = new List({
                  name: revDate,
                  newItem: 0,
                  items: [item],
                });
                list.save();
              } else {
                revList.items.push(item);
                revList.save();
              }
            }
          );
        }
      }
    }
  );
};

const deleteItem = (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const timesSeen = req.body.timesSeen;

  //pull is used to delete element from array in mongodb
  List.findOneAndUpdate(
    {
      name: listName,
    },
    {
      $pull: {
        items: {
          _id: checkedItemId,
        },
      },
    },
    function (err, foundList) {
      if (!err) {
        if (timesSeen == 1) {
          foundList.newItem = foundList.newItem - 1;
          foundList.save();
        }
        res.redirect("/" + listName);
      }
    }
  );
};

const getCustomList = async (req, res) => {
  var customListName = req.params.customListName;
  if (
    customListName.includes("prevDate") ||
    customListName.includes("nextDate")
  ) {
    let x = customListName[0] == "p" ? -1 : 1;
    customListName = customListName.substring(8);
    customListName = customListName.split("-").reverse().join("-");
    var date = new Date(customListName);
    if (date instanceof Date && !isNaN(date)) {
      date.setDate(date.getDate() + x);
    } else {
      date = new Date();
    }
    customListName = getDateStringFromDateObject(date);
  } else if ("notDoneInput" in req.query) {
    //iterate last N days and from the list of that day , retrieve unfinished item and add it newList
    let numOfDays = req.query["notDoneInput"];
    numOfDays = +numOfDays;
    let newListItems = [];
    let itemsListTitle = [];
    await getPreviousDayItem(newListItems, itemsListTitle, numOfDays);

    let listTitle = "Previous-" + numOfDays;
    //render the new list
    res.render("list", {
      listTitle: listTitle,
      newListItems: newListItems,
      itemsListTitle: itemsListTitle,
      newItem: 0,
    });
    return;
  }

  _.capitalize(customListName);

  List.findOne(
    {
      name: customListName,
    },
    function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //create a new list
          const list = new List({
            name: customListName,
            newItem: 0,
            items: [],
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          //render the existing list
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
            newItem: foundList.newItem,
          });
        }
      }
    }
  );
};

module.exports = {
  getTodaysList,
  addNewItem,
  markItemAsDone,
  deleteItem,
  getCustomList,
};

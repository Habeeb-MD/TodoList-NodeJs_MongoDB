//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();
const util = require('util');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

connection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-j09cl.mongodb.net/todolistDB`;
mongoose.connect(connection, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
})
  .catch(() => {
    console.log("Couldn't connect to MongoDB");
  });


const itemsSchema = new mongoose.Schema({
  name: String,
  done: Boolean,
  timesSeen: Number,
  gap: Number
});

const Item = mongoose.model("Item", itemsSchema);


const listSchema = new mongoose.Schema({
  name: String,
  newItem: Number,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);


//handling the get request for root
app.get("/", function (req, res) {
  //find the current date
  const date = new Date();
  var month = date.getMonth() + 1;

  const currentDate = date.getDate() + "-" + month + "-" + date.getFullYear();
  let query = req.originalUrl;
  if (query.includes('selected_date')) {
    let selected_date = query.substring('/?selected_date='.length)
    selected_date = selected_date.split("-")
    if (selected_date[1] < 10) selected_date[1] = selected_date[1][1];
    if (selected_date[2] < 10) selected_date[2] = selected_date[2][1];
    selected_date = selected_date.reverse().join("-");
    //redirect it to selected_date
    res.redirect('/' + selected_date);
  }
  else {
    //redirect it to current date list
    res.redirect('/' + currentDate);
  }

});


// handling the post request
app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  const listName = req.body.listName;
  const revisionNeeded = req.body.revision;
  //console.log(revisionNeeded)

  if (itemName.startsWith('https://leetcode.com/problems/')) {
    const startIndex = itemName.indexOf('/problems/') + 10;
    let endIndex = itemName.indexOf('/', startIndex);
    if (endIndex < 0) {
      endIndex = itemName.length;
    }
    itemName = itemName.substring(0, endIndex);
    // console.log(endIndex,itemName);
  }

  //make a new item
  var item = new Item({
    done: false,
    name: itemName,
    timesSeen: 1,
    gap: (revisionNeeded ? 4 : 0)
  });

  const date = new Date();
  var month = date.getMonth() + 1;
  const currentDate = date.getDate() + "-" + month + "-" + date.getFullYear();

  //add a new item to the list
  List.findOne({
    name: listName
  }, function (err, foundList) {
    foundList.items.push(item);
    foundList.newItem = foundList.newItem + 1;
    foundList.save();
    res.redirect('/' + listName);
  });

});


// if done change done variable to true and add it to revision list
app.post("/done", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  List.findOne({
    "name": listName
  }, function (err, curList) {
    if (!err) {
      var element = curList.items.find(function (element) {
        return element.id == checkedItemId;
      });
      element.done = true;
      curList.save();
      res.redirect('/' + listName);

      //also add it to the revision list in list collection and insert there
      if (element.gap) {

        const date = new Date();
        date.setDate(date.getDate() + element.gap);
        var month = date.getMonth() + 1;
        const revDate = date.getDate() + "-" + month + "-" + date.getFullYear();
        var item = new Item({
          done: false,
          name: element.name,
          timesSeen: element.timesSeen + 1,
          gap: Math.min(25, element.gap * 2)
        });

        List.findOne({
          name: revDate
        }, function (err, revList) {
          if (!revList) {
            //create a new list
            const list = new List({
              name: revDate,
              newItem: 0,
              items: [item]
            });
            list.save();
          } else {
            revList.items.push(item);
            revList.save();
          }
        });
      }
    }
  });
});


//handling the delete request
app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const timesSeen = req.body.timesSeen;

  //pull is used to delete element from array in mongodb
  List.findOneAndUpdate({
    name: listName
  }, {
    $pull: {
      items: {
        _id: checkedItemId
      }
    }
  }, function (err, foundList) {
    if (!err) {
      if (timesSeen == 1) {
        foundList.newItem = foundList.newItem - 1;
        foundList.save();
      }
      res.redirect('/' + listName);
    }
  });
});

const getDateStringFromDateObject = date => {
  return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
}
const increaseDate = (date, numOfDays) => {
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numOfDays);
  return newDate;
}
const decreaseDate = (date, numOfDays) => {
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() - numOfDays);
  return newDate;
}
const isSameDate = (date1, date2) => (date1.getDate() === date2.getDate() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getFullYear() === date2.getFullYear());

const findOneAsync = util.promisify(List.findOne).bind(List);

const getPreviousDayItem = async (newListItems, itemsListTitle, numOfDays = 3) => {
  let today = new Date();
  let tomorrow = increaseDate(today, 1);
  let startDate = decreaseDate(today, numOfDays);
  while (!isSameDate(startDate, tomorrow)) {
    let ListName = getDateStringFromDateObject(startDate);

    try {
      const foundList = await findOneAsync({ name: ListName });
      if (foundList) {
        // go over each item and add them to our new list if not done
        foundList.items.filter(item => !item.done).forEach(item => {
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

//handling the get request for a  custom List
app.get("/:customListName", async function (req, res) {

  var customListName = req.params.customListName;
  if (customListName.includes('prevDate') || customListName.includes('nextDate')) {
    let x = (customListName[0] == 'p') ? -1 : 1;
    customListName = customListName.substring(8);
    customListName = customListName.split("-").reverse().join("-");
    var date = new Date(customListName);
    if (date instanceof Date && !isNaN(date)) {
      date.setDate(date.getDate() + x);
    }
    else {
      date = new Date();
    }
    var month = date.getMonth() + 1;
    customListName = date.getDate() + "-" + month + "-" + date.getFullYear();
  }
  else if ('notDoneInput' in req.query) {
    //iterate last N days and from the list of that day , retrieve unfinished item and add it newList
    let numOfDays = req.query['notDoneInput'];
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
      newItem: 0
    });
    return;
  }

  _.capitalize(customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          newItem: 0,
          items: []
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //render the existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
          newItem: foundList.newItem
        });
      }
    }
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(port, function () {
  console.log("Server has started succesfully ");
});

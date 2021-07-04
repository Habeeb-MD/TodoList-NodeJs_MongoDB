  //jshint esversion:6
  require('dotenv').config();
  const express = require("express");
  const bodyParser = require("body-parser");
  const mongoose = require('mongoose');
  const _ = require('lodash');
  const app = express();

  app.set('view engine', 'ejs');

  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(express.static("public"));

  connection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-j09cl.mongodb.net/todolistDB`;
  mongoose.connect(connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
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
  app.get("/", function(req, res) {

    //find the current date
    const date = new Date();
    var month = date.getMonth() + 1;

    const currentDate = date.getDate() + "-" + month + "-" + date.getFullYear();

    //redirect it to current date list
    res.redirect('/' + currentDate);

  });


  // handling the post request
  app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.listName;
    const revisionNeeded = req.body.yes;

    //make a new item
    var item = new Item({
      done: false,
      name: itemName,
      timesSeen: 1,
      gap: (revisionNeeded ? 3 : 0)
    });

    const date = new Date();
    var month = date.getMonth() + 1;
    const currentDate = date.getDate() + "-" + month + "-" + date.getFullYear();

    //add a new item to the list
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.newItem = foundList.newItem + 1;
      foundList.save();
      res.redirect('/' + listName);
    });

  });


  // if done change done variable to true and add it to revision list
  app.post("/done", function(req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    List.findOne({
      "name": listName
    }, function(err, curList) {
      if (!err) {
        var element = curList.items.find(function(element) {
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
          }, function(err, revList) {
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
  app.post("/delete", function(req, res) {

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
    }, function(err, foundList) {
      if (!err) {
        if (timesSeen == 1) {
          foundList.newItem = foundList.newItem - 1;
          foundList.save();
        }
        res.redirect('/' + listName);
      }
    });
  });

  //handling the get request for a  custom List
  app.get("/:customListName", function(req, res) {

    var customListName = req.params.customListName;

    if (customListName.substr(0, 7) == 'nextDay') {
      customListName = customListName.substr(7);
      var c = customListName[0];
      if (c >= '0' && c <= '9') {
        customListName = customListName.split("-").reverse().join("-");
        var date = new Date(customListName);
        date.setDate(date.getDate() + 1);
        var month = date.getMonth() + 1;
        customListName = date.getDate() + "-" + month + "-" + date.getFullYear();
      }
    }

    _.capitalize(customListName);

    List.findOne({
      name: customListName
    }, function(err, foundList) {
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

  app.listen(port, function() {
    console.log("Server has started succesfully ");
  });

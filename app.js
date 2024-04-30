//jshint esversion:6
const express = require("express");
const app = express();
const controller = require("./controller");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//handling the get request for root
app.get("/", controller.getTodaysList);

//handling the get request for a custom List
app.get("/:customListName", controller.getCustomList);

app
  .route("/items")
  .post(controller.modifyItemName,controller.addNewItem) //post request to add new item to list -> this is a synchronous operation
  .patch(controller.markItemAsDone) // if item is mark as Done -> update done variable to true and add item to revision list
  .delete(controller.deleteItem); //delete request to delete item from list

module.exports = app;

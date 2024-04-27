//jshint esversion:6
const express = require("express");
const { establishMongoConnection } = require("./mongo");
const app = express();
const {
  getTodaysList,
  addNewItem,
  markItemAsDone,
  deleteItem,
  getCustomList,
} = require("./api_logic");

app.set("view engine", "ejs");

//to connect to mongo server
establishMongoConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//handling the get request for root
app.get("/", getTodaysList);

//handling the get request for a custom List
app.get("/:customListName", getCustomList);

app
  .route("/items")
  .post(addNewItem) //handling the post request to add new item to list -> this is a synchronous operation
  .patch(markItemAsDone) // if item is mark as Done -> update done variable to true and add item to revision list
  .delete(deleteItem); //handling the delete request to delete item from list

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server has started succesfully on port ${port}...`);
});

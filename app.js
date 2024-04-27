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

// handling the post request
app.post("/", addNewItem);

// if done change done variable to true and add it to revision list
app.post("/done", markItemAsDone);

//handling the delete request
app.post("/delete", deleteItem);

//handling the get request for a custom List
app.get("/:customListName", getCustomList);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server has started succesfully on port ${port}...`);
});

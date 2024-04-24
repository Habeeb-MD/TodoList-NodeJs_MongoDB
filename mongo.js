require("dotenv").config();
const mongoose = require("mongoose");

connection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-j09cl.mongodb.net/todolistDB`;

const establishMongoConnection = () => {
  mongoose
    .connect(connection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch(() => {
      console.log("Couldn't connect to MongoDB");
    });
};

const itemsSchema = new mongoose.Schema({
  name: String,
  done: Boolean,
  timesSeen: Number,
  gap: Number,
});

const listSchema = new mongoose.Schema({
  name: String,
  newItem: Number,
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);
const List = new mongoose.model("List", listSchema);

module.exports = {
  establishMongoConnection,
  Item,
  List,
};

const { establishMongoConnection } = require("./mongo");

//to connect to mongo server
establishMongoConnection();

const app = require("./app");

let port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server has started succesfully on port ${port}...`);
});

require("dotenv").config();
const URL = process.env.URL;
module.exports = () => {
  setInterval(() => {
    fetch(URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        } else {
          console.log("Server is ok");
        }
      })
      .catch((error) => console.error("Error:", error));
  }, 14 * 60 * 1000);
};

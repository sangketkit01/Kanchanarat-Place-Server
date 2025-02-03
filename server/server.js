

let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mysql = require("mysql");
const { testController } = require("../controller/TestController");

require("dotenv").config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/",testController)

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;

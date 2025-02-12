let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mysql = require("mysql");

require("dotenv").config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var dbConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

dbConn.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed: ", err.message);
    process.exit(1); 
  } else {
    console.log("✅ Database connected successfully!");

    app.listen(3000, () => {
      console.log("🚀 Server is running on port 3000");
    });
  }
});




module.exports = {app,dbConn};

// ================================================================================
const { getRoomByFloor } = require("../controller/RoomController");
const { testController } = require("../controller/TestController");
const { loginVerify } = require("../controller/UserController");

app.post("/login_verify", loginVerify);
app.get("/get-room/:floor", getRoomByFloor);


// ================================================================================

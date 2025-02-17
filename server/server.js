let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcryptjs");

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

module.exports = { app, dbConn, bcrypt };

// Routes
const upload = require("../config/multer");
const { getRoomByFloor, reserveRoom, checkReservation, getReservation, allReserved, getOneRoom, approveReservation, insertContract, getNewContracts } = require("../controller/RoomController");
const { testController } = require("../controller/TestController");
const { loginVerify } = require("../controller/UserController");

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.post("/login_verify", loginVerify);

app.get("/get-room/:floor", getRoomByFloor);
app.get("/get-one-room/:room_id", getOneRoom);

app.put("/reserving-room/:room_id", upload.single("slip_part"), reserveRoom);
app.post("/check-reservation",checkReservation);
app.get("/getReservation/:reservation_id",getReservation)

app.get("/allReserved",allReserved)
app.post("/approve-reservation/:reservation_id",approveReservation)

app.post("/insert-contract", upload.single("slip_part"), insertContract);

app.get("/get-new-contracts",getNewContracts)
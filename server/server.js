let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcryptjs");

const multer = require("multer");

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
const { getRoomByFloor, reserveRoom, checkReservation, getReservation, allReserved, getOneRoom, approveReservation, 
  insertContract, getNewContracts, makeRoomUnavailable, approveContract, 
  getRoomContract,
  insertRepair,
  insertRepairImage,
  getUnapprovedRepair,
  getRepairImages,
  approveRepair,
  getApprovedRepair,
  insertRepairDetail,
  insertRepairDetailImages,
  updateRepairCostStatus,
  getSuccessRepair,
  getRepairDetail,
  getRepairDetailImages,
  insertLeaving,
  getUnapprovedLeaving,
  getMemberByRoom,
  approveLeaving,
  rejectLeaving} = require("../controller/RoomController");
const { testController } = require("../controller/TestController");
const { loginVerify, updateProfile } = require("../controller/UserController");
const { createBill, getBill, getLatestBill, getRoomBills, payBill, createOrUpdateWaterBill, createOrUpdateElectricityBill, releaseBill, approveBill } = require("../controller/PaymentController");

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.post("/login_verify", loginVerify);
app.get("/get-member-by-room/:room_id", getMemberByRoom);
app.post("/update-profile/:member_id", upload.single("image_path"), updateProfile);

app.get("/get-room/:floor", getRoomByFloor);
app.get("/get-one-room/:room_id", getOneRoom);
app.post("/make-room-unavailable/:room_id", makeRoomUnavailable);

app.put(
  "/reserving-room/:room_id",
  (req, res, next) => {
    upload.single("slip_path")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("Multer Error", err.message);
        res.status(400).send(err.message);
      } else if (err) {
        console.log("Unknown Error", err);
        res.status(500).send(err.message);
      } else {
        // Everything went fine.
        next();
      }
    });
  },
  reserveRoom
);
app.post("/check-reservation",checkReservation);
app.get("/getReservation/:reservation_id",getReservation)
app.get("/allReserved",allReserved)
app.post("/approve-reservation/:reservation_id",approveReservation)

app.post("/insert-contract", 
  upload.fields([
    { name: "slip_path", maxCount: 1 },
    { name: "contract_path", maxCount: 1 }
  ]), 
  insertContract
);

app.get("/get-new-contracts",getNewContracts)
app.post("/approve-contract/:contract_id",approveContract)

app.post("/create-bill",createBill)
app.get("/get-bill/:room_id/:month/:year",getBill)
app.get("/get-latest-bill/:room_id",getLatestBill)
app.get("/get-room-bills/:room_id",getRoomBills)
app.post("/pay-bill/:bill_id", upload.single("slip_part"), payBill);
app.post("/create-meter-water",createOrUpdateWaterBill)
app.post("/create-meter-electricity",createOrUpdateElectricityBill)
app.post("/release-bill/:month/:year",releaseBill)
app.post("/approve-bill/:bill_id",approveBill)

app.get("/get-room-contract/:room_id", getRoomContract);

app.post("/insert-repair",insertRepair)
app.post("/insert-repair-images/:repair_id",upload.single("image_path"),insertRepairImage)
app.get("/get-unapproved-repair",getUnapprovedRepair)
app.get("/get-approved-repair",getApprovedRepair)
app.get("/get-repair-images/:repair_id",getRepairImages)
app.put("/approve-repair/:repair_id",approveRepair)
app.post("/insert-repair-details/:repair_id",insertRepairDetail)
app.post("/insert-repair-detail-images/:repair_id",upload.single("repair_detail_image_path"),insertRepairDetailImages)
app.put("/update-repair-cost-status/:repair_id",updateRepairCostStatus)
app.get("/get-success-repair",getSuccessRepair)
app.get("/get-repair-detail/:repair_id",getRepairDetail)
app.get("/get-repair-detail-image/:repair_id",getRepairDetailImages)

app.post("/insert-leaving",insertLeaving)
app.get("/get-unapproved-leaving",getUnapprovedLeaving)
app.put("/approve-leaving/:leaving_id",approveLeaving)
app.post("/reject-leaving/:leaving_id",rejectLeaving)
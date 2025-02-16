const { dbConn } = require("../server/server");

const getRoomByFloor = (req, res) => {
  dbConn.query(
    `SELECT rooms.room_id, rooms.room_code, status.status_name, 
            rooms.room_price, rooms.room_floor 
     FROM rooms 
     JOIN status ON status.status_id = rooms.status_id 
     WHERE room_floor = ?`,
    [req.params.floor],
    (error, results) =>
      error ? res.status(500).send(error) : res.send(results)
  );
};

const getOneRoom = (req,res) =>{
  dbConn.query(
    `SELECT * FROM rooms WHERE room_id = ?`,
    [req.params.room_id],
    (error, results) =>
      error ? res.status(500)
      .send(error) : res.send(results[0])
)}

const reserveRoom = (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาอัพโหลดสลิปการโอนเงิน",
      });
    }

    const filePath = `../uploads/${req.file.filename}`;

    const reservationData = {
      room_id: req.params.room_id,
      status_id: req.body.status_id,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      line: req.body.line,
      slip_path: filePath,
    };

    const sql = "INSERT INTO reservations SET ?";

    dbConn.query(sql, reservationData, (err, result) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          error: err,
        });
      }

      const makeRoomUnavailable = `UPDATE rooms SET status_id = 3 WHERE room_id = ?`;

      dbConn.query(makeRoomUnavailable, req.params.room_id, (err, result) => {
        if (err) {
          console.error("Error:", err);
          return res.status(500).json({
            status: "error",
            message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูลห้องพัก",
            error: err,
          });
        }
      })

      res.status(201).json({
        status: "success",
        message: "จองห้องพักสำเร็จ",
        reservationId: result.insertId,
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในระบบ",
      error: error.message,
    });
  }
};

const checkReservation = (req, res) => {
  dbConn.query(
    `SELECT * FROM reservations WHERE name = ? AND phone = ?`,
    [req.body.name,req.body.phone],
    (error, results) =>
      error ? res.status(500).send(error) : res.send(results[0])
  );
}

const getReservation = (req, res) => {
  dbConn.query(
    `SELECT * FROM reservations WHERE reservation_id = ?`,
    [req.params.reservation_id],
    (error, results) =>
      error ? res.status(500).send(error) : res.send(results[0])
  );
}

const allReserved = (req, res) => {
  dbConn.query(
    `SELECT * FROM reservations where status_id = 4`,
    (error, results) =>
      error ? res.status(500)
      .send(error) : res.send(results)
  );
}

const approveReservation = (req,res) => {
  dbConn.query(
    `UPDATE reservations SET status_id = 6 WHERE reservation_id = ?`,
    [req.params.reservation_id],
    (error, results) =>
      error ? res.status(500)
      .send(error) : res.send(results)
  );
}

module.exports = { getRoomByFloor ,getOneRoom, reserveRoom , checkReservation, getReservation , allReserved , approveReservation };

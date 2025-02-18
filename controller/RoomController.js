const { dbConn } = require("../server/server");

function getRoomByFloor(req, res) {
  dbConn.query(
    `SELECT rooms.room_id, rooms.room_code, status.status_name, 
            rooms.room_price, rooms.room_floor 
     FROM rooms 
     JOIN status ON status.status_id = rooms.status_id 
     WHERE room_floor = ? AND room_id <> 46`,
    [req.params.floor],
    (error, results) =>
      error ? res.status(500).send(error) : res.send(results)
  );
}

function getOneRoom(req, res) {
  dbConn.query(
    `SELECT * FROM rooms WHERE room_id = ?`,
    [req.params.room_id],
    (error, results) =>
      error ? res.status(500).send(error) : res.send(results[0])
  );
}

function makeRoomUnavailable(req, res) {
  dbConn.query(
    `UPDATE rooms SET status_id = 2 WHERE room_id = ?`,
    [req.params.room_id],
    (error, results) =>{
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else {
        res.send(results);
      }
    }
)}

function reserveRoom(req, res) {
  try {
    if (!req.file) {
      console.log("Error: กรุณาอัพโหลดสลิปการโอนเงิน");
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
      });

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
}

function checkReservation(req, res) {
  dbConn.query(
    `SELECT * FROM reservations WHERE name = ? AND phone = ?`,
    [req.body.name, req.body.phone],
    (error, results) =>{
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else {
        res.send(results[0]);
      }
    }
  );
}

function getReservation(req, res) {
  dbConn.query(
    `SELECT * FROM reservations WHERE reservation_id = ?`,
    [req.params.reservation_id],
    (error, results) =>{
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else {
        res.send(results[0]);
      }
    }
  );
}

function allReserved(req, res) {
  dbConn.query(
    `SELECT * FROM reservations where status_id = 4`,
    (error, results) =>{
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else {
        res.send(results);
      }
    }
  );
}

function approveReservation(req, res) {
  dbConn.query(
    `UPDATE reservations SET status_id = 6 WHERE reservation_id = ?`,
    [req.params.reservation_id],
    (error, results) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      }else{
        res.send(results);
      }
    }
  );
}

function insertContract(req, res) {
  try {
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    if (!req.file) {
      console.log("กรุณาอัพโหลดสลิปการโอนเงิน");
      return res.status(400).json({
        status: "error",
        message: "กรุณาอัพโหลดสลิปการโอนเงิน",
      });
    }

    const filePath = `../uploads/${req.file.filename}`;

    const expireDate = new Date(req.body.expire_at);
    const mysqlTimestamp = expireDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const contractData = {
      room_id: req.body.room_id,
      reservation_id : req.body.reservation_id,
      contract_detail: req.body.contract_detail,
      contract_length_month: req.body.contract_length_month,
      slip_path: filePath,
      expire_at: mysqlTimestamp,
      status_id: 4,
    };

    if (
      !contractData.room_id ||
      !contractData.contract_detail ||
      !contractData.contract_length_month ||
      !contractData.expire_at
    ) {
      console.log("ข้อมูลไม่ครบถ้วน");
      return res.status(400).json({
        status: "error",
        message: "ข้อมูลไม่ครบถ้วน",
      });
    }

    dbConn.query(
      `INSERT INTO contracts SET ?`,
      [contractData],
      (error, results) => {
        if (error) {
          console.error("SQL Error:", error);
          return res.status(500).json({
            status: "error",
            message: "เกิดข้อผิดพลาดในการบันทึกสัญญา",
            error: error,
          });
        }

        res.status(201).json({
          status: "success",
          message: "บันทึกสัญญาเรียบร้อย",
          contractId: results.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Catch Error:", error);
    res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดในระบบ",
      error: error.message,
    });
  }
}

function getNewContracts(req, res) {
  dbConn.query(
    `SELECT * FROM contracts WHERE status_id = 4`,
    (error, results) =>{
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else {
        res.send(results);
      }
    }
  );
}

function approveContract(req, res) {
  dbConn.query(
    `UPDATE contracts SET status_id = 6 WHERE contract_id = ?`,
    [req.params.contract_id],
    (error, results) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      }else{
        res.status(201).json({
          status: "success",
          message: "อนุมัติสัญญาเรียบร้อย",
        });
      }
    }
  );
}


module.exports = {
  getRoomByFloor,
  getOneRoom,
  reserveRoom,
  checkReservation,
  getReservation,
  allReserved,
  approveReservation,
  insertContract,
  getNewContracts,
  approveContract,
  makeRoomUnavailable
};

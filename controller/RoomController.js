const { dbConn, app } = require("../server/server");

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
    if (req.file) {
      console.log("File field name:", req.file.fieldname); // นี่จะพิมพ์ "slip_part"
      console.log("Uploaded file name:", req.file.originalname);
      console.log("Stored file path:", req.file.path);
      // คุณสามารถทำการประมวลผลเพิ่มเติมที่นี่ได้ เช่น บันทึกข้อมูลลงฐานข้อมูล
    }
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
    (error, results) => {
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error,
        });
      } else if (results.length === 0) {
        res.status(404).json({
          status: "not_found",
          message: "ไม่พบข้อมูลการจอง",
        });
      } else {
        res.json(results[0]);
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
    if (!req.files || !req.files["slip_path"] || !req.files["contract_path"]) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาอัพโหลดไฟล์ให้ครบถ้วน",
      });
    }

    const slipFilePath = `../uploads/${req.files["slip_path"][0].filename}`;
    const contractFilePath = `../uploads/${req.files["contract_path"][0].filename}`;

    const expireDate = new Date(req.body.expire_at);
    const mysqlTimestamp = expireDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const contractData = {
      room_id: req.body.room_id,
      reservation_id: req.body.reservation_id,
      contract_detail: req.body.contract_detail,
      contract_length_month: req.body.contract_length_month,
      slip_path: slipFilePath,
      contract_path: contractFilePath,
      expire_at: mysqlTimestamp,
      status_id: 4,
    };

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

function getRoomContract(req, res) {
  dbConn.query(
    `SELECT * FROM contracts WHERE room_id = ?`,
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
        res.send(results[0]);
      }
    }
  );
}

function insertRepair(req, res) {
  try {
    const repairData = {
      room_id: req.body.room_id,
      repair_title : req.body.repair_title,
      repair_detail: req.body.repair_detail,
    };

    const sql = "INSERT INTO repairs SET ?";

    dbConn.query(sql, repairData, (err, result) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          error: err,
        });
      }

      res.status(201).json({
        status: "success",
        message: "บันทึกข้อมูลการซ่อมสำเร็จ",
        repairId: result.insertId,
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

function insertRepairImage(req, res) {
  try {
    if (!req.file) {
      return res.status(201).json({
        status: "success",
        message: "ไม่มีการอัพโหลดรูปภาพ"
      });
    }

    const repairImage = {
      repair_id: req.params.repair_id,
      image_path: `../uploads/${req.file.filename}`,
    };

    const sql = "INSERT INTO repair_images SET ?";

    dbConn.query(sql, repairImage, (err, result) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({
          status: "error", 
          message: "เกิดข้อผิดพลาดในการบันทึกรูปภาพ",
          error: err,
        });
      }

      res.status(201).json({
        status: "success",
        message: "บันทึกรูปภาพสำเร็จ",
        repairImageId: result.insertId,
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

function getUnapprovedRepair(req, res) {
  dbConn.query(
    `SELECT * FROM repairs WHERE status_id = 4 ORDER BY created_at DESC`,
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

function getApprovedRepair(req, res) {
  dbConn.query(
    `SELECT * FROM repairs WHERE status_id = 6 ORDER BY created_at DESC`,
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

function getSuccessRepair(req, res) {
  dbConn.query(
    `SELECT * FROM repairs WHERE status_id = 9 ORDER BY created_at DESC`,
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

function getRepairImages(req, res) {
  dbConn.query(
    `SELECT * FROM repair_images WHERE repair_id = ?`,
    [req.params.repair_id],
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

function approveRepair(req,res){
  dbConn.query(
    `UPDATE repairs SET status_id = 6 WHERE repair_id = ?`,
    [req.params.repair_id],
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

function updateRepairCostStatus(req,res){
  dbConn.query(
    `UPDATE repairs SET repair_cost = ? , status_id = ? WHERE repair_id = ?`,
    [req.body.repair_cost ,req.body.status_id,req.params.repair_id],
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
          message: "อัปเดตการซ่อมเรียบร้อย",
        });
      }
    }
  );
}

function insertRepairDetail(req,res){
  dbConn.query(
    `INSERT INTO repair_details SET ? , repair_id = ?`,
    [req.body , req.params.repair_id],
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
          message: "อัปเดตการซ่อมเรียบร้อย",
        });
      }
    }
  );
}

function insertRepairDetailImages(req, res) {
  if (!req.file) {
    return res.status(201).json({
      status: "success",
      message: "ไม่มีการอัพโหลดรูปภาพ"
    });
  }

  const imageData = {
    repair_detail_id: req.body.repair_detail_id,
    repair_detail_image_path: `../uploads/${req.file.filename}`
  };

  dbConn.query(
    `INSERT INTO repair_detail_images SET ? , repair_id = ?`,
    [imageData , req.params.repair_id],
    (error, result) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
          error: error
        });
      } else {
        res.status(201).json({
          status: "success",
          message: "บันทึกรูปภาพสำเร็จ",
          imageId: result.insertId
        });
      }
    }
  );
}

function getRepairDetail(req, res) {
  dbConn.query(
    `SELECT * FROM repair_details WHERE repair_id = ?`,
    [req.params.repair_id],
    (error, results) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          error: error
        });
      } else {
        res.send(results[0]);
      }
    }
  );
}

function getRepairDetailImages(req, res) {
  dbConn.query(
    `SELECT * FROM repair_detail_images WHERE repair_id = ?`,
    [req.params.repair_id],
    (error, results) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          error: error
        });
      } else {
        res.send(results);
      }
    }
  );
}

function insertLeaving(req, res) {
  try {
    const sql = "INSERT INTO leaving SET ?";

    dbConn.query(sql, req.body, (err, result) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          error: err,
        });
      }

      res.status(201).json({
        status: "success",
        message: "บันทึกข้อมูลการย้ายออกสำเร็จ",
        leavingId: result.insertId,
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

function getUnapprovedLeaving(req, res) {
  dbConn.query(
    `SELECT * FROM leaving ORDER BY created_at DESC`,
    (error, results) => {
      if (error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          error: error
        });
      } else {
        res.send(results);
      }
    }
  );
}

function getMemberByRoom(req, res) {
  dbConn.query(
    `SELECT * FROM members WHERE room_id = ?`,
    [req.params.room_id],
    (error, results) => {
      if(error) {
        console.error("Error:", error);
        res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          error: error
        });
      } else {
        res.send(results[0]);
      }
    }
  );
}

function rejectLeaving(req,res){
  dbConn.query(
    `UPDATE leaving SET status_id = 7 , reject_reason = ? WHERE leaving_id = ?`,
    [req.body.reject_reason,req.params.leaving_id],
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

function approveLeaving(req,res){
  dbConn.query(
    `UPDATE leaving SET status_id = 9 WHERE leaving_id = ?`,
    [req.params.leaving_id],
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
  makeRoomUnavailable,
  getRoomContract,
  insertRepair,
  insertRepairImage,
  getUnapprovedRepair,
  getRepairImages,
  approveRepair,
  getApprovedRepair,
  updateRepairCostStatus,
  insertRepairDetail,
  insertRepairDetailImages,
  getSuccessRepair,
  getRepairDetail,
  getRepairDetailImages,
  insertLeaving,
  getUnapprovedLeaving,
  getMemberByRoom,
  approveLeaving,
  rejectLeaving
};

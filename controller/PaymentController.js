const { dbConn } = require("../server/server");

function createBill(req, res) {
  console.log("Received data:", req.body);

  dbConn.query(`INSERT INTO bills SET ?`, [req.body], (error, results) => {
    if (error) {
      console.error("SQL Error:", error); 
      return res.status(500).json({
        status: "error",
        message: "เกิดข้อผิดพลาดในการบันทึกบิล",
        error: error.sqlMessage || error, 
      });
    }
    res.status(201).json({
      status: "success",
      message: "บันทึกบิลเรียบร้อย",
      billId: results.insertId,
    });
  });
}

function getBill(req,res){
    const { room_id, month, year } = req.params;
    dbConn.query(
      `SELECT * FROM bills WHERE room_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
      [room_id, month, year],
      (error, results) => {
        if (error) {
          console.error("SQL Error:", error);
          return res.status(500).json({
            status: "error",
            message: "เกิดข้อผิดพลาดในการดึงบิล",
            error: error,
          });
        }
        res.send(results[0]);
      }
    );
}

function getLatestBill(req,res){
  dbConn.query( `SELECT * FROM bills WHERE room_id = ? ORDER BY bill_id DESC LIMIT 1`,[req.params.room_id], (error, results) => {
    if (error) {
      console.error("SQL Error:", error);
      return res.status(500).json({
        status: "error",
        message: "เกิดข้อผิดพลาดในการดึงบิล",
        error: error,
      });
    }
    res.send(results[0]);
  })
}

function getRoomBills(req,res){
  dbConn.query( `SELECT * FROM bills WHERE room_id = ? ORDER BY created_at DESC`,[req.params.room_id], (error, results) => {
    if (error) {
      console.error("SQL Error:", error);
      return res.status(500).json({
        status: "error",
        message: "เกิดข้อผิดพลาดในการดึงบิล",
        error: error,
      });
    }
    res.send(results);
  })
}

function payBill(req, res) {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "กรุณาอัปโหลดสลิปการชำระเงิน",
    });
  }

  const filePath = `../uploads/${req.file.filename}`;
  const billId = req.params.bill_id;

  if (!billId || isNaN(billId)) {
    return res.status(400).json({
      status: "error",
      message: "รหัสบิลไม่ถูกต้อง",
    });
  }

  dbConn.query(
    `UPDATE bills SET status_id = 9, slip_path = ? WHERE bill_id = ?`,
    [filePath, billId],
    (error, results) => {
      if (error) {
        console.error("SQL Error:", error);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการชำระบิล",
          error: error,
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          status: "error",
          message: "ไม่พบบิลที่ต้องการชำระ",
        });
      }

      res.json({
        status: "success",
        message: "ชำระบิลเรียบร้อย",
      });
    }
  );
}


module.exports = {
    createBill,
    getBill,
    getLatestBill,
    getRoomBills,
    payBill,
}
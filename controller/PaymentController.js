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

function getBill(req, res) {
  const { room_id, month, year } = req.params;

  // คำนวณเดือนและปีของเดือนก่อนหน้า
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  // คิวรีข้อมูลจาก month, year ที่ระบุ
  dbConn.query(
    `SELECT * FROM bills WHERE room_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
    [room_id, month, year],
    (error, currentResults) => {
      if (error) {
        console.error("SQL Error (current month):", error);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงบิล",
          error: error,
        });
      }

      const currentBill = currentResults.length > 0 ? currentResults[0] : null;

      dbConn.query(
        `SELECT * FROM bills WHERE room_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
        [room_id, prevMonth, prevYear],
        (error, previousResults) => {
          if (error) {
            console.error("SQL Error (previous month):", error);
            return res.status(500).json({
              status: "error",
              message: "เกิดข้อผิดพลาดในการดึงบิลของเดือนก่อนหน้า",
              error: error,
            });
          }

          const previousBill = previousResults[0] || {};

          const result = currentBill
            ? {
                ...currentBill,
                previous_water_used: previousBill.current_water_used || 0,
                previous_electricity_used:
                  previousBill.current_electricity_used || 0,
              }
            : null;

          res.send(result);
        }
      );
    }
  );
}

function getLatestBill(req,res){
  dbConn.query( `SELECT * FROM bills WHERE room_id = ? AND status_id <> 10 ORDER BY bill_id DESC LIMIT 1`,[req.params.room_id], (error, results) => {
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
  dbConn.query( `SELECT * FROM bills WHERE room_id = ? AND status_id <> 10 ORDER BY created_at DESC`,[req.params.room_id], (error, results) => {
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

function releaseBill(req, res) {
  let { month, year } = req.params;

  // First get all bills for the given month/year
  dbConn.query(
    `SELECT bill_id, water_used, electricity_used FROM bills WHERE MONTH(date) = ? AND YEAR(date) = ?`,
    [month, year],
    (error, bills) => {
      if (error) {
        console.error("SQL Error:", error);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูลบิล",
          error: error
        });
      }

      // Calculate total price for each bill
      bills.forEach(bill => {
        let waterPrice = bill.water_used <= 5 ? 150 : 150 + ((bill.water_used - 5) * 20);
        let electricityPrice = bill.electricity_used * 8;
        let totalPrice = waterPrice + electricityPrice;

        // Update each bill with the calculated total price and status
        dbConn.query(
          `UPDATE bills SET total_price = ?, status_id = 4 WHERE bill_id = ?`,
          [totalPrice + 4000, bill.bill_id],
          (updateError) => {
            if (updateError) {
              console.error("Update Error for bill", bill.bill_id, ":", updateError);
            }
          }
        );
      });

      res.json({
        status: "success",
        message: "อัปเดตสถานะและราคารวมของบิลเรียบร้อย",
        affectedRows: bills.length
      });
    }
  );
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
    `UPDATE bills SET slip_path = ? WHERE bill_id = ?`,
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

function createOrUpdateWaterBill(req, res) {
  const checkQuery = `SELECT bill_id FROM bills WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`;

  let { room_id, current_water_used, water_used, date } = req.body;

  const lastMonthQuery = `
    SELECT current_water_used 
    FROM bills 
    WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')
  `;

  dbConn.query(lastMonthQuery, [room_id, date], (err, lastMonthResults) => {
    if (err) {
      console.error("Error fetching last month's water usage:", err);
      return;
    }

    let previous_water_used =
      lastMonthResults.length > 0 ? lastMonthResults[0].current_water_used : 0;

    dbConn.query(checkQuery, [room_id, date], (err, results) => {
      if (err) {
        console.error("Error checking existing bill:", err);
        return;
      }

      if (results.length > 0) {
        const updateQuery = `
          UPDATE bills 
          SET previous_water_used = ?, current_water_used = ?, water_used = ?, updated_at = NOW()
          WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        `;

        dbConn.query(
          updateQuery,
          [previous_water_used, current_water_used, water_used, room_id, date],
          (err, updateResults) => {
            if (err) {
              console.error("Error updating bill:", err);
            } else {
              console.log("Bill updated successfully.");
            }
          }
        );
      } else {
        const insertQuery = `
          INSERT INTO bills (room_id, date, previous_water_used, current_water_used, water_used, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        dbConn.query(
          insertQuery,
          [room_id, date, previous_water_used, current_water_used, water_used],
          (err, insertResults) => {
            if (err) {
              console.error("Error inserting new bill:", err);
            } else {
              console.log("New bill created successfully.");
            }
          }
        );
      }
    });
  });
}

function createOrUpdateElectricityBill(req, res) {
  const checkQuery = `SELECT bill_id FROM bills WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`;

  let { room_id, current_electricity_used, electricity_used, date } = req.body;

  const lastMonthQuery = `
    SELECT current_electricity_used 
    FROM bills 
    WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')
  `;

  dbConn.query(lastMonthQuery, [room_id, date], (err, lastMonthResults) => {
    if (err) {
      console.error("Error fetching last month's electricity usage:", err);
      return;
    }

    let previous_electricity_used =
      lastMonthResults.length > 0
        ? lastMonthResults[0].current_electricity_used
        : 0;

    dbConn.query(checkQuery, [room_id, date], (err, results) => {
      if (err) {
        console.error("Error checking existing bill:", err);
        return;
      }

      if (results.length > 0) {
        const updateQuery = `
          UPDATE bills 
          SET previous_electricity_used = ?, current_electricity_used = ?, electricity_used = ?, updated_at = NOW()
          WHERE room_id = ? AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        `;

        dbConn.query(
          updateQuery,
          [
            previous_electricity_used,
            current_electricity_used,
            electricity_used,
            room_id,
            date,
          ],
          (err, updateResults) => {
            if (err) {
              console.error("Error updating bill:", err);
            } else {
              console.log("Bill updated successfully.");
            }
          }
        );
      } else {
        const insertQuery = `
          INSERT INTO bills (room_id, date, previous_electricity_used, current_electricity_used, electricity_used, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        dbConn.query(
          insertQuery,
          [
            room_id,
            date,
            previous_electricity_used,
            current_electricity_used,
            electricity_used,
          ],
          (err, insertResults) => {
            if (err) {
              console.error("Error inserting new bill:", err);
            } else {
              console.log("New bill created successfully.");
            }
          }
        );
      }
    });
  });
}

function approveBill(req, res) {
  const { bill_id } = req.params;

  dbConn.query(
    `UPDATE bills SET status_id = 9 WHERE bill_id = ?`,
    [bill_id],
    (error, results) => {
      if (error) {
        console.error("SQL Error:", error);
        return res.status(500).json({
          status: "error",
          message: "เกิดข้อผิดพลาดในการอนุมัติบิล",
          error: error,
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          status: "error",
          message: "ไม่พบบิลที่ต้องการอนุมัติ",
        });
      }

      res.json({
        status: "success",
        message: "อนุมัติบิลเรียบร้อย",
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
    createOrUpdateWaterBill,
    createOrUpdateElectricityBill,
    releaseBill,
    approveBill
}
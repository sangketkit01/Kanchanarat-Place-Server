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


module.exports = {
    createBill,
    getBill
}
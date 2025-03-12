const { dbConn } = require("../server/server");

const register = (req, res) => {
  dbConn.query(
    `INSERT INTO members (room_id,role_id,username, password, name,
    email,phone,card_number) VALUES (?, ?, ?,?,?, ?, ?, ?)`,
    [
      req.body.room_id, req.body.role_id, req.body.username, req.body.password, req.body.name, 
      req.body.email, req.body.phone, req.body.card_number
    ],

    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "Database query failed", details: error.message });
      }
      res.status(200).json({ message: "User registered successfully" });
    }
  );
};

const loginVerify = (req, res) => {
  dbConn.query(
    `SELECT * FROM members
    WHERE members.username = ? AND members.password = ?`,
    [req.body.username, req.body.password],
    (error, results) => {
      if (error) {
        console.error("Error:", error);
        return res
          .status(500)
          .json({ error: "Database query failed", details: error.message });
      }
      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      res.send(results[0]);
    }
  );
};

const updateProfile = (req, res) => {
  try {
    console.log("req.file", req.file);
    console.log("req.body", req.body);

    const memberId = req.params.member_id;
    const { name, email, phone, birth_date } = req.body;

    if (!name || !email || !phone || !birth_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    const updateData = {
      name,
      email,
      phone,
      birth_date,
    };

    if (req.file) {
      updateData.profile_image = req.file.path;
    }


    const params = [name, email, phone, birth_date];

    if (req.file) {
      params.push(req.file.path);
    }

    params.push(memberId);


    return res.status(200).json({
      success: true,
      message: "อัปเดตโปรไฟล์สำเร็จ",
      data: {
        member_id: memberId,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์",
      error: error.message,
    });
  }
};

module.exports = { loginVerify , updateProfile, register , updateProfile };

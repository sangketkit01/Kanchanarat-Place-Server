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

module.exports = { loginVerify };

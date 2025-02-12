const { dbConn } = require("../server/server");

const loginVerify = (req, res) => {
  dbConn.query(
    `SELECT * FROM members WHERE username = ? AND password = ?`,
    [req.body.username, req.body.password],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "Database query failed", details: error.message });
      }
      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }
      res.status(200).json({ message: "Login successful", user: results[0] });
    }
  );
};

module.exports = { loginVerify };

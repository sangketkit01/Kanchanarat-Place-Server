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

module.exports = { getRoomByFloor };

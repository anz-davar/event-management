const mysql2 = require("mysql2/promise");

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// iife to test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database");
    connection.release();
  } catch (error) {
    console.error("Error connecting to database: ", error);
  }
})();

module.exports = pool;
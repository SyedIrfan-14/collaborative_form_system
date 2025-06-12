const mysql = require('mysql2/promise');
require('dotenv').config();

let db;

if (process.env.MYSQL_URL) {
  const dbUrl = new URL(process.env.MYSQL_URL);
  db = mysql.createPool({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    port: dbUrl.port || 3306,
  });
} else {
  db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
}

// Optional: Test connection at startup
(async () => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    console.log('MySQL connection established successfully.');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
})();

module.exports = db;

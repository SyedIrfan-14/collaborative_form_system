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
  // fallback if using individual DB_ variables
  db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
}

module.exports = db;

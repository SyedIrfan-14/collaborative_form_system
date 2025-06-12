// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();
const url = require('url');

const dbUrl = process.env.MYSQL_URL;

const { hostname: host, port, pathname, auth } = new URL(dbUrl);
const [user, password] = auth.split(':');
const database = pathname.slice(1); // remove leading /

const db = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;

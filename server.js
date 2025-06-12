const express = require('express');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { ensureAuth } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes'); // adjust if routes are in main file
const db = require('./config/db'); // adjust as needed

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- Socket.io setup ---
const { Server } = require('socket.io');
const io = new Server(server);
require('./socket/socketHandler')(io); // Pass io to your handler

// --- Express & Middleware ---
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Routes ---
app.use('/', authRoutes); // If your auth routes are in a router
// If you have all routes in server.js, you can skip this line

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).render('404', { error: 'Page not found' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

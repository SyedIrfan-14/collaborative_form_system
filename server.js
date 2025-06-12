const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (optional, if you have CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false
}));

// Use authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Use form routes if needed
// const formRoutes = require('./routes/formRoutes');
// app.use('/form', formRoutes);

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Import and use your socket handler (modularized for clarity)
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

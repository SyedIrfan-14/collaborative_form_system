const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (optional, if you have CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route for login, register, etc. (your existing routes)

// Route for collaborative form page
app.get('/form', (req, res) => {
  res.render('form');
});

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('form_update', (data) => {
    // Broadcast the update to all other clients except sender
    socket.broadcast.emit('form_update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

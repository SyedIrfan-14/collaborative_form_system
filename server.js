require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// In production, restrict the CORS origin to your domain for security
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Set CORS_ORIGIN in .env for production
    methods: ['GET', 'POST']
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/api', require('./routes/formRoutes'));

const { authenticate } = require('./middleware/auth');

// Dashboard (protected)
app.get('/dashboard', authenticate, (req, res) => {
  res.send(`<h1>Welcome, User ${req.user.id}</h1><a href="/logout">Logout</a>`);
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token').redirect('/login');
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Socket.IO handler
require('./socket/socketHandler')(io);

// Global error handler (for unhandled errors)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

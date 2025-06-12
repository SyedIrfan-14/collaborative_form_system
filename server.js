require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/authRoutes'));
app.use('/api', require('./routes/formRoutes'));

const { authenticate } = require('./middleware/auth');
app.get('/dashboard', authenticate, (req, res) => {
  res.send(`<h1>Welcome, User ${req.user.id}</h1><a href="/logout">Logout</a>`);
});
app.get('/logout', (req, res) => {
  res.clearCookie('token').redirect('/login');
});

require('./socket/socketHandler')(io);

server.listen(process.env.PORT || 3000, () => console.log('Server running on port 3000'));
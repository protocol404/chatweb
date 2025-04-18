const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// File configuration
const ALLOWED_USERS_FILE = 'allowed_users.txt';
const MESSAGES_FILE = 'messages.json';

// Inisialisasi file
if (!fs.existsSync(ALLOWED_USERS_FILE)) {
  fs.writeFileSync(ALLOWED_USERS_FILE, 'admin\nguest\nuser\n');
}

if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, '[]');
}

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', (req, res) => {
  const username = req.body.username.trim();
  const allowedUsers = fs.readFileSync(ALLOWED_USERS_FILE, 'utf-8').split('\n');

  if (allowedUsers.includes(username)) {
    res.redirect(`/chat?username=${encodeURIComponent(username)}`);
  } else {
    res.status(403).send('Username tidak valid');
  }
});

app.get('/chat', (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect('/');
  res.sendFile(__dirname + '/views/chat.html');
});

// Socket.io Logic
const onlineUsers = new Set();

io.on('connection', (socket) => {
  let currentUsername = '';
  
  socket.on('set-username', (username) => {
    currentUsername = username;
    onlineUsers.add(username);
    io.emit('update-users', Array.from(onlineUsers));
  });

  // Kirim history chat
  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
  socket.emit('load-messages', messages);

  socket.on('send-message', (data) => {
    const newMessage = {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    // Simpan ke file
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    messages.push(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    // Broadcast ke semua client
    io.emit('new-message', newMessage);
  });

  socket.on('disconnect', () => {
    if (currentUsername) {
      onlineUsers.delete(currentUsername);
      io.emit('update-users', Array.from(onlineUsers));
    }
  });
}); // <-- Penambahan penutup yang hilang

// Start server
server.listen(3000, () => {
  console.log('Server running on port 3000');
}); // <-- Penambahan penutup yang hilang
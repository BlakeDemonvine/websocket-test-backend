// app.js - enhanced logging + robust binding
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // 若需要可加 cors 設定
  // cors: { origin: '*' }
});

let clickCount = 0;
const PORT = parseInt(process.env.PORT, 10) || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// Basic routes:
app.get('/', async (req, res) => {
  try {
    const mobileUrl = `${APP_URL}/mobile`;
    const qr = await QRCode.toDataURL(mobileUrl);
    res.send(`
      <html>
        <body style="text-align:center;font-family:sans-serif;">
          <h1>即時互動</h1>
          <p>掃描 QRCode 用手機參與：<a href="${mobileUrl}" target="_blank">${mobileUrl}</a></p>
          <img src="${qr}" />
          <h2>總點擊數: <span id="count">0</span></h2>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io(); // 相對連線
            socket.on("update", (count) => {
              document.getElementById("count").innerText = count;
            });
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error in / route:', err);
    res.status(500).send('Server error');
  }
});

app.get('/mobile', (req, res) => {
  res.send(`
    <html>
      <body style="text-align:center;font-family:sans-serif;">
        <h1>點我送出！</h1>
        <button id="btn" style="font-size:30px;padding:20px;">Click</button>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          document.getElementById("btn").onclick = () => {
            socket.emit("clicked");
          };
        </script>
      </body>
    </html>
  `);
});

// socket.io
io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);
  socket.emit('update', clickCount);

  socket.on('clicked', () => {
    clickCount++;
    io.emit('update', clickCount);
  });

  socket.on('disconnect', (reason) => {
    console.log('socket disconnected:', socket.id, reason);
  });
});

// global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // optionally process.exit(1) to let platform restart cleanly
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at Promise:', p, 'reason:', reason);
});

// bind to 0.0.0.0 to ensure external connectivity on some hosts
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT} (APP_URL=${APP_URL})`);
});

// app.js (完整、已整合 env)
require('dotenv').config(); // 本地測試用；放著沒壞處

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let clickCount = 0;
const PORT = process.env.PORT || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

app.get('/', async (req, res) => {
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
          const socket = io();
          socket.on("update", (count) => {
            document.getElementById("count").innerText = count;
          });
        </script>
      </body>
    </html>
  `);
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

io.on('connection', (socket) => {
  socket.emit('update', clickCount);
  socket.on('clicked', () => {
    clickCount++;
    io.emit('update', clickCount);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

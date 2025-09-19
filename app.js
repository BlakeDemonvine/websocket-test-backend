// app.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let clickCount = 0;

// 主頁
app.get("/", async (req, res) => {
  const mobileUrl = "http://localhost:3000/mobile";
  const qr = await QRCode.toDataURL(mobileUrl);

  res.send(`
    <html>
      <body style="text-align:center; font-family: sans-serif;">
        <h1>即時互動</h1>
        <p>掃描 QRCode 用手機參與</p>
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

// 手機頁
app.get("/mobile", (req, res) => {
  res.send(`
    <html>
      <body style="text-align:center; font-family: sans-serif;">
        <h1>點我送出！</h1>
        <button id="btn" style="font-size:30px; padding:20px;">Click</button>
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

// socket.io 即時處理
io.on("connection", (socket) => {
  console.log("使用者連線");

  socket.emit("update", clickCount);

  socket.on("clicked", () => {
    clickCount++;
    io.emit("update", clickCount);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

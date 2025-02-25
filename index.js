const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 0;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
   
  })
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log("DB Connection Error:", err.message));

// API Endpoints
app.get("/ping", (_req, res) => res.json({ msg: "Ping Successful" }));
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Handle "port in use" error
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use. Trying a different port...`);
    server.listen(0); // Use a random available port
  } else {
    console.error("Server error:", err);
  }
});

// Socket.io Configuration
const io = socket(server, {
  cors: {
    origin: "https://phillchat.kenswedtechclub.org", // Update with frontend URL if needed
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});

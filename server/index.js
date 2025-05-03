require("dotenv").config();
const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 3005;
const pool = require("./db/connection");

// Make io accessible to routes
app.set('io', io);

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  
  // Join a room for a specific event
  socket.on('joinEvent', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Socket ${socket.id} joined room: event-${eventId}`);
  });
  
  // Leave a room
  socket.on('leaveEvent', (eventId) => {
    socket.leave(`event-${eventId}`);
    console.log(`Socket ${socket.id} left room: event-${eventId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

app.use("/api/users", require("./api/users/routes"));
app.use("/api/halls", require("./api/halls/routes"));
app.use("/api/eventtables", require("./api/eventtables/routes"));
// USE TABLES API
app.use("/api/tables", require("./api/tables/routes"));
app.use("/api/seatingarrangement", require("./api/seatingarrangement/routes"));
app.use("/api/guests", require("./api/guests/routes"));
// events
app.use("/api/events", require("./api/events/routes"));

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

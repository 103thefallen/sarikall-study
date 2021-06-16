const path = require("path");
const express = require("express");
const app = express();

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "https://sarikall-spy-game.pages.dev",
  },
});

app.use("/", express.static(path.join(__dirname, "public")));

const generateRoomID = () => Math.random().toString(36).substr(2, 4);
const getColorOfMember = ({ memberID, membersArray }) =>
  ["red", "green", "blue", "purple", "yellow", "cyan", "black", "white"][
    membersArray.findIndex(memberID)
  ];

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("socket:connected", { socketID: socket.id });

  socket.on("room:create", async () => {
    let roomID = null;
    while (rooms.has(roomID)) {
      roomID = generateRoomID();
    }
    rooms.set(roomID, { messages: [], members: [], timeLeft: 60 });
    socket.emit("room:create:gotoJoin", { roomID });
  });

  socket.on("room:join", async ({ roomID }) => {
    const room = rooms.get(roomID);
    if (!room) {
      socket.emit("room:join:error", "Room does not exist");
      return;
    }
    if (room.members.length === 8) {
      socket.emit("room:join:error", "Room is full");
      return;
    }
    if (room.members.length === 1) {
      const timer = setInterval(() => {
        io.to(roomID).emit("waitRoom:tick", room.timeLeft--);
        if (room.timeLeft === 0) {
          clearInterval(timer);
        }
      }, 1000);
    }

    socket.join(roomID);
    room.members.push(roomID);
  });
});

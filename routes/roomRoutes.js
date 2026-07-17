const express = require("express");
const router = express.Router();

const {
  createRoom,
  inviteUser,
  getMyRooms,
} = require("../controllers/roomController");

router.post("/create", createRoom);

router.post("/invite", inviteUser);

router.get("/myrooms/:ownerId", getMyRooms);

module.exports = router;
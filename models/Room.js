const roomSchema = new mongoose.Schema({
  roomId: String,

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  invitedUsers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["editor", "viewer"],
        default: "viewer",
      },
    },
  ],
});
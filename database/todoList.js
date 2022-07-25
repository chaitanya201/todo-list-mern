const mongoose = require("mongoose");


const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  todo: [
    {
      task: { type: String, require: true, trim: true },
      priority: {
        type: String,
        require: true,
        trim: true,
        enum: {
          values: ["high", "low", "medium"],
          message: "{VALUE} is not valid priority.",
        },
      },
      isCompleted: { type: Boolean, default: false },
    },
  ],
});

const todoModel = new mongoose.model("TodoList", todoSchema);
module.exports = todoModel;

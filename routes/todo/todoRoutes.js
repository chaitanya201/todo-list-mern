const express = require("express");
const todoModel = require("../../database/todoList");
const { taskSchema, updateTaskSchema } = require("../schemas/taskSchema");
const router = express.Router();

const isValidPriority = (priority) => {
  return ["low", "medium", "high"].includes(priority);
};

// Add tasks function.
const addTask = async (req, res) => {
  console.log("In add task.");

  const { error } = taskSchema.validate(req.body);
  if (error) {
    console.log("joi error");
    console.log(error);
    return res.send({
      status: false,
      msg: "Please provide all/valid components",
    });
  }

  if (!isValidPriority) {
    console.log("invalid priority");
    return res.send({ status: false, msg: "Invalid priority." });
  }

  // get all previous tasks.
  let previousTasks;
  try {
    previousTasks = await todoModel.findOne({ userId: req.user._id });
  } catch (error) {
    return res.send({
      status: false,
      msg: "Internal Server Error. Try again later.",
    });
  }
  console.log("task is ", req.body.task);
  console.log("priority is ", req.body.priority);
  // if length is zero then creating new task object for the first time.
  if (!previousTasks) {
    console.log("save started...");
    console.log("userId", req.body.userId);
    try {
      const task = new todoModel({
        userId: req.body.userId,
        todo: [
          {
            task: req.body.task,
            priority: req.body.priority,
          },
        ],
      });
      const savedTask = await task.save();
      console.log("saved task ", savedTask);
    } catch (error) {
      console.log("error while saving");
      console.log(error);
      return res.send({ status: false, msg: "Unable to save task." });
    }
    console.log("save ended.");

    // getting all tasks.
    let allTasks;
    try {
      allTasks = await todoModel.find({ userId: req.user._id });
      if (!addTask) {
        console.log("no task found");
        return res.send({ status: false, msg: "Unable to retrieve tasks." });
      }
    } catch (error) {
      console.log("error while getting all tasks.");
      console.log(error);
      return res.send({ status: false, msg: "Unable to retrieve tasks." });
    }

    return res.send({ status: true, tasks: allTasks });
  }
  console.log("pre tasks", previousTasks.todo);
  // adding task to existing tasks.
  try {
    const addTask = await todoModel.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        todo: [
          ...previousTasks.todo,
          { task: req.body.task, priority: req.body.priority },
        ],
      }
    );
    if (!addTask) {
      console.log("not added");
      return res.send({ status: false, msg: "Unable to add task." });
    }
  } catch (error) {
    console.log("error while updating new task.");
    console.log(error);
    return res.send({
      status: false,
      msg: "Internal Server Error. Unable to add task.",
    });
  }

  // getting all tasks of current user.
  let allTasks;
  try {
    allTasks = await todoModel.find({ userId: req.user._id });
    if (!addTask) {
      console.log("no task found");
      return res.send({ status: false, msg: "Unable to retrieve tasks." });
    }
  } catch (error) {
    console.log("error while getting all tasks.");
    console.log(error);
    return res.send({ status: false, msg: "Unable to retrieve tasks." });
  }

  return res.send({ status: true, tasks: allTasks });
};

const isTaskValid = async (taskId, userId) => {
  console.log("........");
  try {
    const findTask = await todoModel.findOne({
      "todo.$._id": taskId,
      userId: userId,
    });
    if (!findTask) {
      console.log("task not found***");
      return false;
    }
  } catch (error) {
    console.log("error while finding task.");
    console.log(error);
    return false;
  }

  return true;
};

// MARK AS COMPLETE.
const markAsCompleted = async (req, res) => {
  console.log("In mark as completed");
  if (!req.query.taskId) {
    console.log("no task id");
    return res.send({ status: false, msg: "Provide task." });
  }

  // check if task exists or not.
  if (!isTaskValid(req.query.taskId, req.query.userId)) {
    console.log("invalid task");
    return res.send({ status: false, msg: "Invalid task." });
  }
  // update task.
  try {
    const updateTask = await todoModel.findOneAndUpdate(
      { "todo._id": req.query.taskId, userId: req.query.userId },
      { "todo.$.isCompleted": true },
      { new: true }
    );
    if (!updateTask) {
      console.log("not updated");
      return res.send({ status: false, msg: "task not updated." });
    }
    console.log("task updated..");
    console.log(updateTask.todo);
    return res.send({ status: true, tasks: updateTask });
  } catch (error) {
    console.log("error while updating");
    console.log(error);
    return res.send({
      status: false,
      msg: "Internal Server Error. Try again.",
    });
  }
};


// UPDATE TASK...
const updateTask = async (req, res) => {
  console.log("in update task.");
  const { error } = updateTaskSchema.validate(req.body);
  if (error) {
    console.log("joi error");
    console.log(error);
    return res.send({ status: false, msg: "Provide all/valid parameters." });
  }

  if (!isTaskValid(req.body.taskId, req.body.userId)) {
    console.log("task is invalid");
    return res.send({ status: false, msg: "Invalid task." });
  }

  // update task.
  try {
    const updatedTask = await todoModel.findOneAndUpdate(
      { userId: req.body.userId, "todo._id": req.body.taskId },
      {
        "todo.$.task": req.body.task,
        "todo.$.priority": req.body.priority,
        "todo.isCompleted": req.body.isCompleted,
      },
      { new: true }
    );

    if (!updatedTask) {
      console.log("not updated");
      return res.send({
        status: false,
        msg: "Task not updated. Server Error.",
      });
    }

    console.log("task updated.");
    console.log(updatedTask.todo);
    return res.send({ status: true, tasks: updatedTask });
  } catch (error) {
    console.log("error while updating");
    console.log(error);
    return res.send({
      status: false,
      msg: "Something went wrong. Please try again later.",
    });
  }
};

// DELETE TASK.
const deleteTask = async (req, res) => {
  console.log("in DELETE task.");

  if (!isTaskValid(req.query.taskId, req.query.userId)) {
    console.log("task is invalid");
    return res.send({ status: false, msg: "Invalid task." });
  }

  // delete task.
  try {
    const delTask = await todoModel.updateOne(
      { userId: req.query.userId, "todo.$._id": req.query.taskId },
      { $pull: { todo: { _id: req.query.taskId } } }
    );

    if (!delTask) {
      console.log("not updated");
      return res.send({
        status: false,
        msg: "Task not updated. Server Error.",
      });
    }

    console.log("task updated.");
    console.log(delTask);
    return res.send({ status: true, tasks: delTask });
  } catch (error) {
    console.log("error while updating");
    console.log(error);
    return res.send({
      status: false,
      msg: "Something went wrong. Please try again later.",
    });
  }
};



// Get all todo list of user
const getTodo = async(req, res) => {
  console.log("in get todo");
  try {
    const todo = await todoModel.findOne({userId: req.user._id}).populate('userId')
    if(!todo){
      console.log("todo not found.");
      return res.send({status: false, msg: "No tasks found."})
    }

    console.log("todo found");
    return res.send({status: true, todo:todo})
  } catch (error) {
    console.log(".............");
    console.log(error);
    return res.send({status: false, msg : "Unable to get tasks."})
  }
}

const logout = (req, res) => {
  console.log("in logout");
  res.clearCookie("user");
  res.clearCookie("token");
  return res.send({ status: "success" });
};



router.post("/add", addTask);
router.post("/update", updateTask);
router.delete("/delete", deleteTask);
router.get("/mark-complete", markAsCompleted);
router.get('/get', getTodo)
router.get('/logout', logout)

module.exports = router;

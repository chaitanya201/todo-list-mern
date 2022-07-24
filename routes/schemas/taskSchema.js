const joi = require('joi');

const taskSchema = joi.object({
    task : joi.string().required().min(3),
    priority : joi.string().required(),
    userId: joi.string().required()
})
const updateTaskSchema = joi.object({
    task : joi.string().required().min(3),
    priority : joi.string().required(),
    userId: joi.string().required(),
    taskId: joi.string().required(),
})

module.exports = {taskSchema, updateTaskSchema}
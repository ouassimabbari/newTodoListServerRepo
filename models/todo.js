const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new Schema({
    title: String,
    userID: String,
    forDate: Date,
    isCompleted: Boolean
});

module.exports = mongoose.model('Todo', todoSchema);
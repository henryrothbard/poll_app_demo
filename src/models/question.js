const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    creator: { type: String, required: true },
    anonymous: Boolean,
    question: { type: String, required: true },
    date: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    votes: { type: Map, of: Number, default: () => new Map([['yes', 0], ['no', 0]])},
});

module.exports = mongoose.model('Question', QuestionSchema);
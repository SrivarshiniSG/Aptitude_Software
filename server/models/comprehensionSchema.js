import mongoose from "mongoose";

// Define the sub-question schema
const subQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: [arr => arr.length === 4, 'Must have exactly 4 options']
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    }
});

// Define the main comprehension schema
const comprehensionSchema = new mongoose.Schema({
    passage: {
        type: String,
        required: true
    },
    subQuestions: {
        type: [subQuestionSchema],
        required: true,
        validate: [arr => arr.length > 0, 'Must have at least one sub-question']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create and export the model
const ComprehensionQuestion = mongoose.model('ComprehensionQuestion', comprehensionSchema);

export default ComprehensionQuestion;
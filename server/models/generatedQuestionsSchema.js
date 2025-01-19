import mongoose from "mongoose";

const generatedQuestionsSchema = new mongoose.Schema({
    regNo: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    aptitudeQuestions: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Question',
        validate: {
            validator: function(arr) {
                return arr.length === 10;
            },
            message: 'Aptitude questions array must contain exactly 10 questions'
        }
    },
    coreQuestions: {
        type: [mongoose.Schema.Types.ObjectId],
        validate: {
            validator: function(arr) {
                return arr.length === 20;
            },
            message: 'Core questions array must contain exactly 20 questions'
        }
    },
    verbalQuestions: {
        type: [mongoose.Schema.Types.ObjectId],
        validate: {
            validator: function(arr) {
                return arr.length === 5;
            },
            message: 'Verbal questions array must contain exactly 5 questions'
        }
    },
    programmingQuestions: {
        type: [mongoose.Schema.Types.ObjectId],
        validate: {
            validator: function(arr) {
                return arr.length === 10;
            },
            message: 'Programming questions array must contain exactly 10 questions'
        }
    },
    comprehensionQuestions: {
        type: [mongoose.Schema.Types.ObjectId],
        validate: {
            validator: function(arr) {
                return arr.length === 1;
            },
            message: 'Comprehension questions array must contain exactly 1 question'
        }
    }
}, { timestamps: true });

const GeneratedQuestions = mongoose.model('GeneratedQuestions', generatedQuestionsSchema);

export default GeneratedQuestions;
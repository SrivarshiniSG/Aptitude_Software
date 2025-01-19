import mongoose from "mongoose";
const { Schema } = mongoose;

/** Question Schema */
const questionSchema = new Schema({
    category: {
        type: String,
        required: true
    },
    subCategory: String,
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 4;
            },
            message: 'Four options are required'
        }
    },
    correctAnswer: {
        type: Number,
        required: true
    },
    image: String,
    createdAt: { type: Date, default: Date.now }
});

// Create models for each category
export const AptitudeQuestion = mongoose.model('AptitudeQuestion', questionSchema);
export const CoreQuestion = mongoose.model('CoreQuestion', questionSchema);
export const VerbalQuestion = mongoose.model('VerbalQuestion', questionSchema);
export const ProgrammingQuestion = mongoose.model('ProgrammingQuestion', questionSchema);

// Export the model map for easy access
export const modelMap = {
    'aptitude': AptitudeQuestion,
    'core': CoreQuestion,
    'verbal': VerbalQuestion,
    'programming': ProgrammingQuestion
};
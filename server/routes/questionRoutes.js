import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadImageToR2 } from '../utils/imageUpload.js';
import { auth, checkRole } from '../middleware/auth.js';
import ComprehensionModel from '../models/comprehensionSchema.js';
import { AptitudeQuestion, CoreQuestion, VerbalQuestion, ProgrammingQuestion, modelMap } from '../models/questionSchema.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});


// Single route for regular questions
router.post('/questions', auth, checkRole(['question_uploader']), upload.single('image'), async (req, res) => {
    try {
        console.log('Received question data:', req.body);
        console.log('Received file:', req.file);
        
        const { category, subCategory, question, options, correctAnswer } = req.body;
        
        // Extract options from form data if not provided as array
        let parsedOptions = options;
        if (!Array.isArray(options)) {
            parsedOptions = [];
            for (let i = 0; i < 4; i++) {
                const option = req.body[`options[${i}]`] || req.body.options?.[i];
                if (option) {
                    parsedOptions.push(option);
                }
            }
        }

        // For core questions, subCategory is required
        if (category === 'core' && !subCategory) {
            throw new Error('Sub-category is required for core questions');
        }

        const QuestionModel = modelMap[category];
        if (!QuestionModel) {
            throw new Error(`Invalid category: ${category}`);
        }

        // Upload image to R2 if present
        let imageUrl = null;
        if (req.file) {
            console.log('Uploading image to R2...');
            imageUrl = await uploadImageToR2(req.file);
            console.log('Image uploaded, URL:', imageUrl);
        }

        const newQuestion = new QuestionModel({
            category,
            subCategory,
            question,
            options: parsedOptions,
            correctAnswer: Number(correctAnswer),
            image: imageUrl
        });

        console.log('Question to be saved:', newQuestion);

        const savedQuestion = await newQuestion.save();
        
        res.status(201).json({ 
            message: 'Question added successfully',
            question: savedQuestion
        });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            message: 'Error adding question',
            error: error.message,
            requestData: {
                body: req.body,
                file: req.file ? 'Present' : 'Not present',
                options: req.body.options
            }
        });
    }
});

// Route for comprehension questions
router.post('/comprehension', auth, checkRole(['question_uploader']), upload.single('image'), async (req, res) => {
    try {
        const { passage } = req.body;

        // Validate passage
        if (!passage) {
            throw new Error('Passage is required');
        }

        // Create an object to store the comprehension data
        const comprehensionData = {
            passage
        };

        // Process each question (q1 through q5)
        for (let i = 1; i <= 5; i++) {
            const qKey = `q${i}`;
            const question = req.body[`${qKey}.question`];
            const options = [];
            const correctAnswer = req.body[`${qKey}.correctAnswer`];

            // Validate question
            if (!question) {
                throw new Error(`Question ${i} is required`);
            }

            // Extract and validate options
            for (let j = 0; j < 4; j++) {
                const option = req.body[`${qKey}.options[${j}]`];
                if (!option) {
                    throw new Error(`Option ${j + 1} for question ${i} is required`);
                }
                options.push(option);
            }

            // Validate correct answer
            if (correctAnswer === undefined || correctAnswer === '') {
                throw new Error(`Correct answer for question ${i} is required`);
            }

            // Add to comprehension data
            comprehensionData[qKey] = {
                question,
                options,
                correctAnswer: Number(correctAnswer)
            };
        }

        // Upload image to R2 if present
        const imageUrl = await uploadImageToR2(req.file);
        if (imageUrl) {
            comprehensionData.image = imageUrl;
        }

        const newComprehension = new ComprehensionModel(comprehensionData);
        const savedComprehension = await newComprehension.save();
        
        res.status(201).json({ 
            message: 'Comprehension question set added successfully',
            comprehension: savedComprehension
        });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            message: 'Error adding comprehension question',
            error: error.message,
            requestData: {
                body: req.body
            }
        });
    }
});

export { router };

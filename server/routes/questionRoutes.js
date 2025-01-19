console.log('Loading questionRoutes.js');

import express from 'express';
import mongoose from 'mongoose';
import ComprehensionQuestion from '../models/comprehensionSchema.js';

// Add these debug logs at the top after imports
console.log('\n=== Debugging ComprehensionQuestion Model ===');
console.log('ComprehensionQuestion:', ComprehensionQuestion);
console.log('Model name:', ComprehensionQuestion.modelName);
console.log('Collection name:', ComprehensionQuestion.collection.name);

// Add this line to verify the model is loaded
console.log('ComprehensionQuestion model:', ComprehensionQuestion.modelName);

const router = express.Router();

console.log('Loading question routes...');

// 1. Add this middleware to log all requests to this router
router.use((req, res, next) => {
    console.log('\n=== Question Router Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Full URL:', req.originalUrl);
    next();
});

// 2. Add these specific routes FIRST
router.get('/test-specific', (req, res) => {
    res.json({ message: 'Specific test route working' });
});

// 3. Add comprehension routes
router.post('/comprehension', async (req, res) => {
    console.log('Comprehension POST route hit');
    try {
        const { passage, subQuestions } = req.body;
        const newQuestion = new ComprehensionQuestion({
            passage,
            subQuestions
        });
        const saved = await newQuestion.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error('Comprehension save error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/comprehension', async (req, res) => {
    console.log('Comprehension GET route hit');
    try {
        const questions = await ComprehensionQuestion.find();
        res.json(questions);
    } catch (error) {
        console.error('Comprehension fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Add your existing routes for specific question types
router.post('/aptitude-questions', async (req, res) => {
    try {
        const { question, options, correctAnswer, category } = req.body;
        
        const newQuestion = new AptitudeQuestion({
            category: 'aptitude',
            subCategory: category,  // This preserves the subcategory
            question,
            options,
            correctAnswer
        });

        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
        console.error('Error adding aptitude question:', error);
        res.status(500).json({ message: 'Error adding question' });
    }
});

router.post('/verbal-questions', async (req, res) => {
    try {
        const { question, options, correctAnswer, category } = req.body;
        
        const newQuestion = new VerbalQuestion({
            category: 'verbal',
            subCategory: category,  // This preserves the subcategory
            question,
            options,
            correctAnswer
        });

        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
        console.error('Error adding verbal question:', error);
        res.status(500).json({ message: 'Error adding question' });
    }
});

router.post('/programming-questions', async (req, res) => {
    try {
        const { question, options, correctAnswer, category } = req.body;
        
        const newQuestion = new ProgrammingQuestion({
            category: 'programming',
            subCategory: category,  // This preserves the subcategory
            question,
            options,
            correctAnswer
        });

        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
        console.error('Error adding programming question:', error);
        res.status(500).json({ message: 'Error adding question' });
    }
});

router.post('/core-questions', async (req, res) => {
    try {
        const { question, options, correctAnswer, category } = req.body;
        
        const newQuestion = new CoreQuestion({
            category: 'core',
            subCategory: category,  // This preserves the subcategory for department-specific questions
            question,
            options,
            correctAnswer
        });

        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
        console.error('Error adding core question:', error);
        res.status(500).json({ message: 'Error adding question' });
    }
});

// Add this BEFORE your /:departmentId route
router.route('/comprehension-questions')
    .post(async (req, res) => {
        console.log('POST /comprehension-questions hit');
        try {
            const { passage, subQuestions } = req.body;
            if (!passage || !subQuestions) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }

            const newQuestion = new ComprehensionQuestion({
                passage,
                subQuestions
            });

            const saved = await newQuestion.save();
            console.log('Saved comprehension question:', saved);
            
            res.status(201).json(saved);
        } catch (error) {
            console.error('Error saving comprehension question:', error);
            res.status(500).json({ error: error.message });
        }
    })
    .get(async (req, res) => {
        console.log('GET /comprehension-questions hit');
        try {
            const questions = await ComprehensionQuestion.find();
            res.json(questions);
        } catch (error) {
            console.error('Error fetching comprehension questions:', error);
            res.status(500).json({ error: error.message });
        }
    });

// Modify your existing /:departmentId route to skip comprehension routes
router.get('/:departmentId', async (req, res, next) => {
    if (req.params.departmentId === 'comprehension-questions') {
        return next();
    }
    try {
        const { departmentId } = req.params;
        console.log('Fetching questions for department:', departmentId);

        // Get questions based on department
        const aptitudeQuestions = await AptitudeQuestion.find().lean().limit(10);
        
        // Get core questions specific to department
        const coreQuestions = await CoreQuestion.find({ 
            subCategory: departmentId 
        }).lean().limit(20);

        // Get one random comprehension question
        const comprehensionQuestion = await ComprehensionQuestion.aggregate([
            { $sample: { size: 1 } }
        ]);

        // Transform comprehension question into 5 separate questions
        const comprehensionQuestions = comprehensionQuestion[0] ? 
            comprehensionQuestion[0].subQuestions.map(sq => ({
                category: 'verbal',
                question: `${comprehensionQuestion[0].passage}\n\n${sq.question}`,
                options: sq.options,
                correctAnswer: sq.correctAnswer
            })) : [];

        // Get remaining 5 verbal questions
        const verbalQuestions = await VerbalQuestion.find().lean().limit(5);
        
        // Get programming questions
        const programmingQuestions = await ProgrammingQuestion.find().lean().limit(10);

        const allQuestions = [
            ...aptitudeQuestions,
            ...coreQuestions,
            ...comprehensionQuestions,  // First 5 verbal questions (comprehension)
            ...verbalQuestions,         // Last 5 verbal questions
            ...programmingQuestions
        ];

        const answers = allQuestions.map(q => q.correctAnswer);

        console.log(`Found ${allQuestions.length} questions for ${departmentId}`);

        res.json([{
            questions: allQuestions,
            answers: answers
        }]);

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ 
            error: 'Error fetching questions',
            details: error.message 
        });
    }
});

// Add a test route at the top
router.get('/test-route', (req, res) => {
    res.json({ message: 'Question router is working' });
});

// Add debug route for comprehension
router.get('/comprehension-test', (req, res) => {
    res.json({ message: 'Comprehension route is accessible' });
});

// Question Schema
const questionSchema = new mongoose.Schema({
  category: String,
  subCategory: String,
  question: String,
  options: [String],
  correctAnswer: Number,
  createdAt: { type: Date, default: Date.now }
});

// Models
const AptitudeQuestion = mongoose.model('AptitudeQuestion', questionSchema);
const CoreQuestion = mongoose.model('CoreQuestion', questionSchema);
const VerbalQuestion = mongoose.model('VerbalQuestion', questionSchema);
const ProgrammingQuestion = mongoose.model('ProgrammingQuestion', questionSchema);

// Route to get all questions
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all questions...'); // Debug log

    const aptitudeQuestions = await AptitudeQuestion.find().lean();
    const coreQuestions = await CoreQuestion.find().lean();
    const verbalQuestions = await VerbalQuestion.find().lean();
    const programmingQuestions = await ProgrammingQuestion.find().lean();

    const allQuestions = [
      ...aptitudeQuestions,
      ...coreQuestions,
      ...verbalQuestions,
      ...programmingQuestions
    ];

    const answers = allQuestions.map(q => q.correctAnswer);

    console.log(`Found ${allQuestions.length} questions`); // Debug log

    res.json([{
      questions: allQuestions,
      answers: answers
    }]);

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ 
      error: 'Error fetching questions',
      details: error.message 
    });
  }
});

// Add question route
router.post('/add', async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Debug log

    const { category, subCategory, question, options, correctAnswer } = req.body;

    // Validate inputs
    if (!category) {
      throw new Error('Category is required');
    }
    if (!subCategory) {
      throw new Error('Sub-category is required');
    }
    if (!question) {
      throw new Error('Question is required');
    }
    if (!Array.isArray(options) || options.length !== 4) {
      throw new Error('Four options are required');
    }
    if (correctAnswer === undefined || correctAnswer === '') {
      throw new Error('Correct answer is required');
    }

    // Select the appropriate model based on category
    let QuestionModel;
    switch (category) {
      case 'aptitude':
        QuestionModel = AptitudeQuestion;
        break;
      case 'core':
        QuestionModel = CoreQuestion;
        break;
      case 'verbal':
        QuestionModel = VerbalQuestion;
        break;
      case 'programming':
        QuestionModel = ProgrammingQuestion;
        break;
      default:
        throw new Error(`Invalid category: ${category}`);
    }

    console.log('Selected model:', QuestionModel.modelName); // Debug log

    const newQuestion = new QuestionModel({
      category,
      subCategory,
      question,
      options,
      correctAnswer: Number(correctAnswer)
    });

    console.log('Created question object:', newQuestion); // Debug log

    const savedQuestion = await newQuestion.save();
    console.log('Saved question:', savedQuestion); // Debug log

    res.status(201).json({ 
      message: 'Question added successfully',
      question: savedQuestion 
    });
  } catch (error) {
    console.error('Detailed error:', error); // Debug log
    res.status(500).json({ 
      message: 'Error adding question',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add this at the top of your routes
router.get('/test', (req, res) => {
    res.json({ message: 'Question routes working' });
});

// Move this route BEFORE the /:departmentId route
router.get('/comprehension/test', async (req, res) => {
    console.log('\n=== COMPREHENSION TEST ROUTE ===');
    try {
        // 1. Verify model
        console.log('1. Checking model...');
        if (!ComprehensionQuestion || !ComprehensionQuestion.modelName) {
            throw new Error('ComprehensionQuestion model not properly initialized');
        }
        console.log('Model verified:', ComprehensionQuestion.modelName);

        // 2. Create test question
        console.log('2. Creating test question...');
        const testQuestion = new ComprehensionQuestion({
            passage: "Test passage " + Date.now(),
            subQuestions: [
                {
                    question: "Q1?",
                    options: ["A1", "B1", "C1", "D1"],
                    correctAnswer: 0
                },
                // ... other questions ...
            ]
        });

        // 3. Save question
        console.log('3. Attempting to save...');
        const saved = await testQuestion.save();
        console.log('Save successful! ID:', saved._id);

        return res.json({
            success: true,
            message: 'Comprehension question created',
            question: saved
        });

    } catch (error) {
        console.error('ERROR in comprehension test route:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/test-db', async (req, res) => {
    try {
        // Try to create a test document
        const testDoc = new ComprehensionQuestion({
            passage: "Test passage",
            subQuestions: [{
                question: "Test question?",
                options: ["A", "B", "C", "D"],
                correctAnswer: 0
            }]
        });
        
        await testDoc.save();
        
        res.json({ 
            message: 'Database connection working',
            testDoc 
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            error: 'Database connection error',
            details: error.message 
        });
    }
});

router.get('/test-comprehension', async (req, res) => {
    try {
        // Try to create a test document
        const testDoc = new ComprehensionQuestion({
            passage: "Test passage",
            subQuestions: [{
                question: "Test question?",
                options: ["A", "B", "C", "D"],
                correctAnswer: 0
            }]
        });
        
        await testDoc.save();
        
        res.json({ 
            message: 'Comprehension model is working',
            testDoc 
        });
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ 
            error: 'Test failed',
            details: error.message 
        });
    }
});

router.get('/test-comprehension-model', async (req, res) => {
    try {
        console.log('Testing comprehension model...');
        
        // Create a test document
        const testQuestion = new ComprehensionQuestion({
            passage: "This is a test passage",
            subQuestions: [
                {
                    question: "Test question 1?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 0
                },
                {
                    question: "Test question 2?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 1
                },
                {
                    question: "Test question 3?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 2
                },
                {
                    question: "Test question 4?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 3
                },
                {
                    question: "Test question 5?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 0
                }
            ]
        });

        // Try to save it
        const saved = await testQuestion.save();
        
        res.json({
            message: 'Test successful',
            question: saved
        });
    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({
            error: 'Test failed',
            message: error.message
        });
    }
});

router.get('/create-test-comprehension', async (req, res) => {
    try {
        console.log('Attempting to create test comprehension question...');
        
        // Create a simple test question
        const testQuestion = new ComprehensionQuestion({
            passage: "This is a test passage.",
            subQuestions: [
                {
                    question: "Test Question 1?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 0
                },
                {
                    question: "Test Question 2?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 1
                },
                {
                    question: "Test Question 3?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 2
                },
                {
                    question: "Test Question 4?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 3
                },
                {
                    question: "Test Question 5?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 0
                }
            ]
        });

        console.log('Test question created:', testQuestion);

        // Try to save it
        const saved = await testQuestion.save();
        console.log('Question saved successfully:', saved);

        // Try to find it
        const found = await ComprehensionQuestion.findById(saved._id);
        console.log('Question retrieved:', found);

        res.json({
            message: 'Test successful',
            created: saved,
            retrieved: found
        });
    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({
            error: 'Test failed',
            message: error.message,
            stack: error.stack
        });
    }
});

router.get('/list-comprehension', async (req, res) => {
    try {
        const questions = await ComprehensionQuestion.find();
        res.json({
            count: questions.length,
            questions: questions
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Add this new route
router.get('/comprehension-only', async (req, res) => {
    console.log('\n=== COMPREHENSION TEST ROUTE ===');
    try {
        // 1. Verify model
        console.log('1. Checking model...');
        console.log('Model name:', ComprehensionQuestion.modelName);
        console.log('Model:', ComprehensionQuestion);

        // 2. Create test question
        console.log('\n2. Creating test question...');
        const testQuestion = new ComprehensionQuestion({
            passage: "Test passage " + new Date().toISOString(),
            subQuestions: [
                {
                    question: "Q1?",
                    options: ["A1", "B1", "C1", "D1"],
                    correctAnswer: 0
                },
                {
                    question: "Q2?",
                    options: ["A2", "B2", "C2", "D2"],
                    correctAnswer: 1
                },
                {
                    question: "Q3?",
                    options: ["A3", "B3", "C3", "D3"],
                    correctAnswer: 2
                },
                {
                    question: "Q4?",
                    options: ["A4", "B4", "C4", "D4"],
                    correctAnswer: 3
                },
                {
                    question: "Q5?",
                    options: ["A5", "B5", "C5", "D5"],
                    correctAnswer: 0
                }
            ]
        });
        console.log('Test question created:', JSON.stringify(testQuestion, null, 2));

        // 3. Save question
        console.log('\n3. Saving question...');
        const saved = await testQuestion.save();
        console.log('Save result:', JSON.stringify(saved, null, 2));

        // 4. Verify save
        console.log('\n4. Verifying save...');
        const found = await ComprehensionQuestion.findById(saved._id);
        console.log('Found saved question:', found ? 'Yes' : 'No');

        // 5. Return response
        res.json({
            message: 'Comprehension test complete',
            modelName: ComprehensionQuestion.modelName,
            newQuestion: saved,
            foundQuestion: found
        });

    } catch (error) {
        console.error('\nERROR:', error);
        res.status(500).json({
            error: 'Test failed',
            message: error.message,
            stack: error.stack
        });
    }
});

// Add these at the top of your routes
router.get('/hello', (req, res) => {
    res.json({ message: 'Hello from question router' });
});

router.get('/test', (req, res) => {
    res.json({ message: 'Test route in question router' });
});

// Log that routes are set up
console.log('Question routes loaded');

// Add this test route at the top of your routes
router.post('/test-comprehension-create', async (req, res) => {
    console.log('\n=== Testing Comprehension Creation ===');
    try {
        // Create a simple test question
        const testQuestion = new ComprehensionQuestion({
            passage: "Test passage " + new Date().toISOString(),
            subQuestions: [{
                question: "Test question?",
                options: ["A", "B", "C", "D"],
                correctAnswer: 0
            }]
        });

        console.log('Created question object:', testQuestion);
        const saved = await testQuestion.save();
        console.log('Saved successfully:', saved);

        res.json({
            message: 'Test successful',
            question: saved
        });
    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({
            error: 'Test failed',
            details: error.message,
            stack: error.stack
        });
    }
});

export default router;

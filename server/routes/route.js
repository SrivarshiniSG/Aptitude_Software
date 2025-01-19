import { Router } from "express";
import Result from '../models/resultSchema.js';
import mongoose from 'mongoose';
import ActiveSession from '../models/activeSession.js';
import { ComprehensionQuestion } from '../models/comprehensionSchema.js';
const router = Router();

// Define models for existing collections
const AptitudeQuestion = mongoose.model('aptitudequestions', new mongoose.Schema({}, { strict: false }));
const CoreQuestion = mongoose.model('corequestions', new mongoose.Schema({}, { strict: false }));
const VerbalQuestion = mongoose.model('verbalquestions', new mongoose.Schema({}, { strict: false }));
const ProgrammingQuestion = mongoose.model('programmingquestions', new mongoose.Schema({}, { strict: false }));

const departmentCoreMapping = {
  'cs': 'cs',
  'it': 'it',
  'ec': 'ec',
  'ee': 'ee',
  'mech': 'mech',
  'civil': 'civil',
  'chem': 'chem',
  'bio': 'bio',
  'aids': 'aids',
  'auto': 'auto',
  'marine': 'marine'
};

// Add this debug route after your imports and before other routes
router.get('/debug', async (req, res) => {
    try {
        const counts = await Promise.all([
            AptitudeQuestion.countDocuments(),
            CoreQuestion.countDocuments(),
            VerbalQuestion.countDocuments(),
            ProgrammingQuestion.countDocuments()
        ]);

        res.json({
            aptitudeCount: counts[0],
            coreCount: counts[1],
            verbalCount: counts[2],
            programmingCount: counts[3]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Questions Routes API */
router.get('/questions', async (req, res) => {
    try {
        // Get 2 random questions from each category
        const aptitudeQuestions = await AptitudeQuestion.aggregate([{ $sample: { size: 2 } }]);
        const coreQuestions = await CoreQuestion.aggregate([{ $sample: { size: 2 } }]);
        const verbalQuestions = await VerbalQuestion.aggregate([{ $sample: { size: 2 } }]);
        const programmingQuestions = await ProgrammingQuestion.aggregate([{ $sample: { size: 2 } }]);

        // Combine all questions
        let allQuestions = [
            ...aptitudeQuestions.map(q => ({ ...q, category: 'aptitude' })),
            ...coreQuestions.map(q => ({ ...q, category: 'core' })),
            ...verbalQuestions.map(q => ({ ...q, category: 'verbal' })),
            ...programmingQuestions.map(q => ({ ...q, category: 'programming' }))
        ];

        // Shuffle the combined array
        allQuestions = allQuestions.sort(() => Math.random() - 0.5);

        // Create answers array
        const answers = allQuestions.map(q => q.correctAnswer);

        res.json([{
            questions: allQuestions,
            answers: answers
        }]);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/questions/:deptId', async (req, res) => {
    try {
        const { deptId } = req.params;
        console.log("Fetching questions for department:", deptId);
        
        // Fetch questions by category
        const aptitudeQuestions = await AptitudeQuestion.aggregate([
            { $sample: { size: 10 } },
            { $addFields: { category: 'aptitude' } }
        ]);

        const coreQuestions = await CoreQuestion.aggregate([
            { $match: { category: deptId } },
            { $sample: { size: 20 } },
            { $addFields: { category: 'core' } }
        ]);

        // Get one random comprehension question
        const comprehensionQuestion = await ComprehensionQuestion.aggregate([
            { $sample: { size: 1 } }
        ]);

        // Transform comprehension question into 5 separate questions
        const comprehensionQuestions = comprehensionQuestion[0]?.subQuestions.map(sq => ({
            category: 'verbal',
            question: `${comprehensionQuestion[0].passage}\n\n${sq.question}`,
            options: sq.options,
            correctAnswer: sq.correctAnswer
        })) || [];

        // Get remaining verbal questions
        const verbalQuestions = await VerbalQuestion.aggregate([
            { $sample: { size: 5 } },
            { $addFields: { category: 'verbal' } }
        ]);

        const programmingQuestions = await ProgrammingQuestion.aggregate([
            { $sample: { size: 10 } },
            { $addFields: { category: 'programming' } }
        ]);

        // Combine all questions
        const questions = {
            aptitude: aptitudeQuestions,
            core: coreQuestions,
            verbal: [...comprehensionQuestions, ...verbalQuestions],
            programming: programmingQuestions
        };

        // Create answer arrays
        const answers = {
            aptitude: aptitudeQuestions.map(q => q.correctAnswer),
            core: coreQuestions.map(q => q.correctAnswer),
            verbal: [...comprehensionQuestions.map(q => q.correctAnswer), ...verbalQuestions.map(q => q.correctAnswer)],
            programming: programmingQuestions.map(q => q.correctAnswer)
        };

        res.json([{ questions, answers }]);

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message });
    }
});

/** Result Routes API */
router.get('/result', async (req, res) => {
    try {
        const results = await Result.find();
        res.json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/result', async (req, res) => {
    try {
        console.log("Received result data:", req.body);

        const { 
            username, 
            email, 
            regNo,
            department, 
            result, 
            attempts,
            points,
            totalQuestions 
        } = req.body;

        // Validate required fields
        if (!username || !email || !regNo) {
            console.error("Missing required fields:", { username, email, regNo });
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { username, email, regNo }
            });
        }

        // Check if user already exists by registration number
        const existingResult = await Result.findOne({ regNo });
        if (existingResult) {
            // Update existing result
            existingResult.result = result;
            existingResult.attempts = attempts;
            existingResult.points = points;
            existingResult.totalQuestions = totalQuestions;
            
            const updatedResult = await existingResult.save();
            console.log("Updated existing result:", updatedResult);
            return res.json(updatedResult);
        }

        // Create new result
        const newResult = new Result({
            username,
            email,
            regNo,  // Make sure regNo is included
            dept: department || '',
            result: result || [],
            attempts: attempts || 0,
            points: points || 0,
            totalQuestions: totalQuestions || 0
        });

        console.log("Saving new result:", newResult);
        const savedResult = await newResult.save();
        console.log("Result saved successfully:", savedResult);
        res.json(savedResult);

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.delete('/result', async (req, res) => {
    try {
        await Result.deleteMany({});
        res.json({ message: "All results deleted successfully" });
    } catch (error) {
        console.error('Error deleting results:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this with your other routes
// router.get('/users/search', async (req, res) => {
//     try {
//         const { regNo } = req.query;
        
//         if (!regNo) {
//             return res.status(400).json({ message: 'Registration number is required' });
//         }

//         const user = await Result.findOne({ regNo });
        
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const userData = {
//             name: user.username,
//             email: user.email,
//             regNo: user.regNo,
//             department: user.dept,
//             status: user.attempts > 0 ? 'completed' : 'not_started',
//             score: `${user.points} out of ${user.totalQuestions}`,  // Updated score format
//             totalQuestions: user.totalQuestions
//         };

//         res.json(userData);

//     } catch (error) {
//         console.error('Error searching user:', error);
//         res.status(500).json({ message: 'Error searching for user' });
//     }
// });

// Add this route to search user by email
router.get('/users/search', async (req, res) => {
    try {
        const { email } = req.query; 
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' }); 
        }

        const user = await Result.findOne({ email }); 
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            name: user.username,
            email: user.email,
            regNo: user.regNo,
            department: user.dept,
            status: user.attempts > 0 ? 'completed' : 'not_started',
            score: `${user.points} `, 
            totalQuestions: user.totalQuestions
        };

        res.json(userData);

    } catch (error) {
        console.error('Error searching user:', error);
        res.status(500).json({ message: 'Error searching for user' });
    }
});


// Reset test endpoint - modified to delete the record
router.post('/users/reset-test', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Delete the user's result completely from database
        const result = await Result.findOneAndDelete({ email });

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Test reset successfully. Result deleted from database.' });

    } catch (error) {
        console.error('Error resetting test:', error);
        res.status(500).json({ message: 'Error resetting test' });
    }
});

// Add check before starting quiz
router.post('/check-attempt', async (req, res) => {
    try {
        const { regNo } = req.body;
        const user = await Result.findOne({ regNo });
        
        if (user && user.attempts > 0) {
            return res.status(403).json({ 
                message: 'You have already taken the test. Please contact admin for reset.' 
            });
        }
        
        res.json({ canTakeTest: true });
    } catch (error) {
        res.status(500).json({ message: 'Error checking test attempt' });
    }
});

/** check session route */
router.post('/api/users/check-session', async (req, res) => {
    try {
        const { email, regNo } = req.body;

        // Check if user has already completed the test
        const existingResult = await Result.findOne({ email, regNo });
        if (existingResult) {
            return res.json({ 
                canTakeTest: false, 
                hasActiveSession: false,
                message: 'User has already completed the test'
            });
        }

        // Check for active session
        const activeSession = await ActiveSession.findOne({ email, regNo });
        if (activeSession) {
            return res.json({ 
                canTakeTest: true, 
                hasActiveSession: true,
                message: 'User has an active session'
            });
        }

        return res.json({ 
            canTakeTest: true, 
            hasActiveSession: false,
            message: 'User can take test'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/** create session route */
router.post('/api/users/create-session', async (req, res) => {
    try {
        const { email, regNo } = req.body;
        
        const newSession = new ActiveSession({
            email,
            regNo,
            startTime: new Date()
        });

        await newSession.save();
        res.json({ message: 'Session created successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/** clear session route */
router.post('/api/users/clear-session', async (req, res) => {
    try {
        const { email, regNo } = req.body;
        
        await ActiveSession.findOneAndDelete({ email, regNo });
        res.json({ message: 'Session cleared successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
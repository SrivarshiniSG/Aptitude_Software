import express from 'express';
import Feedback from '../models/feedbackSchema.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/',auth, checkRole(['student']), async (req, res) => {
    try {
        const { ratings, comments } = req.body;
        const { username, email } = req.user;

        // Create new feedback
        const newFeedback = new Feedback({
            username,
            email,
            ratings,
            comments
        });

        await newFeedback.save();
        res.json({ success: true, message: 'Feedback submitted successfully' });

    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

export { router as feedbackRouter };

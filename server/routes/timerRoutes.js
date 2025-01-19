import express from 'express';
import TimerSettings from '../models/timerSettings.js';
import {auth,checkRole} from '../middleware/auth.js';
const router = express.Router();

router.get('/endtime', async (req, res) => {
    try {
        const settings = await TimerSettings.findOne({ isActive: true });
        if (!settings) {
            // Create default end time if none exists
            const defaultEndTime = new Date(Date.now() + 90 * 60000);
            const newSettings = await TimerSettings.create({
                endTime: defaultEndTime,
                isActive: true
            });
            return res.json({ endTime: newSettings.endTime });
        }
        res.json({ endTime: settings.endTime });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timer end time' });
    }
});

router.post('/update', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { endTime } = req.body;
        await TimerSettings.updateOne(
            { isActive: true },
            { endTime: new Date(endTime) },
            { upsert: true }
        );
        res.json({ message: 'Timer end time updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating timer end time' });
    }
});

export default router;

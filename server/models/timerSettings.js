import mongoose from "mongoose";
const { Schema } = mongoose;

const timerSettingsSchema = new Schema({
    endTime: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 90 * 60000) // Default 90 minutes from now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

export default mongoose.model('TimerSettings', timerSettingsSchema);

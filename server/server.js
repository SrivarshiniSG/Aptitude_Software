import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import router from './routes/route.js';
import morgan from 'morgan';
import { router as userRouter } from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import AccessCode from './models/accessCodeSchema.js';
import questionRouter from './routes/questionRoutes.js';
import { feedbackRouter } from './routes/feedbackRoutes.js';

// Load environment variables first
config();

const app = express();

// Add debug middleware BEFORE other middleware
app.use((req, res, next) => {
    console.log('\n=== New Request ===');
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    next();
});

/** Middlewares */
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add this after your middleware setup but before route registration
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Body:', req.body);
    next();
});

// Debug log before mounting routes
console.log('Mounting routes...');

// Route registrations - Update the order
app.use('/api/questions', questionRouter);
app.use('/api', router);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/feedback', feedbackRouter);

// Add a test route directly in server.js
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

// Debug log after mounting routes
console.log('Routes mounted successfully');

// Check if MongoDB URI exists
if (!process.env.MONGODB_URI && !process.env.ATLAS_URL) {
    console.error('MongoDB connection URI is not defined in .env file');
    process.exit(1);
}

// MongoDB connection with error handling
const mongoURI = process.env.MONGODB_URI || process.env.ATLAS_URL;
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Add this function
const initializeAccessCode = async () => {
    try {
        const existingCode = await AccessCode.findOne({ isActive: true });
        if (!existingCode) {
            await AccessCode.create({ 
                code: 'SVCE2024',  // This is your default code
                isActive: true 
            });
            console.log('Default access code created: SVCE2024');
        }
    } catch (error) {
        console.error('Error initializing access code:', error);
    }
};

// Initialize default code when server starts
mongoose.connect(mongoURI)
    .then(() => {
        console.log("Database Connected");
        initializeAccessCode();
    })
    .catch(error => console.log(error));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Add a test route to verify base routing
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Add this temporary debug code
setTimeout(() => {
    console.log('\nRegistered Routes:');
    app._router.stack.forEach(r => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
        } else if (r.name === 'router') {
            console.log('Router:', r.regexp);
        }
    });
}, 1000);

// Add a test middleware to log all registered routes
app.use((req, res, next) => {
    console.log('\n=== Request Info ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Original URL:', req.originalUrl);
    next();
});

// Add a test route directly in server.js
app.get('/test-server', (req, res) => {
    res.json({ message: 'Server route working' });
});

// Mount routes with debugging
console.log('Mounting question routes...');
app.use('/api/questions', questionRouter);
console.log('Question routes mounted');


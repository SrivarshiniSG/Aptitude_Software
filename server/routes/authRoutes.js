import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();



// Admin login
router.post('/admin-login',
  [
    body('username').exists(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Hardcoded admin credentials - in production these should be in env vars and hashed
      const validAdmins = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'ques', password: 'ques123', role: 'question_uploader' }
      ];

      const admin = validAdmins.find(a => a.username === username && a.password === password);
      
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { username: admin.username, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, success: true, role: admin.role });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export { router as authRouter }; 
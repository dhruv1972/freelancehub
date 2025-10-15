// Authentication routes (Week 5 enhancement)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';

export const authRouter = Router();

// Register with email/password
authRouter.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { email, password, firstName, lastName, userType } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName || !userType) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            userType,
            isVerified: true, // Auto-verify for demo
            profile: {}
        });

        // Generate token
        const token = generateToken(user._id.toString());

        // Return user data (without password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            profile: user.profile
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login with email/password
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password || '');
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id.toString());

        // Return user data (without password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            profile: user.profile
        };

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user profile
authRouter.get('/me', async (req, res) => {
    try {
        // This would use the auth middleware in a real implementation
        const userEmail = req.headers['x-user-email'] as string;
        if (!userEmail) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data (without password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            profile: user.profile
        };

        res.json(userResponse);
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Google OAuth placeholder (for demo)
authRouter.post('/google', async (req, res) => {
    try {
        const { googleToken, userType } = req.body;

        // In a real implementation, you would:
        // 1. Verify the Google token with Google's API
        // 2. Extract user info from the token
        // 3. Create or find user in database
        // 4. Generate JWT token

        // For demo purposes, create a mock Google user
        const mockGoogleUser = {
            email: 'demo.google@example.com',
            firstName: 'Google',
            lastName: 'User',
            userType: userType || 'freelancer'
        };

        // Check if user exists
        let user = await User.findOne({ email: mockGoogleUser.email });

        if (!user) {
            // Create new user
            user = await User.create({
                ...mockGoogleUser,
                isVerified: true,
                profile: {}
            });
        }

        // Generate token
        const token = generateToken(user._id.toString());

        // Return user data
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            profile: user.profile
        };

        res.json({
            message: 'Google authentication successful',
            user: userResponse,
            token
        });
    } catch (error: any) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

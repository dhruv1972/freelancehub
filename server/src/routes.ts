// All HTTP API routes used in Week 2/3/4/5 milestones
import { Router } from 'express';
import { User } from './models/User';
import { Project } from './models/Project';
import { Proposal } from './models/Proposal';
import { Message } from './models/Message';
import { TimeEntry } from './models/TimeEntry';
import { Review } from './models/Review';
import { Notification } from './models/Notification';
import { authRouter } from './routes/auth';
import multer from 'multer';
import path from 'path';
import Stripe from 'stripe';

// temporary auth stub: read x-user-email header
function getUserEmail(req: any): string | null {
    const email = req.header('x-user-email');
    return typeof email === 'string' ? email : null;
}

export const api = Router();

// Mount auth routes
api.use('/auth', authRouter);

// simple local upload storage (for dev only)
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

// Profile upsert
// Upserts the current user's profile (uses x-user-email header as a simple auth stub for dev)
api.post('/profile', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });

        const { firstName, lastName, userType, profile } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { email, firstName, lastName, userType, profile } },
            { upsert: true, new: true }
        );
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get my profile
// Returns the current user's profile using x-user-email header
api.get('/profile/me', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const user = await User.findOne({ email });
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create project (client)
// Client creates a new project; requires x-user-email of a client account
api.post('/projects', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const client = await User.findOne({ email });
        if (!client) return res.status(400).json({ error: 'User not found' });

        const project = await Project.create({ ...req.body, clientId: client._id });
        res.status(201).json(project);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List/search projects (open)
// Supports q (text) and category filters
api.get('/projects', async (req, res) => {
    try {
        const {
            q,
            category,
            minBudget,
            maxBudget,
            status,
            skills,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = '1',
            limit = '20'
        } = req.query as {
            q?: string;
            category?: string;
            minBudget?: string;
            maxBudget?: string;
            status?: string;
            skills?: string;
            sortBy?: string;
            sortOrder?: string;
            page?: string;
            limit?: string;
        };

        const filter: any = {};

        // Default to open projects unless status specified
        if (status && status !== 'all') {
            filter.status = status;
        } else if (!status) {
            filter.status = 'open';
        }

        // Text search
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { requirements: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Budget range filter
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = parseInt(minBudget);
            if (maxBudget) filter.budget.$lte = parseInt(maxBudget);
        }

        // Skills filter (search in requirements array)
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            filter.requirements = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const projects = await Project.find(filter)
            .populate('clientId', 'firstName lastName')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);

        const total = await Project.countDocuments(filter);

        res.json({
            projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get project by id
api.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Not found' });
        res.json(project);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Proposal accept -> also set project to in-progress and store selected freelancer
api.post('/proposals/:id/accept', async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            { status: 'accepted' },
            { new: true }
        );
        if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
        await Project.findByIdAndUpdate(proposal.projectId, { status: 'in-progress', selectedFreelancer: proposal.freelancerId });
        res.json(proposal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

api.post('/proposals/:id/reject', async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );
        if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
        res.json(proposal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Messaging: send a message
api.post('/messages', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const sender = await User.findOne({ email });
        if (!sender) return res.status(400).json({ error: 'Sender not found' });
        const msg = await Message.create({ ...req.body, senderId: sender._id });
        res.status(201).json(msg);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Messaging: list messages between me and withUserId (optional project scope)
api.get('/messages', async (req, res) => {
    try {
        const { withUserId, projectId } = req.query as { withUserId?: string; projectId?: string };
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const me = await User.findOne({ email });
        if (!me) return res.status(400).json({ error: 'User not found' });
        const filter: any = {
            $or: [
                { senderId: me._id, receiverId: withUserId },
                { senderId: withUserId, receiverId: me._id },
            ],
        };
        if (projectId) filter.projectId = projectId;
        const msgs = await Message.find(filter).sort({ createdAt: 1 });
        res.json(msgs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// File upload (dev-only local storage). Returns a relative path you can attach to a message.
api.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        res.json({ path: `/uploads/${req.file.filename}` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


// Create proposal (freelancer)
api.post('/projects/:id/proposals', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(400).json({ error: 'User not found' });

        const projectId = req.params.id;
        const proposal = await Proposal.create({ ...req.body, projectId, freelancerId: freelancer._id });
        res.status(201).json(proposal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List proposals by project (client)
api.get('/projects/:id/proposals', async (req, res) => {
    try {
        const proposals = await Proposal.find({ projectId: req.params.id }).sort({ createdAt: -1 });
        res.json(proposals);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Week 4 routes: Time tracking, Reviews, Payments, Admin

// Initialize Stripe with secret key (only if provided)
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    : null;

// Time tracking: Start timer
api.post('/time/start', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(400).json({ error: 'User not found' });

        const { projectId, description } = req.body;
        const timeEntry = await TimeEntry.create({
            freelancerId: freelancer._id,
            projectId,
            startTime: new Date(),
            description,
        });
        res.status(201).json(timeEntry);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Time tracking: Stop timer
api.post('/time/stop', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(400).json({ error: 'User not found' });

        const { timeEntryId } = req.body;
        const timeEntry = await TimeEntry.findOneAndUpdate(
            { _id: timeEntryId, freelancerId: freelancer._id, endTime: null },
            { endTime: new Date() },
            { new: true }
        );
        if (!timeEntry) return res.status(404).json({ error: 'Active time entry not found' });
        res.json(timeEntry);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Time tracking: Get time entries for a project
api.get('/time', async (req, res) => {
    try {
        const { projectId } = req.query as { projectId?: string };
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const filter: any = { freelancerId: user._id };
        if (projectId) filter.projectId = projectId;
        const timeEntries = await TimeEntry.find(filter).sort({ createdAt: -1 });
        res.json(timeEntries);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Reviews: Create a review
api.post('/reviews', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });
        const reviewer = await User.findOne({ email });
        if (!reviewer) return res.status(400).json({ error: 'User not found' });

        const { projectId, revieweeId, rating, comment, reviewType } = req.body;
        const review = await Review.create({
            projectId,
            reviewerId: reviewer._id,
            revieweeId,
            rating,
            comment,
            reviewType,
        });
        res.status(201).json(review);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Reviews: Get reviews for a project or user
api.get('/reviews', async (req, res) => {
    try {
        const { projectId, userId } = req.query as { projectId?: string; userId?: string };
        const filter: any = {};
        if (projectId) filter.projectId = projectId;
        if (userId) filter.revieweeId = userId;
        const reviews = await Review.find(filter).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Payments: Create payment intent (Stripe test mode)
api.post('/payments/intent', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' });
        }

        const { amount, currency = 'usd', description } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            description,
            automatic_payment_methods: { enabled: true },
        });
        res.json({ client_secret: paymentIntent.client_secret });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all users
api.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-__v').sort({ createdAt: -1 });
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all projects
api.get('/admin/projects', async (req, res) => {
    try {
        const projects = await Project.find({}).select('-__v').sort({ createdAt: -1 });
        res.json(projects);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Suspend user
api.post('/admin/users/:id/suspend', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: 'suspended' },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ===== WEEK 5: NOTIFICATIONS =====

// Get user notifications
api.get('/notifications', async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const notifications = await Notification.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
api.patch('/notifications/:id/read', async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
api.patch('/notifications/read-all', async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Notification.updateMany(
            { userId: user._id, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Get unread notification count
api.get('/notifications/unread-count', async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const count = await Notification.countDocuments({
            userId: user._id,
            isRead: false
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get notification count' });
    }
});



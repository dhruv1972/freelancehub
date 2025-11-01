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

        // Debug logging
        console.log('Profile save request for:', email);
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));
        console.log('Profile data received:', JSON.stringify(profile, null, 2));
        console.log('Skills in profile:', profile?.skills);
        console.log('Portfolio in profile:', profile?.portfolio);
        console.log('Skills is array:', Array.isArray(profile?.skills));
        console.log('Portfolio is array:', Array.isArray(profile?.portfolio));

        // Ensure arrays are properly formatted
        const profileToSave = {
            ...profile,
            skills: Array.isArray(profile?.skills) ? profile.skills : (profile?.skills ? [profile.skills] : []),
            portfolio: Array.isArray(profile?.portfolio) ? profile.portfolio : (profile?.portfolio ? [profile.portfolio] : [])
        };

        console.log('Profile to save (formatted):', JSON.stringify(profileToSave, null, 2));

        const user = await User.findOneAndUpdate(
            { email },
            { $set: { email, firstName, lastName, userType, profile: profileToSave } },
            { upsert: true, new: true }
        );

        // Debug: Log what was saved
        console.log('Profile saved. User profile:', JSON.stringify(user.profile, null, 2));
        console.log('Saved skills:', user.profile?.skills);
        console.log('Saved portfolio:', user.profile?.portfolio);

        res.json(user);
    } catch (err: any) {
        console.error('Error saving profile:', err);
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

        // Debug logging
        console.log('Profile fetch request for:', email);
        if (user) {
            console.log('User found, profile data:', JSON.stringify(user.profile, null, 2));
            console.log('Skills in profile:', user.profile?.skills);
            console.log('Portfolio in profile:', user.profile?.portfolio);
            console.log('Skills type:', typeof user.profile?.skills, 'isArray:', Array.isArray(user.profile?.skills));
            console.log('Portfolio type:', typeof user.profile?.portfolio, 'isArray:', Array.isArray(user.profile?.portfolio));
        } else {
            console.log('User not found');
        }

        res.json(user);
    } catch (err: any) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user profile by ID (public view) - MUST be before /admin/users
api.get('/users/:id', async (req, res) => {
    try {
        console.log('Fetching user profile for ID:', req.params.id);

        // Handle both ObjectId and string formats
        let user;
        try {
            user = await User.findById(req.params.id)
                .select('-password -__v');
        } catch (findError: any) {
            // If findById fails, try finding by email or other field
            console.error('Error finding user by ID:', findError);
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (!user) {
            console.log('User not found for ID:', req.params.id);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', user.email);
        res.json(user);
    } catch (err: any) {
        console.error('Error in /users/:id:', err);
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

// Get ongoing projects for freelancer (projects where freelancer is selected and status is in-progress)
// IMPORTANT: This route must come before /projects/:id to avoid route conflicts
api.get('/projects/my', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });

        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(404).json({ error: 'User not found' });

        // Get projects where this freelancer is selected and status is in-progress or completed
        const { status } = req.query as { status?: string };
        const filter: any = {
            selectedFreelancer: freelancer._id
        };

        // If status filter is provided and not 'all', filter by status
        // Otherwise (including 'all'), show both in-progress and completed projects
        if (status && status !== 'all') {
            filter.status = status;
        } else {
            // Default: show in-progress and completed projects (not 'open')
            filter.status = { $in: ['in-progress', 'completed'] };
        }

        const projects = await Project.find(filter)
            .populate('clientId', 'firstName lastName email')
            .sort({ updatedAt: -1 });

        res.json(projects);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get project by id
api.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('selectedFreelancer', 'firstName lastName email')
            .populate('clientId', 'firstName lastName email');
        if (!project) return res.status(404).json({ error: 'Not found' });
        res.json(project);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update project status (for freelancers working on the project)
api.patch('/projects/:id', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });

        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(404).json({ error: 'User not found' });

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Verify freelancer is working on this project
        if (project.selectedFreelancer?.toString() !== freelancer._id.toString()) {
            return res.status(403).json({ error: 'You are not authorized to update this project' });
        }

        // Allow updating status (only freelancer can change from in-progress to completed)
        const { status } = req.body;
        if (status && ['in-progress', 'completed'].includes(status)) {
            if (project.status === 'in-progress' && status === 'completed') {
                project.status = 'completed';
                await project.save();

                // Create notification for client
                try {
                    await Notification.create({
                        userId: project.clientId,
                        title: 'Project Completed',
                        message: `The project "${project.title}" has been marked as completed.`,
                        type: 'project_completed',
                        relatedId: project._id,
                        actionUrl: `/project/${project._id}`
                    });
                } catch (notifError: any) {
                    console.error('Failed to create completion notification:', notifError);
                }
            }
        }

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

        const project = await Project.findByIdAndUpdate(
            proposal.projectId,
            { status: 'in-progress', selectedFreelancer: proposal.freelancerId },
            { new: true }
        );

        // Create notification for freelancer when proposal is accepted
        if (proposal.freelancerId) {
            try {
                console.log('Creating notification for freelancer:', proposal.freelancerId.toString());
                const notification = await Notification.create({
                    userId: proposal.freelancerId,
                    title: 'Proposal Accepted!',
                    message: `Your proposal for "${project?.title || 'project'}" has been accepted.`,
                    type: 'proposal_accepted',
                    relatedId: proposal.projectId,
                    actionUrl: `/project/${proposal.projectId}`
                });
                console.log('✅ Proposal accepted notification created:', notification._id);
            } catch (notifError: any) {
                console.error('❌ Failed to create proposal accepted notification:', notifError);
            }
        }

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

        const project = await Project.findById(proposal.projectId);

        // Create notification for freelancer when proposal is rejected
        if (proposal.freelancerId) {
            try {
                console.log('Creating notification for rejected proposal, freelancer:', proposal.freelancerId.toString());
                const notification = await Notification.create({
                    userId: proposal.freelancerId,
                    title: 'Proposal Rejected',
                    message: `Your proposal for "${project?.title || 'project'}" was not selected.`,
                    type: 'proposal_rejected',
                    relatedId: proposal.projectId,
                    actionUrl: `/project/${proposal.projectId}`
                });
                console.log('✅ Proposal rejected notification created:', notification._id);
            } catch (notifError: any) {
                console.error('❌ Failed to create proposal rejected notification:', notifError);
            }
        }

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

        const { receiverId, content, attachments, projectId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ error: 'Receiver ID is required' });
        }

        const msg = await Message.create({
            senderId: sender._id,
            receiverId,
            content: content || '',
            attachments: attachments || [],
            projectId
        });

        // Populate sender and receiver for response
        const populatedMsg = await Message.findById(msg._id)
            .populate('senderId', 'firstName lastName email')
            .populate('receiverId', 'firstName lastName email');

        res.status(201).json(populatedMsg);
    } catch (err: any) {
        console.error('Error sending message:', err);
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

        let filter: any;

        // If withUserId is provided, get messages between two users
        if (withUserId) {
            filter = {
                $or: [
                    { senderId: me._id, receiverId: withUserId },
                    { senderId: withUserId, receiverId: me._id },
                ],
            };
            if (projectId) filter.projectId = projectId;
        } else {
            // Get all messages for current user (for conversation list)
            filter = {
                $or: [
                    { senderId: me._id },
                    { receiverId: me._id }
                ]
            };
            if (projectId) filter.projectId = projectId;
        }

        const msgs = await Message.find(filter)
            .populate('senderId', 'firstName lastName email')
            .populate('receiverId', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(msgs);
    } catch (err: any) {
        console.error('Error loading messages:', err);
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
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const proposal = await Proposal.create({ ...req.body, projectId, freelancerId: freelancer._id });

        // Create notification for client when proposal is received
        if (project.clientId) {
            try {
                console.log('Creating notification for client:', project.clientId.toString());
                console.log('Project title:', project.title);
                console.log('Freelancer name:', `${freelancer.firstName} ${freelancer.lastName}`);

                const notification = await Notification.create({
                    userId: project.clientId,
                    title: 'New Proposal Received',
                    message: `${freelancer.firstName} ${freelancer.lastName} submitted a proposal for "${project.title}"`,
                    type: 'proposal_received',
                    relatedId: proposal._id,
                    actionUrl: `/project/${projectId}`
                });

                console.log('✅ Notification created successfully!');
                console.log('Notification ID:', notification._id);
                console.log('Notification userId:', notification.userId);
            } catch (notifError: any) {
                console.error('❌ Failed to create notification:', notifError);
                console.error('Error details:', {
                    message: notifError.message,
                    stack: notifError.stack,
                    clientId: project.clientId?.toString()
                });
                // Don't fail the proposal creation if notification fails
            }
        } else {
            console.warn('⚠️ Project has no clientId, cannot create notification');
            console.log('Project data:', JSON.stringify(project, null, 2));
        }

        res.status(201).json(proposal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List proposals by project (client)
api.get('/projects/:id/proposals', async (req, res) => {
    try {
        const proposals = await Proposal.find({ projectId: req.params.id })
            .populate('freelancerId', 'firstName lastName email profile')
            .sort({ createdAt: -1 });
        res.json(proposals);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get all proposals by freelancer (for freelancer dashboard)
api.get('/proposals/my', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });

        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(404).json({ error: 'User not found' });

        const proposals = await Proposal.find({ freelancerId: freelancer._id })
            .populate('projectId', 'title description budget status category')
            .sort({ createdAt: -1 });

        res.json(proposals);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


// Week 4 routes: Time tracking, Reviews, Payments, Admin

// Initialize Stripe with secret key (only if provided)
// Do not pin apiVersion here so it matches the installed SDK/types in deploy environments
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey as string)
    : null;

// Log Stripe initialization status (only if key exists, for security don't log if missing)
if (stripeSecretKey) {
    console.log('✅ Stripe initialized successfully (key length:', stripeSecretKey.length + ')');
} else {
    console.log('⚠️  Stripe NOT initialized - STRIPE_SECRET_KEY not found in environment variables');
}

// Time tracking: Start timer
api.post('/time/start', async (req, res) => {
    try {
        const email = getUserEmail(req);
        if (!email) return res.status(401).json({ error: 'Missing x-user-email' });

        const freelancer = await User.findOne({ email });
        if (!freelancer) return res.status(400).json({ error: 'User not found' });

        if (freelancer.userType !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can track time' });
        }

        const { projectId, description } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Check if there's already an active timer for this freelancer (any project)
        const activeTimer = await TimeEntry.findOne({
            freelancerId: freelancer._id,
            endTime: null
        });

        if (activeTimer) {
            return res.status(400).json({
                error: 'You already have an active timer. Please stop it before starting a new one.'
            });
        }

        // Verify the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const timeEntry = await TimeEntry.create({
            freelancerId: freelancer._id,
            projectId,
            startTime: new Date(),
            description: description || '',
        });

        res.status(201).json(timeEntry);
    } catch (err: any) {
        console.error('Error starting timer:', err);
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

        if (freelancer.userType !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can track time' });
        }

        const { timeEntryId } = req.body;

        if (!timeEntryId) {
            return res.status(400).json({ error: 'Time entry ID is required' });
        }

        // Find the active time entry first
        const activeEntry = await TimeEntry.findOne({
            _id: timeEntryId,
            freelancerId: freelancer._id,
            endTime: null
        });

        if (!activeEntry) {
            return res.status(404).json({ error: 'Active time entry not found. It may have already been stopped.' });
        }

        // Calculate duration manually (store endTime, durationMinutes is for reference only)
        const endTime = new Date();
        const durationMs = endTime.getTime() - activeEntry.startTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));

        // Debug logging
        console.log('Stopping timer:', {
            timeEntryId,
            startTime: activeEntry.startTime,
            endTime: endTime,
            durationMs,
            durationMinutes,
            durationSeconds: Math.floor(durationMs / 1000)
        });

        // Update with calculated duration
        const timeEntry = await TimeEntry.findByIdAndUpdate(
            timeEntryId,
            {
                endTime: endTime,
                durationMinutes: durationMinutes
            },
            { new: true }
        );

        if (!timeEntry) {
            return res.status(404).json({ error: 'Failed to update time entry' });
        }

        // Debug: Log what was saved
        console.log('Timer stopped, saved entry:', {
            _id: timeEntry._id,
            startTime: timeEntry.startTime,
            endTime: timeEntry.endTime,
            durationMinutes: timeEntry.durationMinutes
        });

        res.json(timeEntry);
    } catch (err: any) {
        console.error('Error stopping timer:', err);
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


// Search freelancers (for clients)
api.get('/freelancers', async (req, res) => {
    try {
        const { q, skills, location, minRating } = req.query as {
            q?: string;
            skills?: string;
            location?: string;
            minRating?: string;
        };

        const filter: any = {
            userType: 'freelancer',
            status: 'active'
        };

        // Text search in name, bio, experience
        if (q) {
            filter.$or = [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { 'profile.bio': { $regex: q, $options: 'i' } },
                { 'profile.experience': { $regex: q, $options: 'i' } }
            ];
        }

        // Skills filter
        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim());
            filter['profile.skills'] = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
        }

        // Location filter
        if (location) {
            filter['profile.location'] = { $regex: location, $options: 'i' };
        }

        // Rating filter
        if (minRating) {
            filter['profile.rating'] = { $gte: parseFloat(minRating) };
        }

        const freelancers = await User.find(filter)
            .select('-password -__v')
            .sort({ 'profile.rating': -1, createdAt: -1 })
            .limit(50);

        res.json(freelancers);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all users (active or legacy users without status)
api.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { status: 'active' },
                { status: { $exists: false } }
            ]
        })
            .select('-__v')
            .sort({ createdAt: -1 });
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
        console.log('Suspending user:', req.params.id);
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
        console.log('Fetching notifications for email:', userEmail);

        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.log('User not found for email:', userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', user._id);
        const notifications = await Notification.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        console.log('Notifications found:', notifications.length);
        res.json(notifications);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications: ' + error.message });
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
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get notification count' });
    }
});

// Test endpoint: Create a sample notification (for debugging)
api.post('/notifications/test', async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        if (!userEmail) {
            return res.status(401).json({ error: 'User email required' });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const notification = await Notification.create({
            userId: user._id,
            title: 'Test Notification',
            message: 'This is a test notification to verify the system is working.',
            type: 'admin_notice',
            isRead: false
        });

        console.log('Test notification created:', notification._id);
        res.json({ message: 'Test notification created', notification });
    } catch (error: any) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ error: 'Failed to create test notification: ' + error.message });
    }
});



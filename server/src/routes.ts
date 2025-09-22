import { Router } from 'express';
import { User } from './models/User';
import { Project } from './models/Project';
import { Proposal } from './models/Proposal';
import { Message } from './models/Message';
import multer from 'multer';
import path from 'path';

// temporary auth stub: read x-user-email header
function getUserEmail(req: any): string | null {
    const email = req.header('x-user-email');
    return typeof email === 'string' ? email : null;
}

export const api = Router();

// simple local upload storage (for dev only)
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

// Profile upsert
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
api.get('/projects', async (req, res) => {
    try {
        const { q, category } = req.query as { q?: string; category?: string };
        const filter: any = { status: 'open' };
        if (category) filter.category = category;
        if (q) filter.$text = { $search: q };
        const projects = await Project.find(filter).sort({ createdAt: -1 });
        res.json(projects);
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

// Proposal accept/reject and update project status
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

// Messaging: send
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

// Messaging: list between two users (optional project)
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

// File upload (returns file path) and attach in messages
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



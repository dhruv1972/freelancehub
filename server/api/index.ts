// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from '../src/db';
import { api } from '../src/routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount API routes
app.use('/api', api);

// Connect to database
const MONGODB_URI = process.env.MONGODB_URI || '';
if (MONGODB_URI) {
    connectToDatabase(MONGODB_URI)
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('Failed to connect to MongoDB:', err.message);
        });
}

export default app;

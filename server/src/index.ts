// Express entry point
// Loads environment variables FIRST before any other imports that might use them
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file (MUST be first, before any other imports)
// Look for .env in the server directory (parent of src directory)
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Now import other modules that might use environment variables
import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './db';
import { api } from './routes';

// Debug: Log if Stripe key is loaded (without showing the key)
console.log('Environment check:');
console.log('- STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('- STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
if (process.env.STRIPE_SECRET_KEY) {
    console.log('✅ Stripe secret key is configured');
} else {
    console.log('⚠️  Stripe secret key is NOT configured (STRIPE_SECRET_KEY missing)');
    console.log('   Make sure STRIPE_SECRET_KEY is in server/.env file');
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', api);

connectToDatabase(MONGODB_URI)
    .then(() => {
        // Simple startup log for development visibility
        app.listen(PORT, () => {
            console.log(`API listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });


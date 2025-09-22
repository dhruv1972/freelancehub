import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri: string): Promise<typeof mongoose> {
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set');
    }
    mongoose.set('strictQuery', true);
    return mongoose.connect(mongoUri);
}



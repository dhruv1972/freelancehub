// Mongoose schema for User (week 2)
import { Schema, model, InferSchemaType } from 'mongoose';

const ProfileSchema = new Schema({
    bio: { type: String },
    skills: { type: [String], default: [] },
    experience: { type: String },
    portfolio: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    location: { type: String },
});

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: { type: String, enum: ['freelancer', 'client', 'admin'], required: true },
        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
        profile: { type: ProfileSchema, default: {} },
    },
    { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: any };
export const User = model('User', UserSchema);



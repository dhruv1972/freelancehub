// Review model for client/freelancer feedback after project completion.
// Week 4 scope - basic rating and comment system.
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    revieweeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    // Type of review: 'client-to-freelancer' or 'freelancer-to-client'
    reviewType: {
        type: String,
        enum: ['client-to-freelancer', 'freelancer-to-client'],
        required: true,
    },
}, {
    timestamps: true,
});

// Prevent duplicate reviews for same project/reviewer/reviewee combo
reviewSchema.index({ projectId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);

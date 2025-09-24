// Time tracking model for freelancers to log work hours on projects.
// Week 4 scope - basic start/stop time tracking functionality.
import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        // Optional - null means timer is still running
    },
    description: {
        type: String,
        trim: true,
    },
    // Auto-calculated duration in minutes when endTime is set
    durationMinutes: {
        type: Number,
    },
}, {
    timestamps: true,
});

// Calculate duration when endTime is set
timeEntrySchema.pre('save', function (next) {
    if (this.endTime && this.startTime) {
        this.durationMinutes = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    }
    next();
});

export const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

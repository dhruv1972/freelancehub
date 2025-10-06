// Mongoose schema for Notifications (week 5)
import { Schema, model, InferSchemaType, Types } from 'mongoose';

const NotificationSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['proposal_received', 'proposal_accepted', 'proposal_rejected', 'payment_received', 'project_completed', 'message_received', 'admin_notice'],
            required: true
        },
        relatedId: { type: Types.ObjectId }, // projectId, proposalId, messageId, etc.
        isRead: { type: Boolean, default: false },
        actionUrl: { type: String }, // URL to navigate to when clicked
    },
    { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & { _id: any };
export const Notification = model('Notification', NotificationSchema);

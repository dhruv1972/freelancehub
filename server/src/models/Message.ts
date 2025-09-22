import { Schema, model, Types, InferSchemaType } from 'mongoose';

const MessageSchema = new Schema(
    {
        senderId: { type: Types.ObjectId, ref: 'User', required: true },
        receiverId: { type: Types.ObjectId, ref: 'User', required: true },
        projectId: { type: Types.ObjectId, ref: 'Project' },
        content: { type: String, default: '' },
        attachments: { type: [String], default: [] },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export type MessageDocument = InferSchemaType<typeof MessageSchema> & { _id: any };
export const Message = model('Message', MessageSchema);



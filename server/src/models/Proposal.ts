// Mongoose schema for Proposal (week 2)
import { Schema, model, InferSchemaType, Types } from 'mongoose';

const ProposalSchema = new Schema(
    {
        projectId: { type: Types.ObjectId, ref: 'Project', required: true },
        freelancerId: { type: Types.ObjectId, ref: 'User', required: true },
        coverLetter: { type: String, required: true },
        proposedBudget: { type: Number, required: true },
        timeline: { type: String, required: true },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    },
    { timestamps: true }
);

export type ProposalDocument = InferSchemaType<typeof ProposalSchema> & { _id: any };
export const Proposal = model('Proposal', ProposalSchema);



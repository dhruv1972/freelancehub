import { Schema, model, InferSchemaType, Types } from 'mongoose';

const ProjectSchema = new Schema(
    {
        clientId: { type: Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        budget: { type: Number, required: true },
        timeline: { type: String, required: true },
        status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' },
        requirements: { type: [String], default: [] },
        selectedFreelancer: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export type ProjectDocument = InferSchemaType<typeof ProjectSchema> & { _id: any };
export const Project = model('Project', ProjectSchema);



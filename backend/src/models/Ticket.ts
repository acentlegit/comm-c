import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  customerId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  confidence: number; // AI confidence score
  breached: boolean; // SLA breach status
  responseTime?: number; // Time to first response in minutes
  resolutionTime?: number; // Time to resolution in minutes
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const TicketSchema = new Schema<ITicket>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: { type: String, default: 'general' },
  confidence: { type: Number, default: 0, min: 0, max: 1 },
  breached: { type: Boolean, default: false },
  responseTime: { type: Number },
  resolutionTime: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

TicketSchema.index({ customerId: 1, createdAt: -1 });
TicketSchema.index({ agentId: 1, status: 1 });
TicketSchema.index({ status: 1, priority: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);

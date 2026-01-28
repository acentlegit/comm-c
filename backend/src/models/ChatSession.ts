import mongoose, { Document, Schema } from 'mongoose';

export interface IChatSession extends Document {
  customerId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  ticketId?: mongoose.Types.ObjectId;
  type: 'chat' | 'voice' | 'video';
  status: 'waiting' | 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // in seconds
}

const ChatSessionSchema = new Schema<IChatSession>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'User' },
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
  type: { type: String, enum: ['chat', 'voice', 'video'], required: true },
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number }
});

ChatSessionSchema.index({ customerId: 1, status: 1 });
ChatSessionSchema.index({ agentId: 1, status: 1 });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'customer' | 'agent' | 'admin';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'agent', 'admin'], required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ ticketId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);

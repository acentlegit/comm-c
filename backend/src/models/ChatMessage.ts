import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

ChatMessageSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

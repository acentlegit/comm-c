import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'agent' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  scopes: string[];
  isActive: boolean;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const getDefaultScopesForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'customer':
      return [
        'tickets:create',
        'tickets:read:own',
        'messages:create:own',
        'sessions:create'
      ];
    case 'agent':
      return [
        'tickets:read:all',
        'tickets:update:assigned',
        'messages:create',
        'users:read:assigned'
      ];
    case 'admin':
      return [
        'tickets:*',
        'users:*',
        'analytics:read',
        'settings:update'
      ];
    default:
      return [];
  }
};

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'agent', 'admin'], required: true },
  scopes: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

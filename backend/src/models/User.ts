import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'member' | 'agent' | 'admin';

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
        'sessions:create',
        'sessions:join:own',
        'sessions:end:own'
      ];
    case 'member':
      // Member is read-only - no write permissions
      return [
        'tickets:read:family',
        'sessions:read:family',
        'analytics:read:optional'
      ];
    case 'agent':
      return [
        'tickets:read:all',
        'tickets:update:assigned',
        'tickets:resolve:assigned',
        'messages:create',
        'users:read:assigned',
        'sessions:join:assigned',
        'sessions:end:assigned'
      ];
    case 'admin':
      return [
        'tickets:*',
        'users:*',
        'analytics:read',
        'settings:update',
        'sessions:*',
        'audit:read'
      ];
    default:
      return [];
  }
};

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'member', 'agent', 'admin'], required: true },
  scopes: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    // If a new user is being created and scopes are not explicitly set, set default scopes
    if (this.isNew && (!this.scopes || this.scopes.length === 0)) {
      this.scopes = getDefaultScopesForRole(this.role);
    }
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

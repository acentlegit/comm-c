import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  scopes?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Scope-based RBAC (inspired by uam-hardening-pack rbac-enforced.js)
export const requireScope = (scope: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Block write operations for Member (Read-only) role
export const blockMemberWrite = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'member') {
    return res.status(403).json({ 
      error: 'Read-only access. Members cannot perform write operations.' 
    });
  }
  next();
};

import { Document, Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

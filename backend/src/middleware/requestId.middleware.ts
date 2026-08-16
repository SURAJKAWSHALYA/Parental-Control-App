import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
  id?: string;
}

export const requestIdMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  req.id = reqId as string;
  res.setHeader('x-request-id', reqId);
  next();
};

import { Request, Response, NextFunction } from 'express';
import IdempotencyKey from '../models/IdempotencyKey';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.header('Idempotency-Key');

  if (!idempotencyKey) {
    return next();
  }

  try {
    const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });

    if (existingKey) {
      if (existingKey.responseBody && existingKey.statusCode) {
        // Return the cached response
        return res.status(existingKey.statusCode).json(JSON.parse(existingKey.responseBody));
      } else {
        // The request is currently being processed
        return res.status(409).json({
          success: false,
          message: 'Concurrent request is being processed with the same Idempotency-Key.'
        });
      }
    }

    // Create a new key record marking it as in-progress
    await IdempotencyKey.create({ key: idempotencyKey });

    // Override res.json to capture the response and save it
    const originalJson = res.json;
    res.json = function (body: any) {
      IdempotencyKey.updateOne(
        { key: idempotencyKey },
        {
          $set: {
            responseBody: JSON.stringify(body),
            statusCode: res.statusCode
          }
        }
      ).catch((err) => {
        console.error('Failed to update idempotency key with response:', err);
      });
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    next(error);
  }
};

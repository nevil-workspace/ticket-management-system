import { Response, NextFunction } from 'express';
import { limiterSlidingWindow } from './rateLimiter';
import { AuthRequest } from './auth';

export const rateLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.ip) {
      console.warn('Request received without an IP address');
      res.status(400).json({ message: 'Invalid request: IP address not found' });
      return;
    }

    await limiterSlidingWindow.consume(req.ip);
    next();
  } catch (error) {
    console.error(error);
    res.status(429).json({ message: 'Too Many Requests' });
  }
};

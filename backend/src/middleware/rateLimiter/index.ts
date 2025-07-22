import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../../utils/redisClient';

const commonOptions = {
  storeClient: redisClient,
  keyPrefix: 'rate-limit', // Redis key prefix
};

export const limiterSlidingWindow = new RateLimiterRedis({
  ...commonOptions,
  points: 60, // 60 requests
  duration: 60, // per 60 seconds
  useRedisPackage: true,
  insuranceLimiter: undefined,
});

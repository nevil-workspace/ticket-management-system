import { createClient } from 'redis';

let redisClient;
if (process.env.REDIS_URL) {
  // Production (Upstash)
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  // Local Docker Redis
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

redisClient.on('error', (err) => console.error('Redis Error', err));
redisClient.connect().then(() => {
  console.log('✅', 'Redis client initialized');
});

export { redisClient };

import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

redisClient.on('error', (err) => console.error('Redis Error', err));
redisClient.connect().then(() => {
  console.log('✅', 'Redis client initialized');
});

export { redisClient };

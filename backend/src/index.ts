import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import ticketRoutes from './routes/ticket.routes';
import { rateLimitMiddleware } from './middleware/rateLimiterMiddleWare';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.on('user:join', (userId: string) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their SocketId (${socket.id})`);
    }
  });
  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// rate limit middleware
app.use(rateLimitMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

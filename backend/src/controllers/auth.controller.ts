import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import dotenv from 'dotenv';
import { Request as ExpressRequest } from 'express';
import { uploadProfileImage, deleteProfileImage, UploadProvider } from '../uploadProvider';

interface MulterRequest extends ExpressRequest {
  file?: Express.Multer.File;
}

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// @ts-ignore kept to choose between GCP and Cloudinary
const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);

// @ts-ignore
const upload = multer({ storage: multer.memoryStorage() });

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ message: 'Missing Google credential' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub || !payload.name) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          profileImage: payload.picture,
        },
      });
    } else if (!user.googleId) {
      // Link Google account if not already linked
      user = await prisma.user.update({
        where: { email: payload.email },
        data: { googleId: payload.sub },
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Google login failed' });
  }
};

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const editUser = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { name } = req.body;
    let profileImageUrl: string | undefined;
    const provider = (process.env.PROFILE_IMAGE_PROVIDER || 'gcp') as UploadProvider;

    // Enforce 3MB file size limit
    if (req.file && req.file.size > 3 * 1024 * 1024) {
      res.status(400).json({ message: 'Profile picture must be less than 3MB' });
      return;
    }

    if (req.file) {
      // Remove old image if present
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.profileImage) {
        await deleteProfileImage({ provider, userId, previousUrl: user.profileImage });
      }
      // Upload new image
      profileImageUrl = await uploadProfileImage({ provider, userId, file: req.file });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (profileImageUrl) updateData.profileImage = profileImageUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error });
  }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    // (paginated, unread first, then recent)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: Number(pageSize),
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

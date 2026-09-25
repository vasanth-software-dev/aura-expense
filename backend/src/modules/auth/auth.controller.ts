import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { env } from '../../config/env';
import { ApiResponse } from '../../utils/api-response';
import { DEFAULT_INDIAN_CATEGORIES } from '../../config/constants';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2),
    currency: z.string().default('INR'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export class AuthController {
  public static async register(req: Request, res: Response) {
    const { email, password, name, currency } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return ApiResponse.error(res, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        currency: currency || 'INR',
      },
    });

    // Seed default categories for this user
    await prisma.category.createMany({
      data: DEFAULT_INDIAN_CATEGORIES.map((cat) => ({
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        colorHex: cat.colorHex,
        type: cat.type,
        isDefault: true,
      })),
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return ApiResponse.success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
      },
    }, 201);
  }

  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return ApiResponse.error(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return ApiResponse.error(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return ApiResponse.success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
      },
    });
  }

  public static async getProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, currency: true, createdAt: true },
    });

    if (!user) {
      return ApiResponse.error(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    return ApiResponse.success(res, user);
  }
}

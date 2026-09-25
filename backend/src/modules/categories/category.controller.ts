import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    icon: z.string().min(1),
    colorHex: z.string().regex(/^#([0-9A-Fa-f]{6})$/),
    type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).default('EXPENSE'),
  }),
});

export class CategoryController {
  public static async getCategories(req: Request, res: Response) {
    const userId = req.user!.id;

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return ApiResponse.success(res, categories);
  }

  public static async createCategory(req: Request, res: Response) {
    const userId = req.user!.id;
    const { name, icon, colorHex, type } = req.body;

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        icon,
        colorHex,
        type,
        isDefault: false,
      },
    });

    return ApiResponse.success(res, category, 201);
  }

  public static async deleteCategory(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const cat = await prisma.category.findFirst({
      where: { id, userId },
    });
    if (!cat) {
      return ApiResponse.error(res, 'CATEGORY_NOT_FOUND', 'Custom category not found or is a system default', 404);
    }

    await prisma.category.delete({ where: { id } });

    return ApiResponse.success(res, { deleted: true });
  }
}

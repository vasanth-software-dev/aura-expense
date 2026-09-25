import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';

export const setBudgetSchema = z.object({
  body: z.object({
    monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
    totalLimit: z.number().positive(),
    categoryLimits: z.record(z.string(), z.number()).optional(),
  }),
});

export class BudgetController {
  public static async getCurrentBudget(req: Request, res: Response) {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = (req.query.monthYear as string) || currentMonthYear;

    const budget = await prisma.budget.findUnique({
      where: { userId_monthYear: { userId, monthYear } },
    });

    // Calculate actual spending in this month
    const startOfMonth = new Date(`${monthYear}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'DEBIT',
        isTransfer: false,
        transactionTime: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { amount: true, categoryId: true },
    });

    const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Calculate per-category spent
    const categorySpentMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.categoryId) {
        categorySpentMap[tx.categoryId] = (categorySpentMap[tx.categoryId] || 0) + Number(tx.amount);
      }
    }

    const totalLimit = budget ? Number(budget.totalLimit) : 0;
    const remaining = Math.max(0, totalLimit - totalSpent);
    const progress = totalLimit > 0 ? totalSpent / totalLimit : 0;

    return ApiResponse.success(res, {
      monthYear,
      hasBudget: !!budget,
      totalLimit,
      totalSpent,
      remaining,
      progress,
      isOverBudget: totalSpent > totalLimit && totalLimit > 0,
      categoryLimits: (budget?.categoryLimits as Record<string, number>) || {},
      categorySpent: categorySpentMap,
    });
  }

  public static async setBudget(req: Request, res: Response) {
    const userId = req.user!.id;
    const { monthYear, totalLimit, categoryLimits } = req.body;

    const budget = await prisma.budget.upsert({
      where: { userId_monthYear: { userId, monthYear } },
      create: {
        userId,
        monthYear,
        totalLimit,
        categoryLimits: categoryLimits || {},
      },
      update: {
        totalLimit,
        categoryLimits: categoryLimits || {},
      },
    });

    return ApiResponse.success(res, {
      ...budget,
      totalLimit: Number(budget.totalLimit),
    });
  }
}

import { Request, Response } from 'express';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';

export class ReportController {
  public static async getSummary(req: Request, res: Response) {
    const userId = req.user!.id;
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [currentMonthTxs, prevMonthTxs] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, transactionTime: { gte: startOfMonth } },
        select: { amount: true, type: true, isTransfer: true },
      }),
      prisma.transaction.findMany({
        where: { userId, transactionTime: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        select: { amount: true, type: true, isTransfer: true },
      }),
    ]);

    const calculateTotals = (txs: typeof currentMonthTxs) => {
      let expense = 0;
      let income = 0;
      let transfers = 0;

      for (const t of txs) {
        const amt = Number(t.amount);
        if (t.isTransfer) transfers += amt;
        else if (t.type === 'DEBIT') expense += amt;
        else if (t.type === 'CREDIT') income += amt;
      }

      return { expense, income, transfers, savings: income - expense };
    };

    const current = calculateTotals(currentMonthTxs);
    const previous = calculateTotals(prevMonthTxs);

    // Percentage change in expense compared to last month
    const expenseChangePercent = previous.expense > 0
      ? Math.round(((current.expense - previous.expense) / previous.expense) * 100)
      : 0;

    return ApiResponse.success(res, {
      currentMonth: {
        spent: current.expense,
        income: current.income,
        transfers: current.transfers,
        savings: current.savings,
        transactionCount: currentMonthTxs.length,
      },
      previousMonth: {
        spent: previous.expense,
        income: previous.income,
      },
      expenseChangePercent,
    });
  }

  public static async getCategoryBreakdown(req: Request, res: Response) {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'DEBIT',
        isTransfer: false,
        transactionTime: { gte: since },
      },
      include: {
        category: true,
      },
    });

    const categoryMap: Record<string, { id: string; name: string; icon: string; colorHex: string; total: number }> = {};
    let grandTotal = 0;

    for (const t of transactions) {
      const amt = Number(t.amount);
      grandTotal += amt;
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Other';
      const icon = t.category?.icon || 'more_horiz';
      const colorHex = t.category?.colorHex || '#8E8E93';

      if (!categoryMap[catId]) {
        categoryMap[catId] = { id: catId, name: catName, icon, colorHex, total: 0 };
      }
      categoryMap[catId].total += amt;
    }

    const items = Object.values(categoryMap)
      .map((cat) => ({
        ...cat,
        percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return ApiResponse.success(res, {
      grandTotal,
      categories: items,
    });
  }

  public static async getTrends(req: Request, res: Response) {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 14;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'DEBIT',
        isTransfer: false,
        transactionTime: { gte: since },
      },
      select: { amount: true, transactionTime: true },
      orderBy: { transactionTime: 'asc' },
    });

    // Group by YYYY-MM-DD
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    for (const t of transactions) {
      const key = new Date(t.transactionTime).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += Number(t.amount);
      }
    }

    const trend = Object.entries(dailyMap).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    return ApiResponse.success(res, trend);
  }
}

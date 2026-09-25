import { Request, Response } from 'express';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';

export class PrivacyController {
  public static async exportData(req: Request, res: Response) {
    const userId = req.user!.id;
    const format = (req.query.format as string) || 'json';

    const [transactions, categories, accounts, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true, account: true },
      }),
      prisma.category.findMany({ where: { OR: [{ userId: null }, { userId }] } }),
      prisma.account.findMany({
        where: { userId },
        select: { id: true, institutionName: true, accountType: true, maskLastFour: true, balance: true },
      }),
      prisma.budget.findMany({ where: { userId } }),
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPORT_DATA',
        detailsMasked: { format, transactionCount: transactions.length },
      },
    });

    if (format === 'csv') {
      const header = 'ID,Date,Type,Amount,Currency,Merchant,Category,PaymentMethod,Account,UPI_Ref\n';
      const rows = transactions.map((t) => {
        const cleanMerchant = (t.merchant || '').replace(/,/g, ' ');
        const cleanCat = (t.category?.name || 'Other').replace(/,/g, ' ');
        const cleanAcc = t.account ? `${t.account.institutionName} ••${t.account.maskLastFour}` : '';
        return `"${t.id}","${t.transactionTime.toISOString()}","${t.type}","${t.amount}","${t.currency}","${cleanMerchant}","${cleanCat}","${t.paymentMethod}","${cleanAcc}","${t.upiReference || ''}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aura_financial_export.csv"');
      return res.send(header + rows);
    }

    return ApiResponse.success(res, {
      exportedAt: new Date().toISOString(),
      user: { id: userId, email: req.user!.email },
      accounts,
      categories,
      budgets,
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        confidence: Number(t.confidence),
      })),
    });
  }

  public static async getAuditLogs(req: Request, res: Response) {
    const userId = req.user!.id;

    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return ApiResponse.success(res, logs);
  }

  public static async deleteAccount(req: Request, res: Response) {
    const userId = req.user!.id;

    // Log deletion before cascade
    await prisma.auditLog.create({
      data: {
        userId: null, // detached because user will be deleted
        action: 'DELETE_ACCOUNT',
        detailsMasked: { userId, timestamp: new Date() },
      },
    });

    // Cascade delete user and all associated financial records
    await prisma.user.delete({
      where: { id: userId },
    });

    return ApiResponse.success(res, {
      message: 'Your account and all associated financial data have been permanently deleted.',
    });
  }
}

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';

export const createAccountSchema = z.object({
  body: z.object({
    accountName: z.string().min(1, 'Account name is required (e.g. AD-HDFCBK-S)'),
    institutionName: z.string().optional(),
    accountType: z.enum(['SAVINGS', 'CURRENT', 'CREDIT_CARD', 'WALLET', 'CASH']).default('SAVINGS'),
    maskLastFour: z.string().optional(),
    ifscPrefix: z.string().optional(),
    balance: z.number().optional(),
  }),
});

export class AccountController {
  public static async getAccounts(req: Request, res: Response) {
    const userId = req.user!.id;

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return ApiResponse.success(res, accounts.map((a) => ({
      ...a,
      displayName: a.accountName || a.institutionName,
      balance: a.balance ? Number(a.balance) : null,
      transactionCount: a._count.transactions,
    })));
  }

  public static async createAccount(req: Request, res: Response) {
    const userId = req.user!.id;
    const { accountName, institutionName, accountType, maskLastFour, ifscPrefix, balance } = req.body;

    const account = await prisma.account.create({
      data: {
        userId,
        accountName: accountName.trim(),
        institutionName: (institutionName || accountName).trim(),
        accountType: accountType || 'SAVINGS',
        maskLastFour: maskLastFour || null,
        ifscPrefix: ifscPrefix || null,
        balance,
      },
    });

    return ApiResponse.success(res, {
      ...account,
      displayName: account.accountName,
      balance: account.balance ? Number(account.balance) : null,
    }, 201);
  }

  public static async deleteAccount(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const account = await prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) {
      return ApiResponse.error(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 404);
    }

    await prisma.account.delete({ where: { id } });

    return ApiResponse.success(res, { deleted: true });
  }
}

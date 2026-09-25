import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';
import { SmsParserRegistry } from '../parsers/sms';
import { Deduplicator, ExistingTransactionRecord } from '../engine/deduplicator';
import { TransferDetector } from '../engine/transfer-detector';
import { Categorizer } from '../engine/categorizer';

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().default('INR'),
    type: z.enum(['DEBIT', 'CREDIT']),
    merchant: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    accountId: z.string().optional(),
    accountName: z.string().optional(),
    paymentMethod: z.enum(['UPI', 'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'ATM', 'OTHER']).default('UPI'),
    transactionTime: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const smsIngestSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        sender: z.string(),
        body: z.string(),
        timestamp: z.string().optional(),
        messageId: z.string().optional(),
      })
    ).min(1),
  }),
});

export const confirmReviewSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    rememberRule: z.boolean().default(false),
  }),
});

export class TransactionController {
  public static async getTransactions(req: Request, res: Response) {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const {
      type,
      paymentMethod,
      categoryId,
      accountId,
      source,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const where: any = { userId };

    if (type) where.type = type;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (source) where.source = source;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.transactionTime = {};
      if (startDate) where.transactionTime.gte = new Date(startDate as string);
      if (endDate) where.transactionTime.lte = new Date(endDate as string);
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { merchant: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { upiReference: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionTime: 'desc' },
        include: {
          category: { select: { id: true, name: true, icon: true, colorHex: true } },
          account: { select: { id: true, institutionName: true, maskLastFour: true } },
          sources: { select: { sourceType: true, receivedAt: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return ApiResponse.success(res, {
      items: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        confidence: Number(t.confidence),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  public static async getTransactionById(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        account: true,
        sources: true,
      },
    });

    if (!transaction) {
      return ApiResponse.error(res, 'TRANSACTION_NOT_FOUND', 'Transaction not found', 404);
    }

    return ApiResponse.success(res, {
      ...transaction,
      amount: Number(transaction.amount),
      confidence: Number(transaction.confidence),
    });
  }

  public static async createTransaction(req: Request, res: Response) {
    const userId = req.user!.id;
    const data = req.body;

    // Verify account ownership if provided
    if (data.accountId) {
      const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
      if (!account) {
        return ApiResponse.error(res, 'ACCOUNT_NOT_FOUND', 'Account not found or access denied', 404);
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: data.amount,
        currency: data.currency || 'INR',
        type: data.type,
        merchant: data.merchant,
        description: data.description,
        categoryId: data.categoryId,
        accountId: data.accountId,
        accountName: data.accountName || null,
        paymentMethod: data.paymentMethod,
        transactionTime: data.transactionTime ? new Date(data.transactionTime) : new Date(),
        source: 'MANUAL',
        confidence: 1.0,
        status: 'CONFIRMED',
        notes: data.notes,
        sources: {
          create: {
            sourceType: 'MANUAL',
            messageSnippetMasked: 'Manual Entry',
          },
        },
      },
      include: {
        category: true,
        account: true,
      },
    });

    return ApiResponse.success(res, {
      ...transaction,
      amount: Number(transaction.amount),
      confidence: Number(transaction.confidence),
    }, 201);
  }

  public static async ingestSmsMessages(req: Request, res: Response) {
    const userId = req.user!.id;
    const { messages } = req.body;

    const userAccounts = await prisma.account.findMany({ where: { userId } });
    const categories = await prisma.category.findMany({ where: { OR: [{ userId: null }, { userId }] } });
    const userRules = await prisma.userCategoryRule.findMany({
      where: { userId },
      include: { category: true },
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        transactionTime: true,
        upiReference: true,
        bankReference: true,
        merchant: true,
        source: true,
        accountId: true,
        isTransfer: true,
      },
    });

    const existingRecords: ExistingTransactionRecord[] = recentTransactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      transactionTime: tx.transactionTime,
      upiReference: tx.upiReference,
      bankReference: tx.bankReference,
      merchant: tx.merchant,
      source: tx.source,
    }));

    let importedCount = 0;
    let duplicatesCount = 0;
    let reviewCount = 0;

    for (const msg of messages) {
      const normalized = SmsParserRegistry.parse({
        sender: msg.sender,
        body: msg.body,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        messageId: msg.messageId,
      });

      if (!normalized) continue;

      // Deduplication check
      const dedupResult = Deduplicator.checkDuplicate(normalized, existingRecords);
      if (dedupResult.isDuplicate && dedupResult.matchedTransactionId) {
        duplicatesCount++;
        await prisma.transactionSource.create({
          data: {
            transactionId: dedupResult.matchedTransactionId,
            sourceType: 'SMS',
            externalId: normalized.sourceMessageId,
            messageSnippetMasked: normalized.description,
          },
        });
        continue;
      }

      // Transfer detection
      const transferResult = TransferDetector.detectTransfer(
        normalized,
        userAccounts.map((a) => ({ id: a.id, maskLastFour: a.maskLastFour, institutionName: a.institutionName })),
        recentTransactions.map((t) => ({
          id: t.id,
          accountId: t.accountId,
          amount: Number(t.amount),
          type: t.type,
          transactionTime: t.transactionTime,
          isTransfer: t.isTransfer,
        }))
      );

      // Categorization
      const catResult = Categorizer.categorize(
        normalized,
        categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        userRules.map((r) => ({
          categoryId: r.categoryId,
          categoryName: r.category.name,
          matchField: r.matchField,
          matchPattern: r.matchPattern,
        }))
      );

      const status = catResult.confidence < 0.8 ? 'PENDING_REVIEW' : 'CONFIRMED';
      if (status === 'PENDING_REVIEW') reviewCount++;

      const matchedAccount = normalized.accountLastFour
        ? userAccounts.find((a) => a.maskLastFour === normalized.accountLastFour)
        : undefined;

      const createdTx = await prisma.transaction.create({
        data: {
          userId,
          accountId: matchedAccount?.id,
          categoryId: catResult.categoryId,
          amount: normalized.amount,
          currency: normalized.currency,
          type: normalized.type,
          merchant: normalized.merchant ?? null,
          description: normalized.description ?? null,
          paymentMethod: normalized.paymentMethod,
          transactionTime: normalized.transactionTime,
          upiReference: normalized.upiReference ?? null,
          source: 'SMS',
          sourceMessageId: normalized.sourceMessageId ?? null,
          confidence: catResult.confidence,
          isTransfer: transferResult.isTransfer,
          transferPairId: transferResult.pairedTransactionId ?? null,
          status,
          sources: {
            create: {
              sourceType: 'SMS',
              externalId: normalized.sourceMessageId ?? null,
              messageSnippetMasked: normalized.description ?? null,
            },
          },
        },
      });

      importedCount++;

      existingRecords.push({
        id: createdTx.id,
        amount: normalized.amount,
        type: normalized.type,
        transactionTime: normalized.transactionTime,
        upiReference: normalized.upiReference ?? null,
        bankReference: normalized.bankReference ?? null,
        merchant: normalized.merchant ?? null,
        source: 'SMS',
      });
    }

    return ApiResponse.success(res, {
      imported: importedCount,
      duplicates: duplicatesCount,
      needsReview: reviewCount,
    });
  }

  public static async getReviewQueue(req: Request, res: Response) {
    const userId = req.user!.id;

    const items = await prisma.transaction.findMany({
      where: { userId, status: 'PENDING_REVIEW' },
      orderBy: { transactionTime: 'desc' },
      include: {
        category: true,
        account: true,
      },
    });

    return ApiResponse.success(res, items.map((t) => ({
      ...t,
      amount: Number(t.amount),
      confidence: Number(t.confidence),
    })));
  }

  public static async confirmReview(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { categoryId, rememberRule } = req.body;

    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!tx) {
      return ApiResponse.error(res, 'TRANSACTION_NOT_FOUND', 'Transaction not found', 404);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId,
        status: 'CONFIRMED',
        confidence: 1.0,
      },
      include: { category: true },
    });

    // If rememberRule is true and merchant is known, create a permanent UserCategoryRule!
    if (rememberRule && tx.merchant) {
      await prisma.userCategoryRule.create({
        data: {
          userId,
          categoryId,
          matchField: 'MERCHANT',
          matchPattern: tx.merchant.trim(),
          priority: 1,
        },
      });
    }

    return ApiResponse.success(res, {
      ...updated,
      amount: Number(updated.amount),
      confidence: Number(updated.confidence),
    });
  }

  public static async deleteTransaction(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) {
      return ApiResponse.error(res, 'TRANSACTION_NOT_FOUND', 'Transaction not found', 404);
    }

    await prisma.transaction.delete({ where: { id } });

    return ApiResponse.success(res, { deleted: true });
  }
}

import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, prisma } from './database/client';
import { errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limiter';
import { QueueService } from './queues/queue.service';
import { SyncService } from './modules/sync/sync.service';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import categoryRoutes from './modules/categories/category.routes';
import accountRoutes from './modules/accounts/account.routes';
import budgetRoutes from './modules/budgets/budget.routes';
import reportRoutes from './modules/reports/report.routes';
import emailAccountRoutes from './modules/email/email-account.routes';
import privacyRoutes from './modules/privacy/privacy.routes';

const app = express();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'degraded';
  }

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: 'ok',
    version: '1.0.0',
    service: 'Aura Expense API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/email-accounts', emailAccountRoutes);
apiRouter.use('/privacy', privacyRoutes);

app.use(env.API_PREFIX, apiRouter);

// Serve Mobile Web App (PWA)
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap Server
async function startServer() {
  await connectDatabase();

  // Initialize background queue worker
  await QueueService.init(async (jobData) => {
    await SyncService.executeSync(jobData);
  });

  if (process.env.NODE_ENV !== 'test') {
    app.listen(env.PORT, () => {
      logger.info(`✨ Aura Expense API running on http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`⚡ Health check available at http://localhost:${env.PORT}/health`);
    });
  }
}

startServer().catch((err) => {
  logger.error('Failed to start Aura Expense API server', err);
});

export default app;

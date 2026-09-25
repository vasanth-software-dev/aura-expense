import { Router } from 'express';
import {
  TransactionController,
  createTransactionSchema,
  smsIngestSchema,
  confirmReviewSchema,
} from './transaction.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', TransactionController.getTransactions);
router.post('/', validate(createTransactionSchema), TransactionController.createTransaction);
router.post('/sms-ingest', validate(smsIngestSchema), TransactionController.ingestSmsMessages);
router.get('/review-queue', TransactionController.getReviewQueue);
router.post('/:id/confirm-review', validate(confirmReviewSchema), TransactionController.confirmReview);
router.get('/:id', TransactionController.getTransactionById);
router.delete('/:id', TransactionController.deleteTransaction);

export default router;

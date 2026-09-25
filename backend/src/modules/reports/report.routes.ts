import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', ReportController.getSummary);
router.get('/categories', ReportController.getCategoryBreakdown);
router.get('/trends', ReportController.getTrends);

export default router;

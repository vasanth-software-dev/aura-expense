import { Router } from 'express';
import { PrivacyController } from './privacy.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/export', PrivacyController.exportData);
router.get('/audit-logs', PrivacyController.getAuditLogs);
router.delete('/delete-account', PrivacyController.deleteAccount);

export default router;

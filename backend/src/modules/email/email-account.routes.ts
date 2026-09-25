import { Router } from 'express';
import { EmailAccountController } from './email-account.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// OAuth callback routes (invoked by browser redirect, public)
router.get('/gmail/callback', EmailAccountController.handleGmailCallback);
router.get('/outlook/callback', EmailAccountController.handleOutlookCallback);

// Authenticated user routes
router.use(authenticate);

router.get('/', EmailAccountController.getAccounts);
router.post('/gmail/connect', EmailAccountController.connectGmail);
router.post('/outlook/connect', EmailAccountController.connectOutlook);
router.post('/:id/sync', EmailAccountController.triggerSync);
router.delete('/:id', EmailAccountController.disconnectAccount);

export default router;

import { Router } from 'express';
import { AccountController, createAccountSchema } from './account.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', AccountController.getAccounts);
router.post('/', validate(createAccountSchema), AccountController.createAccount);
router.delete('/:id', AccountController.deleteAccount);

export default router;

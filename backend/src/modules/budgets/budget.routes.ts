import { Router } from 'express';
import { BudgetController, setBudgetSchema } from './budget.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', BudgetController.getCurrentBudget);
router.post('/', validate(setBudgetSchema), BudgetController.setBudget);

export default router;

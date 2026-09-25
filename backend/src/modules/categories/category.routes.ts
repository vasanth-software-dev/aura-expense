import { Router } from 'express';
import { CategoryController, createCategorySchema } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', CategoryController.getCategories);
router.post('/', validate(createCategorySchema), CategoryController.createCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;

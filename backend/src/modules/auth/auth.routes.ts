import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from './auth.controller';
import { validate } from '../../middleware/validator';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;

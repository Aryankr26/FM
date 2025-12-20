import { Router, type Router as ExpressRouter } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validator';
import { loginSchema, registerSchema } from './auth.types';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router: ExpressRouter = Router();
const authController = new AuthController();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login', validate(loginSchema), authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.me.bind(authController));

export default router;

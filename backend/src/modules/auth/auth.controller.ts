import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from './auth.types';
import { AuthRequest } from '../../middleware/auth';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input: RegisterInput = req.body;
      const result = await authService.register(input);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await authService.me(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

import { Router, type Router as ExpressRouter } from 'express';
import { AlertsController } from './alerts.controller';
import { validate } from '../../middleware/validator';
import { getAlertsSchema, resolveAlertSchema } from './alerts.types';
import { authenticate } from '../../middleware/auth';

const router: ExpressRouter = Router();
const alertsController = new AlertsController();

// All routes require authentication
router.use(authenticate);

// Get alert statistics (must be before /:id route)
router.get(
  '/statistics',
  alertsController.getStatistics.bind(alertsController)
);

// Get alerts with filters
router.get(
  '/',
  validate(getAlertsSchema),
  alertsController.getAlerts.bind(alertsController)
);

// Get alert by ID
router.get(
  '/:id',
  alertsController.getAlertById.bind(alertsController)
);

// Resolve alert
router.post(
  '/:id/resolve',
  validate(resolveAlertSchema),
  alertsController.resolveAlert.bind(alertsController)
);

export default router;

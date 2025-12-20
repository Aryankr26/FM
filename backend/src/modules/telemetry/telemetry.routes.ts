import { Router, type Router as ExpressRouter } from 'express';
import { TelemetryController } from './telemetry.controller';
import { validate } from '../../middleware/validator';
import { telemetryInputSchema, getTelemetrySchema } from './telemetry.types';
import { authenticate } from '../../middleware/auth';
import { telemetryLimiter } from '../../middleware/rateLimiter';

const router: ExpressRouter = Router();
const telemetryController = new TelemetryController();

// Ingest telemetry (high rate limit for GPS devices)
router.post(
  '/',
  telemetryLimiter,
  authenticate,
  validate(telemetryInputSchema),
  telemetryController.ingest.bind(telemetryController)
);

// Get telemetry for specific vehicle (protected)
router.get(
  '/:vehicleId',
  authenticate,
  validate(getTelemetrySchema),
  telemetryController.getTelemetryByVehicle.bind(telemetryController)
);

// Get latest telemetry for specific vehicle (protected)
router.get(
  '/:vehicleId/latest',
  authenticate,
  telemetryController.getLatestTelemetry.bind(telemetryController)
);

// Get latest telemetry for all vehicles (protected)
router.get(
  '/latest/all',
  authenticate,
  telemetryController.getAllLatestTelemetry.bind(telemetryController)
);

export default router;

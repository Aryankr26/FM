import { Router, type Router as ExpressRouter } from 'express';
import { FuelController } from './fuel.controller';
import { validate } from '../../middleware/validator';
import { getFuelEventsSchema } from './fuel.types';
import { authenticate } from '../../middleware/auth';

const router: ExpressRouter = Router();
const fuelController = new FuelController();

// All routes require authentication
router.use(authenticate);

// Get fuel events with filters
router.get(
  '/events',
  validate(getFuelEventsSchema),
  fuelController.getFuelEvents.bind(fuelController)
);

// Get theft events only
router.get(
  '/theft',
  fuelController.getTheftEvents.bind(fuelController)
);

// Get fuel statistics
router.get(
  '/statistics',
  fuelController.getFuelStatistics.bind(fuelController)
);

export default router;

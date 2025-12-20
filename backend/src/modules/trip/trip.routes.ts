import { Router, type Router as ExpressRouter } from 'express';
import { TripController } from './trip.controller';
import { authenticate } from '../../middleware/auth';

const router: ExpressRouter = Router();
const tripController = new TripController();

// All routes require authentication
router.use(authenticate);

// Get all trips
router.get(
  '/',
  tripController.getAll.bind(tripController)
);

// Get trips by vehicle
router.get(
  '/vehicle/:vehicleId',
  tripController.getByVehicle.bind(tripController)
);

// Get trip by ID
router.get(
  '/:id',
  tripController.getById.bind(tripController)
);

export default router;

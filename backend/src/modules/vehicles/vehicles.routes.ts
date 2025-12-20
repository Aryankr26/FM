import { Router, type Router as ExpressRouter } from 'express';
import { VehiclesController } from './vehicles.controller';
import { validate } from '../../middleware/validator';
import {
  createVehicleSchema,
  updateVehicleSchema,
  deleteVehicleSchema,
  getVehicleSchema,
  getVehiclesQuerySchema,
} from './vehicles.types';
import { authenticate, authorize } from '../../middleware/auth';

const router: ExpressRouter = Router();
const vehiclesController = new VehiclesController();

// All routes require authentication
router.use(authenticate);

// Get statistics (must be before /:id)
router.get(
  '/statistics',
  vehiclesController.getStatistics.bind(vehiclesController)
);

// Get all vehicles
router.get(
  '/',
  validate(getVehiclesQuerySchema),
  vehiclesController.getVehicles.bind(vehiclesController)
);

// Get vehicle by ID
router.get(
  '/:id',
  validate(getVehicleSchema),
  vehiclesController.getVehicleById.bind(vehiclesController)
);

// Create vehicle (owner/supervisor only)
router.post(
  '/',
  authorize('owner', 'supervisor'),
  validate(createVehicleSchema),
  vehiclesController.createVehicle.bind(vehiclesController)
);

// Update vehicle (owner/supervisor only)
router.put(
  '/:id',
  authorize('owner', 'supervisor'),
  validate(updateVehicleSchema),
  vehiclesController.updateVehicle.bind(vehiclesController)
);

// Delete vehicle (owner only)
router.delete(
  '/:id',
  authorize('owner'),
  validate(deleteVehicleSchema),
  vehiclesController.deleteVehicle.bind(vehiclesController)
);

export default router;

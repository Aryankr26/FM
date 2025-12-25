import { Router, type Router as ExpressRouter } from 'express';
import { GeofenceController } from './geofence.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router: ExpressRouter = Router();
const geofenceController = new GeofenceController();

// All routes require authentication
router.use(authenticate);

// Get all geofences
router.get(
  '/',
  geofenceController.getAll.bind(geofenceController)
);

// Get geofence by ID
router.get(
  '/:id',
  geofenceController.getById.bind(geofenceController)
);

// Create geofence (owner/supervisor only)
router.post(
  '/',
  authorize('owner', 'supervisor'),
  geofenceController.create.bind(geofenceController)
);

// Update geofence (owner/supervisor only)
router.patch(
  '/:id',
  authorize('owner', 'supervisor'),
  geofenceController.update.bind(geofenceController)
);

// Delete geofence (owner only)
router.delete(
  '/:id',
  authorize('owner'),
  geofenceController.delete.bind(geofenceController)
);

// Get geofence alerts
router.get(
  '/alerts/all',
  geofenceController.getAlerts.bind(geofenceController)
);

export default router;

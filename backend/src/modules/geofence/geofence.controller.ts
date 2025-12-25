import { type NextFunction, type Request, type Response } from 'express';
import { GeofenceService } from './geofence.service';

const service = new GeofenceService();

export class GeofenceController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const geofences = await service.getAll();
      res.json({ count: geofences.length, data: geofences });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const geofence = await service.getById(id);
      if (!geofence) {
        res.status(404).json({ message: 'Geofence not found' });
        return;
      }
      res.json({ data: geofence });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const geofence = await service.create(req.body);
      res.status(201).json({ data: geofence });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const geofence = await service.update(id, req.body);
      res.json({ data: geofence });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const geofence = await service.delete(id);
      res.json({ data: geofence });
    } catch (err) {
      next(err);
    }
  }

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
      const resolved =
        req.query.resolved === 'true'
          ? true
          : req.query.resolved === 'false'
            ? false
            : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const alerts = await service.getAlerts({ vehicleId, resolved, limit });
      res.json({ count: alerts.length, data: alerts });
    } catch (err) {
      next(err);
    }
  }
}

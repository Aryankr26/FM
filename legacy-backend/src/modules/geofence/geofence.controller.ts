import { Request, Response, NextFunction } from 'express';
import { GeofenceService } from './geofence.service';
import { logger } from '../../config/logger';

export class GeofenceController {
  private geofenceService: GeofenceService;

  constructor() {
    this.geofenceService = new GeofenceService();
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const geofences = await this.geofenceService.getAll();
      res.json({ success: true, data: geofences });
    } catch (error) {
      logger.error('Error getting geofences:', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const geofence = await this.geofenceService.getById(id);
      
      if (!geofence) {
        res.status(404).json({ 
          success: false, 
          message: 'Geofence not found' 
        });
        return;
      }

      res.json({ success: true, data: geofence });
    } catch (error) {
      logger.error('Error getting geofence:', error);
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const geofenceData = req.body;
      const geofence = await this.geofenceService.create(geofenceData);
      res.status(201).json({ success: true, data: geofence });
    } catch (error) {
      logger.error('Error creating geofence:', error);
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const geofenceData = req.body;
      const geofence = await this.geofenceService.update(id, geofenceData);
      
      if (!geofence) {
        res.status(404).json({ 
          success: false, 
          message: 'Geofence not found' 
        });
        return;
      }

      res.json({ success: true, data: geofence });
    } catch (error) {
      logger.error('Error updating geofence:', error);
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.geofenceService.delete(id);
      res.json({ success: true, message: 'Geofence deleted' });
    } catch (error) {
      logger.error('Error deleting geofence:', error);
      next(error);
    }
  }

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId, resolved, limit } = req.query;
      const alerts = await this.geofenceService.getAlerts({
        vehicleId: vehicleId as string,
        resolved: resolved === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, data: alerts });
    } catch (error) {
      logger.error('Error getting geofence alerts:', error);
      next(error);
    }
  }
}

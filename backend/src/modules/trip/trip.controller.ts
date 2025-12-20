import { Request, Response, NextFunction } from 'express';
import { TripService } from './trip.service';
import { logger } from '../../config/logger';

export class TripController {
  private tripService: TripService;

  constructor() {
    this.tripService = new TripService();
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, status } = req.query;
      const trips = await this.tripService.getAll({
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });
      res.json({ success: true, data: trips });
    } catch (error) {
      logger.error('Error getting trips:', error);
      next(error);
    }
  }

  async getByVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const { limit, status } = req.query;
      const trips = await this.tripService.getByVehicle(vehicleId, {
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });
      res.json({ success: true, data: trips });
    } catch (error) {
      logger.error('Error getting vehicle trips:', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const trip = await this.tripService.getById(id);
      
      if (!trip) {
        res.status(404).json({ 
          success: false, 
          message: 'Trip not found' 
        });
        return;
      }

      res.json({ success: true, data: trip });
    } catch (error) {
      logger.error('Error getting trip:', error);
      next(error);
    }
  }
}

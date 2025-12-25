import { Request, Response, NextFunction } from 'express';
import { FuelService } from './fuel.service';
import { GetFuelEventsQuery } from './fuel.types';

const fuelService = new FuelService();

export class FuelController {
  /**
   * Get fuel events (GET /api/fuel/events)
   */
  async getFuelEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetFuelEventsQuery;
      const events = await fuelService.getFuelEvents(query);

      res.json({
        count: events.length,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get theft events (GET /api/fuel/theft)
   */
  async getTheftEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId, limit } = req.query;

      const events = await fuelService.getTheftEvents(
        vehicleId as string | undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.json({
        count: events.length,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fuel statistics (GET /api/fuel/statistics)
   */
  async getFuelStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId, days } = req.query;

      const stats = await fuelService.getFuelStatistics(
        vehicleId as string | undefined,
        days ? parseInt(days as string, 10) : undefined
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

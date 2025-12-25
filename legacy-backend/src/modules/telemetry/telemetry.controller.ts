import { Request, Response, NextFunction } from 'express';
import { TelemetryService } from './telemetry.service';
import { TelemetryProcessor } from './telemetry.processor';
import { TelemetryInput, GetTelemetryQuery } from './telemetry.types';
import { logger } from '../../config/logger';

const telemetryService = new TelemetryService();
const telemetryProcessor = new TelemetryProcessor();

export class TelemetryController {
  /**
   * Ingest telemetry data (POST /api/telemetry)
   */
  async ingest(req: Request, res: Response, next: NextFunction) {
    try {
      const input: TelemetryInput = req.body;

      // Normalize timestamp
      const payload = {
        ...input,
        timestamp: new Date(input.timestamp),
      };

      // Process telemetry (async, non-blocking)
      telemetryProcessor.processTelemetry(payload).catch((error) => {
        logger.error(`Async telemetry processing failed: ${error}`);
      });

      // Return immediate success (don't block on processing)
      res.status(202).json({
        message: 'Telemetry received',
        imei: input.imei,
        timestamp: payload.timestamp,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get telemetry for a vehicle (GET /api/telemetry/:vehicleId)
   */
  async getTelemetryByVehicle(
    req: Request<GetTelemetryQuery['params'], {}, {}, GetTelemetryQuery['query']>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { vehicleId } = req.params;
      const { limit, startDate, endDate } = req.query;

      const telemetries = await telemetryService.getTelemetryByVehicle(vehicleId, {
        limit: (limit as number) || undefined,
        startDate: startDate ? new Date(startDate as any) : undefined,
        endDate: endDate ? new Date(endDate as any) : undefined,
      });

      res.json({
        count: telemetries.length,
        data: telemetries,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest telemetry for a vehicle (GET /api/telemetry/:vehicleId/latest)
   */
  async getLatestTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vehicleId } = req.params;

      const telemetry = await telemetryService.getLatestTelemetry(vehicleId);

      if (!telemetry) {
        res.status(404).json({ error: 'No telemetry data found' });
        return;
      }

      res.json(telemetry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest telemetry for all vehicles (GET /api/telemetry/latest/all)
   */
  async getAllLatestTelemetry(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const telemetries = await telemetryService.getLatestTelemetryForAllVehicles();

      res.json({
        count: telemetries.length,
        data: telemetries,
      });
    } catch (error) {
      next(error);
    }
  }
}

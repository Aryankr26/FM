import { type NextFunction, type Request, type Response } from 'express';
import { prisma } from '../../config/database';
import { broadcastVehicleUpdate } from '../../websocket/broadcaster';
import { TelemetryService } from './telemetry.service';
import { type TelemetryInput } from './telemetry.types';

const service = new TelemetryService();

export class TelemetryController {
  async ingest(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as TelemetryInput;
      const timestamp = input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp);

      const vehicle = await prisma.vehicle.findUnique({ where: { imei: input.imei } });
      if (vehicle) {
        const payload = { ...input, timestamp };
        await service.createTelemetry(vehicle.id, payload);
        await service.updateVehiclePosition(vehicle.id, payload);

        broadcastVehicleUpdate({
          vehicleId: vehicle.id,
          imei: vehicle.imei,
          registrationNo: vehicle.registrationNo,
          lastLat: payload.latitude,
          lastLng: payload.longitude,
          lastSpeed: payload.speed,
          lastIgnition: payload.ignition,
          lastSeen: payload.timestamp,
        });
      }

      res.status(202).json({
        message: 'Telemetry received',
        imei: input.imei,
        timestamp,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTelemetryByVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = String(req.params.vehicleId);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

      const telemetries = await service.getTelemetryByVehicle(vehicleId, { limit, startDate, endDate });
      res.json({ count: telemetries.length, data: telemetries });
    } catch (err) {
      next(err);
    }
  }

  async getLatestTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = String(req.params.vehicleId);
      const telemetry = await service.getLatestTelemetry(vehicleId);
      if (!telemetry) {
        res.status(404).json({ message: 'No telemetry data found' });
        return;
      }
      res.json({ data: telemetry });
    } catch (err) {
      next(err);
    }
  }

  async getAllLatestTelemetry(_req: Request, res: Response, next: NextFunction) {
    try {
      const telemetries = await service.getLatestTelemetryForAllVehicles();
      res.json({ count: telemetries.length, data: telemetries });
    } catch (err) {
      next(err);
    }
  }
}

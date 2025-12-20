import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { TelemetryPayload } from './telemetry.types';

export class TelemetryService {
  /**
   * Store telemetry data in database
   */
  async createTelemetry(vehicleId: string, payload: TelemetryPayload) {
    try {
      const telemetry = await prisma.telemetry.create({
        data: {
          vehicleId,
          timestamp: payload.timestamp,
          latitude: payload.latitude,
          longitude: payload.longitude,
          speed: payload.speed,
          ignition: payload.ignition,
          motion: payload.motion,
          fuelLevel: payload.fuelLevel,
          odometer: payload.odometer,
          power: payload.power,
          raw: payload.raw,
        },
      });

      return telemetry;
    } catch (error) {
      logger.error(`Failed to create telemetry: ${error}`);
      throw new AppError('Failed to store telemetry data', 500);
    }
  }

  /**
   * Get telemetry for a vehicle
   */
  async getTelemetryByVehicle(
    vehicleId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const limit = options?.limit || 100;

    const where: any = { vehicleId };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const telemetries = await prisma.telemetry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return telemetries;
  }

  /**
   * Get latest telemetry for a vehicle
   */
  async getLatestTelemetry(vehicleId: string) {
    const telemetry = await prisma.telemetry.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    return telemetry;
  }

  /**
   * Get latest telemetry for all vehicles
   */
  async getLatestTelemetryForAllVehicles() {
    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true },
    });

    // Get latest telemetry for each vehicle
    const telemetries = await Promise.all(
      vehicles.map(async (vehicle: { id: string }) => {
        const latest = await this.getLatestTelemetry(vehicle.id);
        return latest;
      })
    );

    return telemetries.filter(Boolean);
  }

  /**
   * Update vehicle's last known position
   */
  async updateVehiclePosition(
    vehicleId: string,
    payload: TelemetryPayload
  ) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        lastLat: payload.latitude,
        lastLng: payload.longitude,
        lastSeen: payload.timestamp,
        lastSpeed: payload.speed,
        lastIgnition: payload.ignition,
      },
    });
  }

  /**
   * Get vehicle by IMEI
   */
  async getVehicleByImei(imei: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { imei },
    });

    return vehicle;
  }
}

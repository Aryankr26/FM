import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { CreateVehicleInput, UpdateVehicleInput, GetVehiclesQuery } from './vehicles.types';
import { AppError } from '../../middleware/errorHandler';

export class VehicleService {
  /**
   * Create a new vehicle
   */
  async createVehicle(input: CreateVehicleInput) {
    try {
      // Check if IMEI already exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { imei: input.imei },
      });

      if (existingVehicle) {
        throw new AppError('Vehicle with this IMEI already exists', 409);
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          imei: input.imei,
          registrationNo: input.registrationNo,
          make: input.make,
          model: input.model,
          year: input.year,
          fuelCapacity: input.fuelCapacity || 60,
          dashOdometer: input.dashOdometer || 0,
          gpsOdometer: 0,
          status: input.status || 'active',
        },
      });

      logger.info(`Vehicle created: ${vehicle.imei} - ${vehicle.registrationNo}`);

      return vehicle;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create vehicle: ${error}`);
      throw new AppError('Failed to create vehicle', 500);
    }
  }

  /**
   * Get all vehicles with optional filters
   */
  async getVehicles(query: GetVehiclesQuery) {
    const { status, search, limit = 100 } = query;

    const where: any = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { imei: { contains: search } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { registrationNo: 'asc' },
      take: parseInt(limit as any, 10),
    });

    return vehicles;
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    return vehicle;
  }

  /**
   * Get vehicle by IMEI
   */
  async getVehicleByImei(imei: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { imei },
    });

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    return vehicle;
  }

  /**
   * Update vehicle
   */
  async updateVehicle(id: string, input: UpdateVehicleInput) {
    try {
      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: input,
      });

      logger.info(`Vehicle updated: ${vehicle.id} - ${vehicle.registrationNo}`);

      return vehicle;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to update vehicle: ${error}`);
      throw new AppError('Failed to update vehicle', 500);
    }
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string) {
    try {
      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      // Delete all related data
      await prisma.$transaction([
        prisma.telemetry.deleteMany({ where: { vehicleId: id } }),
        prisma.fuelEvent.deleteMany({ where: { vehicleId: id } }),
        prisma.alert.deleteMany({ where: { vehicleId: id } }),
        prisma.trip.deleteMany({ where: { vehicleId: id } }),
        prisma.geofenceAlert.deleteMany({ where: { vehicleId: id } }),
        prisma.tyre.deleteMany({ where: { vehicleId: id } }),
        prisma.vehicle.delete({ where: { id } }),
      ]);

      logger.info(`Vehicle deleted: ${id} - ${existingVehicle.registrationNo}`);

      return { message: 'Vehicle deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to delete vehicle: ${error}`);
      throw new AppError('Failed to delete vehicle', 500);
    }
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStatistics() {
    const [total, active, inactive, maintenance] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.vehicle.count({ where: { status: 'inactive' } }),
      prisma.vehicle.count({ where: { status: 'maintenance' } }),
    ]);

    return {
      total,
      active,
      inactive,
      maintenance,
    };
  }
}

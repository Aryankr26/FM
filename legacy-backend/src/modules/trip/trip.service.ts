import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { haversineKm } from '../../utils/haversine';
import { THRESHOLDS } from '../../utils/constants';

export class TripService {
  private activeTrips: Map<string, { tripId: string; startTime: Date }>;

  constructor() {
    this.activeTrips = new Map();
  }

  /**
   * Process trip logic based on telemetry data
   * 
   * TRIP DETECTION:
   * - Start trip: ignition ON + movement detected
   * - End trip: ignition OFF for > 5 minutes OR no movement for > 15 minutes
   * - Track: distance, fuel consumed, duration
   */
  async processTripLogic(
    vehicleId: string,
    telemetry: {
      lat: number;
      lng: number;
      speed: number;
      ignition: boolean;
      fuelLevel: number;
      odometer: number;
      timestamp: Date;
    },
    previousTelemetry?: {
      lat: number;
      lng: number;
      speed: number;
      ignition: boolean;
      fuelLevel: number;
      odometer: number;
      timestamp: Date;
    }
  ): Promise<void> {
    try {
      const activeTrip = this.activeTrips.get(vehicleId);
      const isMoving = telemetry.speed > THRESHOLDS.MOVING_SPEED_THRESHOLD;

      // START TRIP: Ignition ON + movement detected + no active trip
      if (
        telemetry.ignition &&
        isMoving &&
        !activeTrip
      ) {
        await this.startTrip(vehicleId, telemetry);
      }

      // UPDATE TRIP: Trip is active, update statistics
      if (activeTrip && previousTelemetry) {
        await this.updateTrip(vehicleId, telemetry, previousTelemetry);
      }

      // END TRIP: Ignition OFF or stopped for too long
      if (activeTrip) {
        const tripData = await prisma.trip.findUnique({
          where: { id: activeTrip.tripId },
        });

        if (tripData) {
          const timeSinceStart =
            (telemetry.timestamp.getTime() - activeTrip.startTime.getTime()) /
            1000 /
            60; // minutes

          // End trip if:
          // 1. Ignition OFF and trip has been running for > 5 minutes
          // 2. Not moving for > 15 minutes (long stop)
          if (
            (!telemetry.ignition && timeSinceStart > 5) ||
            (!isMoving && timeSinceStart > THRESHOLDS.LONG_STOP_THRESHOLD)
          ) {
            await this.endTrip(vehicleId, telemetry);
          }
        }
      }
    } catch (error) {
      logger.error(`Trip processing error for vehicle ${vehicleId}: ${error}`);
    }
  }

  /**
   * Start a new trip
   */
  private async startTrip(
    vehicleId: string,
    telemetry: {
      lat: number;
      lng: number;
      odometer: number;
      fuelLevel: number;
      timestamp: Date;
    }
  ): Promise<void> {
    try {
      const trip = await prisma.trip.create({
        data: {
          vehicleId,
          startTime: telemetry.timestamp,
          startLat: telemetry.lat,
          startLng: telemetry.lng,
          startOdometer: telemetry.odometer,
          startFuel: telemetry.fuelLevel,
          distanceKm: 0,
          fuelConsumed: 0,
          status: 'active',
        },
      });

      this.activeTrips.set(vehicleId, {
        tripId: trip.id,
        startTime: telemetry.timestamp,
      });

      logger.info(`Trip started for vehicle ${vehicleId}: ${trip.id}`);
    } catch (error) {
      logger.error(`Failed to start trip for vehicle ${vehicleId}: ${error}`);
    }
  }

  /**
   * Update ongoing trip with distance and fuel consumption
   */
  private async updateTrip(
    vehicleId: string,
    currentTelemetry: {
      lat: number;
      lng: number;
      odometer: number;
      fuelLevel: number;
    },
    previousTelemetry: {
      lat: number;
      lng: number;
      odometer: number;
      fuelLevel: number;
    }
  ): Promise<void> {
    try {
      const activeTrip = this.activeTrips.get(vehicleId);
      if (!activeTrip) return;

      // Calculate distance traveled in this segment
      const segmentDistance = haversineKm(
        previousTelemetry.lat,
        previousTelemetry.lng,
        currentTelemetry.lat,
        currentTelemetry.lng
      );

      // Calculate fuel consumed (only if fuel decreased)
      const fuelDelta = previousTelemetry.fuelLevel - currentTelemetry.fuelLevel;
      const segmentFuelConsumed = fuelDelta > 0 ? fuelDelta : 0;

      // Get current trip data
      const tripData = await prisma.trip.findUnique({
        where: { id: activeTrip.tripId },
      });

      if (!tripData) {
        logger.warn(`Trip ${activeTrip.tripId} not found, removing from active trips`);
        this.activeTrips.delete(vehicleId);
        return;
      }

      // Update trip with cumulative values
      await prisma.trip.update({
        where: { id: activeTrip.tripId },
        data: {
          distanceKm: tripData.distanceKm + segmentDistance,
          fuelConsumed: (tripData.fuelConsumed ?? 0) + segmentFuelConsumed,
        },
      });

      logger.debug(
        `Trip ${activeTrip.tripId} updated: +${segmentDistance.toFixed(2)}km, +${segmentFuelConsumed.toFixed(2)}L`
      );
    } catch (error) {
      logger.error(`Failed to update trip for vehicle ${vehicleId}: ${error}`);
    }
  }

  /**
   * End an active trip
   */
  private async endTrip(
    vehicleId: string,
    telemetry: {
      lat: number;
      lng: number;
      odometer: number;
      fuelLevel: number;
      timestamp: Date;
    }
  ): Promise<void> {
    try {
      const activeTrip = this.activeTrips.get(vehicleId);
      if (!activeTrip) return;

      const tripData = await prisma.trip.findUnique({
        where: { id: activeTrip.tripId },
      });

      if (!tripData) {
        logger.warn(`Trip ${activeTrip.tripId} not found`);
        this.activeTrips.delete(vehicleId);
        return;
      }

      // Calculate final fuel consumption
      const startFuel = tripData.startFuel ?? 0;
      const totalFuelConsumed = startFuel - telemetry.fuelLevel;

      await prisma.trip.update({
        where: { id: activeTrip.tripId },
        data: {
          endTime: telemetry.timestamp,
          endLat: telemetry.lat,
          endLng: telemetry.lng,
          endOdometer: telemetry.odometer,
          endFuel: telemetry.fuelLevel,
          fuelConsumed: totalFuelConsumed > 0 ? totalFuelConsumed : (tripData.fuelConsumed ?? 0),
          status: 'completed',
        },
      });

      this.activeTrips.delete(vehicleId);

      logger.info(
        `Trip ended for vehicle ${vehicleId}: ${activeTrip.tripId}, Distance: ${tripData.distanceKm.toFixed(2)}km, Fuel: ${totalFuelConsumed.toFixed(2)}L`
      );
    } catch (error) {
      logger.error(`Failed to end trip for vehicle ${vehicleId}: ${error}`);
    }
  }

  /**
   * Get active trip for a vehicle
   */
  async getActiveTrip(vehicleId: string) {
    const activeTrip = this.activeTrips.get(vehicleId);
    if (!activeTrip) return null;

    return await prisma.trip.findUnique({
      where: { id: activeTrip.tripId },
      include: {
        vehicle: {
          select: {
            id: true,
            imei: true,
            registrationNo: true,
          },
        },
      },
    });
  }

  /**
   * Get trip history for a vehicle
   */
  async getTripHistory(vehicleId: string, limit: number = 50) {
    return await prisma.trip.findMany({
      where: { vehicleId },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        vehicle: {
          select: {
            id: true,
            imei: true,
            registrationNo: true,
          },
        },
      },
    });
  }

  /**
   * Get all trips with filters
   */
  async getAll(options: { limit?: number; status?: string } = {}) {
    return await prisma.trip.findMany({
      where: options.status ? { status: options.status } : undefined,
      orderBy: { startTime: 'desc' },
      take: options.limit || 100,
      include: {
        vehicle: {
          select: {
            id: true,
            imei: true,
            registrationNo: true,
            make: true,
            model: true,
          },
        },
      },
    });
  }

  /**
   * Get trips by vehicle ID
   */
  async getByVehicle(vehicleId: string, options: { limit?: number; status?: string } = {}) {
    return await prisma.trip.findMany({
      where: {
        vehicleId,
        ...(options.status ? { status: options.status } : {}),
      },
      orderBy: { startTime: 'desc' },
      take: options.limit || 50,
      include: {
        vehicle: {
          select: {
            id: true,
            imei: true,
            registrationNo: true,
            make: true,
            model: true,
          },
        },
      },
    });
  }

  /**
   * Get trip by ID
   */
  async getById(id: string) {
    return await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            imei: true,
            registrationNo: true,
            make: true,
            model: true,
          },
        },
      },
    });
  }
}

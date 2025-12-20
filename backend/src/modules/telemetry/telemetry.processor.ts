import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { haversineKm } from '../../utils/haversine';
import { THRESHOLDS } from '../../utils/constants';
import { TelemetryPayload, VehicleState } from './telemetry.types';
import { TelemetryService } from './telemetry.service';

export class TelemetryProcessor {
  private telemetryService: TelemetryService;

  constructor() {
    this.telemetryService = new TelemetryService();
  }

  /**
   * Main processing function - orchestrates all telemetry processing
   */
  async processTelemetry(payload: TelemetryPayload): Promise<void> {
    try {
      // Validate IMEI
      if (!payload.imei) {
        logger.warn('Telemetry ignored: missing IMEI');
        return;
      }

      // Find vehicle by IMEI
      const vehicle = await prisma.vehicle.findUnique({
        where: { imei: payload.imei },
      });

      if (!vehicle) {
        logger.warn(`Unknown IMEI: ${payload.imei}`);
        return;
      }

      // Get last telemetry for comparison
      const lastTelemetry = await this.telemetryService.getLatestTelemetry(
        vehicle.id
      );

      // Calculate distance traveled since last reading
      const distanceKm = lastTelemetry
        ? haversineKm(
            lastTelemetry.latitude,
            lastTelemetry.longitude,
            payload.latitude,
            payload.longitude
          )
        : 0;

      // Determine vehicle state
      const state = this.determineVehicleState(payload);

      // Store telemetry in database
      await this.telemetryService.createTelemetry(vehicle.id, payload);

      // Update vehicle's last known position
      await this.telemetryService.updateVehiclePosition(vehicle.id, payload);

      // Update GPS odometer (accumulated distance)
      if (distanceKm > THRESHOLDS.MIN_DISTANCE_FOR_TRIP) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            gpsOdometer: { increment: distanceKm },
          },
        });
      }

      // Update dashboard odometer if reported
      if (payload.odometer) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            dashOdometer: payload.odometer,
          },
        });
      }

      logger.debug(
        `Telemetry processed: ${vehicle.registrationNo || vehicle.imei} - ${state} - ${distanceKm.toFixed(2)}km`
      );

      // Trigger analysis engines asynchronously (non-blocking)
      this.triggerAnalysisEngines(vehicle, lastTelemetry, payload, distanceKm, state);

    } catch (error) {
      logger.error(`Telemetry processing error: ${error}`);
      throw error;
    }
  }

  /**
   * Determine vehicle state based on speed and ignition
   */
  private determineVehicleState(payload: TelemetryPayload): VehicleState {
    const { speed, motion, ignition } = payload;

    if (speed > THRESHOLDS.MOVING_SPEED_THRESHOLD || motion) {
      return 'moving';
    }

    if (speed > THRESHOLDS.IDLE_SPEED_THRESHOLD && speed <= THRESHOLDS.MOVING_SPEED_THRESHOLD) {
      return 'idle';
    }

    if (ignition && speed <= THRESHOLDS.IDLE_SPEED_THRESHOLD) {
      return 'idle';
    }

    return 'stopped';
  }

  /**
   * Trigger all analysis engines (fuel, odometer, geofence, etc.)
   */
  private triggerAnalysisEngines(
    vehicle: any,
    lastTelemetry: any,
    currentPayload: TelemetryPayload,
    distanceKm: number,
    state: VehicleState
  ): void {
    // Use setImmediate to run engines asynchronously without blocking
    
    // Fuel analysis engine
    setImmediate(async () => {
      try {
        const { FuelEngine } = await import('../fuel/fuel.engine');
        const fuelEngine = new FuelEngine();
        await fuelEngine.analyzeFuel(vehicle, lastTelemetry, currentPayload, distanceKm);
      } catch (error) {
        logger.error(`Fuel engine error: ${error}`);
      }
    });

    // Odometer tampering detection
    setImmediate(async () => {
      try {
        const { OdometerDetector } = await import('../odometer/odometer.detector');
        const odometerDetector = new OdometerDetector();
        await odometerDetector.analyzeOdometer(
          vehicle.id,
          {
            lat: currentPayload.latitude,
            lng: currentPayload.longitude,
            odometer: currentPayload.odometer || 0,
            timestamp: currentPayload.timestamp,
          },
          lastTelemetry
            ? {
                lat: lastTelemetry.latitude,
                lng: lastTelemetry.longitude,
                odometer: lastTelemetry.odometer || 0,
                timestamp: lastTelemetry.timestamp,
              }
            : {
                lat: currentPayload.latitude,
                lng: currentPayload.longitude,
                odometer: currentPayload.odometer || 0,
                timestamp: currentPayload.timestamp,
              },
          vehicle.dashOdometer || 0,
          lastTelemetry?.odometer || vehicle.dashOdometer || 0
        );
      } catch (error) {
        logger.error(`Odometer detector error: ${error}`);
      }
    });

    // Geofence checking
    setImmediate(async () => {
      try {
        const { GeofenceEngine } = await import('../geofence/geofence.engine');
        const geofenceEngine = new GeofenceEngine();
        await geofenceEngine.checkGeofences(
          vehicle.id,
          currentPayload.latitude,
          currentPayload.longitude,
          currentPayload.timestamp
        );
      } catch (error) {
        logger.error(`Geofence engine error: ${error}`);
      }
    });

    // Trip management
    setImmediate(async () => {
      try {
        const { TripService } = await import('../trip/trip.service');
        const tripService = new TripService();
        await tripService.processTripLogic(
          vehicle.id,
          {
            lat: currentPayload.latitude,
            lng: currentPayload.longitude,
            speed: currentPayload.speed,
            ignition: currentPayload.ignition,
            fuelLevel: currentPayload.fuelLevel || 0,
            odometer: currentPayload.odometer || 0,
            timestamp: currentPayload.timestamp,
          },
          lastTelemetry
            ? {
                lat: lastTelemetry.latitude,
                lng: lastTelemetry.longitude,
                speed: (lastTelemetry.speed as number) || 0,
                ignition: (lastTelemetry.ignition as boolean) || false,
                fuelLevel: (lastTelemetry.fuelLevel as number) || 0,
                odometer: (lastTelemetry.odometer as number) || 0,
                timestamp: lastTelemetry.timestamp,
              }
            : undefined
        );
      } catch (error) {
        logger.error(`Trip service error: ${error}`);
      }
    });

    // Broadcast to WebSocket clients
    setImmediate(async () => {
      try {
        const { broadcastVehicleUpdate } = await import('../../websocket/broadcaster');
        broadcastVehicleUpdate({
          imei: currentPayload.imei,
          vehicleId: vehicle.id,
          lat: currentPayload.latitude,
          lng: currentPayload.longitude,
          speed: currentPayload.speed,
          ignition: currentPayload.ignition,
          timestamp: currentPayload.timestamp,
          state,
        });
      } catch (error) {
        logger.error(`WebSocket broadcast error: ${error}`);
      }
    });
  }
}

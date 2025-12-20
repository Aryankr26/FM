import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { THRESHOLDS } from '../../utils/constants';

export class DashboardService {
  /**
   * Get real-time fleet statistics
   */
  async getFleetStatistics() {
    try {
      const now = new Date();
      const offlineThreshold = new Date(
        now.getTime() - THRESHOLDS.DEVICE_OFFLINE_THRESHOLD * 60 * 1000
      );

      // Get all vehicles with last seen status
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          imei: true,
          registrationNo: true,
          lastSeen: true,
          lastLat: true,
          lastLng: true,
          lastSpeed: true,
          lastIgnition: true,
        },
      });

      // Calculate vehicle states
      let moving = 0;
      let stopped = 0;
      let idle = 0;
      let offline = 0;

      vehicles.forEach((vehicle: { lastSeen: Date | null; lastSpeed: number | null; lastIgnition: boolean | null }) => {
        if (!vehicle.lastSeen || vehicle.lastSeen < offlineThreshold) {
          offline++;
        } else {
          const spd = vehicle.lastSpeed ?? 0;
          const ign = vehicle.lastIgnition ?? false;
          if (spd > THRESHOLDS.MOVING_SPEED_THRESHOLD) moving++;
          else if (ign && spd > THRESHOLDS.IDLE_SPEED_THRESHOLD) idle++;
          else stopped++;
        }
      });

      // Get alert counts
      const [unresolvedAlerts, criticalAlerts, todayAlerts] = await Promise.all([
        prisma.alert.count({ where: { resolved: false } }),
        prisma.alert.count({ where: { resolved: false, severity: 'critical' } }),
        prisma.alert.count({
          where: {
            createdAt: {
              gte: new Date(now.setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      // Get active trips
      const activeTrips = await prisma.trip.count({ where: { status: 'active' } });

      return {
        fleet: {
          total: vehicles.length,
          moving,
          stopped,
          idle,
          offline,
        },
        alerts: {
          unresolved: unresolvedAlerts,
          critical: criticalAlerts,
          today: todayAlerts,
        },
        trips: {
          active: activeTrips,
        },
      };
    } catch (error) {
      logger.error(`Failed to get fleet statistics: ${error}`);
      throw error;
    }
  }

  /**
   * Get recent alerts (last 10)
   */
  async getRecentAlerts() {
    try {
      const alerts = await prisma.alert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
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

      return alerts;
    } catch (error) {
      logger.error(`Failed to get recent alerts: ${error}`);
      throw error;
    }
  }

  /**
   * Get active vehicles with live positions
   */
  async getLiveVehicles() {
    try {
      const now = new Date();
      const offlineThreshold = new Date(
        now.getTime() - THRESHOLDS.DEVICE_OFFLINE_THRESHOLD * 60 * 1000
      );

      const vehicles = await prisma.vehicle.findMany({
        where: {
          status: 'active',
          lastSeen: {
            gte: offlineThreshold,
          },
        },
        select: {
          id: true,
          imei: true,
          registrationNo: true,
          make: true,
          model: true,
          lastLat: true,
          lastLng: true,
          lastSpeed: true,
          lastIgnition: true,
          lastSeen: true,
          gpsOdometer: true,
        },
        orderBy: { registrationNo: 'asc' },
      });

      // Compute state per vehicle
      return vehicles.map((v: { lastSeen: Date | null; lastSpeed: number | null; lastIgnition: boolean | null }) => ({
        ...v,
        state:
          !v.lastSeen || v.lastSeen < offlineThreshold
            ? 'offline'
            : (v.lastSpeed ?? 0) > THRESHOLDS.MOVING_SPEED_THRESHOLD
              ? 'moving'
              : (v.lastIgnition ?? false) && (v.lastSpeed ?? 0) > THRESHOLDS.IDLE_SPEED_THRESHOLD
                ? 'idle'
                : 'stopped',
      }));
    } catch (error) {
      logger.error(`Failed to get live vehicles: ${error}`);
      throw error;
    }
  }

  /**
   * Get fuel statistics for the last 7 days
   */
  async getFuelStatistics(days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const fuelEvents = await prisma.fuelEvent.findMany({
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        select: {
          eventType: true,
          delta: true,
          severity: true,
          timestamp: true,
        },
      });

      // Aggregate by event type
      const thefts = fuelEvents.filter((e: any) => e.eventType === 'THEFT');
      const refills = fuelEvents.filter((e: any) => e.eventType === 'REFILL');
      const losses = fuelEvents.filter((e: any) => e.eventType === 'LOSS');

      const totalTheft = thefts.reduce((sum: number, e: any) => sum + Math.abs(e.delta), 0);
      const totalRefill = refills.reduce((sum: number, e: any) => sum + e.delta, 0);
      const totalLoss = losses.reduce((sum: number, e: any) => sum + Math.abs(e.delta), 0);

      return {
        period: `${days} days`,
        thefts: {
          count: thefts.length,
          totalLiters: totalTheft,
        },
        refills: {
          count: refills.length,
          totalLiters: totalRefill,
        },
        losses: {
          count: losses.length,
          totalLiters: totalLoss,
        },
      };
    } catch (error) {
      logger.error(`Failed to get fuel statistics: ${error}`);
      throw error;
    }
  }

  /**
   * Get trip statistics for the last 30 days
   */
  async getTripStatistics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trips = await prisma.trip.findMany({
        where: {
          startTime: {
            gte: startDate,
          },
          status: 'completed',
        },
        select: {
          distanceKm: true,
          fuelConsumed: true,
        },
      });

      const totalDistance = trips.reduce((sum: number, t: any) => sum + t.distanceKm, 0);
      const totalFuel = trips.reduce((sum: number, t: any) => sum + t.fuelConsumed, 0);
      const avgMileage = totalFuel > 0 ? totalDistance / totalFuel : 0;

      return {
        period: `${days} days`,
        totalTrips: trips.length,
        totalDistance,
        totalFuel,
        avgMileage,
      };
    } catch (error) {
      logger.error(`Failed to get trip statistics: ${error}`);
      throw error;
    }
  }
}

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

      // Guard against empty vehicles array
      if (!vehicles || vehicles.length === 0) {
        return {
          fleet: { total: 0, moving: 0, stopped: 0, idle: 0, offline: 0 },
          alerts: { unresolved: 0, critical: 0, today: 0 },
          trips: { active: 0 },
        };
      }

      // Calculate vehicle states
      let moving = 0;
      let stopped = 0;
      let idle = 0;
      let offline = 0;

      vehicles.forEach((vehicle) => {
        const lastSeen = vehicle.lastSeen;
        const lastSpeed = vehicle.lastSpeed ?? 0;
        const lastIgnition = vehicle.lastIgnition ?? false;
        
        if (!lastSeen || lastSeen < offlineThreshold) {
          offline++;
        } else {
          if (lastSpeed > THRESHOLDS.MOVING_SPEED_THRESHOLD) moving++;
          else if (lastIgnition && lastSpeed > THRESHOLDS.IDLE_SPEED_THRESHOLD) idle++;
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
      // Get recent alerts with safe fallback
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

      // Guard against null/undefined alerts
      return alerts || [];
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

      // Get live vehicles with safe fallback
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

      // Guard against empty vehicles array
      if (!vehicles || vehicles.length === 0) {
        return [];
      }

      // Compute state per vehicle with safe defaults
      return vehicles.map((v) => {
        const lastSeen = v.lastSeen;
        const lastSpeed = v.lastSpeed ?? 0;
        const lastIgnition = v.lastIgnition ?? false;
        
        return {
          ...v,
          state:
            !lastSeen || lastSeen < offlineThreshold
              ? 'offline'
              : lastSpeed > THRESHOLDS.MOVING_SPEED_THRESHOLD
                ? 'moving'
                : lastIgnition && lastSpeed > THRESHOLDS.IDLE_SPEED_THRESHOLD
                  ? 'idle'
                  : 'stopped',
        };
      });
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

      // Aggregate by event type with safe guards
      const thefts = fuelEvents.filter((e) => e.eventType === 'THEFT');
      const refills = fuelEvents.filter((e) => e.eventType === 'REFILL');
      const losses = fuelEvents.filter((e) => e.eventType === 'LOSS');

      const totalTheft = thefts.reduce((sum, e) => sum + (e.delta ? Math.abs(e.delta) : 0), 0);
      const totalRefill = refills.reduce((sum, e) => sum + (e.delta || 0), 0);
      const totalLoss = losses.reduce((sum, e) => sum + (e.delta ? Math.abs(e.delta) : 0), 0);

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

      // Calculate averages with division by zero protection
      const totalDistance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      const totalFuel = trips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
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

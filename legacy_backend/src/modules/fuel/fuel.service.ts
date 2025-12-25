import { prisma } from '../../config/database';
import { GetFuelEventsQuery, FuelStatistics } from './fuel.types';

export class FuelService {
  /**
   * Get fuel events with filters
   */
  async getFuelEvents(query: GetFuelEventsQuery) {
    const {
      vehicleId,
      severity,
      eventType,
      limit = 100,
      startDate,
      endDate,
    } = query;

    const where: any = {};

    if (vehicleId) where.vehicleId = vehicleId;
    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const events = await prisma.fuelEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as any, 10),
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

    return events;
  }

  /**
   * Get fuel theft events only
   */
  async getTheftEvents(vehicleId?: string, limit: number = 50) {
    const where: any = {
      severity: { in: ['red', 'yellow'] },
      eventType: { in: ['THEFT', 'MANIPULATION', 'LOSS'] },
    };

    if (vehicleId) where.vehicleId = vehicleId;

    const events = await prisma.fuelEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
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

    return events;
  }

  /**
   * Get fuel statistics for a vehicle or all vehicles
   */
  async getFuelStatistics(vehicleId?: string, days: number = 30): Promise<FuelStatistics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      timestamp: { gte: startDate },
    };

    if (vehicleId) where.vehicleId = vehicleId;

    const events = await prisma.fuelEvent.findMany({
      where,
    });

    const stats: FuelStatistics = {
      totalEvents: events.length,
      theftEvents: events.filter((e: any) => e.eventType === 'THEFT').length,
      refillEvents: events.filter((e: any) => e.eventType === 'REFILL').length,
      totalFuelLoss: events
        .filter((e: any) => e.delta < 0)
        .reduce((sum: number, e: any) => sum + Math.abs(e.delta), 0),
      suspiciousEvents: events.filter((e: any) => e.severity === 'red' || e.severity === 'yellow').length,
      averageConsumption: events.length > 0
        ? events.reduce((sum: number, e: any) => sum + Math.abs(e.delta), 0) / events.length
        : 0,
    };

    return stats;
  }
}

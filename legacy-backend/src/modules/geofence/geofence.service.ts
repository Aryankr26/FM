import { prisma } from '../../config/database';
import { Geofence, GeofenceAlert } from '@prisma/client';

interface GeofenceCreateData {
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  polygon?: any;
  active?: boolean;
}

interface GeofenceUpdateData extends Partial<GeofenceCreateData> {}

interface GeofenceAlertsFilter {
  vehicleId?: string;
  resolved?: boolean;
  limit?: number;
}

export class GeofenceService {
  async getAll(): Promise<Geofence[]> {
    return prisma.geofence.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Geofence | null> {
    return prisma.geofence.findUnique({
      where: { id },
    });
  }

  async create(data: GeofenceCreateData): Promise<Geofence> {
    return prisma.geofence.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        radius: data.radius,
        polygon: data.polygon,
        active: data.active ?? true,
      },
    });
  }

  async update(id: string, data: GeofenceUpdateData): Promise<Geofence | null> {
    try {
      return await prisma.geofence.update({
        where: { id },
        data,
      });
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.geofence.delete({
      where: { id },
    });
  }

  async getAlerts(filter: GeofenceAlertsFilter): Promise<GeofenceAlert[]> {
    const where: any = {};
    
    if (filter.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }
    
    if (filter.resolved !== undefined) {
      where.resolved = filter.resolved;
    }

    return prisma.geofenceAlert.findMany({
      where,
      include: {
        geofence: true,
        vehicle: true,
      },
      orderBy: { timestamp: 'desc' },
      take: filter.limit || 100,
    });
  }
}

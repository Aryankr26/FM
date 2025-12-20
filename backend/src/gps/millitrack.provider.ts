import axios from 'axios';
import { GPSProvider, TelemetryPayload } from './provider.interface';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Millitrack GPS Provider
 * 
 * Fetches real-time telemetry from Millitrack API
 * API Documentation: (based on existing millitrackParser.js)
 */
export class MillitrackProvider implements GPSProvider {
  name = 'millitrack';
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = env.millitrack.baseUrl || '';
    this.apiKey = env.millitrack.token || '';
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Millitrack GPS provider...');

    // Test API connection
    try {
      const response = await axios.get(`${this.apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      logger.info(`✓ Millitrack API connected: ${response.data?.status}`);
    } catch (error) {
      logger.error(`Failed to connect to Millitrack API: ${error}`);
      throw error;
    }
  }

  async fetchTelemetry(): Promise<TelemetryPayload[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/vehicles/telemetry`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      const rawData = response.data?.vehicles || [];

      // Parse Millitrack data format
      const telemetry: TelemetryPayload[] = rawData.map((vehicle: any) =>
        this.parseMillitrackData(vehicle)
      );

      return telemetry.filter((t) => t !== null) as TelemetryPayload[];
    } catch (error) {
      logger.error(`Failed to fetch Millitrack telemetry: ${error}`);
      return [];
    }
  }

  async fetchVehicleTelemetry(imei: string): Promise<TelemetryPayload | null> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/vehicles/${imei}/telemetry`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data) {
        logger.warn(`No telemetry data for IMEI: ${imei}`);
        return null;
      }

      return this.parseMillitrackData(response.data);
    } catch (error) {
      logger.error(`Failed to fetch vehicle telemetry for ${imei}: ${error}`);
      return null;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Millitrack GPS provider');
  }

  /**
   * Parse Millitrack data format to our standard format
   */
  private parseMillitrackData(data: any): TelemetryPayload {
    return {
      imei: data.imei || data.deviceId,
      timestamp: new Date(data.timestamp || data.gpsTime),
      lat: parseFloat(data.latitude || data.lat),
      lng: parseFloat(data.longitude || data.lng),
      speed: parseFloat(data.speed || 0),
      ignition: data.ignition === true || data.ignition === 1 || data.acc === 1,
      fuelLevel: parseFloat(data.fuelLevel || data.fuel || 0),
      odometer: parseFloat(data.odometer || data.mileage || 0),
    };
  }
}

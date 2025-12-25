import { GPSProvider } from './provider.interface';
import { MillitrackProvider } from './millitrack.provider';
import { SimulatorProvider } from './simulator.provider';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { TelemetryService } from '../modules/telemetry/telemetry.service';
import { TelemetryProcessor } from '../modules/telemetry/telemetry.processor';
import { TelemetryPayload as IngestPayload } from '../modules/telemetry/telemetry.types';

/**
 * GPS Poller Service
 * 
 * Polls GPS provider at regular intervals and processes telemetry
 * 
 * FLOW:
 * 1. Poll GPS provider every X seconds (configurable)
 * 2. Fetch telemetry for all vehicles
 * 3. Store telemetry in database
 * 4. Process telemetry (fuel, odometer, geofence, trip detection)
 * 5. Broadcast updates via WebSocket
 */
export class GPSPoller {
  private provider: GPSProvider | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private telemetryService: TelemetryService;
  private processor: TelemetryProcessor;
  private pollIntervalMs: number;

  constructor() {
    this.telemetryService = new TelemetryService();
    // `GPS_POLL_INTERVAL` is treated as milliseconds (e.g. 10000 = 10s)
    this.pollIntervalMs = env.gps.pollInterval;
    this.processor = new TelemetryProcessor();
  }

  /**
   * Initialize GPS provider and start polling
   */
  async start(): Promise<void> {
    try {
      // Initialize the correct provider
      const providerType = env.gps.provider;

      if (providerType === 'simulator') {
        this.provider = new SimulatorProvider();
      } else if (providerType === 'millitrack') {
        this.provider = new MillitrackProvider();
      } else {
        throw new Error(`Unknown GPS provider: ${providerType}`);
      }

      // Initialize provider
      await this.provider.initialize();

      logger.info(
        `GPS Poller started with ${this.provider.name} provider (poll interval: ${this.pollIntervalMs}ms)`
      );

      // Start polling
      this.isPolling = true;
      this.pollTelemetry(); // First poll immediately

      // Schedule regular polling
      this.pollingInterval = setInterval(() => {
        this.pollTelemetry();
      }, this.pollIntervalMs);
    } catch (error) {
      logger.error(`Failed to start GPS poller: ${error}`);
      throw error;
    }
  }

  /**
   * Stop GPS polling
   */
  async stop(): Promise<void> {
    logger.info('Stopping GPS poller...');

    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.provider) {
      await this.provider.shutdown();
      this.provider = null;
    }

    logger.info('GPS poller stopped');
  }

  /**
   * Poll telemetry from GPS provider and process it
   */
  private async pollTelemetry(): Promise<void> {
    if (!this.provider || !this.isPolling) return;

    try {
      const startTime = Date.now();

      // Fetch telemetry from provider
      const telemetryData = await this.provider.fetchTelemetry();

      if (telemetryData.length === 0) {
        logger.debug('No telemetry data received from provider');
        return;
      }

      logger.debug(`Received telemetry for ${telemetryData.length} vehicles`);

      // Process each telemetry payload
      for (const payload of telemetryData) {
        try {
          // Get vehicle by IMEI
          const vehicle = await this.telemetryService.getVehicleByImei(payload.imei);

          if (!vehicle) {
            logger.warn(`Vehicle with IMEI ${payload.imei} not found in database`);
            continue;
          }

          // Previous telemetry not required here; processor will handle state.

          // Normalize payload to telemetry service shape
          const ingest: IngestPayload = {
            imei: payload.imei,
            timestamp: payload.timestamp,
            latitude: (payload as any).lat ?? (payload as any).latitude,
            longitude: (payload as any).lng ?? (payload as any).longitude,
            speed: payload.speed,
            ignition: payload.ignition,
            fuelLevel: payload.fuelLevel,
            odometer: payload.odometer,
          } as IngestPayload;

          // Create telemetry record
          await this.telemetryService.createTelemetry(
            vehicle.id,
            ingest
          );

          // Process telemetry (async - non-blocking)
          this.processor.processTelemetry({
            imei: ingest.imei,
            timestamp: ingest.timestamp,
            latitude: ingest.latitude,
            longitude: ingest.longitude,
            speed: ingest.speed,
            ignition: ingest.ignition,
            fuelLevel: ingest.fuelLevel,
            odometer: ingest.odometer,
            motion: false,
            power: undefined,
            raw: undefined,
          } as any).catch((err) => logger.error(`Processor error: ${err}`));
        } catch (error) {
          logger.error(`Failed to process telemetry for ${payload.imei}: ${error}`);
        }
      }

      const elapsed = Date.now() - startTime;
      logger.debug(
        `Telemetry poll completed in ${elapsed}ms (${telemetryData.length} vehicles)`
      );
    } catch (error) {
      logger.error(`GPS poll error: ${error}`);
    }
  }

  /**
   * Get current provider status
   */
  getStatus(): {
    isPolling: boolean;
    providerName: string | null;
    pollIntervalMs: number;
  } {
    return {
      isPolling: this.isPolling,
      providerName: this.provider?.name || null,
      pollIntervalMs: this.pollIntervalMs,
    };
  }
}

// Singleton instance
let pollerInstance: GPSPoller | null = null;

export function getGPSPoller(): GPSPoller {
  if (!pollerInstance) {
    pollerInstance = new GPSPoller();
  }
  return pollerInstance;
}

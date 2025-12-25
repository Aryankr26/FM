/**
 * GPS Provider Interface
 * 
 * This interface defines the contract that all GPS providers must implement.
 * Supports: Millitrack, Simulator, and future providers (TeltonikaEye, etc.)
 */

export interface TelemetryPayload {
  imei: string;
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  fuelLevel: number;
  odometer: number;
}

export interface GPSProvider {
  /**
   * Provider name (e.g., 'millitrack', 'simulator', 'teltonika')
   */
  name: string;

  /**
   * Initialize the provider (connect, authenticate, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Fetch latest telemetry data for all vehicles
   * Returns array of telemetry payloads
   */
  fetchTelemetry(): Promise<TelemetryPayload[]>;

  /**
   * Fetch telemetry for a specific vehicle by IMEI
   */
  fetchVehicleTelemetry(imei: string): Promise<TelemetryPayload | null>;

  /**
   * Shutdown the provider gracefully
   */
  shutdown(): Promise<void>;
}

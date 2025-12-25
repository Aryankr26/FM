import { GPSProvider, TelemetryPayload } from './provider.interface';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * GPS Simulator Provider
 * 
 * Generates realistic telemetry data for testing:
 * - Vehicles move along predefined routes
 * - Simulates fuel consumption, theft scenarios
 * - Odometer tampering scenarios
 * - Geofence entry/exit events
 * 
 * SCENARIOS SIMULATED:
 * 1. Normal operation (5 vehicles)
 * 2. Fuel theft (2 vehicles) - Engine OFF + fuel drop
 * 3. Odometer tampering (1 vehicle) - GPS vs odometer mismatch
 * 4. Route deviation (1 vehicle) - Enters restricted geofence
 * 5. Long idle (1 vehicle) - Engine ON, no movement, fuel consumption
 */
export class SimulatorProvider implements GPSProvider {
  name = 'simulator';
  private vehicles: Map<string, VehicleSimState> = new Map();
  private simulationInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    logger.info('Initializing GPS Simulator...');

    // Load vehicles from database
    const dbVehicles = await prisma.vehicle.findMany({
      where: { status: 'active' },
    });

    // Initialize simulation state for each vehicle
    dbVehicles.forEach((vehicle: { imei: string; gpsOdometer: number }) => {
      this.vehicles.set(vehicle.imei, {
        imei: vehicle.imei,
        lat: 28.6139 + Math.random() * 0.1, // Delhi region
        lng: 77.209 + Math.random() * 0.1,
        speed: 0,
        ignition: false,
        fuelLevel: Math.random() * 40 + 20, // 20-60L
        odometer: vehicle.gpsOdometer,
        heading: Math.random() * 360,
        scenario: this.assignScenario(vehicle.imei),
        scenarioStep: 0,
        lastUpdate: new Date(),
      });
    });

    logger.info(`✓ Simulator initialized with ${this.vehicles.size} vehicles`);
  }

  async fetchTelemetry(): Promise<TelemetryPayload[]> {
    const telemetry: TelemetryPayload[] = [];

    for (const [_imei, state] of this.vehicles.entries()) {
      // Update vehicle state based on scenario
      this.updateVehicleState(state);

      telemetry.push({
        imei: state.imei,
        timestamp: new Date(),
        lat: state.lat,
        lng: state.lng,
        speed: state.speed,
        ignition: state.ignition,
        fuelLevel: state.fuelLevel,
        odometer: state.odometer,
      });
    }

    return telemetry;
  }

  async fetchVehicleTelemetry(imei: string): Promise<TelemetryPayload | null> {
    const state = this.vehicles.get(imei);
    if (!state) return null;

    this.updateVehicleState(state);

    return {
      imei: state.imei,
      timestamp: new Date(),
      lat: state.lat,
      lng: state.lng,
      speed: state.speed,
      ignition: state.ignition,
      fuelLevel: state.fuelLevel,
      odometer: state.odometer,
    };
  }

  async shutdown(): Promise<void> {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    logger.info('GPS Simulator shut down');
  }

  /**
   * Assign scenario to vehicle based on IMEI
   */
  private assignScenario(imei: string): SimulationScenario {
    const scenarios: SimulationScenario[] = [
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'fuel_theft',
      'fuel_theft',
      'odometer_tamper',
      'route_deviation',
      'long_idle',
    ];

    const index = parseInt(imei.slice(-1), 10) % scenarios.length;
    return scenarios[index];
  }

  /**
   * Update vehicle state based on scenario
   */
  private updateVehicleState(state: VehicleSimState): void {
    const timeDelta = (Date.now() - state.lastUpdate.getTime()) / 1000; // seconds
    state.lastUpdate = new Date();

    switch (state.scenario) {
      case 'normal':
        this.simulateNormalOperation(state, timeDelta);
        break;
      case 'fuel_theft':
        this.simulateFuelTheft(state, timeDelta);
        break;
      case 'odometer_tamper':
        this.simulateOdometerTamper(state, timeDelta);
        break;
      case 'route_deviation':
        this.simulateRouteDeviation(state, timeDelta);
        break;
      case 'long_idle':
        this.simulateLongIdle(state, timeDelta);
        break;
    }

    state.scenarioStep++;
  }

  /**
   * Normal operation: Vehicle moves, consumes fuel normally
   */
  private simulateNormalOperation(state: VehicleSimState, timeDelta: number): void {
    state.ignition = true;
    state.speed = 40 + Math.random() * 30; // 40-70 km/h

    // Move vehicle
    const distanceKm = (state.speed * timeDelta) / 3600;
    const { lat, lng } = this.moveVehicle(state.lat, state.lng, state.heading, distanceKm);
    state.lat = lat;
    state.lng = lng;
    state.odometer += distanceKm;

    // Consume fuel (8-12 km/L mileage)
    const fuelConsumed = distanceKm / (10 + Math.random() * 2);
    state.fuelLevel = Math.max(0, state.fuelLevel - fuelConsumed);

    // Random direction changes
    if (Math.random() < 0.1) {
      state.heading = (state.heading + (Math.random() - 0.5) * 45) % 360;
    }

    // Refuel when fuel is low
    if (state.fuelLevel < 10) {
      state.fuelLevel = 50 + Math.random() * 10;
    }
  }

  /**
   * Fuel theft: Engine OFF, sudden fuel drop
   */
  private simulateFuelTheft(state: VehicleSimState, timeDelta: number): void {
    if (state.scenarioStep < 100) {
      // Normal driving first
      this.simulateNormalOperation(state, timeDelta);
    } else if (state.scenarioStep === 100) {
      // Stop and turn off engine
      state.ignition = false;
      state.speed = 0;
      logger.warn(`SIMULATION: Fuel theft scenario starting for ${state.imei}`);
    } else if (state.scenarioStep === 105) {
      // THEFT: Drop 25L fuel while engine is OFF
      state.fuelLevel = Math.max(0, state.fuelLevel - 25);
      logger.warn(`SIMULATION: Fuel theft executed for ${state.imei} (-25L)`);
    } else if (state.scenarioStep > 110) {
      // Resume normal operation
      state.ignition = true;
      this.simulateNormalOperation(state, timeDelta);
    }
  }

  /**
   * Odometer tampering: GPS distance doesn't match odometer
   */
  private simulateOdometerTamper(state: VehicleSimState, timeDelta: number): void {
    state.ignition = true;
    state.speed = 50 + Math.random() * 20;

    // Move vehicle
    const distanceKm = (state.speed * timeDelta) / 3600;
    const { lat, lng } = this.moveVehicle(state.lat, state.lng, state.heading, distanceKm);
    state.lat = lat;
    state.lng = lng;

    // TAMPER: Odometer only increases by 50% of actual distance
    state.odometer += distanceKm * 0.5;

    // Normal fuel consumption
    const fuelConsumed = distanceKm / 10;
    state.fuelLevel = Math.max(0, state.fuelLevel - fuelConsumed);

    if (state.fuelLevel < 10) state.fuelLevel = 60;
  }

  /**
   * Route deviation: Vehicle enters restricted geofence
   */
  private simulateRouteDeviation(state: VehicleSimState, timeDelta: number): void {
    if (state.scenarioStep < 50) {
      this.simulateNormalOperation(state, timeDelta);
    } else {
      // Move towards restricted area (28.65, 77.25)
      state.ignition = true;
      state.speed = 60;

      const targetLat = 28.65;
      const targetLng = 77.25;

      state.lat += (targetLat - state.lat) * 0.01;
      state.lng += (targetLng - state.lng) * 0.01;

      state.odometer += 0.5;
      state.fuelLevel = Math.max(0, state.fuelLevel - 0.05);
    }
  }

  /**
   * Long idle: Engine ON, no movement, fuel consumption
   */
  private simulateLongIdle(state: VehicleSimState, timeDelta: number): void {
    state.ignition = true;
    state.speed = 0; // Not moving

    // Idle fuel consumption (1L per hour)
    const idleFuelConsumption = (timeDelta / 3600) * 1;
    state.fuelLevel = Math.max(0, state.fuelLevel - idleFuelConsumption);

    if (state.fuelLevel < 5) state.fuelLevel = 50;
  }

  /**
   * Move vehicle by distance in km along heading
   */
  private moveVehicle(
    lat: number,
    lng: number,
    headingDeg: number,
    distanceKm: number
  ): { lat: number; lng: number } {
    const earthRadius = 6371; // km
    const headingRad = (headingDeg * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceKm / earthRadius) +
        Math.cos(latRad) * Math.sin(distanceKm / earthRadius) * Math.cos(headingRad)
    );

    const newLngRad =
      (lng * Math.PI) / 180 +
      Math.atan2(
        Math.sin(headingRad) * Math.sin(distanceKm / earthRadius) * Math.cos(latRad),
        Math.cos(distanceKm / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
      );

    return {
      lat: (newLatRad * 180) / Math.PI,
      lng: (newLngRad * 180) / Math.PI,
    };
  }
}

// Types
interface VehicleSimState {
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  fuelLevel: number;
  odometer: number;
  heading: number;
  scenario: SimulationScenario;
  scenarioStep: number;
  lastUpdate: Date;
}

type SimulationScenario =
  | 'normal'
  | 'fuel_theft'
  | 'odometer_tamper'
  | 'route_deviation'
  | 'long_idle';

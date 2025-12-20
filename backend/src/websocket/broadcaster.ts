import { io } from '../index';
import { logger } from '../config/logger';
import { WS_EVENTS } from '../utils/constants';

/**
 * Broadcast vehicle position update to all connected clients
 */
export function broadcastVehicleUpdate(data: {
  imei: string;
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: Date;
  state: string;
}) {
  try {
    io.emit(WS_EVENTS.VEHICLE_UPDATE, {
      imei: data.imei,
      vehicleId: data.vehicleId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      ignition: data.ignition,
      timestamp: data.timestamp,
      state: data.state,
    });

    logger.debug(`WebSocket broadcast: vehicle update for ${data.imei}`);
  } catch (error) {
    logger.error(`WebSocket broadcast error: ${error}`);
  }
}

/**
 * Broadcast new alert to all connected clients
 */
export function broadcastAlert(alert: any) {
  try {
    io.emit(WS_EVENTS.ALERT_NEW, {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      vehicleId: alert.vehicleId,
      vehicle: alert.vehicle,
      createdAt: alert.createdAt,
      metadata: alert.metadata,
    });

    logger.debug(`WebSocket broadcast: new alert ${alert.type}`);
  } catch (error) {
    logger.error(`WebSocket alert broadcast error: ${error}`);
  }
}

/**
 * Broadcast dashboard update to all connected clients
 */
export function broadcastDashboardUpdate(data: {
  moving: number;
  stopped: number;
  idle: number;
  offline: number;
  alerts: number;
}) {
  try {
    io.emit(WS_EVENTS.DASHBOARD_UPDATE, data);

    logger.debug('WebSocket broadcast: dashboard update');
  } catch (error) {
    logger.error(`WebSocket dashboard broadcast error: ${error}`);
  }
}

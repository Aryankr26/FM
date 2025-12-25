// Alert Types
export const ALERT_TYPES = {
  FUEL_THEFT: 'FUEL_THEFT',
  FUEL_MANIPULATION: 'FUEL_MANIPULATION',
  ODOMETER_TAMPER: 'ODOMETER_TAMPER',
  GEOFENCE_ENTRY: 'GEOFENCE_ENTRY',
  GEOFENCE_EXIT: 'GEOFENCE_EXIT',
  GEOFENCE_DWELL: 'GEOFENCE_DWELL',
  SPEED_VIOLATION: 'SPEED_VIOLATION',
  TIRE_THEFT: 'TIRE_THEFT',
  LOW_MILEAGE: 'LOW_MILEAGE',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
} as const;

// Alert Severity Levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

// Fuel Event Types
export const FUEL_EVENT_TYPES = {
  THEFT: 'THEFT',
  REFILL: 'REFILL',
  LOSS: 'LOSS',
  NORMAL: 'NORMAL',
  MANIPULATION: 'MANIPULATION',
} as const;

// Fuel Theft Patterns
export const FUEL_PATTERNS = {
  ENGINE_OFF_DROP: 'ENGINE_OFF_DROP',
  RAPID_DROP: 'RAPID_DROP',
  REFILL_NO_MOVEMENT: 'REFILL_NO_MOVEMENT',
  GRADUAL_LOSS: 'GRADUAL_LOSS',
  SUSPICIOUS_PATTERN: 'SUSPICIOUS_PATTERN',
} as const;

// Fuel Severity Colors
export const FUEL_SEVERITY = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
} as const;

// Vehicle Status
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

// Trip Status
export const TRIP_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  SUPERVISOR: 'supervisor',
  DRIVER: 'driver',
} as const;

// Geofence Types
export const GEOFENCE_TYPES = {
  CIRCLE: 'circle',
  POLYGON: 'polygon',
} as const;

// Geofence Alert Types
export const GEOFENCE_ALERT_TYPES = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  DWELL: 'DWELL',
} as const;

// Tire Positions
export const TIRE_POSITIONS = {
  FRONT_LEFT: 'FRONT_LEFT',
  FRONT_RIGHT: 'FRONT_RIGHT',
  REAR_LEFT: 'REAR_LEFT',
  REAR_RIGHT: 'REAR_RIGHT',
  SPARE: 'SPARE',
} as const;

// Tire Status
export const TIRE_STATUS = {
  INSTALLED: 'installed',
  REMOVED: 'removed',
  STOLEN: 'stolen',
} as const;

// Detection Thresholds
export const THRESHOLDS = {
  // Fuel theft detection
  CRITICAL_FUEL_DROP: 20, // liters
  RAPID_FUEL_DROP: 25, // liters
  FUEL_DROP_TIME_WINDOW: 10, // minutes
  REFILL_DISTANCE_THRESHOLD: 0.5, // km
  
  // Odometer tampering
  ODOMETER_DEVIATION_PERCENT: 10, // percent
  ODOMETER_DEVIATION_ABS: 50, // km
  
  // Speed thresholds
  MOVING_SPEED_THRESHOLD: 5, // km/h
  IDLE_SPEED_THRESHOLD: 1, // km/h
  
  // Distance thresholds
  MIN_DISTANCE_FOR_TRIP: 0.01, // km (10 meters)
  STATIONARY_DISTANCE: 0.01, // km (10 meters)
  
  // Time thresholds
  DEVICE_OFFLINE_THRESHOLD: 30, // minutes
  LONG_STOP_THRESHOLD: 15, // minutes (for stop detection)
  
  // Geofence
  DEFAULT_GEOFENCE_RADIUS: 500, // meters
  GEOFENCE_DWELL_TIME: 30, // minutes
} as const;

// WebSocket Events
export const WS_EVENTS = {
  VEHICLE_UPDATE: 'vehicle:update',
  ALERT_NEW: 'alert:new',
  DASHBOARD_UPDATE: 'dashboard:update',
  SUBSCRIBE_VEHICLE: 'subscribe:vehicle',
  ALERT_ACKNOWLEDGE: 'alert:acknowledge',
} as const;

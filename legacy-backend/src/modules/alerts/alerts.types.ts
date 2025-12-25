import { z } from 'zod';

// Alert types
export type AlertType =
  | 'FUEL_THEFT'
  | 'FUEL_MANIPULATION'
  | 'ODOMETER_TAMPER'
  | 'GEOFENCE_ENTRY'
  | 'GEOFENCE_EXIT'
  | 'GEOFENCE_DWELL'
  | 'SPEED_VIOLATION'
  | 'TIRE_THEFT'
  | 'LOW_MILEAGE'
  | 'DEVICE_OFFLINE';

// Alert severity
export type AlertSeverity = 'info' | 'warning' | 'critical';

// Create alert input
export interface CreateAlertInput {
  vehicleId?: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: any;
}

// Query schema for alerts
export const getAlertsSchema = z.object({
  query: z.object({
    vehicleId: z.string().cuid().optional(),
    type: z.string().optional(),
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    resolved: z.string().transform((val) => val === 'true').optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type GetAlertsQuery = z.infer<typeof getAlertsSchema>['query'];

// Resolve alert schema
export const resolveAlertSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    resolvedBy: z.string().optional(),
  }),
});

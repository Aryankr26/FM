import { z } from 'zod';

// Telemetry input schema
export const telemetryInputSchema = z.object({
  body: z.object({
    imei: z.string().min(15, 'Invalid IMEI').max(15, 'Invalid IMEI'),
    timestamp: z.string().datetime().or(z.date()),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().min(0).max(300),
    ignition: z.boolean(),
    motion: z.boolean().optional(),
    fuelLevel: z.number().min(0).optional(),
    odometer: z.number().min(0).optional(),
    power: z.number().optional(),
    raw: z.any().optional(),
  }),
});

export type TelemetryInput = z.infer<typeof telemetryInputSchema>['body'];

// Normalized telemetry payload (internal use)
export interface TelemetryPayload {
  imei: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  motion?: boolean;
  fuelLevel?: number;
  odometer?: number;
  power?: number;
  raw?: any;
}

// Vehicle state
export type VehicleState = 'moving' | 'idle' | 'stopped';

// Query schema for fetching telemetry
export const getTelemetrySchema = z.object({
  params: z.object({
    vehicleId: z.string().cuid(),
  }),
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type GetTelemetryQuery = z.infer<typeof getTelemetrySchema>;

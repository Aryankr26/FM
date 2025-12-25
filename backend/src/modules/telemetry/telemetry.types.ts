import { z } from 'zod';

export const telemetryInputSchema = z.object({
  body: z.object({
    imei: z.string().min(1),
    timestamp: z.union([z.string(), z.coerce.date()]),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    speed: z.coerce.number(),
    ignition: z.coerce.boolean(),
    motion: z.coerce.boolean().optional(),
    fuelLevel: z.coerce.number().optional(),
    odometer: z.coerce.number().optional(),
    power: z.coerce.number().optional(),
    raw: z.any().optional(),
  }),
});

export const getTelemetrySchema = z.object({
  params: z.object({
    vehicleId: z.string().min(1),
  }),
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export type TelemetryInput = z.infer<typeof telemetryInputSchema>['body'];

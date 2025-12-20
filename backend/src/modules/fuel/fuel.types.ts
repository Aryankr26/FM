import { z } from 'zod';

// Fuel event types
export type FuelEventType = 'THEFT' | 'REFILL' | 'LOSS' | 'NORMAL' | 'MANIPULATION';

// Fuel theft patterns
export type FuelPattern =
  | 'ENGINE_OFF_DROP'
  | 'RAPID_DROP'
  | 'REFILL_NO_MOVEMENT'
  | 'GRADUAL_LOSS'
  | 'SUSPICIOUS_PATTERN';

// Fuel severity
export type FuelSeverity = 'green' | 'yellow' | 'red';

// Fuel analysis result
export interface FuelAnalysis {
  eventType: FuelEventType;
  pattern: FuelPattern | null;
  severity: FuelSeverity;
  confidence: number; // 0-100
  evidence: string[];
  previousLevel: number;
  currentLevel: number;
  delta: number;
  distanceKm: number;
  engineState: 'ON' | 'OFF';
}

// Query schema for fuel events
export const getFuelEventsSchema = z.object({
  query: z.object({
    vehicleId: z.string().cuid().optional(),
    severity: z.enum(['green', 'yellow', 'red']).optional(),
    eventType: z.enum(['THEFT', 'REFILL', 'LOSS', 'NORMAL', 'MANIPULATION']).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type GetFuelEventsQuery = z.infer<typeof getFuelEventsSchema>['query'];

// Fuel statistics
export interface FuelStatistics {
  totalEvents: number;
  theftEvents: number;
  refillEvents: number;
  totalFuelLoss: number;
  suspiciousEvents: number;
  averageConsumption: number;
}

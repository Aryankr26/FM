import { z } from 'zod';

// Vehicle schema
export const createVehicleSchema = z.object({
  body: z.object({
    imei: z.string().min(15).max(15).regex(/^\d{15}$/, 'IMEI must be 15 digits'),
    registrationNo: z.string().min(1).max(20),
    make: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    fuelCapacity: z.number().min(0).max(1000).optional(),
    dashOdometer: z.number().min(0).optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    registrationNo: z.string().min(1).max(20).optional(),
    make: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    fuelCapacity: z.number().min(0).max(1000).optional(),
    dashOdometer: z.number().min(0).optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  }),
});

export const deleteVehicleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const getVehicleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const getVehiclesQuerySchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive', 'maintenance']).optional(),
    search: z.string().optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).optional(),
  }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
export type GetVehiclesQuery = z.infer<typeof getVehiclesQuerySchema>['query'];

import { type NextFunction, type Request, type Response } from 'express';
import { MilitrackService } from './militrack.service';

const service = new MilitrackService();

const normalizeQuery = (query: Request['query']): Record<string, string | undefined> => {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      out[key] = value.length > 0 ? String(value[0]) : undefined;
      continue;
    }
    if (value == null) {
      out[key] = undefined;
      continue;
    }
    out[key] = String(value);
  }
  return out;
};

export class MilitrackController {
  async getDeviceInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const extraQuery = normalizeQuery(req.query);
      const data = await service.getDeviceInfo(extraQuery);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const extraQuery = normalizeQuery(req.query);
      const devices = await service.listDevices(extraQuery);
      res.json({ count: devices.length, data: devices });
    } catch (err) {
      next(err);
    }
  }
}

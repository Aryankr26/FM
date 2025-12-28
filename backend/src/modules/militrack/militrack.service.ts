import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

export type MilitrackDevice = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  speed: number | null;
  ignition: boolean | null;
  lastSeen: string | null;
  raw: unknown;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toStringSafe = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return null;
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (k in obj) return obj[k];
  }
  return undefined;
};

const normalizeOne = (raw: unknown): MilitrackDevice | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id =
    toStringSafe(
      pick(obj, ['id', 'deviceId', 'deviceID', 'imei', 'IMEI', 'terminalId', 'terminalID', 'uniqueId', 'uniqueID']),
    ) ?? null;
  if (!id) return null;

  const label =
    toStringSafe(pick(obj, ['label', 'name', 'deviceName', 'vehicleNo', 'vehicleNumber', 'plate', 'plateNo', 'regNo'])) ??
    id;

  const lat =
    toNumber(pick(obj, ['lat', 'latitude', 'gpsLat', 'gpsLatitude', 'y'])) ??
    toNumber(pick(obj, ['lastLat', 'LastLat', 'lastLatitude', 'last_lat']));
  const lng =
    toNumber(pick(obj, ['lng', 'lon', 'long', 'longitude', 'gpsLng', 'gpsLon', 'gpsLongitude', 'x'])) ??
    toNumber(pick(obj, ['lastLng', 'LastLng', 'lastLongitude', 'last_lng', 'lastLon']));

  if (lat == null || lng == null) return null;

  const speed =
    toNumber(pick(obj, ['speed', 'speedKmh', 'speedKMH', 'speedKph', 'spd'])) ??
    toNumber(pick(obj, ['lastSpeed', 'LastSpeed']));

  const ignition =
    toBoolean(pick(obj, ['ignition', 'acc', 'ACC', 'engine', 'engineOn', 'engineStatus'])) ??
    toBoolean(pick(obj, ['lastIgnition', 'LastIgnition']));

  const lastSeen =
    toStringSafe(pick(obj, ['lastSeen', 'lastUpdate', 'updatedAt', 'gpsTime', 'deviceTime', 'timestamp', 'time'])) ?? null;

  return {
    id,
    label,
    lat,
    lng,
    speed: speed == null ? null : speed,
    ignition,
    lastSeen,
    raw,
  };
};

const extractDeviceArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const candidates = [obj.object, obj.data, obj.result, obj.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === 'object' && Array.isArray((c as any).data)) return (c as any).data;
  }
  return [];
};

export class MilitrackService {
  async getDeviceInfo(extraQuery: Record<string, string | undefined>) {
    const token = env.militrack.token;
    if (!token) {
      throw new AppError('Militrack token not configured', 501);
    }

    const baseUrl = env.militrack.baseUrl;
    const url = new URL('/api/middleMan/getDeviceInfo', baseUrl);
    url.searchParams.set('accessToken', token);

    for (const [key, value] of Object.entries(extraQuery)) {
      if (!value) continue;
      if (key.toLowerCase() === 'accesstoken') continue;
      url.searchParams.set(key, value);
    }

    let resp: Response;
    try {
      resp = await fetch(url.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
    } catch {
      throw new AppError('Failed to reach Militrack', 502);
    }

    const text = await resp.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!resp.ok) {
      const message =
        parsed && typeof parsed === 'object' && 'message' in parsed
          ? String((parsed as any).message)
          : `Militrack error (${resp.status})`;
      throw new AppError(message, 502);
    }

    return parsed;
  }

  async listDevices(extraQuery: Record<string, string | undefined>): Promise<MilitrackDevice[]> {
    const payload = await this.getDeviceInfo(extraQuery);
    const rows = extractDeviceArray(payload);
    const devices: MilitrackDevice[] = [];
    for (const r of rows) {
      const d = normalizeOne(r);
      if (d) devices.push(d);
    }
    return devices;
  }
}

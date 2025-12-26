import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Polyline, TileLayer, Circle as LeafletCircle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { telemetryApi } from '../../services/api';

const defaultMarkerIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STORAGE_KEY_GEOFENCES = 'fleet.admin.geofences';
const STORAGE_KEY_LOGS = 'fleet.admin.logs';
const STORAGE_KEY_SESSIONS = 'fleet.admin.sessions';
const STORAGE_KEY_ROUTE = 'fleet.admin.route';

const nowIso = () => new Date().toISOString();

const isoToMs = (iso) => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
};

const formatMeters = (m) => {
  if (!Number.isFinite(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
};

const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
};

const safeParseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);

  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const distancePointToSegmentMeters = (p, a, b) => {
  const R = 6371000;
  const lat0 = toRad(p.lat);
  const cosLat0 = Math.cos(lat0);

  const px = toRad(p.lng) * R * cosLat0;
  const py = toRad(p.lat) * R;
  const ax = toRad(a.lng) * R * cosLat0;
  const ay = toRad(a.lat) * R;
  const bx = toRad(b.lng) * R * cosLat0;
  const by = toRad(b.lat) * R;

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 <= 0) {
    const dx = px - ax;
    const dy = py - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const t = clamp((apx * abx + apy * aby) / abLen2, 0, 1);
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
};

const distancePointToPolylineMeters = (p, routePoints) => {
  if (!p || !Array.isArray(routePoints) || routePoints.length < 2) return null;
  let min = Infinity;
  for (let i = 1; i < routePoints.length; i++) {
    const d = distancePointToSegmentMeters(p, routePoints[i - 1], routePoints[i]);
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : null;
};

const pointInPolygon = (point, polygon) => {
  const x = point.lng;
  const y = point.lat;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

const isInsideGeofence = (pos, geofence) => {
  if (!pos) return false;
  const reverse = !!geofence.reverse;
  if (geofence.type === 'circle') {
    if (!geofence.center || typeof geofence.radiusMeters !== 'number') return false;
    const d = haversineMeters(pos, geofence.center);
    const inside = d <= geofence.radiusMeters;
    return reverse ? !inside : inside;
  }

  if (geofence.type === 'polygon') {
    if (!Array.isArray(geofence.points) || geofence.points.length < 3) return false;
    const inside = pointInPolygon(pos, geofence.points);
    return reverse ? !inside : inside;
  }

  return false;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const speedMpsToKmh = (mps) => (Number.isFinite(mps) ? mps * 3.6 : null);

const computeMetrics = (points) => {
  if (!Array.isArray(points) || points.length < 2) {
    return {
      totalDistanceMeters: 0,
      totalDurationMs: 0,
      avgSpeedKmh: 0,
      maxSpeedKmh: 0,
      currentSpeedKmh: 0,
      idleDurationMs: 0,
      stopsCount: 0,
    };
  }

  const STOP_SPEED_KMH = 2;
  const MIN_STOP_MS = 60 * 1000;

  let totalDistanceMeters = 0;
  let maxSpeedKmh = 0;
  let idleDurationMs = 0;
  let stopsCount = 0;

  const startMs = isoToMs(points[0].ts);
  const endMs = isoToMs(points[points.length - 1].ts);
  const totalDurationMs = Math.max(0, endMs - startMs);

  let stopStartMs = null;
  let lastSpeedKmh = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const prevMs = isoToMs(prev.ts);
    const curMs = isoToMs(cur.ts);
    const dtMs = curMs - prevMs;
    if (!Number.isFinite(dtMs) || dtMs <= 0) continue;

    const d = haversineMeters(prev, cur);
    totalDistanceMeters += d;

    const derivedKmh = (d / (dtMs / 1000)) * 3.6;
    const speedKmh =
      typeof cur.speedKmh === 'number' && Number.isFinite(cur.speedKmh) ? cur.speedKmh : derivedKmh;

    lastSpeedKmh = speedKmh;
    if (speedKmh > maxSpeedKmh) maxSpeedKmh = speedKmh;

    if (speedKmh < STOP_SPEED_KMH) {
      idleDurationMs += dtMs;
      if (stopStartMs == null) stopStartMs = prevMs;
    } else {
      if (stopStartMs != null) {
        const stopMs = prevMs - stopStartMs;
        if (stopMs >= MIN_STOP_MS) stopsCount += 1;
      }
      stopStartMs = null;
    }
  }

  if (stopStartMs != null) {
    const lastMs = isoToMs(points[points.length - 1].ts);
    const stopMs = lastMs - stopStartMs;
    if (stopMs >= MIN_STOP_MS) stopsCount += 1;
  }

  const avgSpeedKmh = totalDurationMs > 0 ? (totalDistanceMeters / (totalDurationMs / 1000)) * 3.6 : 0;

  return {
    totalDistanceMeters,
    totalDurationMs,
    avgSpeedKmh,
    maxSpeedKmh,
    currentSpeedKmh: lastSpeedKmh,
    idleDurationMs,
    stopsCount,
  };
};

function MapClickCapture({ enabled, onClick }) {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

export function AdminDashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [path, setPath] = useState([]);
  const [sessions, setSessions] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const parsed = raw ? safeParseJson(raw, []) : [];
    return Array.isArray(parsed) ? parsed : [];
  });

  const [route, setRoute] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY_ROUTE);
    const parsed = raw ? safeParseJson(raw, []) : [];
    return Array.isArray(parsed) ? parsed : [];
  });
  const [routeDraftActive, setRouteDraftActive] = useState(false);
  const [routeDraftPoints, setRouteDraftPoints] = useState([]);
  const [deviationThresholdMeters, setDeviationThresholdMeters] = useState(120);

  const [activeSource, setActiveSource] = useState('live');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef(null);

  const sessionMetaRef = useRef({ sessionId: null, startedAt: null });
  const motionRef = useRef({ moving: null });
  const deviationRef = useRef({ deviating: false });
  const lastPointRef = useRef(null);
  const lastBackendSendMsRef = useRef(0);
  const backendSendInFlightRef = useRef(false);
  const lastBackendErrorMsRef = useRef(0);

  const [geofences, setGeofences] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY_GEOFENCES);
    return Array.isArray(raw ? safeParseJson(raw, []) : []) ? safeParseJson(raw, []) : [];
  });

  const [logs, setLogs] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return Array.isArray(raw ? safeParseJson(raw, []) : []) ? safeParseJson(raw, []) : [];
  });

  const [draftType, setDraftType] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftRadius, setDraftRadius] = useState(200);
  const [draftCenter, setDraftCenter] = useState(null);
  const [draftPoints, setDraftPoints] = useState([]);

  const insideByIdRef = useRef({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GEOFENCES, JSON.stringify(geofences));
    } catch {
      // ignore
    }
  }, [geofences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 2000)));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions.slice(0, 200)));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROUTE, JSON.stringify(route));
    } catch {}
  }, [route]);

  useEffect(() => {
    if (activeSource === 'live') {
      setPlaybackIndex(path.length > 0 ? path.length - 1 : 0);
      return;
    }
    const sess = sessions.find((s) => s.id === activeSource);
    const count = Array.isArray(sess?.points) ? sess.points.length : 0;
    setPlaybackIndex(count > 0 ? count - 1 : 0);
  }, [activeSource, sessions, path.length]);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current != null) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const points =
      activeSource === 'live'
        ? path
        : (sessions.find((s) => s.id === activeSource)?.points ?? []);

    if (!Array.isArray(points) || points.length < 2) {
      setIsPlaying(false);
      return;
    }

    if (playbackTimerRef.current != null) {
      clearInterval(playbackTimerRef.current);
    }

    const tickMs = Math.max(120, Math.floor(600 / clamp(Number(playbackRate) || 1, 1, 8)));
    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev + 1;
        if (next >= points.length) {
          setIsPlaying(false);
          return points.length - 1;
        }
        return next;
      });
    }, tickMs);

    return () => {
      if (playbackTimerRef.current != null) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isPlaying, playbackRate, activeSource, sessions, path]);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          type: 'ERROR',
          message: 'Geolocation not supported in this browser.',
        },
        ...prev,
      ]);
      return;
    }

    if (watchIdRef.current != null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // ignore
      }
    }

    const sessionId = `sess-${Date.now()}`;
    const startedAt = nowIso();
    sessionMetaRef.current = { sessionId, startedAt };
    setIsTracking(true);
    setActiveSource('live');
    setIsPlaying(false);
    setPlaybackIndex(0);
    setPath([]);
    motionRef.current = { moving: null };
    deviationRef.current = { deviating: false };
    lastPointRef.current = null;
    lastBackendSendMsRef.current = 0;
    backendSendInFlightRef.current = false;
    lastBackendErrorMsRef.current = 0;
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        ts: nowIso(),
        type: 'TRACKING_START',
        message: 'GPS tracking started',
      },
      ...prev,
    ]);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const nowMs = Date.now();
        const ts = new Date(nowMs).toISOString();
        const rawSpeedKmh = speedMpsToKmh(pos.coords.speed);

        let speedKmh = rawSpeedKmh;
        const last = lastPointRef.current;
        if ((speedKmh == null || !Number.isFinite(speedKmh)) && last && typeof last.ms === 'number') {
          const dtSec = (nowMs - last.ms) / 1000;
          if (dtSec > 0) {
            const d = haversineMeters({ lat: last.lat, lng: last.lng }, { lat: pos.coords.latitude, lng: pos.coords.longitude });
            const derived = (d / dtSec) * 3.6;
            if (Number.isFinite(derived)) speedKmh = derived;
          }
        }

        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ts,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
          speedKmh,
        };

        lastPointRef.current = { lat: next.lat, lng: next.lng, ms: nowMs };

        const STOP_SPEED_KMH = 2;
        if (typeof speedKmh === 'number' && Number.isFinite(speedKmh)) {
          const moving = speedKmh >= STOP_SPEED_KMH;
          const prevMoving = motionRef.current.moving;
          if (prevMoving == null) {
            motionRef.current.moving = moving;
          } else if (prevMoving !== moving) {
            motionRef.current.moving = moving;
            setLogs((prev) => [
              {
                id: `log-${Date.now()}`,
                ts: nowIso(),
                type: moving ? 'MOVE' : 'STOP',
                message: moving ? 'Movement started' : 'Stop detected',
                position: next,
              },
              ...prev,
            ]);
          }
        }

        setPosition(next);
        setAccuracy(typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null);
        setPath((prev) => {
          const nextPath = [...prev, next];
          return nextPath.length > 2000 ? nextPath.slice(nextPath.length - 2000) : nextPath;
        });

        const minIntervalMs = 5000;
        if (!backendSendInFlightRef.current && nowMs - lastBackendSendMsRef.current >= minIntervalMs) {
          backendSendInFlightRef.current = true;
          lastBackendSendMsRef.current = nowMs;
          telemetryApi
            .ingestPhone({
              timestamp: ts,
              latitude: next.lat,
              longitude: next.lng,
              speed: typeof next.speedKmh === 'number' && Number.isFinite(next.speedKmh) ? next.speedKmh : 0,
              ignition: true,
              motion: typeof next.speedKmh === 'number' && Number.isFinite(next.speedKmh) ? next.speedKmh >= 2 : undefined,
              accuracy: typeof next.accuracy === 'number' ? next.accuracy : undefined,
              raw: {
                source: 'ADMIN_LIVE',
              },
            })
            .catch((err) => {
              const errNow = Date.now();
              if (errNow - lastBackendErrorMsRef.current >= 30000) {
                lastBackendErrorMsRef.current = errNow;
                setLogs((prev) => [
                  {
                    id: `log-${Date.now()}`,
                    ts: nowIso(),
                    type: 'ERROR',
                    message: err?.message ? `Backend ingest failed: ${err.message}` : 'Backend ingest failed',
                  },
                  ...prev,
                ]);
              }
            })
            .finally(() => {
              backendSendInFlightRef.current = false;
            });
        }
      },
      (err) => {
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            ts: nowIso(),
            type: 'ERROR',
            message: err?.message || 'Failed to read GPS location.',
          },
          ...prev,
        ]);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 20000,
      }
    );

    watchIdRef.current = id;
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current != null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // ignore
      }
      watchIdRef.current = null;
    }

    const meta = sessionMetaRef.current;
    if (meta?.sessionId && meta?.startedAt && Array.isArray(path) && path.length >= 2) {
      const endedAt = nowIso();
      const summary = computeMetrics(path);
      const session = {
        id: meta.sessionId,
        startedAt: meta.startedAt,
        endedAt,
        points: path,
        summary,
      };
      setSessions((prev) => [session, ...prev]);
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          type: 'TRACKING_STOP',
          message: `GPS tracking stopped (saved session ${session.id})`,
        },
        ...prev,
      ]);
    } else {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          type: 'TRACKING_STOP',
          message: 'GPS tracking stopped',
        },
        ...prev,
      ]);
    }

    sessionMetaRef.current = { sessionId: null, startedAt: null };
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!position) return;
    if (!isTracking) return;

    const nextInside = {};
    const prevInside = insideByIdRef.current || {};

    for (const g of geofences) {
      const inside = isInsideGeofence(position, g);
      nextInside[g.id] = inside;

      const wasInside = !!prevInside[g.id];
      if (inside !== wasInside) {
        setLogs((prev) => [
          {
            id: `log-${Date.now()}-${g.id}`,
            ts: nowIso(),
            type: inside ? 'ENTRY' : 'EXIT',
            geofenceId: g.id,
            geofenceName: g.name,
            message: inside ? `Entered ${g.name}` : `Exited ${g.name}`,
            position,
          },
          ...prev,
        ]);
      }
    }

    insideByIdRef.current = nextInside;
  }, [position, geofences, isTracking]);

  useEffect(() => {
    if (!isTracking) return;
    if (!position) return;
    if (!Array.isArray(route) || route.length < 2) {
      deviationRef.current = { deviating: false };
      return;
    }

    const threshold = Number(deviationThresholdMeters);
    if (!Number.isFinite(threshold) || threshold <= 0) return;

    const distance = distancePointToPolylineMeters(position, route);
    if (typeof distance !== 'number' || !Number.isFinite(distance)) return;

    const deviating = distance > threshold;
    const prev = !!deviationRef.current.deviating;
    if (deviating !== prev) {
      deviationRef.current = { deviating };
      setLogs((prevLogs) => [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          type: deviating ? 'ROUTE_DEVIATION' : 'ROUTE_OK',
          message: deviating
            ? `Route deviation detected (${Math.round(distance)}m from route)`
            : 'Back on route',
          position,
        },
        ...prevLogs,
      ]);
    }
  }, [isTracking, position, route, deviationThresholdMeters]);

  const beginDraft = (type) => {
    setRouteDraftActive(false);
    setDraftType(type);
    setDraftName('');
    setDraftRadius(200);
    setDraftCenter(null);
    setDraftPoints([]);
  };

  const cancelDraft = () => {
    setDraftType(null);
    setDraftName('');
    setDraftCenter(null);
    setDraftPoints([]);
  };

  const beginRouteDraft = () => {
    setDraftType(null);
    setRouteDraftActive(true);
    setRouteDraftPoints([]);
  };

  const cancelRouteDraft = () => {
    setRouteDraftActive(false);
    setRouteDraftPoints([]);
  };

  const saveRouteDraft = () => {
    if (!Array.isArray(routeDraftPoints) || routeDraftPoints.length < 2) return;
    setRoute(routeDraftPoints);
    setRouteDraftActive(false);
  };

  const clearRoute = () => {
    setRoute([]);
    deviationRef.current = { deviating: false };
  };

  const saveDraft = () => {
    if (!draftType) return;
    const name = String(draftName || '').trim();
    if (!name) return;

    if (draftType === 'circle') {
      if (!draftCenter) return;
      const geofence = {
        id: `gf-${Date.now()}`,
        type: 'circle',
        name,
        center: draftCenter,
        radiusMeters: Number(draftRadius) || 0,
        reverse: false,
        createdAt: nowIso(),
      };
      setGeofences((prev) => [geofence, ...prev]);
      cancelDraft();
      return;
    }

    if (draftType === 'polygon') {
      if (draftPoints.length < 3) return;
      const geofence = {
        id: `gf-${Date.now()}`,
        type: 'polygon',
        name,
        points: draftPoints,
        reverse: false,
        createdAt: nowIso(),
      };
      setGeofences((prev) => [geofence, ...prev]);
      cancelDraft();
    }
  };

  const toggleGeofenceReverse = (id) => {
    setGeofences((prev) => prev.map((g) => (g.id === id ? { ...g, reverse: !g.reverse } : g)));
  };

  const deleteGeofence = (id) => {
    setGeofences((prev) => prev.filter((g) => g.id !== id));
    insideByIdRef.current = { ...insideByIdRef.current, [id]: false };
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearPath = () => {
    setPath([]);
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  const clearSessions = () => {
    setSessions([]);
    if (activeSource !== 'live') setActiveSource('live');
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  const deleteSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSource === id) setActiveSource('live');
  };

  const liveCenter = position ? [position.lat, position.lng] : [28.6139, 77.209];

  const activePoints = useMemo(() => {
    if (activeSource === 'live') return path;
    const sess = sessions.find((s) => s.id === activeSource);
    return Array.isArray(sess?.points) ? sess.points : [];
  }, [activeSource, sessions, path]);

  const metrics = useMemo(() => computeMetrics(activePoints), [activePoints]);

  const playbackPoint = useMemo(() => {
    if (!Array.isArray(activePoints) || activePoints.length === 0) return null;
    const idx = clamp(playbackIndex, 0, activePoints.length - 1);
    return activePoints[idx] || null;
  }, [activePoints, playbackIndex]);

  const displayPoint = activeSource === 'live' ? position : playbackPoint;
  const displayAccuracy = activeSource === 'live' ? accuracy : playbackPoint?.accuracy ?? null;

  const mapCenter = playbackPoint ? [playbackPoint.lat, playbackPoint.lng] : liveCenter;

  const draftHelp = useMemo(() => {
    if (!draftType) return null;
    if (draftType === 'circle') {
      return draftCenter ? 'Adjust radius, then Save.' : 'Click the map to set the circle center.';
    }
    if (draftType === 'polygon') {
      return 'Click the map to add points. Save when you have 3+ points.';
    }
    return null;
  }, [draftType, draftCenter]);

  return (
    <div className="relative h-screen w-full bg-background">
      <div className="absolute inset-0">
        <MapContainer center={mapCenter} zoom={15} zoomControl className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickCapture
            enabled={draftType === 'circle' || draftType === 'polygon' || routeDraftActive}
            onClick={(latlng) => {
              if (draftType === 'circle') {
                setDraftCenter(latlng);
              } else if (draftType === 'polygon') {
                setDraftPoints((prev) => [...prev, latlng]);
              } else if (routeDraftActive) {
                setRouteDraftPoints((prev) => [...prev, latlng]);
              }
            }}
          />

          {position && activeSource === 'live' && (
            <Marker position={[position.lat, position.lng]} icon={defaultMarkerIcon} />
          )}

          {playbackPoint && activeSource !== 'live' && (
            <Marker position={[playbackPoint.lat, playbackPoint.lng]} icon={defaultMarkerIcon} />
          )}

          {activePoints.length >= 2 && (
            <Polyline
              positions={activePoints.slice(0, clamp(playbackIndex + 1, 0, activePoints.length)).map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.9 }}
            />
          )}

          {Array.isArray(route) && route.length >= 2 && (
            <Polyline
              positions={route.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#a855f7', weight: 3, opacity: 0.9, dashArray: '6 8' }}
            />
          )}

          {routeDraftActive && routeDraftPoints.length >= 2 && (
            <Polyline
              positions={routeDraftPoints.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#a855f7', weight: 3, opacity: 0.9 }}
            />
          )}

          {draftType === 'circle' && draftCenter && (
            <LeafletCircle
              center={[draftCenter.lat, draftCenter.lng]}
              radius={Number(draftRadius) || 0}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
            />
          )}

          {draftType === 'polygon' && draftPoints.length >= 2 && (
            <Polyline
              positions={draftPoints.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#10b981', weight: 3, opacity: 0.9 }}
            />
          )}

          {draftType === 'polygon' && draftPoints.length >= 3 && (
            <Polygon
              positions={draftPoints.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
            />
          )}

          {geofences.map((g) => {
            if (g.type === 'circle' && g.center) {
              return (
                <LeafletCircle
                  key={g.id}
                  center={[g.center.lat, g.center.lng]}
                  radius={Number(g.radiusMeters) || 0}
                  pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                />
              );
            }

            if (g.type === 'polygon' && Array.isArray(g.points) && g.points.length >= 3) {
              return (
                <Polygon
                  key={g.id}
                  positions={g.points.map((p) => [p.lat, p.lng])}
                  pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                />
              );
            }

            return null;
          })}
        </MapContainer>
      </div>

      <div className="absolute left-4 top-4 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background/90 backdrop-blur p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Admin Control Panel</div>
            <div className="text-xs text-muted-foreground">GPS tracking and geofence testing</div>
          </div>
          <div className="flex items-center gap-2">
            {!isTracking ? (
              <Button size="sm" onClick={startTracking}>
                Start
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={stopTracking}>
                Stop
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Label className="text-xs">Source</Label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={activeSource}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveSource(e.target.value);
            }}
          >
            <option value="live">Live</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Lat</div>
            <div className="font-medium">{displayPoint ? displayPoint.lat.toFixed(6) : '—'}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Lng</div>
            <div className="font-medium">{displayPoint ? displayPoint.lng.toFixed(6) : '—'}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Accuracy</div>
            <div className="font-medium">{typeof displayAccuracy === 'number' ? `${Math.round(displayAccuracy)}m` : '—'}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Track points</div>
            <div className="font-medium">{activePoints.length}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Distance</div>
            <div className="font-medium">{formatMeters(metrics.totalDistanceMeters)}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Speed</div>
            <div className="font-medium">{Number.isFinite(metrics.currentSpeedKmh) ? `${metrics.currentSpeedKmh.toFixed(1)} km/h` : '—'}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Avg / Max</div>
            <div className="font-medium">
              {`${metrics.avgSpeedKmh.toFixed(1)} / ${metrics.maxSpeedKmh.toFixed(1)} km/h`}
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Stops</div>
            <div className="font-medium">{metrics.stopsCount}</div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="text-muted-foreground">Idle</div>
            <div className="font-medium">{formatDuration(metrics.idleDurationMs)}</div>
          </div>
        </div>

        <div className="mt-3 rounded-lg border p-3">
          <div className="text-xs font-semibold">Playback</div>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlaying((v) => !v)}
              disabled={!Array.isArray(activePoints) || activePoints.length < 2}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsPlaying(false);
                setPlaybackIndex(0);
              }}
              disabled={!Array.isArray(activePoints) || activePoints.length < 2}
            >
              Reset
            </Button>
            <div className="flex-1" />
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value) || 1)}
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          <div className="mt-2">
            <input
              className="w-full"
              type="range"
              min={0}
              max={Math.max(0, activePoints.length - 1)}
              value={clamp(playbackIndex, 0, Math.max(0, activePoints.length - 1))}
              onChange={(e) => {
                setIsPlaying(false);
                setPlaybackIndex(Number(e.target.value) || 0);
              }}
              disabled={!Array.isArray(activePoints) || activePoints.length < 2}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <div>
                {activePoints.length > 0 ? `${clamp(playbackIndex, 0, activePoints.length - 1) + 1}/${activePoints.length}` : '—'}
              </div>
              <div>
                {playbackPoint?.ts ? new Date(playbackPoint.ts).toLocaleTimeString() : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold">Route Deviation</div>
            <div className="text-[11px] text-muted-foreground">Saved points: {Array.isArray(route) ? route.length : 0}</div>
          </div>

          <div className="mt-2 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Deviation threshold (meters)</Label>
              <Input
                type="number"
                min={10}
                value={deviationThresholdMeters}
                onChange={(e) => setDeviationThresholdMeters(Number(e.target.value || 0))}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {!routeDraftActive ? (
                <Button size="sm" variant="outline" onClick={beginRouteDraft}>
                  New Route
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={saveRouteDraft}>
                    Save Route
                  </Button>
                  <Button size="sm" variant="secondary" onClick={cancelRouteDraft}>
                    Cancel
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={clearRoute}>
                Clear Route
              </Button>
            </div>

            {routeDraftActive && (
              <div className="text-xs text-muted-foreground">Draft points: {routeDraftPoints.length}</div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={clearPath}>
            Clear Path
          </Button>
          <Button size="sm" variant="outline" onClick={clearSessions}>
            Clear Sessions
          </Button>
          <Button size="sm" variant="outline" onClick={() => beginDraft('circle')}>
            New Circle
          </Button>
          <Button size="sm" variant="outline" onClick={() => beginDraft('polygon')}>
            New Polygon
          </Button>
          {draftType && (
            <Button size="sm" variant="secondary" onClick={cancelDraft}>
              Cancel Draft
            </Button>
          )}
        </div>

        {draftType && (
          <div className="mt-3 rounded-lg border p-3">
            <div className="text-xs font-semibold">Create {draftType === 'circle' ? 'Circle' : 'Polygon'} Geofence</div>
            {draftHelp && <div className="mt-1 text-xs text-muted-foreground">{draftHelp}</div>}

            <div className="mt-3 space-y-2">
              <div className="space-y-1">
                <Label htmlFor="gf-name" className="text-xs">
                  Name
                </Label>
                <Input
                  id="gf-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Warehouse Gate"
                />
              </div>

              {draftType === 'circle' && (
                <div className="space-y-1">
                  <Label htmlFor="gf-radius" className="text-xs">
                    Radius (meters)
                  </Label>
                  <Input
                    id="gf-radius"
                    type="number"
                    min={10}
                    value={draftRadius}
                    onChange={(e) => setDraftRadius(Number(e.target.value || 0))}
                  />
                </div>
              )}

              {draftType === 'polygon' && (
                <div className="text-xs text-muted-foreground">
                  Points: {draftPoints.length}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveDraft}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={cancelDraft}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <div className="text-xs font-semibold">Geofences ({geofences.length})</div>
            <Button size="sm" variant="outline" onClick={() => setGeofences([])}>
              Clear
            </Button>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {geofences.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">No geofences yet.</div>
            ) : (
              geofences.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 p-3 border-t">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.type}{g.reverse ? ' (reverse)' : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleGeofenceReverse(g.id)}>
                      Reverse
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteGeofence(g.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <div className="text-xs font-semibold">Sessions ({sessions.length})</div>
          </div>
          <div className="max-h-[160px] overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">No saved sessions yet.</div>
            ) : (
              sessions.slice(0, 20).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-3 border-t">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{s.id}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setActiveSource(s.id)}>
                      Load
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteSession(s.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <div className="text-xs font-semibold">Event Log</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearLogs}>
                Clear
              </Button>
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">No events yet.</div>
            ) : (
              logs.slice(0, 50).map((l) => (
                <div key={l.id} className="p-3 border-t">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium">{l.type}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{l.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

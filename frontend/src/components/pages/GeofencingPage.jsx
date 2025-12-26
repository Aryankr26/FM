import { useMemo, useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polygon, Polyline, TileLayer, Circle as LeafletCircle, useMapEvents } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Plus, AlertCircle, Circle, Shield, Trash2, Power } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { geofenceApi } from '../../services/api';

const defaultMarkerIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickCapture({ enabled, onClick }) {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

export function GeofencingPage() {
  const [geofences, setGeofences] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState('circle');
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createRadius, setCreateRadius] = useState(200);
  const [createCenter, setCreateCenter] = useState(null);
  const [createPolygon, setCreatePolygon] = useState([]);
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMutatingId, setIsMutatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [geofencesRes, alertsRes] = await Promise.all([
        geofenceApi.getAll(),
        geofenceApi.getAlerts({ resolved: false, limit: 20 }),
      ]);

      setGeofences(geofencesRes.data || []);
      setAlerts(alertsRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching geofence data:', err);
      setError('Failed to load geofences');
    } finally {
      setLoading(false);
    }
  };

  const resetCreate = () => {
    setCreateType('circle');
    setCreateName('');
    setCreateDescription('');
    setCreateRadius(200);
    setCreateCenter(null);
    setCreatePolygon([]);
    setCreateError('');
  };

  const createHelpText = useMemo(() => {
    if (createType === 'circle') {
      return createCenter ? 'Adjust the radius and click Save.' : 'Click on the map to set the circle center.';
    }
    return 'Click on the map to add polygon points (3+).';
  }, [createType, createCenter]);

  const handleCreate = async () => {
    if (isSaving) return;

    const name = String(createName || '').trim();
    if (!name) {
      setCreateError('Geofence name is required.');
      return;
    }

    if (createType === 'circle') {
      if (!createCenter) {
        setCreateError('Click on the map to set the circle center.');
        return;
      }
      const radius = Number(createRadius);
      if (!Number.isFinite(radius) || radius <= 0) {
        setCreateError('Radius must be a positive number.');
        return;
      }

      setIsSaving(true);
      setCreateError('');
      try {
        await geofenceApi.create({
          name,
          description: createDescription ? String(createDescription) : null,
          type: 'circle',
          centerLat: createCenter.lat,
          centerLng: createCenter.lng,
          radius,
          active: true,
        });
        setCreateOpen(false);
        resetCreate();
        await fetchData();
      } catch (err) {
        setCreateError(err?.message || 'Failed to create geofence');
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (createPolygon.length < 3) {
      setCreateError('Polygon geofence needs at least 3 points.');
      return;
    }

    setIsSaving(true);
    setCreateError('');
    try {
      await geofenceApi.create({
        name,
        description: createDescription ? String(createDescription) : null,
        type: 'polygon',
        polygon: createPolygon.map((p) => [p.lat, p.lng]),
        active: true,
      });
      setCreateOpen(false);
      resetCreate();
      await fetchData();
    } catch (err) {
      setCreateError(err?.message || 'Failed to create geofence');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id || isMutatingId) return;
    setIsMutatingId(id);
    try {
      await geofenceApi.delete(id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete geofence');
    } finally {
      setIsMutatingId(null);
    }
  };

  const handleToggleActive = async (geofence) => {
    if (!geofence?.id || isMutatingId) return;
    setIsMutatingId(geofence.id);
    try {
      const nextActive = !geofence.active;
      const res = await geofenceApi.update(geofence.id, { active: nextActive });
      const updated = res?.data;

      setGeofences((prev) =>
        prev.map((g) => (g.id === geofence.id ? (updated || { ...g, active: nextActive }) : g))
      );
    } catch (err) {
      setError(err?.message || 'Failed to update geofence');
    } finally {
      setIsMutatingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAlertTypeColor = (alertType) => {
    switch (alertType) {
      case 'ENTRY': return 'text-green-600 bg-green-100';
      case 'EXIT': return 'text-red-600 bg-red-100';
      case 'DWELL': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading geofences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Geofencing</h1>
              <p className="text-slate-600 mt-1">
                Manage location boundaries and monitor violations
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) {
                resetCreate();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Geofence
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Geofence</DialogTitle>
                  <DialogDescription>
                    {createHelpText}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={createType === 'circle' ? 'default' : 'outline'}
                          onClick={() => {
                            setCreateType('circle');
                            setCreateCenter(null);
                            setCreatePolygon([]);
                            setCreateError('');
                          }}
                        >
                          Circle
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={createType === 'polygon' ? 'default' : 'outline'}
                          onClick={() => {
                            setCreateType('polygon');
                            setCreateCenter(null);
                            setCreatePolygon([]);
                            setCreateError('');
                          }}
                        >
                          Polygon
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="gf-name" className="text-xs">Name</Label>
                      <Input
                        id="gf-name"
                        value={createName}
                        onChange={(e) => {
                          setCreateName(e.target.value);
                          if (createError) setCreateError('');
                        }}
                        placeholder="e.g. Warehouse Gate"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="gf-desc" className="text-xs">Description (optional)</Label>
                      <Input
                        id="gf-desc"
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    {createType === 'circle' && (
                      <div className="space-y-1">
                        <Label htmlFor="gf-radius" className="text-xs">Radius (meters)</Label>
                        <Input
                          id="gf-radius"
                          type="number"
                          min={10}
                          value={createRadius}
                          onChange={(e) => setCreateRadius(Number(e.target.value || 0))}
                        />
                        <div className="text-xs text-slate-500">
                          Center: {createCenter ? `${createCenter.lat.toFixed(5)}, ${createCenter.lng.toFixed(5)}` : '—'}
                        </div>
                      </div>
                    )}

                    {createType === 'polygon' && (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500">Points: {createPolygon.length}</div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCreatePolygon((prev) => prev.slice(0, -1))}
                            disabled={createPolygon.length === 0 || isSaving}
                          >
                            Undo
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCreatePolygon([])}
                            disabled={createPolygon.length === 0 || isSaving}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}

                    {createError && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                        {createError}
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <div className="h-[360px] w-full">
                      <MapContainer
                        center={createCenter ? [createCenter.lat, createCenter.lng] : [28.6139, 77.209]}
                        zoom={13}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickCapture
                          enabled={!isSaving}
                          onClick={(latlng) => {
                            if (createType === 'circle') {
                              setCreateCenter(latlng);
                              setCreateError('');
                            } else {
                              setCreatePolygon((prev) => [...prev, latlng]);
                              setCreateError('');
                            }
                          }}
                        />

                        {createType === 'circle' && createCenter && (
                          <>
                            <Marker position={[createCenter.lat, createCenter.lng]} icon={defaultMarkerIcon} />
                            <LeafletCircle
                              center={[createCenter.lat, createCenter.lng]}
                              radius={Number(createRadius) || 0}
                              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.12 }}
                            />
                          </>
                        )}

                        {createType === 'polygon' && createPolygon.length >= 2 && (
                          <Polyline
                            positions={createPolygon.map((p) => [p.lat, p.lng])}
                            pathOptions={{ color: '#10b981', weight: 3, opacity: 0.9 }}
                          />
                        )}

                        {createType === 'polygon' && createPolygon.length >= 3 && (
                          <Polygon
                            positions={createPolygon.map((p) => [p.lat, p.lng])}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.12 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreate} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save Geofence'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Geofences</p>
                <p className="text-2xl font-bold text-slate-900">{geofences.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Geofences</p>
                <p className="text-2xl font-bold text-slate-900">
                  {geofences.filter(g => g.active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Alerts</p>
                <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Geofences List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Geofences</h3>
          </div>
          {geofences.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No geofences created yet</p>
              <p className="text-sm mt-1">Create your first geofence to start monitoring locations</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {geofences.map((geofence) => (
                <div key={geofence.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        geofence.active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {geofence.type === 'circle' ? (
                          <Circle className={`h-5 w-5 ${
                            geofence.active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        ) : (
                          <MapPin className={`h-5 w-5 ${
                            geofence.active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{geofence.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {geofence.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            Type: {geofence.type.toUpperCase()}
                          </span>
                          {geofence.type === 'circle' && geofence.radius && (
                            <span className="text-xs text-slate-500">
                              Radius: {geofence.radius}m
                            </span>
                          )}
                          <span className={`text-xs font-medium ${
                            geofence.active ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {geofence.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isMutatingId === geofence.id}
                        onClick={() => handleToggleActive(geofence)}
                      >
                        <Power className="h-4 w-4" />
                        {geofence.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isMutatingId === geofence.id}
                        onClick={() => handleDelete(geofence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Recent Alerts</h3>
          </div>
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No active geofence alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.alertType)}`}>
                      {alert.alertType}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Vehicle: {alert.vehicle?.registrationNo || 'Unknown'}</span>
                        <span>Geofence: {alert.geofence?.name || 'Unknown'}</span>
                        <span>{formatDate(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

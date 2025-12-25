import { useEffect, useRef, useState } from 'react';
function zoomByRadius(radius) {
  if (radius <= 200) return 18;
  if (radius <= 500) return 16;
  if (radius <= 1000) return 15;
  return 14;
}

/* ======================================================
   MAP CLICK HELPER
====================================================== */
function useMapClick(map, onPick) {
  useEffect(() => {
    if (!map || !window.mappls || !window.mappls.Event) return;

    const listener = window.mappls.Event.addListener(map, 'click', (e) => {
      onPick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    });

    return () => {
      if (listener) window.mappls.Event.removeListener(listener);
    };
  }, [map, onPick]);
}

/* ======================================================
   SUPERVISOR – GEOFENCING PAGE
====================================================== */
export default function GeofencingPage() {
  const mapRef = useRef(null);

  /* ---------- STATE ---------- */
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [radius, setRadius] = useState(500);
  const [point, setPoint] = useState(null);
  const [editingId, setEditingId] = useState(null);
const API_BASE = 'http://localhost:5002';
const [mapLayer, setMapLayer] = useState('standard');

const [showAssign, setShowAssign] = useState(false);
const [selectedGeofence, setSelectedGeofence] = useState(null);

const [vehicles, setVehicles] = useState([]);
const [vehicleId, setVehicleId] = useState('');
const [expectedTime, setExpectedTime] = useState('');
const [graceMinutes, setGraceMinutes] = useState(10);

 
  /* ======================================================
     INIT MAP
  ====================================================== */
  useEffect(() => {
  if (!window.mappls || mapRef.current) return;

 const map = new window.mappls.Map('geofence-map', {
  center: [28.61, 77.2],
  zoom: 6,
  layers: mapLayer,
});


  mapRef.current = map;

  // SAFE event binding
  map.on('styleimagemissing', () => {});
}, []);

  /* ======================================================
     MAPPLS AUTOSUGGEST (v3)
  ====================================================== */
  useEffect(() => {
    if (
      !window.mappls ||
      !window.mappls.plugins ||
      !window.mappls.plugins.autosuggest ||
      !mapRef.current
    )
      return;

    const autoSuggest = window.mappls.plugins.autosuggest({
      input: 'searchBox',
      map: mapRef.current,
      region: 'IND',
      placeholder: 'Search company address',
      callback: (place) => {
        if (!place || !place.latitude || !place.longitude) return;

        const lat = Number(place.latitude);
        const lng = Number(place.longitude);

        setPoint({ lat, lng });
        setCompanyName(place.placeName || '');
if (mapRef.current) {
  mapRef.current.setCenter([lat, lng]);

// Autosuggest should NOT depend on radius
mapRef.current.setZoom(16);

}
      },
    });

    return () => autoSuggest?.clear?.();
  }, []);

  /* ======================================================
     LOAD EXISTING GEOFENCES
  ====================================================== */
  const loadCompanies = async () => {
    const res = await fetch(`${API_BASE}/api/companies`);
    if (!res.ok) return;
    const data = await res.json();
    setCompanies(data);
  };


  useEffect(() => {
    loadCompanies();
  }, []);


  const loadVehicles = async () => {
  const res = await fetch(`${API_BASE}/api/vehicles`);
  if (!res.ok) return;
  setVehicles(await res.json());
};
useEffect(() => {
  loadVehicles();
}, []);
const geofenceCirclesRef = useRef([]);

useEffect(() => {
  if (!mapRef.current || !window.mappls) return;

  // remove old circles
  geofenceCirclesRef.current.forEach(obj => {
  if (obj.circle) obj.circle.setMap(null);
});
  geofenceCirclesRef.current = [];

  companies.forEach((c) => {
    const m = c.center?.toString().match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!m) return;

    const lat = Number(m[2]);
    const lng = Number(m[1]);

    const circle = new window.mappls.Circle({
      map: mapRef.current,
      center: [lat, lng],
      radius: Number(c.radius_meters),
      strokeColor: '#2563eb',
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: '#2563eb',
      fillOpacity: 0.25,
    });

    // ✅ CLICK ON GEOFENCE → ZOOM
    window.mappls.Event.addListener(circle, 'click', () => {
  mapRef.current.setCenter([lat, lng]);
  mapRef.current.setZoom(zoomByRadius(c.radius_meters));
});

    geofenceCirclesRef.current.push({
      company_id: c.company_id,
      circle,
      lat,
      lng,
      radius: c.radius_meters,
    });
  });
}, [companies]);

  /* ======================================================
     CREATE / UPDATE GEOFENCE
  ====================================================== */
  const saveGeofence = async () => {
    if (!companyName || !point) {
      alert('Please select a location');
      return;
    }

    const payload = {
      company_name: companyName,
      center_lat: point.lat,
      center_lng: point.lng,
      radius_meters: radius,
    
    };

    const url = editingId
  ? `${API_BASE}/api/geofences/${editingId}`
  : `${API_BASE}/api/companies`;

    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert('Failed to save geofence');
      return;
    }

    // reset
    setCompanyName('');
    setRadius(500);
    setPoint(null);
    setEditingId(null);
    setShiftId('');
    setExpectedTime('');
    setShifts([]);
    document.getElementById('searchBox').value = '';

    loadCompanies();
  };

  /* ======================================================
     DELETE GEOFENCE
  ====================================================== */
  const deleteGeofence = async (id) => {
    if (!confirm('Delete this geofence?')) return;
    await fetch(`/api/geofences/${id}`, { method: 'DELETE' });
    loadCompanies();
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div className="flex h-screen bg-gray-50">
      {/* MAP */}
      <div className="flex-1">
        <div
  id="geofence-map"
  className="h-full w-full pointer-events-auto"
/>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[520px] border-l bg-white p-6 overflow-y-auto relative z-50">
        <h1 className="text-lg font-semibold mb-6">Geofence Management</h1>

        {/* FORM */}
        <div className="border rounded-lg p-5 mb-6">
          <h2 className="font-semibold mb-4">
            {editingId ? '✏️ Edit Geofence' : '📍 Create Geofence'}
          </h2>

          <div className="space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Geofence Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            {/* LATITUDE / LONGITUDE */}
<div className="grid grid-cols-2 gap-3">
  <input
    type="number"
    step="any"
    className="border rounded px-3 py-2"
    placeholder="Latitude"
    value={point?.lat ?? ''}
    onChange={(e) =>
      setPoint({
        lat: Number(e.target.value),
        lng: point?.lng ?? 0,
      })
    }
  />

  <input
    type="number"
    step="any"
    className="border rounded px-3 py-2"
    placeholder="Longitude"
    value={point?.lng ?? ''}
    onChange={(e) =>
      setPoint({
        lat: point?.lat ?? 0,
        lng: Number(e.target.value),
      })
    }
  />
</div>

{/* SHOW ON MAP */}
<button
  onClick={() => {
    if (!point?.lat || !point?.lng) {
      alert('Enter latitude and longitude');
      return;
    }
    mapRef.current.setCenter([point.lat, point.lng]);
    mapRef.current.setZoom(16);
  }}
  className="w-full bg-gray-100 border py-2 rounded text-sm"
>
  🗺️ Show on Map
</button>

{/* RADIUS */}
<input
  type="number"
  className="w-full border rounded px-3 py-2"
  placeholder="Radius (meters)"
  value={radius}
  onChange={(e) => setRadius(+e.target.value)}
/>


            
          
            

            <button
              onClick={saveGeofence}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {editingId ? 'Update Geofence' : 'Create Geofence'}
            </button>
          </div>
        </div>

        {/* LIST */}
        <h2 className="font-semibold mb-3">Geofences</h2>

        {companies.map((c) => {
          const m = c.center
            ?.toString()
            .match(/POINT\(([-\d.]+) ([-\d.]+)\)/);

          return (
            <div
              key={c.company_id}
              className="border rounded-lg p-4 mb-3 bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{c.company_name}</div>
                  {m && (
                    <div className="text-sm text-gray-600">
                      {m[2]}, {m[1]}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Radius: {c.radius_meters}m
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingId(c.company_id);
                      setCompanyName(c.company_name);
                      setRadius(c.radius_meters);

                      if (m) {
                        const lat = Number(m[2]);
                        const lng = Number(m[1]);
                        setPoint({ lat, lng });
                     mapRef.current.setCenter([lat, lng]);
                     mapRef.current.setZoom(zoomByRadius(c.radius_meters));

                      }

                      
                    }}
                    className="text-blue-600"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteGeofence(c.company_id)}
                    className="text-red-600"
                  >
                    🗑️
                  </button>
                  <button
  onClick={() => {
    setSelectedGeofence(c);
    setShowAssign(true);
  }}
  className="text-green-600"
>
  ➕
</button>
<button
  onClick={() => {
    const next = mapLayer === 'standard' ? 'satellite' : 'standard';
    setMapLayer(next);

    mapRef.current.setStyle(
      next === 'satellite'
        ? 'mappls://styles/mappls/satellite'
        : 'mappls://styles/mappls/standard'
    );
  }}
  className="px-3 py-1 border rounded text-sm"
>
  🛰️ {mapLayer === 'standard' ? 'Satellite' : 'Standard'}
</button>


                </div>
              </div>
            </div>
          );
        })}
      </div>
{showAssign && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[420px] rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">
        Assign Vehicle to Geofence
      </h2>

      <div className="space-y-4">
        {/* VEHICLE */}
        <select
          className="w-full border rounded px-3 py-2"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Select Vehicle</option>
          {vehicles.map((v) => (
            <option key={v.vehicle_id} value={v.vehicle_id}>
              {v.vehicle_number}
            </option>
          ))}
        </select>

        {/* EXPECTED TIME */}
        <input
          type="time"
          className="w-full border rounded px-3 py-2"
          value={expectedTime}
          onChange={(e) => setExpectedTime(e.target.value)}
        />

        {/* GRACE */}
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          placeholder="Grace minutes"
          value={graceMinutes}
          onChange={(e) => setGraceMinutes(+e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowAssign(false)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              if (!vehicleId || !expectedTime) {
                alert('Select vehicle & time');
                return;
              }

              await fetch(`${API_BASE}/api/geofence-assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  geofence_id: selectedGeofence.company_id
,
                  vehicle_id: vehicleId,
                  expected_entry_time: expectedTime,
                  grace_minutes: graceMinutes,
                }),
              });

              setShowAssign(false);
              setVehicleId('');
              setExpectedTime('');
              setGraceMinutes(10);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

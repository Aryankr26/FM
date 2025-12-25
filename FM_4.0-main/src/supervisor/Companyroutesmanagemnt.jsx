import React, { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Clock, Car, Building, Activity } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";
const API_BASE_URL = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

export function Companyroutesmanagemnt() {
  // State
  const [routes, setRoutes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    company_id: "",
    route_name: "",
    start_time: "",
    end_time: "",
    stops: [],
    vehicles: [],
  });

  // Stop form state
  const [stopForm, setStopForm] = useState({
    stop_name: "",
    lat: "",
    lng: "",
    radius: 150,
    expected_time: "",
  });

  // Vehicle search
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [showVehicleList, setShowVehicleList] = useState(false);

  /* =====================================
     FETCH DATA
  ===================================== */
  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/company-routes`);
      if (!res.ok) throw new Error("Failed to fetch routes");
      const data = await res.json();
      setRoutes(data);
    } catch (error) {
      console.error("Fetch routes error:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/company-routes/companies`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Fetch companies error:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/company-routes/vehicles`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error("Fetch vehicles error:", error);
    }
  };

  const fetchActivityLog = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/company-routes/${routeId}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity log");
      const data = await res.json();
      setActivityLog(data);
      setShowActivityLog(true);
    } catch (error) {
      console.error("Fetch activity log error:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchCompanies();
    fetchVehicles();
  }, []);

  /* =====================================
     FORM HANDLERS
  ===================================== */
  const resetForm = () => {
    setFormData({
      company_id: "",
      route_name: "",
      start_time: "",
      end_time: "",
      stops: [],
      vehicles: [],
    });
    setEditingRoute(null);
    setShowForm(false);
  };

  const handleEdit = (route) => {
    setFormData({
      company_id: route.company_id,
      route_name: route.route_name,
      start_time: route.start_time || "",
      end_time: route.end_time || "",
      stops: route.stops || [],
      vehicles: route.vehicles || [],
    });
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleDelete = async (routeId, routeName) => {
    if (!confirm(`Delete route "${routeName}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/company-routes/${routeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changed_by: "supervisor-id" }),
      });

      if (!res.ok) throw new Error("Failed to delete route");

      fetchRoutes();
    } catch (error) {
      alert("Failed to delete route: " + error.message);
    }
  };

  /* =====================================
     STOP MANAGEMENT
  ===================================== */
  const addStop = () => {
    if (!stopForm.stop_name || !stopForm.lat || !stopForm.lng) {
      alert("Please fill stop name, latitude, and longitude");
      return;
    }

    const newStop = {
      stop_name: stopForm.stop_name,
      lat: parseFloat(stopForm.lat),
      lng: parseFloat(stopForm.lng),
      radius: parseInt(stopForm.radius),
      expected_time: stopForm.expected_time,
    };

    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }));

    setStopForm({
      stop_name: "",
      lat: "",
      lng: "",
      radius: 150,
      expected_time: "",
    });
  };

  const removeStop = (index) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  /* =====================================
     VEHICLE MANAGEMENT
  ===================================== */
  const addVehicle = (vehicle) => {
    if (formData.vehicles.find(v => v.vehicle_id === vehicle.vehicle_id)) {
      alert("Vehicle already added to route");
      return;
    }

    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        vehicle_id: vehicle.vehicle_id,
        vehicle_number: vehicle.vehicle_number
      }]
    }));

    setVehicleSearch("");
    setShowVehicleList(false);
  };

  const removeVehicle = (vehicleId) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.vehicle_id !== vehicleId)
    }));
  };

  /* =====================================
     SUBMIT FORM
  ===================================== */
  const handleSubmit = async () => {
    if (!formData.company_id || !formData.route_name || formData.stops.length === 0) {
      alert("Please fill company, route name, and add at least one stop");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        created_by: "supervisor-id",
      };

      const url = editingRoute
        ? `${API_BASE_URL}/company-routes/${editingRoute.route_id}`
        : `${API_BASE_URL}/company-routes`;

      const method = editingRoute ? "PUT" : "POST";

      if (editingRoute) {
        payload.changed_by = "supervisor-id";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save route");

      resetForm();
      fetchRoutes();
    } catch (error) {
      alert("Failed to save route: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT CARD - ROUTE LIST */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                🗺️ Company Routes ({routes.length})
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                New Route
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {routes.map((route) => (
                  <div key={route.route_id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{route.route_name}</h3>
                        <p className="text-sm text-gray-600">
                          {route.stops?.length || 0} stops • {route.vehicles?.length || 0} vehicles
                        </p>
                        {route.start_time && route.end_time && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={14} />
                            {route.start_time} - {route.end_time}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchActivityLog(route.route_id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Activity Log"
                        >
                          <Activity size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(route)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Route"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(route.route_id, route.route_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Route"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="mb-2">
                        <strong>Stops:</strong>
                        {route.stops?.map((stop, idx) => (
                          <span key={idx} className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {stop.stop_name}
                          </span>
                        ))}
                      </div>
                      <div>
                        <strong>Vehicles:</strong>
                        {route.vehicles?.map((vehicle, idx) => (
                          <span key={idx} className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {vehicle.vehicle_number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {routes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No routes created yet. Click "New Route" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT CARD - FORM */}
          {(showForm || showActivityLog) && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {showActivityLog ? "📋 Activity Log" : editingRoute ? "✏️ Edit Route" : "➕ Create Route"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setShowActivityLog(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {showActivityLog ? (
                  <div className="space-y-3">
                    {activityLog.map((log) => (
                      <div key={log.log_id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="text-sm font-medium text-gray-800">{log.activity_type}</p>
                        <p className="text-sm text-gray-600">{log.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {activityLog.length === 0 && (
                      <p className="text-gray-500 text-center">No activity recorded</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* BASIC INFO */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <select
                          value={formData.company_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Company</option>
                          {companies.map((company) => (
                            <option key={company.company_id} value={company.company_id}>
                              {company.company_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Route Name *
                        </label>
                        <input
                          type="text"
                          value={formData.route_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Morning Route to Tech Park"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* STOPS */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin size={20} />
                        Route Stops ({formData.stops.length})
                      </h3>

                      {/* Add Stop Form */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Stop Name"
                            value={stopForm.stop_name}
                            onChange={(e) => setStopForm(prev => ({ ...prev, stop_name: e.target.value }))}
                            className="border border-gray-300 rounded p-2"
                          />
                          <input
                            type="time"
                            placeholder="Expected Time"
                            value={stopForm.expected_time}
                            onChange={(e) => setStopForm(prev => ({ ...prev, expected_time: e.target.value }))}
                            className="border border-gray-300 rounded p-2"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Latitude"
                            value={stopForm.lat}
                            onChange={(e) => setStopForm(prev => ({ ...prev, lat: e.target.value }))}
                            className="border border-gray-300 rounded p-2"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Longitude"
                            value={stopForm.lng}
                            onChange={(e) => setStopForm(prev => ({ ...prev, lng: e.target.value }))}
                            className="border border-gray-300 rounded p-2"
                          />
                          <input
                            type="number"
                            placeholder="Radius (m)"
                            value={stopForm.radius}
                            onChange={(e) => setStopForm(prev => ({ ...prev, radius: e.target.value }))}
                            className="border border-gray-300 rounded p-2"
                          />
                        </div>
                        <button
                          onClick={addStop}
                          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                        >
                          Add Stop
                        </button>
                      </div>

                      {/* Stops List */}
                      <div className="space-y-2">
                        {formData.stops.map((stop, index) => (
                          <div key={index} className="flex justify-between items-center bg-blue-50 p-3 rounded">
                            <div>
                              <span className="font-medium">{stop.stop_name}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({stop.lat}, {stop.lng}) • {stop.radius}m • {stop.expected_time}
                              </span>
                            </div>
                            <button
                              onClick={() => removeStop(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* VEHICLES */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                        <Car size={20} />
                        Assigned Vehicles ({formData.vehicles.length})
                      </h3>

                      {/* Vehicle Search */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search vehicle number..."
                          value={vehicleSearch}
                          onChange={(e) => {
                            setVehicleSearch(e.target.value);
                            setShowVehicleList(true);
                          }}
                          onFocus={() => setShowVehicleList(true)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        />
                        {showVehicleList && (
                          <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {vehicles
                              .filter(v =>
                                !vehicleSearch ||
                                v.vehicle_number?.toLowerCase().includes(vehicleSearch.toLowerCase())
                              )
                              .map((vehicle) => (
                                <div
                                  key={vehicle.vehicle_id}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => addVehicle(vehicle)}
                                >
                                  {vehicle.vehicle_number}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Vehicles List */}
                      <div className="space-y-2">
                        {formData.vehicles.map((vehicle) => (
                          <div key={vehicle.vehicle_id} className="flex justify-between items-center bg-green-50 p-3 rounded">
                            <span className="font-medium">{vehicle.vehicle_number}</span>
                            <button
                              onClick={() => removeVehicle(vehicle.vehicle_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="border-t pt-6">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : editingRoute ? "Update Route" : "Create Route"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
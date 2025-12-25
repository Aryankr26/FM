import { useEffect, useState } from 'react';
import {
  Truck,
  CheckCircle,
} from 'lucide-react';

import api from '../services/api.js';

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOwnerDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPI
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={Truck}
        />

        <KPI
          title="On-Time Arrivals"
          value={stats.onTimeArrivals}
          icon={CheckCircle}
          success
        />
      </div>

      {/* INFO SECTION */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <h3 className="font-semibold mb-2">
          Operational Summary
        </h3>
        <p className="text-sm text-slate-500">
          This dashboard shows live operational performance based on
          actual vehicle GPS and geofence events.
        </p>
      </div>
    </div>
  );
}

/* =========================
   KPI CARD
========================= */
function KPI({ title, value, icon: Icon, success }) {
  return (
    <div
      className={`p-5 rounded-2xl border ${
        success
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {value}
          </p>
        </div>

        <div
          className={`h-12 w-12 flex items-center justify-center rounded-xl ${
            success
              ? 'bg-emerald-200 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

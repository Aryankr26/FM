/**
 * RiskInsights Component
 * Owner portal for risk analysis, anomaly detection, and predictive insights
 */
export function RiskInsights() {
  return (
    <div className="p-8">
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Risk Insights</h1>
        <p className="text-gray-600 mb-6">Analyze fleet risks, fuel theft detection, and predictive analytics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Cards */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">High Risk Vehicles</p>
            <p className="text-3xl font-bold text-red-600">2</p>
            <p className="text-xs text-gray-500 mt-2">Require attention</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Fuel Theft Probability</p>
            <p className="text-3xl font-bold text-orange-600">15%</p>
            <p className="text-xs text-gray-500 mt-2">Fleet average</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Geofence Violations</p>
            <p className="text-3xl font-bold text-purple-600">8</p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </div>
        </div>

        {/* Risk Analysis Details */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900 mb-1">🔴 Vehicle: UP32BN9021</p>
              <p className="text-sm text-red-800">Unusual fuel consumption pattern detected. Loss of ~25L in 2 hours of idle time.</p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-yellow-900 mb-1">🟡 Vehicle: MP04CE7712</p>
              <p className="text-sm text-yellow-800">Speeding incidents detected. Average speed 15 km/h above limit on Route C.</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900 mb-1">🔵 Vehicle: MH12RK5521</p>
              <p className="text-sm text-blue-800">Route deviation detected. Vehicle spent 1.5 hours in restricted geofence.</p>
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Predictive Insights</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Maintenance Alert:</strong> HR55AN2175 requires scheduled maintenance in 5 days</p>
            <p><strong>Fuel Projection:</strong> Fleet will consume ~2,100 liters next month based on current patterns</p>
            <p><strong>Driver Performance:</strong> 2 drivers flagged for aggressive driving behavior</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskInsights;

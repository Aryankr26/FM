/**
 * Penalties Component
 * Owner portal for SLA violations, complaints, and penalties management
 */
export function Penalties() {
  return (
    <div className="p-8">
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Penalties & Complaints</h1>
        <p className="text-gray-600 mb-6">Track SLA violations, complaints, and penalties</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Summary Cards */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Resolved</p>
            <p className="text-3xl font-bold text-emerald-600">10</p>
            <p className="text-xs text-gray-500 mt-2">83% resolution rate</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Penalties</p>
            <p className="text-3xl font-bold text-red-600">₹15,000</p>
            <p className="text-xs text-gray-500 mt-2">Outstanding</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">2</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>
        </div>

        {/* Complaints Details */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Complaints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold">Issue</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Penalty</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">CMP-001</td>
                  <td className="py-3 px-4">HR55AN2175</td>
                  <td className="py-3 px-4">Delay by 30 mins</td>
                  <td className="py-3 px-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Resolved</span></td>
                  <td className="py-3 px-4">₹5,000</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">CMP-002</td>
                  <td className="py-3 px-4">HR47E2573</td>
                  <td className="py-3 px-4">Route deviation</td>
                  <td className="py-3 px-4"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Pending</span></td>
                  <td className="py-3 px-4">₹8,000</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">CMP-003</td>
                  <td className="py-3 px-4">UP32BN9021</td>
                  <td className="py-3 px-4">Rash driving</td>
                  <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">In Review</span></td>
                  <td className="py-3 px-4">₹2,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Penalties;

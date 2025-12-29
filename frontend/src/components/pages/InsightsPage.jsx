import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';
import { Search, X, MapPin, Gauge, Fuel, User, Wrench, FileText, DollarSign, Truck, Clock, Navigation2, Activity, Edit, Trash2, Map } from 'lucide-react';
import { vehiclesApi } from '../../services/api';
export function InsightsPage({ onNavigate }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showServiceBook, setShowServiceBook] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setVehiclesLoading(true);

        vehiclesApi
            .getAll()
            .then((res) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                if (cancelled)
                    return;

                const mapped = rows.map((v) => {
                    const number = v.registrationNo || v.imei;
                    const speed = typeof v.lastSpeed === 'number' ? v.lastSpeed : 0;
                    const lastSeen = v.lastSeen ? new Date(v.lastSeen) : null;
                    const ageMinutes = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 60000) : null;
                    const ignition = v.lastIgnition === true;
                    const isOffline = ageMinutes != null ? ageMinutes > 30 : true;
                    const status = isOffline ? 'stopped' : speed > 5 ? 'moving' : ignition ? 'idling' : 'stopped';
                    const statusText = status === 'moving' ? 'Active' : status === 'idling' ? 'Idle' : 'Stopped';
                    const lastUpdated =
                        ageMinutes == null
                            ? 'N/A'
                            : ageMinutes < 1
                                ? 'just now'
                                : ageMinutes < 60
                                    ? `${ageMinutes} mins ago`
                                    : `${Math.floor(ageMinutes / 60)} hrs ago`;

                    return {
                        id: String(v.id),
                        number,
                        manufacturer: v.make || 'unknown',
                        status,
                        statusText,
                        speed,
                        position: { top: '50%', left: '50%' },
                        rotation: 0,
                        address: 'N/A',
                        lastUpdated,
                        todayTrips: 0,
                        todayDistance: '0 km',
                        totalKm: `${Math.round(v.gpsOdometer || 0)} km`,
                        driverName: 'N/A',
                        driverMobile: 'N/A',
                        serviceDue: 'N/A',
                        cngPressure: 'N/A',
                        vehicleModel: v.model || 'N/A',
                        fuelLevel: 'N/A',
                        odometer: 'N/A',
                        engineStatus: ignition ? 'Running' : 'Stopped',
                        temperature: 'N/A',
                        batteryVoltage: 'N/A',
                        latitude: v.lastLat != null ? String(v.lastLat) : 'N/A',
                        longitude: v.lastLng != null ? String(v.lastLng) : 'N/A',
                        insurance: { status: 'unknown', expiryDate: 'N/A', daysRemaining: 0 },
                        pollution: { status: 'unknown', expiryDate: 'N/A', daysRemaining: 0 },
                        fitness: { status: 'unknown', expiryDate: 'N/A', daysRemaining: 0 },
                        tax: { status: 'unknown', nextDueDate: 'N/A', amount: 'N/A' },
                        dieselExpense: { today: 'N/A', thisMonth: 'N/A' },
                        tyreExpense: { lastReplacement: 'N/A', cost: 'N/A' },
                        avgSpeed: 'N/A',
                        maxSpeed: 'N/A',
                        totalRunningTime: 'N/A',
                        idleTime: 'N/A'
                    };
                });

                setVehicles(mapped);
            })
            .catch(() => {
                if (cancelled)
                    return;
                setVehicles([]);
            })
            .finally(() => {
                if (cancelled)
                    return;
                setVehiclesLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);
    // Fuel Consumption Data
    const fuelConsumptionData = [];
    // ServiceBook Data
    const serviceBookData = [];
    // Service Records Data
    const serviceRecords = [];
    // Distance Traveled Data
    const distanceTraveledData = [];
    // Cost Analysis Data
    const costAnalysisData = [];
    // Driver Performance Data
    const driverPerformanceData = [];
    const handleSearch = () => {
        const vehicle = vehicles.find(v => v.number.toUpperCase() === searchQuery.toUpperCase());
        if (vehicle) {
            setSelectedVehicle(vehicle);
            setShowPopup(true);
        }
        else {
            toast.error('Vehicle not found. Please check the vehicle number.');
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'moving':
                return '#27AE60';
            case 'stopped':
                return '#E53935';
            case 'idling':
                return '#F2B233';
            default:
                return '#67727E';
        }
    };
    const getComplianceColor = (status) => {
        if (status === 'valid' || status === 'paid')
            return '#27AE60';
        if (status === 'expiring')
            return '#F2B233';
        return '#E53935';
    };
    return (<div className="w-full h-full overflow-y-auto bg-[#F5F7FA] p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[#2A3547] mb-2">Fleet Insights & Analytics</h1>
          <p className="text-[#67727E]">Comprehensive performance metrics and data visualization</p>
        </div>

        {/* Search Section */}
        <Card className="p-6 border border-[#E1E6EF] bg-white">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input type="text" placeholder="Enter vehicle number (e.g., HR55AN2175)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full px-4 py-3 pr-12 border border-[#E1E6EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1] transition-all" style={{
            fontFamily: 'Inter',
            fontSize: '15px',
            color: '#2A3547'
        }}/>
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#67727E] cursor-pointer hover:text-[#0D47A1] transition-colors" size={20} onClick={handleSearch}/>
            </div>
            <button onClick={handleSearch} className="px-6 py-3 bg-[#0D47A1] text-white rounded-lg hover:bg-[#0D47A1]/90 transition-colors flex items-center gap-2" style={{
            fontFamily: 'Inter',
            fontSize: '15px',
            fontWeight: 600
        }}>
              <Search size={18}/>
              Search Vehicle
            </button>
          </div>
        </Card>

        {/* Charts Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuel Consumption Chart */}
          <Card className="p-6 border border-[#E1E6EF] bg-white">
            <h3 className="text-[#2A3547] mb-1" style={{ fontWeight: 600, fontSize: '18px' }}>
              Fuel Consumption & Cost
            </h3>
            <p className="text-[#67727E] text-sm mb-6">Monthly fuel usage and expenses</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fuelConsumptionData}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0D47A1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E6EF"/>
                <XAxis dataKey="month" stroke="#67727E" style={{ fontSize: '12px' }}/>
                <YAxis stroke="#67727E" style={{ fontSize: '12px' }}/>
                <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E1E6EF',
            borderRadius: '8px',
            fontSize: '12px'
        }}/>
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                <Area type="monotone" dataKey="consumption" stroke="#0D47A1" fillOpacity={1} fill="url(#colorConsumption)" name="Consumption (L)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* ServiceBook Chart */}
          <Card className="p-6 border border-[#E1E6EF] bg-white relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[#2A3547]" style={{ fontWeight: 600, fontSize: '18px' }}>
                ServiceBook
              </h3>
              <button onClick={() => setShowServiceBook(true)} className="px-4 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#27AE60]/90 transition-colors flex items-center gap-2" style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: 600
        }}>
                <Wrench size={16}/>
                Service Book
              </button>
            </div>
            <p className="text-[#67727E] text-sm mb-6">Vehicle service status overview</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceBookData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {serviceBookData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E1E6EF',
            borderRadius: '8px',
            fontSize: '12px'
        }}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Grid - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distance Traveled Chart */}
          <Card className="p-6 border border-[#E1E6EF] bg-white">
            <h3 className="text-[#2A3547] mb-1" style={{ fontWeight: 600, fontSize: '18px' }}>
              Distance Traveled
            </h3>
            <p className="text-[#67727E] text-sm mb-6">Total kilometers covered per month</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={distanceTraveledData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E6EF"/>
                <XAxis dataKey="month" stroke="#67727E" style={{ fontSize: '12px' }}/>
                <YAxis stroke="#67727E" style={{ fontSize: '12px' }}/>
                <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E1E6EF',
            borderRadius: '8px',
            fontSize: '12px'
        }}/>
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                <Line type="monotone" dataKey="distance" stroke="#8E24AA" strokeWidth={3} name="Distance (km)" dot={{ fill: '#8E24AA', r: 5 }} activeDot={{ r: 7 }}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Cost Analysis Chart */}
          <Card className="p-6 border border-[#E1E6EF] bg-white">
            <h3 className="text-[#2A3547] mb-1" style={{ fontWeight: 600, fontSize: '18px' }}>
              Cost Breakdown Analysis
            </h3>
            <p className="text-[#67727E] text-sm mb-6">Monthly operational expenses by category</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costAnalysisData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E6EF"/>
                <XAxis type="number" stroke="#67727E" style={{ fontSize: '12px' }}/>
                <YAxis type="category" dataKey="category" stroke="#67727E" style={{ fontSize: '12px' }}/>
                <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E1E6EF',
            borderRadius: '8px',
            fontSize: '12px'
        }} formatter={(value) => `₹${(value / 1000).toFixed(0)}K`}/>
                <Bar dataKey="amount" fill="#F2B233" name="Amount (₹)" radius={[0, 8, 8, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Grid - Row 3 */}
        <div className="grid grid-cols-1 gap-6">
          {/* Driver Performance Chart */}
          <Card className="p-6 border border-[#E1E6EF] bg-white">
            <h3 className="text-[#2A3547] mb-1" style={{ fontWeight: 600, fontSize: '18px' }}>
              Driver Performance Metrics
            </h3>
            <p className="text-[#67727E] text-sm mb-6">Weekly safety and efficiency scores</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={driverPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E6EF"/>
                <XAxis dataKey="week" stroke="#67727E" style={{ fontSize: '12px' }}/>
                <YAxis stroke="#67727E" style={{ fontSize: '12px' }}/>
                <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E1E6EF',
            borderRadius: '8px',
            fontSize: '12px'
        }}/>
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                <Line type="monotone" dataKey="safety" stroke="#27AE60" strokeWidth={2} name="Safety Score" dot={{ fill: '#27AE60', r: 4 }}/>
                <Line type="monotone" dataKey="efficiency" stroke="#0D47A1" strokeWidth={2} name="Efficiency Score" dot={{ fill: '#0D47A1', r: 4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Vehicle Details Popup */}
      {showPopup && selectedVehicle && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D47A1] to-[#1976D2] p-6 text-white relative">
              <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24}/>
              </button>
              {onNavigate && (<button onClick={() => {
                    setShowPopup(false);
                    onNavigate('dashboard', selectedVehicle.id);
                }} className="absolute top-4 right-16 px-4 py-2 bg-[#27AE60] hover:bg-[#27AE60]/90 rounded-lg transition-colors flex items-center gap-2" style={{
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                  <Map size={18}/>
                  See On Map
                </button>)}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Truck size={32}/>
                </div>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Inter' }}>
                    {selectedVehicle.number}
                  </h2>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>
                    Complete Vehicle Information & Telematics
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Status Bar */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={18} style={{ color: getStatusColor(selectedVehicle.status) }}/>
                    <span className="text-[#67727E] text-sm">Status</span>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: getStatusColor(selectedVehicle.status) }}>
                    {selectedVehicle.statusText}
                  </p>
                </div>
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={18} className="text-[#0D47A1]"/>
                    <span className="text-[#67727E] text-sm">Speed</span>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#2A3547' }}>
                    {selectedVehicle.speed} km/h
                  </p>
                </div>
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel size={18} className="text-[#27AE60]"/>
                    <span className="text-[#67727E] text-sm">Fuel Level</span>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#2A3547' }}>
                    {selectedVehicle.fuelLevel}
                  </p>
                </div>
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-[#F2B233]"/>
                    <span className="text-[#67727E] text-sm">Last Update</span>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#2A3547' }}>
                    {selectedVehicle.lastUpdated}
                  </p>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Vehicle Information */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <Truck size={18} className="text-[#0D47A1]"/>
                      Vehicle Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Vehicle Model</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.vehicleModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Manufacturer</span>
                        <span className="text-[#2A3547] font-medium uppercase">{selectedVehicle.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Odometer</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.odometer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Total Distance</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.totalKm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Engine Status</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.engineStatus}</span>
                      </div>
                    </div>
                  </Card>

                  {/* GPS & Location */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <MapPin size={18} className="text-[#E53935]"/>
                      GPS & Location
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Current Address</span>
                      </div>
                      <p className="text-[#2A3547] font-medium text-sm">{selectedVehicle.address}</p>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Latitude</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.latitude}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Longitude</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.longitude}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Driver Details */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <User size={18} className="text-[#8E24AA]"/>
                      Driver Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Driver Name</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.driverName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Contact</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.driverMobile}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Telematics Data */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <Gauge size={18} className="text-[#F2B233]"/>
                      Telematics Data
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Engine Temperature</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.temperature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Battery Voltage</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.batteryVoltage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">CNG Pressure</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.cngPressure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Avg Speed</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.avgSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Max Speed</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.maxSpeed}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Today's Activity */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <Navigation2 size={18} className="text-[#27AE60]"/>
                      Today&apos;s Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Trips Completed</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.todayTrips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Distance Covered</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.todayDistance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Running Time</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.totalRunningTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Idle Time</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.idleTime}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Fuel & Expenses */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <DollarSign size={18} className="text-[#27AE60]"/>
                      Fuel & Expenses
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Today&apos;s Fuel Cost</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.dieselExpense.today}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">This Month</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.dieselExpense.thisMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Last Tyre Change</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.tyreExpense.lastReplacement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Tyre Cost</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.tyreExpense.cost}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Compliance & Documents */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <FileText size={18} className="text-[#0D47A1]"/>
                      Compliance & Documents
                    </h3>
                    <div className="space-y-4">
                      {/* Insurance */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#67727E] text-sm">Insurance</span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                backgroundColor: getComplianceColor(selectedVehicle.insurance.status) + '20',
                color: getComplianceColor(selectedVehicle.insurance.status)
            }}>
                            {selectedVehicle.insurance.status}
                          </span>
                        </div>
                        <p className="text-[#2A3547] text-sm">Expiry: {selectedVehicle.insurance.expiryDate}</p>
                        <p className="text-[#67727E] text-xs">{selectedVehicle.insurance.daysRemaining} days remaining</p>
                      </div>

                      {/* Pollution */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#67727E] text-sm">Pollution (PUC)</span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                backgroundColor: getComplianceColor(selectedVehicle.pollution.status) + '20',
                color: getComplianceColor(selectedVehicle.pollution.status)
            }}>
                            {selectedVehicle.pollution.status}
                          </span>
                        </div>
                        <p className="text-[#2A3547] text-sm">Expiry: {selectedVehicle.pollution.expiryDate}</p>
                        <p className="text-[#67727E] text-xs">{selectedVehicle.pollution.daysRemaining} days remaining</p>
                      </div>

                      {/* Fitness */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#67727E] text-sm">Fitness Certificate</span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                backgroundColor: getComplianceColor(selectedVehicle.fitness.status) + '20',
                color: getComplianceColor(selectedVehicle.fitness.status)
            }}>
                            {selectedVehicle.fitness.status}
                          </span>
                        </div>
                        <p className="text-[#2A3547] text-sm">Expiry: {selectedVehicle.fitness.expiryDate}</p>
                        <p className="text-[#67727E] text-xs">{selectedVehicle.fitness.daysRemaining} days remaining</p>
                      </div>

                      {/* Tax */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#67727E] text-sm">Road Tax</span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                backgroundColor: getComplianceColor(selectedVehicle.tax.status) + '20',
                color: getComplianceColor(selectedVehicle.tax.status)
            }}>
                            {selectedVehicle.tax.status}
                          </span>
                        </div>
                        <p className="text-[#2A3547] text-sm">Next Due: {selectedVehicle.tax.nextDueDate}</p>
                        <p className="text-[#67727E] text-xs">Amount: {selectedVehicle.tax.amount}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Maintenance */}
                  <Card className="p-5 border border-[#E1E6EF]">
                    <h3 className="text-[#2A3547] mb-4 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      <Wrench size={18} className="text-[#E53935]"/>
                      Maintenance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#67727E] text-sm">Next Service Due</span>
                        <span className="text-[#2A3547] font-medium">{selectedVehicle.serviceDue}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* Service Book Popup */}
      {showServiceBook && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setShowServiceBook(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] p-6 text-white relative">
              <button onClick={() => setShowServiceBook(false)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24}/>
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Wrench size={32}/>
                </div>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Inter' }}>
                    Service Book
                  </h2>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>
                    Complete vehicle service records and maintenance history
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Service Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E1E6EF]">
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">S.No</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Reg. No</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Make</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Mileage</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Service Type</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Booking Date</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Kms Run</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Workshop Name</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Contact</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">SR Number</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-[#2A3547] text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRecords.map((record, index) => (<tr key={record.id} className="border-b border-[#E1E6EF] hover:bg-[#F9FBFF] transition-colors">
                        <td className="px-4 py-4 text-[#2A3547] text-sm">{index + 1}</td>
                        <td className="px-4 py-4 text-[#2A3547] text-sm font-medium">{record.vehicleNumber}</td>
                        <td className="px-4 py-4 text-[#2A3547] text-sm uppercase">{record.manufacturer}</td>
                        <td className="px-4 py-4 text-[#2A3547] text-sm">{record.mileage}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className="px-2 py-1 bg-[#0D47A1]/10 text-[#0D47A1] rounded-md text-xs">
                            {record.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#67727E] text-sm">{record.bookingDate}</td>
                        <td className="px-4 py-4 text-[#67727E] text-sm">{record.kmsRun}</td>
                        <td className="px-4 py-4 text-[#2A3547] text-sm max-w-xs truncate">{record.workshopName}</td>
                        <td className="px-4 py-4 text-[#67727E] text-sm">{record.workshopContact}</td>
                        <td className="px-4 py-4 text-[#2A3547] text-sm font-mono text-xs">{record.srNumber}</td>
                        <td className="px-4 py-4 text-[#67727E] text-sm">{record.workshopEmail}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-[#0D47A1]/10 rounded-lg transition-colors" title="Edit">
                              <Edit size={16} className="text-[#0D47A1]"/>
                            </button>
                            <button className="p-2 hover:bg-[#E53935]/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={16} className="text-[#E53935]"/>
                            </button>
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}

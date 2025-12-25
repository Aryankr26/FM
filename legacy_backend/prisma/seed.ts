/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Set this to false to skip seeding (useful for production with empty database)
const ENABLE_SEED = process.env.ENABLE_SEED !== 'false';

async function main() {
  if (!ENABLE_SEED) {
    console.log('⏭️  Seeding is disabled (ENABLE_SEED=false). Skipping...');
    console.log('ℹ️  The system will work with an empty database.');
    console.log('ℹ️  You can create users via the registration API.');
    return;
  }

  console.log('🌱 Starting database seed...');
  console.log('ℹ️  To skip seeding, set ENABLE_SEED=false environment variable.');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🗑️  Clearing existing data...');
    await prisma.geofenceAlert.deleteMany();
    await prisma.geofence.deleteMany();
    await prisma.tyre.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.fuelEvent.deleteMany();
    await prisma.telemetry.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fleet.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'owner',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create supervisor user
  const supervisorPassword = await bcrypt.hash('super123', 10);
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@fleet.com',
      password: supervisorPassword,
      name: 'Supervisor User',
      role: 'supervisor',
    },
  });
  console.log(`✓ Supervisor user created: ${supervisor.email}`);

  // Create demo fleet (10 vehicles)
  console.log('🚚 Creating demo fleet...');
  const vehicles = [];
  
  const vehicleData = [
    { reg: 'HR-55-AN-2175', imei: '864512345678901', make: 'Tata', model: 'Ultra', year: 2020 },
    { reg: 'HR-55-AN-2176', imei: '864512345678902', make: 'Ashok Leyland', model: 'Dost', year: 2021 },
    { reg: 'HR-55-AN-2177', imei: '864512345678903', make: 'Mahindra', model: 'Bolero', year: 2019 },
    { reg: 'DL-01-AB-1234', imei: '864512345678904', make: 'Tata', model: 'Ace', year: 2020 },
    { reg: 'DL-01-AB-1235', imei: '864512345678905', make: 'Mahindra', model: 'Pickup', year: 2021 },
    { reg: 'MH-02-CD-5678', imei: '864512345678906', make: 'Eicher', model: 'Pro 3015', year: 2022 },
    { reg: 'MH-02-CD-5679', imei: '864512345678907', make: 'Tata', model: 'LPT 1918', year: 2020 },
    { reg: 'KA-03-EF-9012', imei: '864512345678908', make: 'Ashok Leyland', model: 'Partner', year: 2021 },
    { reg: 'KA-03-EF-9013', imei: '864512345678909', make: 'Mahindra', model: 'Blazo', year: 2022 },
    { reg: 'TN-01-GH-3456', imei: '864512345678910', make: 'Tata', model: 'Signa', year: 2023 },
  ];

  for (const vData of vehicleData) {
    const vehicle = await prisma.vehicle.create({
      data: {
        imei: vData.imei,
        registrationNo: vData.reg,
        make: vData.make,
        model: vData.model,
        year: vData.year,
        fuelCapacity: 200,
        ownerId: admin.id,
        status: 'active',
        gpsOdometer: Math.floor(Math.random() * 50000) + 10000,
        dashOdometer: Math.floor(Math.random() * 50000) + 10000,
      },
    });
    vehicles.push(vehicle);
    console.log(`  ✓ Vehicle created: ${vehicle.registrationNo} (${vehicle.imei})`);
  }

  // Create sample geofences
  console.log('📍 Creating sample geofences...');
  
  const geofences = [
    {
      name: 'Main Office',
      description: 'Company headquarters',
      type: 'circle',
      centerLat: 28.6139,
      centerLng: 77.2090,
      radius: 500,
      active: true,
    },
    {
      name: 'Warehouse District',
      description: 'Storage and distribution center',
      type: 'circle',
      centerLat: 28.5355,
      centerLng: 77.3910,
      radius: 1000,
      active: true,
    },
    {
      name: 'Restricted Zone',
      description: 'No entry area',
      type: 'polygon',
      polygon: [
        [28.7041, 77.1025],
        [28.7041, 77.2025],
        [28.6041, 77.2025],
        [28.6041, 77.1025],
        [28.7041, 77.1025],
      ],
      active: true,
    },
  ];

  for (const gData of geofences) {
    const geofence = await prisma.geofence.create({
      data: gData,
    });
    console.log(`  ✓ Geofence created: ${geofence.name}`);
  }

  console.log('✅ Database seeding completed!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Owner: admin@fleet.com / admin123');
  console.log('   Supervisor: supervisor@fleet.com / super123');
  console.log(`\n🚚 Created ${vehicles.length} vehicles`);
  console.log(`📍 Created ${geofences.length} geofences`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

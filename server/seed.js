/**
 * Seed Script — Seeds initial admin, student, and collector accounts + sample data
 * Run: node seed.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Reward = require('./models/Reward');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Reward.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Create Users ──────────────────────────────────────────────
    const admin = await User.create({
      name: 'Dr. Priya Singh',
      email: 'admin@campus.edu',
      password: '112233',
      role: 'admin',
      dept: 'Administration'
    });

    const student = await User.create({
      name: 'Alex Johnson',
      email: 'alex.johnson@campus.edu',
      password: '112233',
      role: 'student',
      dept: 'Computer Science',
      rewardPoints: 120
    });

    const collector = await User.create({
      name: 'Ravi Kumar',
      email: 'ravi.kumar@campus.edu',
      password: '112233',
      role: 'collector',
      dept: 'Waste Management'
    });

    console.log('👥 Created users:');
    console.log(`   Admin:     ${admin.email} / 112233`);
    console.log(`   Student:   ${student.email} / 112233`);
    console.log(`   Collector: ${collector.email} / 112233`);

    // ── Create Complaints ─────────────────────────────────────────
    const complaint1 = await Complaint.create({
      complaintId: 'WMS-0001',
      reporter: student._id,
      location: 'Block A - Ground Floor',
      wasteType: 'Mixed Waste',
      description: 'Large pile of garbage near the entrance. Needs immediate attention.',
      status: 'completed',
      type: 'complaint'
    });

    const complaint2 = await Complaint.create({
      complaintId: 'WMS-0002',
      reporter: student._id,
      location: 'Cafeteria East Wing',
      wasteType: 'Food Waste',
      description: 'Overflow of food waste from cafeteria bins.',
      status: 'in-progress',
      assignedCollector: collector._id,
      type: 'complaint'
    });

    const complaint3 = await Complaint.create({
      complaintId: 'WMS-0003',
      reporter: student._id,
      location: 'Library 2nd Floor',
      wasteType: 'Paper Waste',
      description: 'Scattered paper waste near the photocopier station.',
      status: 'pending',
      type: 'complaint'
    });

    console.log('📋 Created 3 sample complaints');

    // ── Create Rewards ────────────────────────────────────────────
    await Reward.create([
      { student: student._id, activity: 'Waste Photo Complaint', points: 50, givenBy: admin._id },
      { student: student._id, activity: 'Dustbin Full Alert (Scan)', points: 30, givenBy: admin._id },
      { student: student._id, activity: 'Waste Photo Complaint', points: 40, givenBy: admin._id }
    ]);

    console.log('🏆 Created 3 sample rewards');
    console.log('\n✨ Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Student:   alex.johnson@campus.edu / 112233');
    console.log('   Collector: ravi.kumar@campus.edu / 112233');
    console.log('   Admin:     admin@campus.edu / 112233');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();

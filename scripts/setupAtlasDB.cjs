/**
 * MongoDB Atlas Database Initialization Script
 * 
 * Usage:
 *   node scripts/setupAtlasDB.js "mongodb+sandbox_uri_here"
 *   OR set environment variable: MONGODB_URI="your_mongodb_atlas_connection_string"
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.argv[2] || 'mongodb+srv://admin:admin1234@cluster0.example.mongodb.net/cstd_bitsathy?retryWrites=true&w=majority';

async function setupAtlas() {
  console.log('Connecting to MongoDB Atlas Database...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');

    const db = client.db(); // Uses default database from URI or 'cstd_bitsathy'

    // List of required collections (folders)
    const collectionsToCreate = [
      'users',
      'courses',
      'attendances',
      'announcements',
      'timetables',
      'notifications',
      'changerequests',
      'results',
    ];

    const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

    for (const collName of collectionsToCreate) {
      if (!existingCollections.includes(collName)) {
        await db.createCollection(collName);
        console.log(`[CREATED COLLECTION]: ${collName}`);
      } else {
        console.log(`[EXISTS]: ${collName}`);
      }
    }

    // Creating Indexes
    console.log('\nCreating Database Indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });

    await db.collection('courses').createIndex({ code: 1 });
    await db.collection('courses').createIndex({ teacherId: 1 });

    await db.collection('attendances').createIndex({ studentId: 1, date: 1 });
    await db.collection('attendances').createIndex({ courseId: 1 });

    await db.collection('announcements').createIndex({ priority: 1, date: -1 });

    await db.collection('timetables').createIndex({ day: 1 });

    await db.collection('notifications').createIndex({ roleTarget: 1, timestamp: -1 });

    await db.collection('changerequests').createIndex({ status: 1 });

    await db.collection('results').createIndex({ studentId: 1 });
    await db.collection('results').createIndex({ rollNo: 1 });

    console.log('Indexes created successfully!');

    // Seeding default administrator account
    const usersColl = db.collection('users');
    const adminUser = await usersColl.findOne({ email: 'admin@bitsathy.ac.in' });
    if (!adminUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin@1234', 10);
      await usersColl.insertOne({
        username: 'admin',
        email: 'admin@bitsathy.ac.in',
        password: hashedPassword,
        name: 'Institutional Administrator',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        joinedDate: 'Jan 2018',
        department: 'Central Academic Administration',
        title: 'Chief Institutional Administrator',
        isBlocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('[SEEDED]: Initial Admin account (admin@bitsathy.ac.in)');
    }

    console.log('\nMongoDB Atlas Database Setup Complete!');
  } catch (err) {
    console.error('Error setting up MongoDB Atlas database:', err);
  } finally {
    await client.close();
  }
}

setupAtlas();

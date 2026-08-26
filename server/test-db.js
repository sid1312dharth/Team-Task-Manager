const db = require('./config/db');

async function testDatabase() {
  console.log('----------------------------------------------------');
  console.log('🔍 Testing Database Connection & Schema...');
  console.log('----------------------------------------------------');

  try {
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('❌ Could not establish database connection.');
      process.exit(1);
    }

    console.log(`📦 Database Mode: ${db.dbType.toUpperCase()}`);
    await db.initSchema();
    console.log('✅ Tables checked/initialized successfully!');

    // Test a basic query
    const res = await db.query('SELECT count(*) as count FROM users');
    const userCount = res.rows[0]?.count || 0;
    console.log(`👥 Total users in database: ${userCount}`);

    console.log('----------------------------------------------------');
    console.log('🎉 DATABASE TEST PASSED! Ready for use.');
    console.log('----------------------------------------------------');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Test Failed:', error.message);
    process.exit(1);
  }
}

testDatabase();


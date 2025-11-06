const { Pool } = require('pg');

// Test without SSL first
const testConfigs = [
  {
    name: 'With SSL (rejectUnauthorized: false)',
    config: {
      host: '51.158.210.40',
      port: 20044,
      database: 'timemanagement',
      user: 'postgres-shba',
      password: 'Shivam@2025#',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'Without SSL',
    config: {
      host: '51.158.210.40',
      port: 20044,
      database: 'timemanagement',
      user: 'postgres-shba',
      password: 'Shivam@2025#',
      ssl: false,
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'With require SSL',
    config: {
      host: '51.158.210.40',
      port: 20044,
      database: 'timemanagement',
      user: 'postgres-shba',
      password: 'Shivam@2025#',
      ssl: { rejectUnauthorized: false, sslmode: 'require' },
      connectionTimeoutMillis: 10000,
    }
  }
];

async function testAllConfigs() {
  for (const testConfig of testConfigs) {
    console.log(`\n🧪 Testing: ${testConfig.name}`);
    console.log('='.repeat(50));
    
    const pool = new Pool(testConfig.config);
    
    try {
      const client = await pool.connect();
      console.log('✅ Connection SUCCESSFUL!');
      
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Query SUCCESSFUL:', result.rows[0].current_time);
      
      client.release();
      await pool.end();
      
      console.log('🎉 This configuration WORKS!');
      break; // Stop testing once we find a working config
      
    } catch (error) {
      console.error('❌ Connection FAILED:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      await pool.end();
    }
  }
}

testAllConfigs();
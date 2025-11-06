const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up database tables for Time Management API...\n');
  
  // Create database connection
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'setup_api_database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual commands (simple split on semicolon + newline)
    const sqlCommands = sqlContent
      .split(/;\s*[\r\n]+/)
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--') && !cmd.trim().startsWith('\\echo'));

    console.log(`📝 Executing ${sqlCommands.length} SQL commands...\n`);

    // Execute each command
    let successCount = 0;
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i].trim();
      if (command) {
        try {
          await pool.query(command);
          successCount++;
          
          // Show progress for major operations
          if (command.includes('CREATE TABLE')) {
            const tableName = command.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
            console.log(`✅ Created table: ${tableName}`);
          } else if (command.includes('INSERT INTO')) {
            const tableName = command.match(/INSERT INTO (\w+)/i)?.[1];
            console.log(`📝 Inserted data into: ${tableName}`);
          }
        } catch (error) {
          console.error(`❌ Error executing command ${i + 1}:`, error.message);
          console.log(`Command: ${command.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n🎉 Database setup completed successfully!`);
    console.log(`✅ ${successCount}/${sqlCommands.length} commands executed successfully\n`);

    // Verify tables were created
    console.log('🔍 Verifying created tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'time_entries', 'leave_requests', 'projects', 'tasks')
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check test user
    const userResult = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', 
      ['jane.smith@company.com']);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`\n👤 Test user created: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
    }

    console.log('\n🚀 Your API is now ready to work with real database data!');
    console.log('You can now update your API routes to remove mock data and use actual database queries.');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);
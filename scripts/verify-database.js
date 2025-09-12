// Script to verify database connection and setup
const { Pool } = require('pg');

async function verifyDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('💡 Make sure to set DATABASE_URL in your Render environment variables');
    process.exit(1);
  }

  console.log('🔍 Checking database connection...');
  console.log(`📡 Database URL: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`); // Hide password

  const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Successfully connected to PostgreSQL!');
    console.log(`🕒 Server time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);

    // Check if tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('📋 No tables found - database is empty (this is normal for new setup)');
      console.log('🛠 Tables will be created automatically when the server starts');
    } else {
      console.log('📋 Existing tables found:');
      tablesResult.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    // Check row counts if tables exist
    const tableNames = ['potlucks', 'menu_items', 'guests', 'guest_dishes'];
    for (const tableName of tableNames) {
      try {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📊 ${tableName}: ${countResult.rows[0].count} rows`);
      } catch (err) {
        // Table doesn't exist yet - that's fine
      }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This looks like a hostname resolution issue.');
      console.log('💡 Make sure you\'re using the Internal Database URL from Render.');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed - check your username/password in DATABASE_URL.');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Database does not exist - check the database name in your URL.');
    }
    
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run verification
verifyDatabase().catch(console.error);
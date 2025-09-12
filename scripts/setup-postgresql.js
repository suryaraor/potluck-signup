const { Pool } = require('pg');

async function setupPostgreSQL() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to PostgreSQL...');
    
    // Test connection
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');

    // Create tables
    console.log('Creating tables...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS potlucks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT
      );
      
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        potluck_id INTEGER REFERENCES potlucks(id) ON DELETE CASCADE,
        dish TEXT
      );
      
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        potluck_id INTEGER REFERENCES potlucks(id) ON DELETE CASCADE,
        name TEXT,
        family_count INTEGER DEFAULT 1
      );
      
      CREATE TABLE IF NOT EXISTS guest_dishes (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
        dish_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        quantity INTEGER
      );
    `);
    
    console.log('✅ Tables created successfully');

    // Check table status
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error setting up PostgreSQL:', error);
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  setupPostgreSQL();
}

module.exports = setupPostgreSQL;
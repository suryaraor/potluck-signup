// Complete database setup and migration script
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('💡 Set DATABASE_URL to your PostgreSQL connection string');
    console.log('💡 Example: postgresql://user:password@host:port/database');
    process.exit(1);
  }

  console.log('🚀 Starting database setup...');
  
  // Connect to PostgreSQL
  const pgDb = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    console.log('🔍 Testing PostgreSQL connection...');
    await pgDb.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');

    // Create tables
    console.log('📋 Creating database tables...');
    await pgDb.query(`
      -- Create potlucks table
      CREATE TABLE IF NOT EXISTS potlucks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT
      );
      
      -- Create menu_items table
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        potluck_id INTEGER REFERENCES potlucks(id) ON DELETE CASCADE,
        dish TEXT
      );
      
      -- Create guests table  
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        potluck_id INTEGER REFERENCES potlucks(id) ON DELETE CASCADE,
        name TEXT,
        family_count INTEGER DEFAULT 1
      );
      
      -- Create guest_dishes table
      CREATE TABLE IF NOT EXISTS guest_dishes (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
        dish_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        quantity INTEGER
      );
    `);
    console.log('✅ Database tables created successfully');

    // Check for existing SQLite database to migrate
    const sqliteDbPath = path.join(__dirname, '..', 'backend', 'potluck.db');
    console.log(`🔍 Checking for SQLite database at: ${sqliteDbPath}`);
    
    try {
      const fs = require('fs');
      if (fs.existsSync(sqliteDbPath)) {
        console.log('📦 Found existing SQLite database - starting migration...');
        await migrateSQLiteData(pgDb, sqliteDbPath);
      } else {
        console.log('ℹ️ No existing SQLite database found - starting with empty database');
      }
    } catch (err) {
      console.log('ℹ️ SQLite migration skipped:', err.message);
    }

    // Display final status
    await showDatabaseStatus(pgDb);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pgDb.end();
  }
}

async function migrateSQLiteData(pgDb, sqliteDbPath) {
  return new Promise((resolve, reject) => {
    const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, async (err) => {
      if (err) {
        console.log('⚠️ Could not open SQLite database:', err.message);
        resolve(); // Continue without migration
        return;
      }

      try {
        console.log('📊 Reading data from SQLite...');
        
        // Migrate potlucks
        const potlucks = await new Promise((res, rej) => {
          sqliteDb.all('SELECT * FROM potlucks', [], (err, rows) => {
            if (err) rej(err);
            else res(rows || []);
          });
        });

        console.log(`📝 Found ${potlucks.length} potlucks to migrate`);
        for (const potluck of potlucks) {
          const result = await pgDb.query(
            'INSERT INTO potlucks (name, date) VALUES ($1, $2) RETURNING id',
            [potluck.name, potluck.date]
          );
          const newPotluckId = result.rows[0].id;
          
          // Migrate menu items for this potluck
          const menuItems = await new Promise((res, rej) => {
            sqliteDb.all('SELECT * FROM menu_items WHERE potluck_id = ?', [potluck.id], (err, rows) => {
              if (err) rej(err);
              else res(rows || []);
            });
          });

          for (const item of menuItems) {
            const menuResult = await pgDb.query(
              'INSERT INTO menu_items (potluck_id, dish) VALUES ($1, $2) RETURNING id',
              [newPotluckId, item.dish]
            );
            
            // Store mapping for guest_dishes migration
            item.newId = menuResult.rows[0].id;
          }

          // Migrate guests for this potluck
          const guests = await new Promise((res, rej) => {
            sqliteDb.all('SELECT * FROM guests WHERE potluck_id = ?', [potluck.id], (err, rows) => {
              if (err) rej(err);
              else res(rows || []);
            });
          });

          for (const guest of guests) {
            const guestResult = await pgDb.query(
              'INSERT INTO guests (potluck_id, name, family_count) VALUES ($1, $2, $3) RETURNING id',
              [newPotluckId, guest.name, guest.family_count || 1]
            );
            const newGuestId = guestResult.rows[0].id;

            // Migrate guest dishes
            const guestDishes = await new Promise((res, rej) => {
              sqliteDb.all('SELECT * FROM guest_dishes WHERE guest_id = ?', [guest.id], (err, rows) => {
                if (err) rej(err);
                else res(rows || []);
              });
            });

            for (const guestDish of guestDishes) {
              // Find the new menu item ID
              const menuItem = menuItems.find(m => m.id === guestDish.dish_id);
              if (menuItem && menuItem.newId) {
                await pgDb.query(
                  'INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES ($1, $2, $3)',
                  [newGuestId, menuItem.newId, guestDish.quantity]
                );
              }
            }
          }
        }

        console.log('✅ SQLite data migration completed successfully');
        sqliteDb.close();
        resolve();
        
      } catch (error) {
        console.error('❌ Error during migration:', error);
        sqliteDb.close();
        reject(error);
      }
    });
  });
}

async function showDatabaseStatus(pgDb) {
  console.log('\n📊 Database Status:');
  
  const tables = ['potlucks', 'menu_items', 'guests', 'guest_dishes'];
  for (const table of tables) {
    try {
      const result = await pgDb.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  📋 ${table}: ${result.rows[0].count} rows`);
    } catch (err) {
      console.log(`  ❌ ${table}: Error - ${err.message}`);
    }
  }
  
  console.log('\n🎉 Database setup complete!');
  console.log('💡 Your backend will now use PostgreSQL in production');
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setupDatabase;
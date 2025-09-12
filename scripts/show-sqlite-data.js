// Simple data migration script - reads SQLite and shows you the data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function showSQLiteData() {
  const sqliteDbPath = path.join(__dirname, '..', 'backend', 'potluck.db');
  
  console.log('🔍 Reading SQLite database...');
  console.log(`📁 Database path: ${sqliteDbPath}`);
  
  const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });

  try {
    // Get potlucks
    const potlucks = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM potlucks', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n📋 Found ${potlucks.length} potlucks:`);
    potlucks.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: "${p.name}", Date: ${p.date}`);
    });

    // Get menu items
    const menuItems = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM menu_items', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n🍽️ Found ${menuItems.length} menu items:`);
    menuItems.forEach(m => {
      console.log(`  - ID: ${m.id}, Potluck: ${m.potluck_id}, Dish: "${m.dish}"`);
    });

    // Get guests
    const guests = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM guests', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n👥 Found ${guests.length} guests:`);
    guests.forEach(g => {
      console.log(`  - ID: ${g.id}, Name: "${g.name}", Potluck: ${g.potluck_id}, Family: ${g.family_count}`);
    });

    // Get guest dishes
    const guestDishes = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM guest_dishes', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n🥘 Found ${guestDishes.length} guest dish assignments:`);
    guestDishes.forEach(gd => {
      console.log(`  - Guest: ${gd.guest_id}, Dish: ${gd.dish_id}, Quantity: ${gd.quantity}`);
    });

    console.log('\n💡 To migrate this data to PostgreSQL:');
    console.log('1. Use your app interface to recreate the potlucks and dishes');
    console.log('2. Or use the PostgreSQL VS Code extension to insert the data manually');
    console.log('3. Or wait for me to create a proper migration script');

  } catch (error) {
    console.error('❌ Error reading data:', error);
  } finally {
    db.close();
  }
}

showSQLiteData();
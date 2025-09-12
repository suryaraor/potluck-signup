const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database configuration - supports both SQLite (local) and PostgreSQL (production)
let db;
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL for production (Render)
  const { Pool } = require('pg');
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  console.log('Connected to PostgreSQL database.');
  
  // Initialize PostgreSQL tables
  const initPostgresql = async () => {
    try {
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
      console.log('PostgreSQL tables initialized.');
    } catch (err) {
      console.error('Error initializing PostgreSQL tables:', err);
    }
  };
  
  initPostgresql();
  
} else {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'potluck.db');
  console.log(`SQLite database path: ${dbPath}`);
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err);
      process.exit(1);
    } else {
      console.log('Connected to SQLite database.');
    }
  });
  
  // Initialize SQLite tables
  const initSql = `
    CREATE TABLE IF NOT EXISTS potlucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      potluck_id INTEGER,
      dish TEXT,
      FOREIGN KEY(potluck_id) REFERENCES potlucks(id)
    );
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      potluck_id INTEGER,
      name TEXT,
      family_count INTEGER DEFAULT 1,
      FOREIGN KEY(potluck_id) REFERENCES potlucks(id)
    );
    CREATE TABLE IF NOT EXISTS guest_dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER,
      dish_id INTEGER,
      quantity INTEGER,
      FOREIGN KEY(guest_id) REFERENCES guests(id),
      FOREIGN KEY(dish_id) REFERENCES menu_items(id)
    );
  `;
  
  db.exec(initSql, (err) => {
    if (err) {
      console.error('Error initializing SQLite tables:', err);
      process.exit(1);
    } else {
      console.log('SQLite tables initialized successfully.');
    }
  });
}

// Database helper functions
const queryDB = async (sql, params = []) => {
  if (isProduction && process.env.DATABASE_URL) {
    // PostgreSQL
    const result = await db.query(sql, params);
    return result.rows;
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ insertId: this.lastID, changes: this.changes });
        });
      }
    });
  }
};

// API routes
app.delete('/reset', async (req, res) => {
  try {
    if (isProduction && process.env.DATABASE_URL) {
      // PostgreSQL - delete in correct order due to foreign keys
      await db.query('DELETE FROM guest_dishes');
      await db.query('DELETE FROM guests');
      await db.query('DELETE FROM menu_items');
      await db.query('DELETE FROM potlucks');
      await db.query('ALTER SEQUENCE potlucks_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE menu_items_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE guests_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE guest_dishes_id_seq RESTART WITH 1');
    } else {
      // SQLite
      await queryDB('DELETE FROM guest_dishes');
      await queryDB('DELETE FROM guests');
      await queryDB('DELETE FROM menu_items');
      await queryDB('DELETE FROM potlucks');
    }
    res.json({ message: 'All data cleared' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

app.get('/potlucks', async (req, res) => {
  try {
    const potlucks = await queryDB('SELECT * FROM potlucks');
    res.json(potlucks);
  } catch (err) {
    console.error('Get potlucks error:', err);
    res.status(500).json({ error: 'Failed to get potlucks' });
  }
});

app.post('/potlucks', async (req, res) => {
  const { name, date, description, location, guestList, menuItems } = req.body;
  
  try {
    let potluckSql, potluckParams;
    
    if (isProduction && process.env.DATABASE_URL) {
      potluckSql = 'INSERT INTO potlucks (name, date) VALUES ($1, $2) RETURNING *';
      potluckParams = [name, date];
    } else {
      potluckSql = 'INSERT INTO potlucks (name, date) VALUES (?, ?)';
      potluckParams = [name, date];
    }
    
    const result = await queryDB(potluckSql, potluckParams);
    const potluckId = isProduction && process.env.DATABASE_URL ? result[0].id : result.insertId;
    
    // Add guests if provided
    if (guestList && Array.isArray(guestList)) {
      for (const guestName of guestList) {
        let guestSql, guestParams;
        if (isProduction && process.env.DATABASE_URL) {
          guestSql = 'INSERT INTO guests (potluck_id, name) VALUES ($1, $2)';
          guestParams = [potluckId, guestName];
        } else {
          guestSql = 'INSERT INTO guests (potluck_id, name) VALUES (?, ?)';
          guestParams = [potluckId, guestName];
        }
        await queryDB(guestSql, guestParams);
      }
    }
    
    // Add menu items if provided
    if (menuItems && Array.isArray(menuItems)) {
      for (const dish of menuItems) {
        let menuSql, menuParams;
        if (isProduction && process.env.DATABASE_URL) {
          menuSql = 'INSERT INTO menu_items (potluck_id, dish) VALUES ($1, $2)';
          menuParams = [potluckId, dish];
        } else {
          menuSql = 'INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)';
          menuParams = [potluckId, dish];
        }
        await queryDB(menuSql, menuParams);
      }
    }
    
    const response = isProduction && process.env.DATABASE_URL ? result[0] : { id: potluckId, name, date };
    res.json(response);
  } catch (err) {
    console.error('Create potluck error:', err);
    res.status(500).json({ error: 'Failed to create potluck' });
  }
});

app.get('/potlucks/:id/menu', async (req, res) => {
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'SELECT * FROM menu_items WHERE potluck_id = $1';
      params = [req.params.id];
    } else {
      sql = 'SELECT * FROM menu_items WHERE potluck_id = ?';
      params = [req.params.id];
    }
    
    const menu = await queryDB(sql, params);
    res.json(menu);
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

app.post('/potlucks/:id/menu', async (req, res) => {
  const { dish } = req.body;
  
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'INSERT INTO menu_items (potluck_id, dish) VALUES ($1, $2) RETURNING *';
      params = [req.params.id, dish];
    } else {
      sql = 'INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)';
      params = [req.params.id, dish];
    }
    
    const result = await queryDB(sql, params);
    res.json(result);
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.get('/potlucks/:id/guests', async (req, res) => {
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = `
        SELECT g.*, 
               COALESCE(array_agg(gd.dish_id) FILTER (WHERE gd.dish_id IS NOT NULL), '{}') as dish_ids,
               COALESCE(array_agg(m.dish) FILTER (WHERE m.dish IS NOT NULL), '{}') as dishes,
               COALESCE(array_agg(gd.quantity) FILTER (WHERE gd.quantity IS NOT NULL), '{}') as quantities
        FROM guests g
        LEFT JOIN guest_dishes gd ON g.id = gd.guest_id
        LEFT JOIN menu_items m ON gd.dish_id = m.id
        WHERE g.potluck_id = $1
        GROUP BY g.id, g.name, g.family_count, g.potluck_id
        ORDER BY g.name
      `;
      params = [req.params.id];
    } else {
      sql = `
        SELECT g.id, g.name, g.family_count, g.potluck_id,
               GROUP_CONCAT(gd.dish_id) as dish_ids,
               GROUP_CONCAT(m.dish) as dishes,
               GROUP_CONCAT(gd.quantity) as quantities
        FROM guests g
        LEFT JOIN guest_dishes gd ON g.id = gd.guest_id
        LEFT JOIN menu_items m ON gd.dish_id = m.id
        WHERE g.potluck_id = ?
        GROUP BY g.id
        ORDER BY g.name
      `;
      params = [req.params.id];
    }
    
    const guests = await queryDB(sql, params);
    
    // Format the response
    const formattedGuests = guests.map(guest => {
      if (isProduction && process.env.DATABASE_URL) {
        return {
          ...guest,
          dish_ids: guest.dish_ids.filter(id => id !== null),
          dishes: guest.dishes.filter(dish => dish !== null),
          quantities: guest.quantities.filter(qty => qty !== null)
        };
      } else {
        return {
          ...guest,
          dish_ids: guest.dish_ids ? guest.dish_ids.split(',').map(Number) : [],
          dishes: guest.dishes ? guest.dishes.split(',') : [],
          quantities: guest.quantities ? guest.quantities.split(',').map(Number) : []
        };
      }
    });
    
    res.json(formattedGuests);
  } catch (err) {
    console.error('Get guests error:', err);
    res.status(500).json({ error: 'Failed to get guests' });
  }
});

app.post('/potlucks/:id/guests', async (req, res) => {
  const { name, family_count = 1, dish_id, quantity = 1 } = req.body;
  
  try {
    // Check if guest already exists
    let checkSql, checkParams;
    if (isProduction && process.env.DATABASE_URL) {
      checkSql = 'SELECT * FROM guests WHERE potluck_id = $1 AND name = $2';
      checkParams = [req.params.id, name];
    } else {
      checkSql = 'SELECT * FROM guests WHERE potluck_id = ? AND name = ?';
      checkParams = [req.params.id, name];
    }
    
    let existingGuest = await queryDB(checkSql, checkParams);
    existingGuest = Array.isArray(existingGuest) ? existingGuest[0] : existingGuest;
    
    let guestId;
    
    if (!existingGuest) {
      // Create new guest
      let createSql, createParams;
      if (isProduction && process.env.DATABASE_URL) {
        createSql = 'INSERT INTO guests (potluck_id, name, family_count) VALUES ($1, $2, $3) RETURNING id';
        createParams = [req.params.id, name, family_count];
      } else {
        createSql = 'INSERT INTO guests (potluck_id, name, family_count) VALUES (?, ?, ?)';
        createParams = [req.params.id, name, family_count];
      }
      
      const result = await queryDB(createSql, createParams);
      guestId = isProduction && process.env.DATABASE_URL ? result[0].id : result.insertId;
    } else {
      guestId = existingGuest.id;
    }
    
    // Add dish selection if provided
    if (dish_id) {
      let dishSql, dishParams;
      if (isProduction && process.env.DATABASE_URL) {
        dishSql = 'INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES ($1, $2, $3)';
        dishParams = [guestId, dish_id, quantity];
      } else {
        dishSql = 'INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES (?, ?, ?)';
        dishParams = [guestId, dish_id, quantity];
      }
      
      await queryDB(dishSql, dishParams);
    }
    
    res.json({ id: guestId, name, family_count });
  } catch (err) {
    console.error('Add guest error:', err);
    res.status(500).json({ error: 'Failed to add guest' });
  }
});

app.delete('/potlucks/:potluckId/guests/:guestId', async (req, res) => {
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'DELETE FROM guests WHERE id = $1 AND potluck_id = $2';
      params = [req.params.guestId, req.params.potluckId];
    } else {
      sql = 'DELETE FROM guests WHERE id = ? AND potluck_id = ?';
      params = [req.params.guestId, req.params.potluckId];
    }
    
    await queryDB(sql, params);
    res.json({ message: 'Guest removed' });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});
app.delete('/potlucks/:potluckId/guests/by-name/:guestName', async (req, res) => {
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'DELETE FROM guests WHERE name = $1 AND potluck_id = $2';
      params = [req.params.guestName, req.params.potluckId];
    } else {
      sql = 'DELETE FROM guests WHERE name = ? AND potluck_id = ?';
      params = [req.params.guestName, req.params.potluckId];
    }
    
    await queryDB(sql, params);
    res.json({ message: 'Guest removed' });
  } catch (err) {
    console.error('Delete guest by name error:', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

app.post('/potlucks/:potluckId/guests/:guestId/dishes', async (req, res) => {
  const { dish_id, quantity = 1 } = req.body;
  
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES ($1, $2, $3)';
      params = [req.params.guestId, dish_id, quantity];
    } else {
      sql = 'INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES (?, ?, ?)';
      params = [req.params.guestId, dish_id, quantity];
    }
    
    await queryDB(sql, params);
    res.json({ message: 'Dish added to guest' });
  } catch (err) {
    console.error('Add guest dish error:', err);
    res.status(500).json({ error: 'Failed to add dish to guest' });
  }
});

app.delete('/potlucks/:potluckId/guests/:guestId/dishes/:dishId', async (req, res) => {
  try {
    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'DELETE FROM guest_dishes WHERE guest_id = $1 AND dish_id = $2';
      params = [req.params.guestId, req.params.dishId];
    } else {
      sql = 'DELETE FROM guest_dishes WHERE guest_id = ? AND dish_id = ?';
      params = [req.params.guestId, req.params.dishId];
    }
    
    await queryDB(sql, params);
    res.json({ message: 'Dish removed from guest' });
  } catch (err) {
    console.error('Remove guest dish error:', err);
    res.status(500).json({ error: 'Failed to remove dish from guest' });
  }
});

app.post('/potlucks/:id/menu/with-user', async (req, res) => {
  const { dish, guestName } = req.body;
  
  try {
    // Add menu item
    let menuSql, menuParams;
    if (isProduction && process.env.DATABASE_URL) {
      menuSql = 'INSERT INTO menu_items (potluck_id, dish) VALUES ($1, $2) RETURNING *';
      menuParams = [req.params.id, dish];
    } else {
      menuSql = 'INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)';
      menuParams = [req.params.id, dish];
    }
    
    const menuResult = await queryDB(menuSql, menuParams);
    const dishId = isProduction && process.env.DATABASE_URL ? menuResult[0].id : menuResult.insertId;
    
    // Add guest if provided
    if (guestName) {
      const guestResponse = await fetch(`http://localhost:${PORT}/potlucks/${req.params.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, dish_id: dishId })
      });
    }
    
    res.json(menuResult);
  } catch (err) {
    console.error('Add menu with user error:', err);
    res.status(500).json({ error: 'Failed to add menu item with user' });
  }
});

// Update family count for a guest
app.put('/potlucks/:potluckId/guests/family-count/:guestName', async (req, res) => {
  const guestName = decodeURIComponent(req.params.guestName);
  const { family_count } = req.body;
  
  try {
    if (family_count < 1) {
      return res.status(400).json({ error: 'Family count must be at least 1' });
    }

    let sql, params;
    if (isProduction && process.env.DATABASE_URL) {
      sql = 'UPDATE guests SET family_count = $1 WHERE name = $2 AND potluck_id = $3';
      params = [family_count, guestName, req.params.potluckId];
    } else {
      sql = 'UPDATE guests SET family_count = ? WHERE name = ? AND potluck_id = ?';
      params = [family_count, guestName, req.params.potluckId];
    }
    
    await queryDB(sql, params);
    res.json({ success: true, message: 'Family count updated' });
  } catch (err) {
    console.error('Update family count error:', err);
    res.status(500).json({ error: 'Failed to update family count' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: isProduction && process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${isProduction && process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

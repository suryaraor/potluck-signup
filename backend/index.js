const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./potluck.db', (err) => {
  if (err) throw err;
  console.log('Connected to SQLite database.');
});

// Create tables if not exist
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
db.exec(initSql);

// API routes
app.delete('/reset', (req, res) => {
  const sql = `
    DELETE FROM guests;
    DELETE FROM menu_items;
    DELETE FROM potlucks;
  `;
  db.exec(sql, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All data cleared' });
  });
});

app.get('/potlucks', (req, res) => {
  db.all('SELECT * FROM potlucks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/potlucks', (req, res) => {
  const { name, date, guestList, menuItems } = req.body;
  
  db.run('INSERT INTO potlucks (name, date) VALUES (?, ?)', [name, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const potluckId = this.lastID;
    const response = { id: potluckId, name, date };
    
    // Add menu items if provided
    if (menuItems && menuItems.length > 0) {
      const menuStmt = db.prepare('INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)');
      menuItems.forEach(dish => {
        menuStmt.run(potluckId, dish.trim());
      });
      menuStmt.finalize();
    }
    
    // Add guests if provided
    if (guestList && guestList.length > 0) {
      const guestStmt = db.prepare('INSERT INTO guests (potluck_id, name, family_count) VALUES (?, ?, ?)');
      guestList.forEach(guestName => {
        guestStmt.run(potluckId, guestName.trim(), 1);
      });
      guestStmt.finalize();
    }
    
    res.json(response);
  });
});

app.get('/potlucks/:id/menu', (req, res) => {
  db.all('SELECT * FROM menu_items WHERE potluck_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/potlucks/:id/menu', (req, res) => {
  const { dish } = req.body;
  db.run('INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)', [req.params.id, dish], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, dish });
  });
});

app.get('/potlucks/:id/guests', (req, res) => {
  const sql = `
    SELECT 
      g.id, g.name, g.family_count,
      GROUP_CONCAT(mi.dish || '(' || gd.quantity || ')') as dishes,
      GROUP_CONCAT(gd.dish_id) as dish_ids,
      GROUP_CONCAT(gd.quantity) as quantities
    FROM guests g 
    LEFT JOIN guest_dishes gd ON g.id = gd.guest_id 
    LEFT JOIN menu_items mi ON gd.dish_id = mi.id 
    WHERE g.potluck_id = ? 
    GROUP BY g.id, g.name, g.family_count
  `;
  
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Transform the data to match frontend expectations
    const guests = rows.map(row => ({
      id: row.id,
      name: row.name,
      family_count: row.family_count,
      dishes: row.dishes ? row.dishes.split(',') : [],
      dish_ids: row.dish_ids ? row.dish_ids.split(',').map(id => parseInt(id)) : [],
      quantities: row.quantities ? row.quantities.split(',').map(q => parseInt(q)) : []
    }));
    
    res.json(guests);
  });
});

app.post('/potlucks/:id/guests', (req, res) => {
  const { name, dish_id, quantity } = req.body;
  
  // First, check if guest already exists
  db.get('SELECT id FROM guests WHERE potluck_id = ? AND name = ?', [req.params.id, name], (err, guest) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (guest) {
      // Guest exists, add dish assignment if provided
      if (dish_id) {
        db.run('INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES (?, ?, ?)', 
               [guest.id, dish_id, quantity || 1], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: guest.id, name, dish_id, quantity: quantity || 1 });
        });
      } else {
        res.json({ id: guest.id, name, message: 'Guest already exists' });
      }
    } else {
      // New guest, create guest first
      db.run('INSERT INTO guests (potluck_id, name, family_count) VALUES (?, ?, ?)', 
             [req.params.id, name, 1], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const guestId = this.lastID;
        
        // Add dish assignment if provided
        if (dish_id) {
          db.run('INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES (?, ?, ?)', 
                 [guestId, dish_id, quantity || 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: guestId, name, dish_id, quantity: quantity || 1, family_count: 1 });
          });
        } else {
          res.json({ id: guestId, name, family_count: 1 });
        }
      });
    }
  });
});

// Remove a guest completely
app.delete('/potlucks/:potluckId/guests/:guestId', (req, res) => {
  // First remove all dish assignments
  db.run('DELETE FROM guest_dishes WHERE guest_id = ?', [req.params.guestId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Then remove the guest
    db.run('DELETE FROM guests WHERE id = ? AND potluck_id = ?', [req.params.guestId, req.params.potluckId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Guest removed completely' });
    });
  });
});

// Remove all selections for a guest by name
app.delete('/potlucks/:potluckId/guests/by-name/:guestName', (req, res) => {
  const guestName = decodeURIComponent(req.params.guestName);
  
  // Get guest ID first
  db.get('SELECT id FROM guests WHERE name = ? AND potluck_id = ?', [guestName, req.params.potluckId], (err, guest) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    
    // Remove all dish assignments
    db.run('DELETE FROM guest_dishes WHERE guest_id = ?', [guest.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Remove the guest
      db.run('DELETE FROM guests WHERE id = ?', [guest.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Guest removed completely' });
      });
    });
  });
});

// Add dish assignment for a guest
app.post('/potlucks/:potluckId/guests/:guestId/dishes', (req, res) => {
  const { dish_id, quantity } = req.body;
  
  db.run('INSERT INTO guest_dishes (guest_id, dish_id, quantity) VALUES (?, ?, ?)', 
         [req.params.guestId, dish_id, quantity || 1], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, assignment_id: this.lastID });
  });
});

// Remove a specific dish assignment
app.delete('/potlucks/:potluckId/guests/:guestId/dishes/:dishId', (req, res) => {
  db.run('DELETE FROM guest_dishes WHERE guest_id = ? AND dish_id = ?', 
         [req.params.guestId, req.params.dishId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Dish assignment removed' });
  });
});

// Update family count for a guest
app.put('/potlucks/:potluckId/guests/family-count/:guestName', (req, res) => {
  const guestName = decodeURIComponent(req.params.guestName);
  const { family_count } = req.body;
  
  if (family_count < 1) {
    return res.status(400).json({ error: 'Family count must be at least 1' });
  }
  
  db.run('UPDATE guests SET family_count = ? WHERE name = ? AND potluck_id = ?', [family_count, guestName, req.params.potluckId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Family count updated' });
  });
});

// Add new dish and automatically assign to user
app.post('/potlucks/:id/menu/with-user', (req, res) => {
  const { dish, userName } = req.body;
  
  // First, add the dish to menu
  db.run('INSERT INTO menu_items (potluck_id, dish) VALUES (?, ?)', [req.params.id, dish], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const dishId = this.lastID;
    
    // Then, automatically assign this dish to the user
    db.run('INSERT INTO guests (potluck_id, name, dish_id, quantity, family_count) VALUES (?, ?, ?, ?, ?)', [req.params.id, userName, dishId, 1, 1], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        dish: { id: dishId, dish: dish },
        guest: { id: this.lastID, name: userName, dish_id: dishId, quantity: 1, family_count: 1 }
      });
    });
  });
});

// Reset endpoint to delete all data
app.delete('/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM guests');
    db.run('DELETE FROM menu_items');
    db.run('DELETE FROM potlucks', function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'All data deleted' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

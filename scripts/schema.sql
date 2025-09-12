-- PostgreSQL Database Schema for Potluck Signup App
-- Run this manually in your PostgreSQL database if needed

-- Drop existing tables if they exist (be careful with this in production!)
-- DROP TABLE IF EXISTS guest_dishes CASCADE;
-- DROP TABLE IF EXISTS guests CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS potlucks CASCADE;

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

-- Create guest_dishes table (junction table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS guest_dishes (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    dish_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_potluck_id ON menu_items(potluck_id);
CREATE INDEX IF NOT EXISTS idx_guests_potluck_id ON guests(potluck_id);
CREATE INDEX IF NOT EXISTS idx_guest_dishes_guest_id ON guest_dishes(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_dishes_dish_id ON guest_dishes(dish_id);

-- Insert sample data (optional)
-- INSERT INTO potlucks (name, date) VALUES ('Sample Potluck', '2025-01-01');
-- INSERT INTO menu_items (potluck_id, dish) VALUES (1, 'Green Bean Casserole');
-- INSERT INTO menu_items (potluck_id, dish) VALUES (1, 'Mashed Potatoes');
-- INSERT INTO guests (potluck_id, name, family_count) VALUES (1, 'John Doe', 2);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
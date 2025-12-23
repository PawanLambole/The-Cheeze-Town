-- Insert 10 menu items for The Cheeze Town
INSERT INTO menu_items (name, category, price, status, image_url) VALUES
  ('Margherita Pizza', 'pizza', 299.00, 'approved', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
  ('Four Cheese Pizza', 'pizza', 399.00, 'approved', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
  ('Cheese Garlic Bread', 'appetizer', 149.00, 'approved', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400'),
  ('Mozzarella Sticks', 'appetizer', 199.00, 'approved', 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400'),
  ('Mac and Cheese', 'main', 249.00, 'approved', 'https://images.unsplash.com/photo-1543826173-1beebfeb9c8e?w=400'),
  ('Cheese Quesadilla', 'main', 229.00, 'approved', 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400'),
  ('Cheese Platter', 'appetizer', 349.00, 'approved', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400'),
  ('Cheesecake', 'dessert', 179.00, 'approved', 'https://images.unsplash.com/photo-1533134242820-b2c8d9f78ea5?w=400'),
  ('Cheese Fondue', 'main', 449.00, 'approved', 'https://images.unsplash.com/photo-1629998270959-09c92dd0c8fd?w=400'),
  ('Parmesan Fries', 'sides', 129.00, 'approved', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400')
ON CONFLICT DO NOTHING;

insert into public.places (id, name, location, cuisine, added_by)
values
  ('11111111-1111-4111-8111-111111111111', 'Taco Corner', 'Main Street', 'Mexican', 'Vinsx'),
  ('22222222-2222-4222-8222-222222222222', 'Noodle House', 'Market Avenue', 'Asian', 'Friend')
on conflict (id) do nothing;

insert into public.reviews (place_id, food_name, rating, comment, reviewer_name)
values
  ('11111111-1111-4111-8111-111111111111', 'Carne Asada Taco', 5, 'Great flavor and fresh toppings.', 'Vinsx'),
  ('11111111-1111-4111-8111-111111111111', 'Chicken Taco', 4, 'Good spice level and soft tortillas.', 'Friend'),
  ('22222222-2222-4222-8222-222222222222', 'Beef Ramen', 5, 'Rich broth and perfect noodles.', 'Friend')
on conflict do nothing;

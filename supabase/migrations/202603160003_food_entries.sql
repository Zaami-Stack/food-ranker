create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  food_name text not null check (char_length(trim(food_name)) between 2 and 80),
  source_place text not null check (char_length(trim(source_place)) between 2 and 120),
  image_url text check (image_url is null or char_length(image_url) <= 2048),
  saad_rating smallint not null check (saad_rating between 1 and 5),
  anas_rating smallint not null check (anas_rating between 1 and 5),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists food_entries_created_at_idx on public.food_entries (created_at desc);

alter table public.food_entries enable row level security;

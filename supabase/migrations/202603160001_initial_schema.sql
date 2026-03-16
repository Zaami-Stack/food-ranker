create extension if not exists pgcrypto;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  location text not null check (char_length(trim(location)) between 2 and 120),
  cuisine text check (cuisine is null or char_length(trim(cuisine)) between 2 and 50),
  added_by text not null check (char_length(trim(added_by)) between 2 and 40),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists places_name_location_unique_idx on public.places (lower(name), lower(location));
create index if not exists places_created_at_idx on public.places (created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  food_name text not null check (char_length(trim(food_name)) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(trim(comment)) <= 280),
  reviewer_name text not null check (char_length(trim(reviewer_name)) between 2 and 40),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists reviews_place_id_idx on public.reviews (place_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

create or replace view public.place_rankings as
select
  p.id,
  p.name,
  p.location,
  p.cuisine,
  p.added_by,
  p.created_at,
  count(r.id)::int as review_count,
  round(avg(r.rating)::numeric, 2) as average_rating
from public.places p
left join public.reviews r on r.place_id = p.id
group by p.id;

alter table public.places enable row level security;
alter table public.reviews enable row level security;

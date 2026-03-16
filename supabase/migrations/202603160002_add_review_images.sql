alter table public.reviews
add column if not exists image_url text;

do $$
begin
  alter table public.reviews
  add constraint reviews_image_url_length_chk
  check (image_url is null or char_length(image_url) <= 2048);
exception
  when duplicate_object then null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-photos',
  'food-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  create policy "Public can read food photos"
  on storage.objects
  for select
  using (bucket_id = 'food-photos');
exception
  when duplicate_object then null;
end;
$$;

-- =============================================================
-- CampusConnect UCC — Migration 002
-- Keep posts.likes_count in sync via triggers on post_likes
-- =============================================================

create or replace function public.handle_post_like_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set likes_count = greatest(0, likes_count - 1)
    where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger on_post_like_insert
  after insert on public.post_likes
  for each row execute procedure public.handle_post_like_change();

create trigger on_post_like_delete
  after delete on public.post_likes
  for each row execute procedure public.handle_post_like_change();

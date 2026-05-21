create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_push_subs_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "Users manage their own subscriptions select" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Users manage their own subscriptions insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users manage their own subscriptions delete" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);
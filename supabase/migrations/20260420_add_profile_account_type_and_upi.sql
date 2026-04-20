alter table public.profiles
add column if not exists account_type text
check (account_type in ('creator', 'supporter'));

alter table public.profiles
add column if not exists upi_id text;

update public.profiles
set account_type = 'supporter'
where account_type is null;

-- Roomie Receipts v2: secure the database without adding logins.
--
-- Model: "the link is the key". Anyone with a receipt's link (its UUID) can
-- view and edit that one receipt, like a shared Google Doc link.
-- Nobody can list, read or change other receipts.
--
-- How: the app no longer touches the tables directly. It calls three
-- functions that only work on the receipt ID you pass in. Then RLS is turned
-- on with no policies, so direct table access is blocked for the public key.
--
-- Run in Supabase > SQL Editor, in two steps:
--   STEP 1 now (old site keeps working),
--   then push the new code,
--   then STEP 2.


-- ===================== STEP 0: missing columns =====================
-- v1's code wrote to these columns, but total_amount never existed, and v1
-- ignored the error, so totals were silently never saved.
alter table public.receipts     add column if not exists total_amount numeric(10, 2);
alter table public.participants add column if not exists amount_owed  numeric(10, 2);


-- ===================== STEP 1: functions =====================

-- Create a receipt and its participants in one go. Returns the new receipt ID.
create or replace function public.create_receipt(
  p_title    public.receipts.title%type,
  p_category public.receipts.category%type,
  p_date     public.receipts.receipt_date%type,
  p_names    text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_names is null or array_length(p_names, 1) is null then
    raise exception 'At least one participant is required';
  end if;

  insert into receipts (title, category, receipt_date)
  values (p_title, p_category, p_date)
  returning id into new_id;

  insert into participants (receipt_id, name)
  select new_id, trim(n)
  from unnest(p_names) as n
  where trim(n) <> '';

  return new_id;
end;
$$;


-- Fetch ONE receipt (and its participants) by ID.
create or replace function public.get_receipt(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'receipt', (select to_json(r) from receipts r where r.id = p_id),
    'participants', coalesce(
      (select json_agg(p) from participants p where p.receipt_id = p_id),
      '[]'::json
    )
  );
$$;


-- Save the total and each person's share for ONE receipt.
-- p_amounts looks like: [{"id": "<participant id>", "amount": 3.34}, ...]
-- The server re-checks that the shares add up to the total.
create or replace function public.save_split(
  p_id      uuid,
  p_total   numeric,
  p_amounts jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  shares_sum numeric;
begin
  if not exists (select 1 from receipts where id = p_id) then
    raise exception 'Receipt not found';
  end if;

  if p_total is null or p_total <= 0 then
    raise exception 'Total must be greater than 0';
  end if;

  select coalesce(sum((a->>'amount')::numeric), 0)
  into shares_sum
  from jsonb_array_elements(p_amounts) a;

  if round(shares_sum, 2) <> round(p_total, 2) then
    raise exception 'Shares (%) do not add up to the total (%)', shares_sum, p_total;
  end if;

  update receipts set total_amount = p_total where id = p_id;

  -- Only participants that belong to THIS receipt can be updated
  update participants p
  set amount_owed = (a->>'amount')::numeric
  from jsonb_array_elements(p_amounts) a
  where p.receipt_id = p_id
    and p.id::text = a->>'id';
end;
$$;

grant execute on function public.create_receipt to anon, authenticated;
grant execute on function public.get_receipt   to anon, authenticated;
grant execute on function public.save_split    to anon, authenticated;


-- ===================== STEP 2: lock the tables =====================
-- Run this only AFTER the new code is live.
-- RLS on + no policies = the public key can't read or write the tables directly.
-- The functions above still work because they run as the table owner.

-- alter table public.receipts     enable row level security;
-- alter table public.participants enable row level security;

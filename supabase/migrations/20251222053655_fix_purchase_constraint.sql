-- Make unit_price nullable in purchases table if it exists
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='purchases' and column_name='unit_price') then
    alter table purchases alter column unit_price drop not null;
  end if;
end $$;

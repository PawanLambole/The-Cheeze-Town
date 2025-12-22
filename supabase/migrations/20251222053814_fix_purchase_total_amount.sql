-- Make total_amount nullable in purchases table if it exists
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='purchases' and column_name='total_amount') then
    alter table purchases alter column total_amount drop not null;
  end if;
end $$;

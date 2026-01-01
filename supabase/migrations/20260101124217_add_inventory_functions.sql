-- Function to safely decrement stock during checkout
create or replace function decrement_stock(row_id uuid, amount int)
returns void as $$
begin
  update variants 
  set stock_quantity = stock_quantity - amount
  where id = row_id;
end;
$$ language plpgsql;
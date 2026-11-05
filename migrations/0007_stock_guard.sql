-- Stock can never be taken below zero: a decrement that would go negative aborts its whole batch, so an order's
-- claim on stock (orders.stock_taken = its claim token) and the product decrements commit together or not at all.
CREATE TRIGGER products_stock_never_negative
BEFORE UPDATE OF stock ON products
WHEN NEW.stock IS NOT NULL AND NEW.stock < 0 AND (OLD.stock IS NULL OR NEW.stock < OLD.stock)
BEGIN
  SELECT RAISE(ABORT, 'out_of_stock');
END;

-- 'refund_request' rows are shoppers asking for money back outside the window: they go to the merchant's
-- inbox but never into the store agent's knowledge (they carry order ids and buyers' complaints).
ALTER TABLE questions ADD COLUMN kind TEXT NOT NULL DEFAULT 'question';
ALTER TABLE questions ADD COLUMN order_id TEXT;
UPDATE questions SET kind = 'refund_request', order_id = substr(question, 26, 14) WHERE question LIKE 'Refund request for order o\_%' ESCAPE '\';
-- 1 = this order's stock has been taken (reserved just before capture), so refunds/cancels know to put it back.
ALTER TABLE orders ADD COLUMN stock_taken INTEGER NOT NULL DEFAULT 0;
UPDATE orders SET stock_taken = 1 WHERE status IN ('paid', 'shipped', 'refunded');
-- Refunded so far (partial refunds made here or in PayPal); status turns 'refunded' only once it covers the total.
ALTER TABLE orders ADD COLUMN refunded_cents INTEGER NOT NULL DEFAULT 0;
UPDATE orders SET refunded_cents = total_cents WHERE status = 'refunded';
-- A caller-supplied key so an agent that retries `buy` gets the same order instead of a second one.
ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX idx_orders_idem ON orders(shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_orders_capture ON orders(capture_id) WHERE capture_id IS NOT NULL;

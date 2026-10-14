-- The matching product in Channel3's product graph, and what it sells for elsewhere (in-stock offers, shop currency).
ALTER TABLE products ADD COLUMN channel3_id TEXT;
ALTER TABLE products ADD COLUMN market_min_cents INTEGER;
ALTER TABLE products ADD COLUMN market_max_cents INTEGER;
ALTER TABLE products ADD COLUMN market_retailers INTEGER;

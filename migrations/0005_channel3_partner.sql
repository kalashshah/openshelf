-- Channel3 Partner Program: the merchant's own storefront (if any) and their Channel3 customer id.
ALTER TABLE shops ADD COLUMN website TEXT;
ALTER TABLE shops ADD COLUMN channel3_customer_id TEXT;
-- Deployment-wide values, e.g. Open Shelf's own Channel3 customer id (the marketplace that lists hosted shops).
CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- 0 = a service or digital product: checkout skips the shipping address.
ALTER TABLE products ADD COLUMN needs_shipping INTEGER NOT NULL DEFAULT 1;

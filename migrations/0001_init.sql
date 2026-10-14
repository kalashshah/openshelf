-- better-auth owns these four tables: camelCase columns, TEXT timestamps. isAnonymous = the anonymous plugin ("Try the demo").
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  isAnonymous INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id),
  token TEXT UNIQUE NOT NULL,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id),
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  idToken TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_session_user ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_user ON account(userId);

-- One shop per signed-in user. The PayPal secret is sealed with MASTER_KEY.
-- A shop with no PayPal creds of its own (demo shops) checks out through the DEMO_PAYPAL_* app.
CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  -- Free text the store agent may quote: policies, shipping, ingredients, brand story.
  about TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  refund_days INTEGER NOT NULL DEFAULT 30,
  -- 1 = appears in the public directory (/mcp search across shops).
  listed INTEGER NOT NULL DEFAULT 0,
  demo INTEGER NOT NULL DEFAULT 0,
  paypal_env TEXT NOT NULL DEFAULT 'sandbox',
  paypal_client_id TEXT,
  paypal_secret_ct TEXT,
  paypal_secret_iv TEXT,
  paypal_webhook_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  -- [{"name":"Size","options":[{"label":"50 ml","price_cents":2400}]}]; an option price replaces the base price.
  variants_json TEXT NOT NULL DEFAULT '[]',
  -- NULL = not tracked.
  stock INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  paypal_link_id TEXT,
  paypal_link_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_products_shop ON products(shop_id, active);
CREATE UNIQUE INDEX idx_products_link ON products(shop_id, paypal_link_id) WHERE paypal_link_id IS NOT NULL;

-- Everything a shopper (agent or human) asked the store agent. answered=0 lands in the merchant's inbox;
-- a merchant answer becomes knowledge the agent uses from then on.
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  answered INTEGER NOT NULL DEFAULT 0,
  asker TEXT NOT NULL DEFAULT 'agent',
  merchant_answer TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX idx_questions_shop ON questions(shop_id, created_at);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  paypal_order_id TEXT NOT NULL UNIQUE,
  -- [{"product_id","name","variant","quantity","unit_cents"}]
  items_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  -- created → paid → (shipped) → refunded | cancelled
  status TEXT NOT NULL DEFAULT 'created',
  channel TEXT NOT NULL DEFAULT 'agent',
  approve_url TEXT NOT NULL,
  capture_id TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  ship_to TEXT,
  carrier TEXT,
  tracking_number TEXT,
  refund_reason TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  shipped_at INTEGER,
  refunded_at INTEGER
);
CREATE INDEX idx_orders_shop ON orders(shop_id, created_at);

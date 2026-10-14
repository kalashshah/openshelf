-- "Log in with PayPal" merchants: orders are created by Open Shelf's own PayPal app with this account as the payee.
ALTER TABLE shops ADD COLUMN paypal_payee_email TEXT;

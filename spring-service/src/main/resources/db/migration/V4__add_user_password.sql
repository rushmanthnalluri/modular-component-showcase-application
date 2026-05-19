-- Add password_hash column to users for secure password storage
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash text;

-- Note: this column is intentionally nullable to avoid blocking legacy seed data.
-- A subsequent migration or operational step should populate password_hash with
-- bcrypt-hashed passwords for existing accounts before enabling authentication for them.

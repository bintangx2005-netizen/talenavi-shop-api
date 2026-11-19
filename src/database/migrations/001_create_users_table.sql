CREATE TABLE users (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,              -- hash bcrypt, bukan plain text
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer'
              CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Email unik tanpa membedakan huruf besar/kecil (User@Mail.com = user@mail.com)
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));

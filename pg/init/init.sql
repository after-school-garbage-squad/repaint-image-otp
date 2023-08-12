CREATE TABLE token_table (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    token VARCHAR(64),
    expires_at TIMESTAMP
);

CREATE INDEX idx_url ON token_table(url);

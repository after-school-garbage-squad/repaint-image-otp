CREATE TABLE your_table_name (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    token VARCHAR(32),
    expires_at TIMESTAMP
);

CREATE INDEX idx_url ON your_table_name(url);

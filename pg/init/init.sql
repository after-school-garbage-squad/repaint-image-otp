CREATE TABLE token (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64),
    url TEXT UNIQUE,
    limit_times INT,
    expires_at TIMESTAMP
);

CREATE INDEX idx_url ON token(url);

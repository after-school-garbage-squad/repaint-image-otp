import { type DB } from "./types"; // this is the Database interface we defined earlier
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const env = process.env;

const dialect = new PostgresDialect({
  pool: new Pool({
    database: env.DATABASE_NAME,
    host: env.DATABASE_HOST,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    port: Number(env.DATABASE_PORT),
    max: Number(env.DATABASE_MAX_CONNECTIONS),
  }),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<DB>({
  dialect,
});

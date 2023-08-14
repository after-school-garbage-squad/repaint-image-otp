import { db } from "../database";
import { type TokenUpdate, type Token, type NewToken } from "../types";

export async function findTokenById(id: number): Promise<Token | undefined> {
  return await db
    .selectFrom("token_table")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export async function findTokenByUrl(url: string): Promise<Token | undefined> {
  return await db
    .selectFrom("token_table")
    .where("url", "=", url)
    .selectAll()
    .executeTakeFirst();
}

export async function findToken(criteria: Partial<Token>): Promise<Token[]> {
  let query = db.selectFrom("token_table");

  if (criteria.id !== undefined) {
    query = query.where("id", "=", criteria.id);
  }

  if (criteria.url !== undefined) {
    query = query.where("url", "=", criteria.url);
  }

  if (criteria.token !== undefined) {
    query = query.where("token", "=", criteria.token);
  }

  if (criteria.expires_at !== undefined) {
    query = query.where("expires_at", "=", criteria.expires_at);
  }

  return await query.selectAll().execute();
}

export async function updateToken(
  id: number,
  updateWith: TokenUpdate
): Promise<void> {
  await db
    .updateTable("token_table")
    .set(updateWith)
    .where("id", "=", id)
    .execute();
}

export async function createToken(Token: NewToken): Promise<Token> {
  return await db
    .insertInto("token_table")
    .values(Token)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteToken(id: number): Promise<Token | undefined> {
  return await db
    .deleteFrom("token_table")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface TokenTable {
  id: Generated<number>;
  token: string | null;
  url: string | null;
  limit_times: number | null;
  expires_at: Timestamp | null;
}

export type Token = Selectable<TokenTable>;
export type NewToken = Insertable<TokenTable>;
export type TokenUpdate = Updateable<TokenTable>;

export interface DB {
  token_table: TokenTable;
}

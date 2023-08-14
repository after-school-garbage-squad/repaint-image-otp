import { sql } from "kysely";
import { app, server } from ".";
import { db } from "./database";
import * as TokenRepository from "./repository/TokenRepository";
import { calcTokenExpiration } from "./token";

const TIME_MERGIN = 1000 * 5;

const testUrls: string[] = [];
for (let i = 0; i < 10; i++) {
  testUrls.push(`https://example.com/${i}`);
}

describe("Token API", () => {
  afterAll(() => {
    server.close();
  });

  describe("GET /token", () => {
    beforeAll(async () => {
      await sql`truncate table ${sql.table("token_table")}`.execute(db);

      for (let i = 0; i < testUrls.length; i++) {
        await TokenRepository.createToken({
          token: `test-token-${i}`,
          url: testUrls[i],
          limit_times: i + 1,
          expires_at: new Date(0 + i),
        });
      }
    });

    testUrls.forEach((url, i) => {
      test(`For URL: ${url}`, async () => {
        const res = await app.request(`/token?url=${encodeURIComponent(url)}`);

        expect(res.status).toBe(200);

        const token = await res.json();
        expect(token.url).toBe(url);
        expect(token.token).toBe(`test-token-${i}`);
        expect(token.limit_times).toBe(i + 1);
        expect(new Date(token.expires_at).getTime()).toBe(
          new Date(0 + i).getTime()
        );
      });
    });
  });

  describe("POST /token", () => {
    beforeAll(async () => {
      await sql`truncate table ${sql.table("token_table")}`.execute(db);
    });

    testUrls.forEach((url, i) => {
      test(`For URL: ${url}`, async () => {
        const req = new Request(
          `http://localhost/token?url=${encodeURIComponent(
            url
          )}&limit_times=${i}`,
          { method: "POST" }
        );
        const res = await app.request(req);

        expect(res.status).toBe(200);

        const token = await res.json();

        expect(token.url).toBe(url);
        expect(token.limit_times).toBe(i);
        expect(new Date(token.expires_at).getTime()).toBeLessThan(
          calcTokenExpiration(new Date(Date.now() + TIME_MERGIN)).getTime()
        );
        expect(new Date(token.expires_at).getTime()).toBeGreaterThan(
          calcTokenExpiration(new Date(Date.now() - TIME_MERGIN)).getTime()
        );
        const dbToken = await TokenRepository.findTokenByUrl(url);
        expect(token.token).toBe(dbToken?.token);
      });
    });
  });

  describe("DELETE /token", () => {
    beforeAll(async () => {
      await sql`truncate table ${sql.table("token_table")}`.execute(db);

      for (let i = 0; i < testUrls.length; i++) {
        await TokenRepository.createToken({
          token: `test-token-${i}`,
          url: testUrls[i],
          limit_times: i + 1,
          expires_at: new Date(0 + i),
        });
      }
    });

    testUrls.forEach((url, i) => {
      test(`For URL: ${url}`, async () => {
        const req = new Request(
          `http://localhost/token?url=${encodeURIComponent(url)}`,
          { method: "DELETE" }
        );
        const res = await app.request(req);

        expect(res.status).toBe(200);

        const token = await res.json();

        expect(token.url).toBe(url);
        expect(token.expires_at).toBe(null);
        expect(token.token).toBe(null);
        const dbToken = await TokenRepository.findTokenByUrl(url);
        expect(dbToken).toBeDefined();
        expect(dbToken?.token).toBe(null);
        expect(dbToken?.expires_at).toBe(null);
      });
    });
  });

  describe("GET /auth/is_login", () => {
    beforeAll(async () => {
      await sql`truncate table ${sql.table("token_table")}`.execute(db);

      for (let i = 0; i < testUrls.length; i++) {
        await TokenRepository.createToken({
          token: `test-token-${i}`,
          url: testUrls[i],
          limit_times: 1,
          expires_at: calcTokenExpiration(),
        });
      }
    });

    testUrls.forEach((url, i) => {
      test(`For URL: ${url}`, async () => {
        const reqInit: RequestInit = {
          headers: { "request-url": `${url}?token=test-token-${i}` },
        };

        const res200 = await app.request(`/auth/is_login`, reqInit);
        expect(res200.status).toBe(200);

        const resLimit = await app.request(
          `/auth/is_login?token=test-token-${i}`,
          reqInit
        );
        expect(resLimit.status).toBe(401);

        const resInvalidToken = await app.request(
          `/auth/is_login?token=this-is-not-a-token`,
          reqInit
        );
        expect(resInvalidToken.status).toBe(401);

        const resFakeUrl = await app.request(
          `/auth/is_login?token=this-is-not-a-token`,
          reqInit
        );
        expect(resFakeUrl.status).toBe(401);

        const token = await TokenRepository.findTokenByUrl(url);
        if (token !== undefined) {
          token.expires_at = new Date(0);
          token.limit_times = 1;
          token.token = `test-token-${i}`;
          await TokenRepository.updateToken(token.id, { ...token });

          const resExpires = await app.request(
            `/auth/is_login?token=this-is-not-a-token`,
            reqInit
          );
          expect(resExpires.status).toBe(401);

          token.expires_at = calcTokenExpiration();
          await TokenRepository.updateToken(token.id, { ...token });

          const res200AfterExpires = await app.request(
            `/auth/is_login?token=test-token-${i}`,
            reqInit
          );
          expect(res200AfterExpires.status).toBe(200);
        } else {
          fail("Token not found");
        }
      });
    });
  });
});

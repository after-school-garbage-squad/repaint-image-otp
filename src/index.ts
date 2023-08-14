import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { calcTokenExpiration, generateRandomToken } from "./token";
import * as TokenRepository from "./repository/TokenRepository";

export const TOKEN_LENGTH = 16;
export const LIFE_TIME = 1000 * 60 * 60 * 24 * 7;

export const app = new Hono();
app.get("/", (c) => c.text("Hello Hono!"));

app.post("/token", async (c) => {
  const url = c.req.query("url");
  const limitTimes = (() => {
    const l = Number(c.req.query("limit_times")) ?? 1;
    return Number.isNaN(l) ? 1 : l;
  })();
  if (url === undefined) {
    return c.text("I'm a teapot", 418);
  }

  const randomToken = generateRandomToken();
  let token = await TokenRepository.findTokenByUrl(url);

  if (token !== undefined) {
    token.token = randomToken;
    token.expires_at = calcTokenExpiration();
    token.limit_times = limitTimes;
    await TokenRepository.updateToken(token.id, { ...token });
  } else {
    token = await TokenRepository.createToken({
      token: randomToken,
      url: c.req.query("url"),
      limit_times: limitTimes,
      expires_at: calcTokenExpiration(),
    });
  }

  return c.json(token);
});

app.get("/token", async (c) => {
  const url = c.req.query("url");
  if (url === undefined) {
    return c.text("Not found", 404);
  }

  const token = await TokenRepository.findTokenByUrl(url);

  return c.json(token);
});

app.delete("/token", async (c) => {
  const url = c.req.query("url");
  if (url === undefined) {
    return c.text("I'm a teapot", 418);
  }

  const token = await TokenRepository.findTokenByUrl(url);
  if (token === undefined) {
    return c.text("Not found", 404);
  } else {
    token.token = null;
    token.expires_at = null;
    await TokenRepository.updateToken(token.id, { ...token });
  }

  return c.json(token);
});

app.get("/auth/is_login", async (c) => {
  const requestUrl = c.req.header("request-url");
  if (requestUrl === undefined) {
    return c.text("Bad Request", 400);
  } else {
    const url = new URL(requestUrl);
    const baseUrl = url.origin + url.pathname;
    const token = await TokenRepository.findTokenByUrl(baseUrl);
    if (
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      token !== undefined &&
      token.token !== null &&
      token.expires_at !== null &&
      token.limit_times !== null
    ) {
      if (token.token === url.searchParams.get("token")) {
        if (
          token.expires_at !== null &&
          token.expires_at.getTime() > new Date().getTime()
        ) {
          if (token.limit_times > 0) {
            token.limit_times -= 1;
            if (token.limit_times === 0) {
              token.token = null;
              token.expires_at = null;
            }
            await TokenRepository.updateToken(token.id, { ...token });
            return c.text("OK", 200);
          } else {
            return c.text("Token is expired", 401);
          }
        } else {
          return c.text("Token is expired", 401);
        }
      } else {
        return c.text("Invalid token", 401);
      }
    } else {
      return c.text("Unauthorized", 401);
    }
  }
});

export const server = serve(app);

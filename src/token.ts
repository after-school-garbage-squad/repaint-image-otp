import * as crypto from "crypto";
import { LIFE_TIME, TOKEN_LENGTH } from ".";

export const generateRandomToken = (): string => {
  const randomBytes = crypto.randomBytes(TOKEN_LENGTH);
  const token = randomBytes.toString("hex");
  return token;
};

export const calcTokenExpiration = (date: Date = new Date()): Date => {
  return new Date(date.getTime() + LIFE_TIME);
};

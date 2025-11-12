import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key";

interface TokenPayload {
  userId: string;
  name: string;
}

export function createToken(payload: TokenPayload): string {
  //  Correct usage of jwt.sign
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch {
    return null;
  }
}
import jwt from "jsonwebtoken";

// Secret key for JWT signing and verification from env if it doesn't work, check if there is a .env file
const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key";

interface TokenPayload {
  userId: string;
  name: string;
}

// Create JWT token
export function createToken(payload: TokenPayload): string {
  //  Correct usage of jwt.sign
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}
// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch {
    return null;
  }
}
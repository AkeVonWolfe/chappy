import * as jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret';

export const createToken = (payload: object, expiresIn = '1h') => {
  return (jwt as any).sign(payload, JWT_SECRET, { expiresIn })
}

export const verifyToken = (token: string) => {
  try {
    return (jwt as any).verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
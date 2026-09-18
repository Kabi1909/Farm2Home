import jwt from 'jsonwebtoken';
export const generateToken = (user, config) => jwt.sign({ sub: String(user._id), version: user.tokenVersion || 0 }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.JWT_EXPIRES_IN, issuer: 'farm2home-api', audience: 'farm2home-web' });

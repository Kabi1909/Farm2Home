import { marketplaceApi } from './marketplaceApi.js';
import { registrationPayload } from '../utils/registration.js';
export const login = (email, password) => marketplaceApi.auth.login(email, password);
export async function register(form) {
  const result = await marketplaceApi.auth.register(registrationPayload(form));
  return result.user;
}

import { marketplaceApi } from './marketplaceApi.js';
export const login = (email, password) => marketplaceApi.auth.login(email, password);
export async function register(form) {
  const result = await marketplaceApi.auth.register({
    name: form.name,
    email: form.email,
    phone: form.phone.replaceAll(' ', ''),
    password: form.password,
    confirmPassword: form.confirm,
    role: form.role,
  });
  return result.user;
}

import { farmers, customers } from '../data/seed';
import { readStore, writeStore } from '../utils/helpers';
import { delay } from './api';
export const accounts = () =>
  readStore(
    'accounts',
    [...farmers, ...customers].map((user) => ({ ...user, password: 'Farm123!' })),
  );
export async function login(email, password) {
  await delay();
  const account = accounts().find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  );
  if (!account) throw new Error('Email or password is incorrect.');
  const { password: _, ...user } = account;
  return user;
}
export async function register(data) {
  await delay();
  if (accounts().some((a) => a.email.toLowerCase() === data.email.toLowerCase()))
    throw new Error('An account with this email already exists.');
  const user = { ...data, id: crypto.randomUUID() };
  writeStore('accounts', [...accounts(), user]);
  const { password: _, ...safe } = user;
  return safe;
}
export function updateAccount(id, changes) {
  writeStore(
    'accounts',
    accounts().map((a) => (a.id === id ? { ...a, ...changes } : a)),
  );
}
export function resetPassword(email, password) {
  const found = accounts().find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error('No demo account found for that email.');
  updateAccount(found.id, { password });
}

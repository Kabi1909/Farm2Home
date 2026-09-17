import * as seed from '../data/seed';
import { readStore, writeStore } from '../utils/helpers';
export function getCollection(name) {
  return readStore(name, seed[name] || []);
}
export function saveCollection(name, items) {
  writeStore(name, items);
  return items;
}
export const repository = (name) => ({
  list: () => getCollection(name),
  get: (id) => getCollection(name).find((item) => item.id === id),
  save: (item) => {
    const rows = getCollection(name);
    return saveCollection(
      name,
      rows.some((row) => row.id === item.id)
        ? rows.map((row) => (row.id === item.id ? item : row))
        : [item, ...rows],
    );
  },
  remove: (id) =>
    saveCollection(
      name,
      getCollection(name).filter((row) => row.id !== id),
    ),
});

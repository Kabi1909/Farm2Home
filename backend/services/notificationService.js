import Notification from '../models/Notification.js';
export async function notify(user, type, title, links = {}, session) {
  return Notification.create([{ user, type, title, message: title, ...links }], { session });
}

import { currentUser, json } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  const user = await currentUser(request, env);
  return json({ user: user ? { id: user.id, username: user.username, role: user.role } : null });
}

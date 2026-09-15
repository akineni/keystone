export function flattenPermissions(user) {
  if (!user || !Array.isArray(user.roles)) return [];
  const set = new Set();
  user.roles.forEach((r) => (r.permissions || []).forEach((p) => set.add(p)));
  return [...set];
}

export function hasPermission(user, permission) {
  return flattenPermissions(user).includes(permission);
}

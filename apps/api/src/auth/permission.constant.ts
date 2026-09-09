// Every module:action pair the API actually gates. Permission rows in the
// database mirror this catalog exactly (seeded, not admin-creatable) — each
// entry here corresponds to a real guarded endpoint, not free-form data.
export const PERMISSION_CATALOG = [
  ['personnel', 'view'],
  ['personnel', 'create'],
  ['personnel', 'edit'],
  ['departments', 'view'],
  ['departments', 'create'],
  ['positions', 'view'],
  ['positions', 'create'],
  ['plantilla', 'view'],
  ['plantilla', 'create'],
  ['salaryGrades', 'view'],
  ['salaryGrades', 'create'],
  ['users', 'view'],
  ['users', 'create'],
  ['users', 'edit'],
  ['roles', 'view'],
  ['roles', 'create'],
] as const;

export type Permission = `${(typeof PERMISSION_CATALOG)[number][0]}:${(typeof PERMISSION_CATALOG)[number][1]}`;

export function permissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}

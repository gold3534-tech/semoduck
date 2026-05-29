export const ADMIN_EMAIL = "gold3534@gmail.com";

export function isAdminEmail(email?: string | null) {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
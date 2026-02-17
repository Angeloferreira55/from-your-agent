/**
 * Admin email addresses that are automatically promoted to admin role on signup/login.
 * Add emails here to grant admin access to the admin dashboard.
 */
export const ADMIN_EMAILS: string[] = [
  "angelo@from-your-agent.com",
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
  );
}

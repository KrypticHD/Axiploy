import { DEMO_CREDENTIALS, ADMIN_CREDENTIALS, MOCK_USER } from "./mock-data";
import type { MockUser } from "./types";

export const SESSION_COOKIE = "axiploy_session";

export function validateCredentials(email: string, password: string): MockUser | null {
  if (
    email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() &&
    password === DEMO_CREDENTIALS.password
  ) {
    return MOCK_USER;
  }
  if (
    email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return MOCK_USER;
  }
  return null;
}

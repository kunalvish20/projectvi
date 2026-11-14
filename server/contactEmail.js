export function contactEmailInput(input = {}) {
  const email = String(input.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
    throw new Error('Enter a valid email address.');
  }
  return {email};
}

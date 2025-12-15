// Utility functions for user display

/**
 * Extracts username from email (part before @)
 * @param email - User's email address
 * @returns Username (part before @) or 'Unknown' if email is invalid
 */
export function getUsernameFromEmail(email: string | null | undefined): string {
  if (!email) return 'Unknown';
  const username = email.split('@')[0];
  return username || 'Unknown';
}

/**
 * Gets display name for a user from their first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Full name or 'Unknown User' if names are not provided
 */
export function getUserDisplayName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) return firstName;
  if (lastName) return lastName;
  return 'Unknown User';
}

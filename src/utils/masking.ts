export function maskAccountNumber(accNumber?: string | null): string {
  if (!accNumber || accNumber.length < 4) return '******';
  const lastFour = accNumber.slice(-4);
  return `******${lastFour}`;
}

export function sanitizeUserOutput(user: any): any {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

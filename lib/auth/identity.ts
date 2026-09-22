/** Pure, dependency-free — safe to import from client components. */
export function hasRealName(name: string | null | undefined, phoneNumber: string | null | undefined): boolean {
  return Boolean(name?.trim()) && name !== phoneNumber;
}

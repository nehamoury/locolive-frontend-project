export function nullString(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return (value as { String?: string }).String || '';
  }
  return (value as string) || '';
}
export function nullString(value: any): string {
  if (typeof value === 'object' && value !== null) {
    return value.String || '';
  }
  return value || '';
}
export function serviceDescriptionIncludesOption(current: string, option: string): boolean {
  const label = option.trim().toLowerCase();
  if (!label) return false;
  return current
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .includes(label);
}

export function appendServiceDescriptionOption(current: string, option: string): string {
  const label = option.trim();
  if (!label) return current;
  if (serviceDescriptionIncludesOption(current, label)) {
    return current;
  }
  const trimmed = current.trim();
  return trimmed ? `${trimmed}, ${label}` : label;
}

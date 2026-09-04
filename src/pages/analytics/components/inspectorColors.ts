const INSPECTOR_COLORS = [
  "#2e7d32",
  "#1565c0",
  "#ed6c02",
  "#6a1b9a",
  "#00838f",
  "#c62828",
  "#5d4037",
  "#4527a0",
];

export function getInspectorColor(index: number): string {
  return INSPECTOR_COLORS[index % INSPECTOR_COLORS.length];
}

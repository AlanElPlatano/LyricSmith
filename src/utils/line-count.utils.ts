export function countNonEmptyLines(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .length;
}

export function countXMLLines(lineGroups: number[][]): number {
  return lineGroups.length;
}

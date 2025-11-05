export function mergeSyllablesInArray(syllables: string[], clickedIndex: number, isXMLRow: boolean): string[] {
  if (clickedIndex >= syllables.length - 1) {
    return syllables;
  }
  
  const newSyllables = [...syllables];
  const current = syllables[clickedIndex];
  const next = syllables[clickedIndex + 1];
  
  if (isXMLRow) {
    const cleaned = current.replace(/-$/, '');
    newSyllables[clickedIndex] = cleaned + next;
  } else {
    newSyllables[clickedIndex] = current + next;
  }
  
  newSyllables.splice(clickedIndex + 1, 1);
  
  return newSyllables;
}

export function calculateTotalSyllableCount(plainTextLines: string[][]): number {
  return plainTextLines.reduce((sum, line) => sum + line.length, 0);
}
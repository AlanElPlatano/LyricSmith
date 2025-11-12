import type { ParsedXMLData } from '../types';

/**
 * Escapes special XML characters to prevent breaking XML syntax
 */
function escapeXMLAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function generateXMLFromState(
  xmlData: ParsedXMLData,
  lineGroups: number[][],
  plainTextLines: string[][]
): string {
  // Start with the original header
  let xmlOutput = xmlData.header;
  
  // Open vocals tag
  xmlOutput += '<vocals count="' + xmlData.vocals.length + '">\n';
  
  // Iterate through each line
  lineGroups.forEach((vocalIndices, lineIndex) => {
    const plainTextSyllables = plainTextLines[lineIndex] || [];
    
    vocalIndices.forEach((vocalIndex, syllableIndex) => {
      const originalVocal = xmlData.vocals[vocalIndex];
      const newLyric = plainTextSyllables[syllableIndex] || originalVocal.lyric;
      
      // Check if the original XML syllable had a hyphen (meaning it continues in the same word)
      const hadHyphen = originalVocal.lyric.endsWith('-');
      
      // Determine if this is the last syllable in the line
      const isLastInLine = syllableIndex === vocalIndices.length - 1;
      
      // Final lyric logic:
      // 1. Start with the new text from plain text row (escaped for XML)
      // 2. Add hyphen if original had it (and it's not the last in line)
      // 3. Add '+' if it's the last syllable in the line
      // Hope i didn't mess up somewhere along the way
      let finalLyric = escapeXMLAttribute(newLyric);
      
      if (hadHyphen && !isLastInLine) {
        finalLyric += '-';
      }
      
      if (isLastInLine) {
        finalLyric += '+';
      }
      
      // Create the vocal element with preserved timing
      xmlOutput += `  <vocal time="${originalVocal.time}" note="${originalVocal.note}" length="${originalVocal.length}" lyric="${finalLyric}"/>\n`;
    });
  });
  
  // Close vocals tag
  xmlOutput += '</vocals>\n';
  
  return xmlOutput;
}

export function downloadXML(content: string, filename: string = 'exported_lyrics.xml'): void {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
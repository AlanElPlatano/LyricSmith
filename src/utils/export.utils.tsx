import type { ParsedXMLData } from '../types';

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
      
      // Determine if this is the last syllable in the line
      const isLastInLine = syllableIndex === vocalIndices.length - 1;
      
      // Add line-end marker if it's the last syllable
      const finalLyric = isLastInLine ? newLyric + '+' : newLyric;
      
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
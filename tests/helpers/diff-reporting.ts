import fs from 'fs';
import path from 'path';
import { XMLComparisonResult } from '../types/test-case.types';

export function generateXMLDiffReport(comparison: XMLComparisonResult): string {
  const lines: string[] = [];

  lines.push('========== XML COMPARISON FAILED ==========');
  lines.push('');

  if (comparison.countMismatch) {
    lines.push('VOCAL COUNT MISMATCH:');
    lines.push(`  Expected: ${comparison.countMismatch.expected}`);
    lines.push(`  Actual:   ${comparison.countMismatch.actual}`);
    lines.push('');
  }

  if (comparison.mismatchedVocals.length > 0) {
    const totalVocals =
      comparison.countMismatch?.expected ||
      comparison.mismatchedVocals[comparison.mismatchedVocals.length - 1].index + 1;

    lines.push(`MISMATCHED VOCALS: ${comparison.mismatchedVocals.length} of ${totalVocals}`);
    lines.push('');

    for (const mismatch of comparison.mismatchedVocals) {
      lines.push(`Vocal #${mismatch.index}:`);
      for (const diff of mismatch.differences) {
        lines.push(`  - ${diff}`);
      }
      lines.push(
        `  Expected: ${JSON.stringify(mismatch.expected)}`
      );
      lines.push(
        `  Actual:   ${JSON.stringify(mismatch.actual)}`
      );
      lines.push('');
    }
  }

  lines.push('==========================================');

  return lines.join('\n');
}

export function saveXMLDiffToFile(
  comparison: XMLComparisonResult,
  testCaseName: string,
  actualXML: string
): void {
  const outputDir = path.join('test-output', testCaseName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const diffReport = generateXMLDiffReport(comparison);
  fs.writeFileSync(path.join(outputDir, 'diff-report.txt'), diffReport, 'utf-8');

  fs.writeFileSync(path.join(outputDir, 'actual-output.xml'), actualXML, 'utf-8');

  console.log(`\nDiff artifacts saved to: ${outputDir}`);
  console.log(`  - diff-report.txt`);
  console.log(`  - actual-output.xml\n`);
}

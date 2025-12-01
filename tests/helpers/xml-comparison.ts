import { XMLParser } from 'fast-xml-parser';
import { ParsedVocals, VocalData, XMLComparisonResult, VocalDifference } from '../types/test-case.types';

export function parseXMLToVocals(xmlString: string): ParsedVocals {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(xmlString);

  if (!parsed.vocals) {
    throw new Error('Invalid XML: missing <vocals> root element');
  }

  const count = parseInt(parsed.vocals.count, 10);
  const vocalElements = parsed.vocals.vocal;

  if (!vocalElements) {
    return { count: 0, vocals: [] };
  }

  const vocals: VocalData[] = Array.isArray(vocalElements)
    ? vocalElements
    : [vocalElements];

  return {
    count,
    vocals: vocals.map(v => ({
      time: v.time,
      note: v.note,
      length: v.length,
      lyric: v.lyric,
    })),
  };
}

export function compareXML(
  actualXML: string,
  expectedXML: string,
  tolerance: number = 0.003
): XMLComparisonResult {
  const actual = parseXMLToVocals(actualXML);
  const expected = parseXMLToVocals(expectedXML);

  const mismatchedVocals: VocalDifference[] = [];

  if (actual.count !== expected.count) {
    return {
      isMatch: false,
      countMismatch: {
        expected: expected.count,
        actual: actual.count,
      },
      mismatchedVocals,
    };
  }

  for (let i = 0; i < expected.vocals.length; i++) {
    const differences: string[] = [];

    if (actual.vocals[i].lyric !== expected.vocals[i].lyric) {
      differences.push(
        `lyric: expected "${expected.vocals[i].lyric}", got "${actual.vocals[i].lyric}"`
      );
    }

    const timeDiff = Math.abs(
      parseFloat(actual.vocals[i].time) - parseFloat(expected.vocals[i].time)
    );
    if (timeDiff > tolerance) {
      differences.push(
        `time: expected ${expected.vocals[i].time}, got ${actual.vocals[i].time} (diff: ${timeDiff})`
      );
    }

    const lengthDiff = Math.abs(
      parseFloat(actual.vocals[i].length) - parseFloat(expected.vocals[i].length)
    );
    if (lengthDiff > tolerance) {
      differences.push(
        `length: expected ${expected.vocals[i].length}, got ${actual.vocals[i].length} (diff: ${lengthDiff})`
      );
    }

    if (actual.vocals[i].note !== expected.vocals[i].note) {
      differences.push(
        `note: expected ${expected.vocals[i].note}, got ${actual.vocals[i].note}`
      );
    }

    if (differences.length > 0) {
      mismatchedVocals.push({
        index: i,
        expected: expected.vocals[i],
        actual: actual.vocals[i],
        differences,
      });
    }
  }

  return {
    isMatch: mismatchedVocals.length === 0,
    mismatchedVocals,
  };
}

export interface MergeAction {
  step: number;
  description: string;
  lineIndex: number;
  syllableIndex: number;
  rowType: 'xml' | 'plain';
}

export interface TestCase {
  testCaseName: string;
  description: string;
  sourceXML: string;
  plainText: string;
  targetXML: string;
  mergeActions: MergeAction[];
  expectedVocalCount: number;
  metadata: {
    author: string;
    created: string;
    language: string;
  };
}

export interface LoadedTestCase extends TestCase {
  sourceXMLContent: string;
  plainTextContent: string;
  targetXMLContent: string;
}

export interface VocalData {
  time: string;
  note: string;
  length: string;
  lyric: string;
}

export interface ParsedVocals {
  count: number;
  vocals: VocalData[];
}

export interface VocalDifference {
  index: number;
  expected: VocalData;
  actual: VocalData;
  differences: string[];
}

export interface XMLComparisonResult {
  isMatch: boolean;
  countMismatch?: {
    expected: number;
    actual: number;
  };
  mismatchedVocals: VocalDifference[];
}

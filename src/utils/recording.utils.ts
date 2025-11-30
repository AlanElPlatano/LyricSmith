import type { AppState, MergeAction } from '../types/state.types';

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

export function validateRecording(state: AppState): { valid: boolean; error?: string } {
  if (!state.recordingTestName.trim()) {
    return { valid: false, error: 'Test name is required' };
  }

  if (!state.xmlData) {
    return { valid: false, error: 'No XML data imported. Please import XML before exporting recording.' };
  }

  if (state.plainTextLines.length === 0) {
    return { valid: false, error: 'No plain text imported. Please import plain text before exporting recording.' };
  }

  return { valid: true };
}

export function generateTestCaseJSON(state: AppState, testName: string): TestCase {
  const currentDate = new Date().toISOString().split('T')[0];

  return {
    testCaseName: testName,
    description: `Test case for ${testName}`,
    sourceXML: 'source.xml',
    plainText: 'plain_text.txt',
    targetXML: 'target.xml',
    mergeActions: state.recordedActions,
    expectedVocalCount: state.xmlData?.count || 0,
    metadata: {
      author: 'user',
      created: currentDate,
      language: state.alphabet
    }
  };
}

export function downloadTestCase(testCase: TestCase, filename?: string): void {
  const jsonString = JSON.stringify(testCase, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${testCase.testCaseName}_merge_sequence.json`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

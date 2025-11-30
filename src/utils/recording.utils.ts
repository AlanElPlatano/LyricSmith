import type { AppState, MergeAction } from '../types/state.types';
import { saveFileToFolder } from './file-system.utils';

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

export async function downloadTestCase(testCase: TestCase, filename?: string): Promise<void> {
  const jsonString = JSON.stringify(testCase, null, 2);
  const finalFilename = filename || `${testCase.testCaseName}_merge_sequence.json`;
  await saveFileToFolder(jsonString, finalFilename, 'application/json');
}

export async function downloadJSON(data: unknown, filename: string): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  await saveFileToFolder(jsonString, filename, 'application/json');
}

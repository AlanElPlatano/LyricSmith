import { describe, it, expect } from 'vitest';
import { discoverTestCases, loadTestCase } from '../helpers/file-loader';
import { executeTestCase } from '../helpers/test-runner';
import { compareXML } from '../helpers/xml-comparison';
import { saveXMLDiffToFile, generateXMLDiffReport } from '../helpers/diff-reporting';

const testCases = discoverTestCases();

if (testCases.length === 0) {
  describe('E2E Test Cases', () => {
    it('should have at least one test case', () => {
      expect.fail('No test cases found in lyric_tests/ directory');
    });
  });
} else {
  describe('E2E Test Cases', () => {
    testCases.forEach(testCaseName => {
      describe(testCaseName, () => {
        it('should execute merge sequence and produce expected XML output', () => {
          const testCase = loadTestCase(testCaseName);

          const { finalState, generatedXML } = executeTestCase(testCase);

          expect(finalState.xmlData?.vocals.length).toBe(testCase.expectedVocalCount);

          const comparison = compareXML(generatedXML, testCase.targetXMLContent);

          if (!comparison.isMatch) {
            saveXMLDiffToFile(comparison, testCaseName, generatedXML);
            const diffReport = generateXMLDiffReport(comparison);
            console.error(diffReport);
          }

          expect(comparison.isMatch).toBe(true);
        });
      });
    });
  });
}

import fs from 'fs';
import path from 'path';
import { TestCase, LoadedTestCase } from '../types/test-case.types';

export function discoverTestCases(): string[] {
  const testDir = 'lyric_tests';

  if (!fs.existsSync(testDir)) {
    return [];
  }

  return fs.readdirSync(testDir).filter(name => {
    const testPath = path.join(testDir, name);
    const stats = fs.statSync(testPath);

    if (!stats.isDirectory()) {
      return false;
    }

    const sequenceFile = path.join(testPath, `${name}_merge_sequence.json`);
    return fs.existsSync(sequenceFile);
  });
}

export function loadTestCase(testCaseName: string): LoadedTestCase {
  const testDir = path.join('lyric_tests', testCaseName);
  const sequenceFile = path.join(testDir, `${testCaseName}_merge_sequence.json`);

  if (!fs.existsSync(sequenceFile)) {
    throw new Error(`Test case not found: ${testCaseName} (missing ${sequenceFile})`);
  }

  const testCase: TestCase = JSON.parse(fs.readFileSync(sequenceFile, 'utf-8'));

  const sourceXMLPath = path.join(testDir, testCase.sourceXML);
  const plainTextPath = path.join(testDir, testCase.plainText);
  const targetXMLPath = path.join(testDir, testCase.targetXML);

  if (!fs.existsSync(sourceXMLPath)) {
    throw new Error(`Source XML not found: ${sourceXMLPath}`);
  }
  if (!fs.existsSync(plainTextPath)) {
    throw new Error(`Plain text not found: ${plainTextPath}`);
  }
  if (!fs.existsSync(targetXMLPath)) {
    throw new Error(`Target XML not found: ${targetXMLPath}`);
  }

  const sourceXMLContent = fs.readFileSync(sourceXMLPath, 'utf-8');
  const plainTextContent = fs.readFileSync(plainTextPath, 'utf-8');
  const targetXMLContent = fs.readFileSync(targetXMLPath, 'utf-8');

  return {
    ...testCase,
    sourceXMLContent,
    plainTextContent,
    targetXMLContent,
  };
}

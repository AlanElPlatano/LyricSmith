import { createInitialState, reducer } from '../../src/state/reducer';
import { generateXMLFromState } from '../../src/utils/export.utils';
import { LoadedTestCase } from '../types/test-case.types';
import type { AppState } from '../../src/types/state.types';

export interface TestExecutionResult {
  finalState: AppState;
  generatedXML: string;
}

export function executeTestCase(testCase: LoadedTestCase): TestExecutionResult {
  let state = createInitialState();

  state = reducer(state, {
    type: 'import_xml',
    payload: testCase.sourceXMLContent,
  });

  if (state.error) {
    throw new Error(`XML import failed: ${state.error}`);
  }

  state = reducer(state, {
    type: 'import_plain_text',
    payload: testCase.plainTextContent,
  });

  if (state.error) {
    throw new Error(`Plain text import failed: ${state.error}`);
  }

  for (const action of testCase.mergeActions) {
    state = reducer(state, {
      type: 'merge_syllables',
      payload: {
        lineIndex: action.lineIndex,
        syllableIndex: action.syllableIndex,
        rowType: action.rowType,
      },
    });

    if (state.error) {
      throw new Error(`Merge action failed at step ${action.step}: ${state.error}`);
    }
  }

  if (!state.xmlData) {
    throw new Error('XML data is missing after test execution');
  }

  const generatedXML = generateXMLFromState(
    state.xmlData,
    state.lineGroups,
    state.plainTextLines
  );

  return {
    finalState: state,
    generatedXML,
  };
}

import { useReducer, useEffect, useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { reducer, createInitialState } from './state/reducer';
import { ACTION_TYPES } from './constants';
import { Header } from './components/Header/Header';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { ImportSection } from './components/ImportSection/ImportSection';
import { ControlBar } from './components/ControlBar/ControlBar';
import { SyllableDisplay } from './components/SyllableDisplay/SyllableDisplay';
import { RecordingIndicator } from './components/TestRecorder/RecordingIndicator';
import { RecordingControls } from './components/TestRecorder/RecordingControls';
import { generateXMLFromState, downloadXML } from './utils/export.utils';
import { validateRecording, generateTestCaseJSON, downloadTestCase } from './utils/recording.utils';
import { initializeWindowGlobals } from './utils/window-globals';
import { countNonEmptyLines, countXMLLines } from './utils/line-count.utils';

export default function LyricSmith() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const theme = useTheme(state.darkMode);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);

  // Initialize window globals for console access
  useEffect(() => {
    initializeWindowGlobals(dispatch);
  }, []);

  // Check if recording is enabled via window global
  useEffect(() => {
    const checkRecordingEnabled = () => {
      setIsRecordingEnabled(!!(window as any).enableTestRecording);
    };

    checkRecordingEnabled();
    const interval = setInterval(checkRecordingEnabled, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleImportXML = (xmlString: string) => {
    dispatch({ type: ACTION_TYPES.IMPORT_XML, payload: xmlString });
  };

  const handleImportPlainText = (text: string) => {
    dispatch({ type: ACTION_TYPES.IMPORT_PLAIN_TEXT, payload: text });
  };

  const handleToggleDarkMode = () => {
    dispatch({ type: ACTION_TYPES.TOGGLE_DARK_MODE });
  };

  const handleDismissError = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  };

  const handleMergeSyllables = (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => {
    dispatch({ 
      type: 'merge_syllables', 
      payload: { lineIndex, syllableIndex, rowType } 
    });
  };

  const handleUndo = () => {
    dispatch({ type: 'undo' });
  };

  const handleRedo = () => {
    dispatch({ type: 'redo' });
  };

  const handleExportXML = () => {
    if (!state.xmlData || state.plainTextLines.length === 0) {
      dispatch({ 
        type: ACTION_TYPES.SET_ERROR, 
        payload: 'Cannot export: Both XML and plain text must be imported first' 
      });
      return;
    }

    try {
      const xmlContent = generateXMLFromState(
        state.xmlData,
        state.lineGroups,
        state.plainTextLines
      );
      downloadXML(xmlContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ 
        type: ACTION_TYPES.SET_ERROR, 
        payload: `Export Error: ${errorMessage}` 
      });
    }
  };

  const handleSetTestName = (name: string) => {
    dispatch({ type: ACTION_TYPES.SET_RECORDING_TEST_NAME, payload: name });
  };

  const handleExportRecording = () => {
    const validation = validateRecording(state);
    if (!validation.valid) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Cannot export recording: ${validation.error}`
      });
      return;
    }

    try {
      const testCase = generateTestCaseJSON(state, state.recordingTestName);
      downloadTestCase(testCase);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Export Recording Error: ${errorMessage}`
      });
    }
  };

  const handleClearRecording = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_RECORDING });
  };

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const canExport = state.xmlData !== null && state.plainTextLines.length > 0;

  // Calculate line counts
  const xmlLineCount = countXMLLines(state.lineGroups);
  const plainTextLineCount = countNonEmptyLines(state.plainTextRaw);

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        <Header theme={theme} />

        {state.error && (
          <ErrorBanner
            message={state.error}
            onDismiss={handleDismissError}
            darkMode={state.darkMode}
          />
        )}

        {isRecordingEnabled && (
          <>
            <RecordingIndicator
              isRecording={state.recordingMode}
              actionCount={state.recordedActions.length}
              testName={state.recordingTestName}
              darkMode={state.darkMode}
            />

            <RecordingControls
              isRecording={state.recordingMode}
              testName={state.recordingTestName}
              actionCount={state.recordedActions.length}
              darkMode={state.darkMode}
              onTestNameChange={handleSetTestName}
              onExport={handleExportRecording}
              onClear={handleClearRecording}
            />
          </>
        )}

        <ImportSection
          onImportXML={handleImportXML}
          onImportPlainText={handleImportPlainText}
          darkMode={state.darkMode}
          xmlLineCount={xmlLineCount}
          plainTextLineCount={plainTextLineCount}
        />

        <ControlBar
          originalCount={state.originalSyllableCount}
          currentCount={state.currentSyllableCount}
          darkMode={state.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportXML={handleExportXML}
          canUndo={canUndo}
          canRedo={canRedo}
          canExport={canExport}
        />

        <SyllableDisplay 
          state={state} 
          onMergeSyllables={handleMergeSyllables}
        />
      </div>
    </div>
  );
}
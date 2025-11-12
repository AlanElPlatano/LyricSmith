import { useReducer } from 'react';
import { useTheme } from './hooks/useTheme';
import { reducer, createInitialState } from './state/reducer';
import { ACTION_TYPES } from './constants';
import { Header } from './components/Header/Header';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { ImportSection } from './components/ImportSection/ImportSection';
import { ControlBar } from './components/ControlBar/ControlBar';
import { SyllableDisplay } from './components/SyllableDisplay/SyllableDisplay';
import { generateXMLFromState, downloadXML } from './utils/export.utils';

export default function LyricSmith() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const theme = useTheme(state.darkMode);

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

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const canExport = state.xmlData !== null && state.plainTextLines.length > 0;

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

        <ImportSection
          onImportXML={handleImportXML}
          onImportPlainText={handleImportPlainText}
          darkMode={state.darkMode}
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
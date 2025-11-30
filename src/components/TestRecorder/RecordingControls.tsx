import { FileDown, Trash2 } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  testName: string;
  actionCount: number;
  darkMode: boolean;
  onTestNameChange: (name: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export function RecordingControls({
  isRecording,
  testName,
  actionCount,
  darkMode,
  onTestNameChange,
  onExport,
  onClear
}: RecordingControlsProps) {
  if (!isRecording) {
    return null;
  }

  const inputBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputBorder = darkMode ? 'border-gray-600' : 'border-gray-300';
  const inputText = darkMode ? 'text-gray-100' : 'text-gray-900';
  const buttonBg = darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700';
  const clearButtonBg = darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600';

  const canExport = testName.trim().length > 0 && actionCount > 0;

  return (
    <div className={`border-2 ${inputBorder} rounded-lg p-4 mb-4`}>
      <h3 className={`font-semibold mb-3 ${inputText}`}>
        Test Recording Controls
      </h3>

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="test-name" className={`block text-sm font-medium mb-1 ${inputText}`}>
            Test Case Name
          </label>
          <input
            id="test-name"
            type="text"
            value={testName}
            onChange={(e) => onTestNameChange(e.target.value)}
            placeholder="e.g., baba_yaga"
            className={`w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExport}
            disabled={!canExport}
            className={`flex-1 ${buttonBg} text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors`}
            title={canExport ? 'Export test recording as JSON' : 'Enter a test name and record at least one action'}
          >
            <FileDown size={18} />
            Export Test Recording
          </button>

          <button
            onClick={onClear}
            disabled={actionCount === 0}
            className={`${clearButtonBg} text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors`}
            title="Clear all recorded actions"
          >
            <Trash2 size={18} />
            Clear
          </button>
        </div>

        {!canExport && (
          <p className="text-sm text-gray-500">
            {!testName.trim() ? 'Enter a test case name to export' : 'Record at least one merge action to export'}
          </p>
        )}
      </div>
    </div>
  );
}

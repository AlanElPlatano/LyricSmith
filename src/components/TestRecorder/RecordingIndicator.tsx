interface RecordingIndicatorProps {
  isRecording: boolean;
  actionCount: number;
  testName: string;
  darkMode: boolean;
}

export function RecordingIndicator({ isRecording, actionCount, testName, darkMode }: RecordingIndicatorProps) {
  if (!isRecording) {
    return null;
  }

  const bgColor = darkMode ? 'bg-red-900/20' : 'bg-red-100';
  const borderColor = darkMode ? 'border-red-700' : 'border-red-400';
  const textColor = darkMode ? 'text-red-300' : 'text-red-700';
  const badgeColor = darkMode ? 'bg-red-700' : 'bg-red-500';

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${badgeColor} animate-pulse`} />
            <span className={`font-semibold ${textColor}`}>
              RECORDING TEST CASE
            </span>
          </div>
          {testName && (
            <span className={`${textColor} font-mono text-sm`}>
              &quot;{testName}&quot;
            </span>
          )}
        </div>
        <div className={`${badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {actionCount} {actionCount === 1 ? 'action' : 'actions'} recorded
        </div>
      </div>
      <p className={`mt-2 text-sm ${textColor} opacity-80`}>
        Merge actions are being automatically captured. Click &quot;Export Test Recording&quot; when done.
      </p>
    </div>
  );
}

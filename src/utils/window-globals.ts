// TypeScript declarations for window globals used in test recording mode

declare global {
  interface Window {
    enableTestRecording?: boolean;
    startRecording?: (testName: string) => void;
    stopRecording?: () => void;
    exportRecording?: () => void;
    lyricSmithDispatch?: any;
  }
}

export function initializeWindowGlobals(dispatch: any) {
  // Store dispatch function globally for console access
  window.lyricSmithDispatch = dispatch;

  // Initialize recording flag
  if (window.enableTestRecording === undefined) {
    window.enableTestRecording = false;
  }

  // Console helper: Start recording with a test name
  window.startRecording = (testName: string) => {
    if (!window.lyricSmithDispatch) {
      console.error('LyricSmith dispatch not initialized');
      return;
    }

    window.enableTestRecording = true;
    window.lyricSmithDispatch({
      type: 'start_recording',
      payload: testName
    });

    console.log(`%c🎬 Recording started for test case: "${testName}"`, 'color: #ef4444; font-weight: bold; font-size: 14px');
    console.log('%cMerge actions will be automatically captured.', 'color: #6b7280; font-size: 12px');
    console.log('%cUse window.stopRecording() to stop or window.exportRecording() to export.', 'color: #6b7280; font-size: 12px');
  };

  // Console helper: Stop recording
  window.stopRecording = () => {
    if (!window.lyricSmithDispatch) {
      console.error('LyricSmith dispatch not initialized');
      return;
    }

    window.lyricSmithDispatch({ type: 'stop_recording' });
    console.log('%c⏹️ Recording stopped', 'color: #f59e0b; font-weight: bold; font-size: 14px');
    console.log('%cUse window.exportRecording() to export or window.startRecording(testName) to start a new recording.', 'color: #6b7280; font-size: 12px');
  };

  // Console helper: Export recording
  window.exportRecording = () => {
    console.log('%c📦 Use the "Export Test Recording" button in the UI to download the JSON file.', 'color: #3b82f6; font-weight: bold; font-size: 14px');
    console.log('%cMake sure you have entered a test name in the UI before exporting.', 'color: #6b7280; font-size: 12px');
  };

  // Log available commands
  console.log('%c🧪 LyricSmith Test Recording Mode', 'color: #8b5cf6; font-weight: bold; font-size: 16px');
  console.log('%cAvailable console commands:', 'color: #6b7280; font-weight: bold; font-size: 12px');
  console.log('%c  window.enableTestRecording = true  - Enable recording UI', 'color: #10b981; font-size: 11px');
  console.log('%c  window.startRecording("test_name") - Start recording merge actions', 'color: #10b981; font-size: 11px');
  console.log('%c  window.stopRecording()             - Stop recording', 'color: #10b981; font-size: 11px');
  console.log('%c  window.exportRecording()           - Instructions to export', 'color: #10b981; font-size: 11px');
}

export {};

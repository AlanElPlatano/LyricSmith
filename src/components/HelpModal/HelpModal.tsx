import type { ThemeClasses } from '../../types';

interface HelpModalProps {
  theme: ThemeClasses;
  onClose: () => void;
}

export function HelpModal({ theme, onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border ${theme.cardBackground} ${theme.text} ${theme.border} p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`absolute top-4 right-4 ${theme.textMuted} hover:${theme.text} text-xl font-bold leading-none`}
          onClick={onClose}
          aria-label="Close help"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-1">How to use LyricSmith</h2>
        <p className={`${theme.textMuted} mb-6 text-sm`}>
          Quick guide to replacing lyrics with their correct alphabet/writing systems in XML files.
        </p>

        <ol className="space-y-5">
          <Step number={1} title="Sync your lyrics in EOF first">
            Before using LyricSmith, sync your lyrics in Editor On Fire (EOF) using the Latin or
            romanized version of the lyrics — for example, romaji for Japanese, or transliterated
            text for Cyrillic or Arabic. Save the project when done to export the XML file.
          </Step>

          <Step number={2} title="Upload your files">
            Upload the XML file exported from EOF using the <strong>Choose XML file</strong> button.
            Then either upload or paste the correct lyrics in the target alphabet into the plain
            text area (under the green button).
          </Step>

          <Step number={3} title="Check the line count">
            The line counter (above <strong>Choose TXT file</strong> button) shows whether both files have the same number of lines, they must
            match before you can export. If they don't, adjust the line breaks in your plain text
            to fix the count.
          </Step>

          <Step number={4} title="Align syllables">
            The interface shows both versions side by side for each line. <strong>Click a
            syllable</strong> on either row to merge it with the next one. Keep clicking until
            that syllable matches its counterpart in the target text. You can adjust both the
            XML row and the plain text row independently.
          </Step>

          <Step number={5} title="Check the status ribbons">
            Each lyric line has a colored ribbon on its left side. <strong>Green</strong> means
            the syllable counts match; <strong>red</strong> means they don't. Hover over the
            ribbon to see the exact counts for that line.
          </Step>

          <Step number={6} title="Fix mistakes">
            Use <strong>Ctrl+Z / Ctrl+Y</strong> (or the undo/redo buttons) to undo any unwanted merge.
            To reset an entire line back to its original state, click the{' '}
            <strong>X button</strong> on the top-right corner of that line.
          </Step>

          <Step number={7} title="Export">
            Once all lines are green, click <strong>Export XML</strong> to download the updated
            file. Import it into DLCBuilder to build your custom chart. If your lyrics
            use Cyrillic or CJK (Chinese/Japanese/Korean) scripts, you'll also need{' '}
            <a
              href="https://github.com/iminashi/RocksmithFontGenerator/releases"
              target="_blank"
              rel="noreferrer"
              className="text-purple-500 hover:underline"
            >
              RSFontGenerator
            </a>{' '}
            to create a compatible font for the game, you can ask in the CustomsForge Discord for
            help with this step if you need further help.
          </Step>
        </ol>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <div>
        <p className="font-semibold mb-1">{title}</p>
        <p className="text-sm leading-relaxed opacity-80">{children}</p>
      </div>
    </li>
  );
}

import { FOCUS_RING } from '@/lib/constants/journal';
import { Bold, Italic, Heading2, List } from 'lucide-react';

interface FormatToolbarProps {
  onWrap: (prefix: string, suffix: string) => void;
  onPrefixLine: (prefix: string) => void;
}

export default function FormatToolbar({
  onWrap,
  onPrefixLine,
}: FormatToolbarProps) {
  const buttonClass = `rounded-lg p-1.5 text-[#665c54] transition hover:bg-[#f5efe6] hover:text-[#2c2523] active:scale-95 ${FOCUS_RING}`;

  return (
    <div className="mt-4 flex w-fit items-center gap-1 rounded-2xl border border-[#eedfd5] bg-white/95 px-3 py-1.5 backdrop-blur-md">
      <button
        type="button"
        title="Tebal"
        aria-label="Tebal"
        onClick={() => onWrap('**', '**')}
        className={buttonClass}
      >
        <Bold className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        title="Miring"
        aria-label="Miring"
        onClick={() => onWrap('_', '_')}
        className={buttonClass}
      >
        <Italic className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="h-5 w-px bg-[#eddcd2]" aria-hidden />
      <button
        type="button"
        title="Sub-judul"
        aria-label="Sub-judul"
        onClick={() => onPrefixLine('## ')}
        className={buttonClass}
      >
        <Heading2 className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        title="Daftar"
        aria-label="Daftar"
        onClick={() => onPrefixLine('- ')}
        className={buttonClass}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

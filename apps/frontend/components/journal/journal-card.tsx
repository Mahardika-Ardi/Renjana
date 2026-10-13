import { FOCUS_RING, UNTITLED } from '@/lib/constants/journal';
import { JournalResponse } from '@renjana/types';
import { formatStamp } from '@renjana/utils';
import { motion } from 'motion/react';
import { Users, Lock } from 'lucide-react';

interface JournalCardProps {
  entry: JournalResponse;
  active: boolean;
  onSelect: (id: string) => void;
}

function splitContent(content: string): { title: string; body: string } {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');

  if (lineBreak === -1) {
    return { title: normalized.replace(/^#+\s*/, '').trim(), body: '' };
  }

  return {
    title: normalized
      .slice(0, lineBreak)
      .replace(/^#+\s*/, '')
      .trim(),
    body: normalized.slice(lineBreak + 1).replace(/^\n+/, ''),
  };
}

function previewOf(content: string): string {
  const { body } = splitContent(content);
  const source = body.trim() || content.trim();
  return source.replace(/\s+/g, ' ').slice(0, 160);
}

function tagToneClass(index: number): string {
  return index % 2 === 0
    ? 'bg-[#faebe6]/90 text-[#c96f4a]'
    : 'bg-[#f4ebe1]/90 text-[#7d6756]';
}

export default function JournalCard({
  entry,
  active,
  onSelect,
}: JournalCardProps) {
  const { title } = splitContent(entry.content);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-current={active ? 'true' : undefined}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full overflow-hidden rounded-2xl p-3.5 text-left backdrop-blur transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
        active
          ? 'border border-[#c96f4a]/40 bg-white shadow-[0_10px_28px_-12px_rgba(60,40,30,0.3)]'
          : 'border border-white/50 bg-white/55 hover:border-[#eddcd2] hover:bg-white/90 hover:shadow-[0_10px_28px_-14px_rgba(60,40,30,0.35)]'
      }`}
    >
      {active && (
        <motion.span
          layoutId="journal-active-rail"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          className="absolute inset-y-0 left-0 w-1.5 rounded-l bg-[#c96f4a]"
          aria-hidden
        />
      )}

      <span className="mb-1 flex items-center justify-between text-[11px] text-[#8c7e75]">
        <span
          className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium backdrop-blur ${
            entry.isShared
              ? 'bg-[#faebe6]/80 text-[#c96f4a]'
              : 'bg-white/60 text-[#665c54]'
          }`}
        >
          {entry.isShared ? (
            <Users className="h-3 w-3" aria-hidden />
          ) : (
            <Lock className="h-3 w-3" aria-hidden />
          )}
          {entry.isShared ? 'Jurnal Bersama' : 'Privat'}
        </span>
        <span>{formatStamp(entry.updatedAt)}</span>
      </span>

      <span
        className={`line-clamp-1 block text-sm leading-snug text-[#2c2523] transition-colors group-hover:text-[#c96f4a] ${
          active ? 'font-semibold' : 'font-medium'
        }`}
      >
        {title || UNTITLED}
      </span>

      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[#8c7e75]">
        {previewOf(entry.content) || 'Belum ada isi tulisan.'}
      </span>

      {entry.tags.length > 0 && (
        <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {entry.tags.slice(0, 3).map((tag, index) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur ${tagToneClass(index)}`}
            >
              {tag}
            </span>
          ))}
        </span>
      )}
    </motion.button>
  );
}

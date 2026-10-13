'use client';

import { FOCUS_RING } from '@/lib/constants/journal';
import { X, Tag } from 'lucide-react';
import { useState } from 'react';

function tagToneClass(index: number): string {
  return index % 2 === 0
    ? 'bg-[#faebe6] text-[#c96f4a]'
    : 'bg-[#f4ebe1] text-[#7d6756]';
}

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagEditor({ tags, onChange }: TagEditorProps) {
  const [value, setValue] = useState('');

  const addTag = () => {
    const cleaned = value.trim().replace(/^#+/, '').trim();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) onChange([...tags, cleaned]);
    setValue('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {tags.map((tag, index) => (
        <span
          key={tag}
          className={`group flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tagToneClass(index)}`}
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            aria-label={`Hapus tag ${tag}`}
            className={`rounded-full opacity-50 transition hover:opacity-100 ${FOCUS_RING}`}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}

      <span className="flex items-center gap-1 rounded-full border border-dashed border-[#e0d0c4] px-2.5 py-0.5 text-[11px] text-[#8c7e75] focus-within:border-[#c96f4a]">
        <Tag className="h-3 w-3" aria-hidden />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={addTag}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag();
              return;
            }
            if (event.key === 'Backspace' && !value && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder="tambah tag"
          aria-label="Tambah tag"
          className="w-20 bg-transparent text-[11px] text-[#2c2523] outline-none placeholder:text-[#b3a599]"
        />
      </span>
    </div>
  );
}

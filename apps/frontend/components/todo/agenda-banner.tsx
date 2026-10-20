'use client';

interface AgendaBannerProps {
  active: number;
  completed: number;
  total: number;
}

export default function AgendaBanner({ active, completed, total }: AgendaBannerProps) {
  return (
    <section className="mx-auto mb-10 flex w-full max-w-6xl flex-col items-start justify-between gap-5 rounded-3xl border border-[#ebe0d3] bg-[#f4ece3]/80 p-7 shadow-sm sm:flex-row sm:items-center">
      <div className="max-w-xl space-y-1.5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c8704c]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#c8704c]" />
          Agenda Berdua
        </div>
        <h2 className="text-2xl font-bold text-[#1a1c1c]">
          Harmoni Langkah Kecil Bersama
        </h2>
        <p className="text-sm leading-relaxed text-[#50453b]">
          Setiap rencana adalah bukti cinta yang diwujudkan bersama dalam
          keseharian.
        </p>
      </div>

      <div className="flex items-center justify-around gap-4 self-stretch rounded-2xl border border-white bg-white/90 px-6 py-3.5 backdrop-blur-sm sm:self-auto sm:justify-start">
        <div className="flex flex-col items-center px-2">
          <span className="text-xl font-bold text-[#c8704c]">{active}</span>
          <span className="mt-0.5 text-xs font-medium text-[#82756a]">Aktif</span>
        </div>
        <div className="h-8 w-px bg-[#eee4da]" aria-hidden />
        <div className="flex flex-col items-center px-2">
          <span className="text-xl font-bold text-[#919673]">{completed}</span>
          <span className="mt-0.5 text-xs font-medium text-[#82756a]">Selesai</span>
        </div>
        <div className="h-8 w-px bg-[#eee4da]" aria-hidden />
        <div className="flex flex-col items-center px-2">
          <span className="text-xl font-bold text-[#7d562d]">{total}</span>
          <span className="mt-0.5 text-xs font-medium text-[#82756a]">Total</span>
        </div>
      </div>
    </section>
  );
}

import Image from 'next/image';

function TaskItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full bg-[#aaad82] px-4 py-3">
      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[#747957]" />

      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{title}</p>
        <p className="mt-0.5 text-[9px] text-[#646844]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SharedFocusCard() {
  return (
    <article className="min-h-72.5 rounded-[30px] bg-[#b4b68d] p-7 text-[#3e4326]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Shared Focus</h3>

        <div className="flex items-center">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#b4b68d] bg-white">
            <Image
              src={
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
              }
              alt=""
              className="h-full w-full object-cover"
              width={100}
              height={100}
            />
          </div>

          <div className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#b4b68d] bg-[#646946] text-[10px] text-white">
            E
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <TaskItem
          title="Finalize weekend itinerary"
          subtitle="Due Tomorrow"
        />

        <TaskItem title="Book dinner reservations" subtitle="Assigned to Sarah" />
      </div>

      <button
        type="button"
        className="mt-5 h-9 w-full rounded-full bg-[#3f4524] text-xs font-medium text-[#c8c9a9] transition hover:bg-[#34391d]"
      >
        View All Tasks
      </button>
    </article>
  );
}

import { MeditationIcon, PlayIcon } from './home-icons';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ACTIVE_DAY_INDEX = 1;

export default function StillnessCard() {
  return (
    <div className="relative min-h-68.75 overflow-hidden rounded-[30px] bg-[#686854]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(73,73,57,.55), rgba(73,73,57,.7)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80')",
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-6 md:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
            <MeditationIcon />
            EVENING RITUAL
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
          >
            <PlayIcon />
          </button>
        </div>

        <div className="mt-10">
          <h3 className="text-3xl font-medium tracking-[-0.03em] text-white">
            Guided Stillness
          </h3>

          <p className="mt-2 max-w-117.5 text-sm leading-6 text-white/85">
            15 minutes remaining today to ground your thoughts
            <br className="hidden sm:block" />
            and prepare for rest.
          </p>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="flex">
            {WEEK_DAYS.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={`-ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#686854] text-[9px] ${
                  index === ACTIVE_DAY_INDEX
                    ? 'bg-[#d5a46d] text-white'
                    : 'bg-[#e8e8df] text-[#55554d]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <span className="text-[10px] font-semibold tracking-[0.12em] text-white/70">
            2 DAY STREAK
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RhythmsHeader() {
  return (
    <section className="mb-7 flex items-end justify-between">
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.04em]">
          Daily Rhythms
        </h2>

        <p className="mt-2 text-sm text-[#575650]">
          Nurturing small actions, continuously.
        </p>
      </div>

      <button
        type="button"
        className="hidden h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm transition hover:bg-[#eeeeeb] sm:flex"
      >
        +
      </button>
    </section>
  );
}

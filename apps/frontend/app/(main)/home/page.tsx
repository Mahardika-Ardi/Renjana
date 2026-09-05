'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getCurrentDateFormatted } from '@renjana/utils';

export default function HomePage() {
  const [glasses, setGlasses] = useState(4);

  const hydrationPercentage = Math.min((glasses / 8) * 100, 100);

  return (
    <div className="min-h-screen bg-[#f8f8f7] text-[#1d1d1b]">
      <div className="mx-auto w-full max-w-250 px-6 py-8 md:px-10 md:py-10">
        <header className="mb-16 text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f3f3f1] px-5 py-2.5 text-xs font-medium tracking-[0.16em] text-[#79582f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8a6335]" />
            {getCurrentDateFormatted().toUpperCase()}
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-[52px]">
            {/* jadikan 4 waktu pagi siang sore malam*/}
            {(() => {
              const hour = new Date().getHours();
              if (hour < 6) {
                return 'Good night, ';
              } else if (hour < 12) {
                return 'Good morning, ';
              } else if (hour < 18) {
                return 'Good afternoon, ';
              } else {
                return 'Good evening, ';
              }
            })()}
            <span className="font-serif italic font-semibold text-[#875e2f]">
              Elias
            </span>
          </h1>

          <div className="mx-auto mt-1 h-1 w-23 -rotate-3 rounded-full bg-[#c9cbb8]" />
        </header>

        {/* =========================
            CONNECTION
        ========================== */}
        <section className="relative mb-16 overflow-hidden rounded-[38px] bg-[#f1eee8] px-6 py-16 shadow-[0_15px_35px_rgba(60,50,40,0.05)] md:px-10 md:py-20">
          <div className="relative mx-auto flex max-w-212.5 items-center justify-between">
            {/* Arka */}
            <Person
              name="Arka"
              image="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead"
            />

            {/* Heartbeat */}
            <div className="absolute left-[18%] right-[18%] top-8.75 h-37.5">
              <svg
                viewBox="0 0 800 150"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="
                    M0 75
                    L180 75
                    L205 75
                    L230 100
                    L260 45
                    L290 105
                    L320 35
                    L350 95
                    L380 10
                    L410 105
                    L440 45
                    L470 105
                    L500 45
                    L530 95
                    L560 45
                    L590 75
                    L800 75
                  "
                  fill="none"
                  stroke="#e8ceb0"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Heart */}
              <div className="absolute left-1/2 top-9.75 -translate-x-1/2">
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 24 24"
                  fill="#f04444"
                  className="drop-shadow-[0_6px_12px_rgba(240,68,68,0.22)]"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                </svg>
              </div>
            </div>

            {/* Senja */}
            <Person
              name="Senja"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
            />
          </div>

          {/* Connection text */}
          <div className="relative z-10 mt-7 text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-[25px]">
              142 Hari Terkoneksi
            </h2>

            <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-[#8a5f2d]">
              SELAMANYA
            </p>
          </div>
        </section>

        {/* =========================
            DAILY RHYTHMS HEADER
        ========================== */}
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

        {/* =========================
            RHYTHMS GRID
        ========================== */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-[235px_1fr]">
          {/* Hydration */}
          <div className="relative flex min-h-68.75 flex-col rounded-[30px] bg-[#f1f1f0] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Hydration</h3>

                <p className="mt-1 text-[11px] font-medium tracking-wide text-[#474742]">
                  {glasses} / 8 GLASSES
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e9e7]">
                <DropletIcon />
              </div>
            </div>

            {/* Percentage */}
            <div className="mt-5 flex flex-1 items-center justify-center">
              <div className="relative flex h-17.5 w-17.5 items-center justify-center rounded-full border-[6px] border-[#8b602f]">
                <span className="text-[22px] text-[#875e2f]">
                  {Math.round(hydrationPercentage)}%
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setGlasses((value) => Math.max(0, value - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e9e7] text-lg text-[#5b5a54] transition hover:bg-[#dfdfdc]"
              >
                −
              </button>

              <button
                type="button"
                onClick={() => setGlasses((value) => Math.min(8, value + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e9e7] text-lg text-[#5b5a54] transition hover:bg-[#dfdfdc]"
              >
                +
              </button>
            </div>
          </div>

          {/* Guided Stillness */}
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
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div
                      key={`${day}-${index}`}
                      className={`-ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#686854] text-[9px] ${
                        index === 1
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
        </section>

        {/* =========================
            LOWER CARDS
        ========================== */}
        <section className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-[1.55fr_1fr]">
          {/* Latest Entry */}
          <article className="min-h-72.5 rounded-[30px] bg-[#f0efed] p-7 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <BookIcon />
                </div>

                <h3 className="text-xl font-semibold">Latest Entry</h3>
              </div>

              <span className="text-xs font-medium text-[#575650]">OCT 23</span>
            </div>

            <div className="mt-7">
              <div className="text-4xl leading-none text-[#d9d6cf]">“</div>

              <p className="-mt-1 max-w-127.5 text-[15px] leading-6 text-[#242420]">
                Found an unexpected moment of clarity during the morning walk.
                The fog was lifting off the lake, and for a second, the noise of
                the upcoming week just evaporated. I need to...
              </p>
            </div>

            <div className="mt-7 flex items-end justify-between border-t border-[#d7d4ce] pt-5">
              <div className="flex gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] text-[#55544e]">
                  #clarify
                </span>

                <span className="rounded-full bg-white px-3 py-1 text-[10px] text-[#55544e]">
                  #morning
                </span>
              </div>

              <button
                type="button"
                className="text-xs font-semibold tracking-wide text-[#825a2e]"
              >
                Open Journal →
              </button>
            </div>
          </article>

          {/* Shared Focus */}
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

              <TaskItem
                title="Book dinner reservations"
                subtitle="Assigned to Sarah"
              />
            </div>

            <button
              type="button"
              className="mt-5 h-9 w-full rounded-full bg-[#3f4524] text-xs font-medium text-[#c8c9a9] transition hover:bg-[#34391d]"
            >
              View All Tasks
            </button>
          </article>
        </section>
      </div>
    </div>
  );
}

/* =====================================
   COMPONENTS
===================================== */

function Person({ name, image }: { name: string; image: string }) {
  return (
    <div className="relative z-20 flex flex-col items-center">
      <div className="h-16.5 w-16.5 overflow-hidden rounded-full border-[3px] border-[#eee9e0] bg-[#ddd] shadow-sm md:h-18 md:w-18">
        <Image
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          height={100}
          width={100}
        />
      </div>

      <span className="mt-3 text-sm text-[#4f4b43]">{name}</span>
    </div>
  );
}

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

/* =====================================
   ICONS
===================================== */

function DropletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8b602f"
      strokeWidth="1.8"
    >
      <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />
    </svg>
  );
}

function MeditationIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="5" r="2" />
      <path d="M6 11c1.5-2 3.5-3 6-3s4.5 1 6 3" />
      <path d="M8 10v4m8-4v4M5 19c2-2 4.3-3 7-3s5 1 7 3" />
      <path d="M9 14h6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8b602f"
      strokeWidth="1.8"
    >
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
      <path d="M7 4v14" />
      <path d="M11 8h5M11 11h5" />
    </svg>
  );
}

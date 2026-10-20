'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { ConsultationMessage, ConsultationSessionSummary } from '@renjana/types';
import { consultationApi } from '@/lib/api/consultation';
import { useLang } from '@/lib/i18n/lang-context';
import { useMounted } from '@/lib/use-mounted';
import { useConsultation } from './consultation-i18n';

const ACTIVE_KEY = 'renjana-consult-active';
const MAX_LEN = 2000;
const SHOW_COUNTER_AT = 1800;

/** Session-row time: today → clock, older → short date. Mounted-only so server HTML ≡ first paint. */
function formatWhen(iso: string, lang: 'id' | 'en'): string {
  const d = new Date(iso);
  const locale = lang === 'id' ? 'id-ID' : 'en-US';
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
      <path
        fillRule="evenodd"
        d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.212A60.517 60.517 0 0 0 3.478 2.404Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M18.5 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </svg>
  );
}

/**
 * Relationship AI Counselor: session history sidebar + chat pane.
 *
 * Backend contract notes (see lib/api/consultation.ts):
 * - AI answers synchronously — a send blocks until the reply lands, so the
 *   composer stays usable but send is gated and typing dots show the wait.
 * - The last-open session persists in sessionStorage: refresh resumes the
 *   conversation (first visit per tab opens the welcome state).
 * - Optimistic user bubble + rollback: on failure the text goes back into
 *   the composer above anything typed meanwhile — never lose a message.
 */
export default function ConsultationWorkspace() {
  const t = useConsultation();
  const { lang } = useLang();
  const mounted = useMounted();

  const [sessions, setSessions] = useState<ConsultationSessionSummary[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [sendError, setSendError] = useState(false);

  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- session history ----------------------------------------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await consultationApi.list(50);
        if (!ignore) {
          setSessions(res.data ?? []);
          setListFailed(false);
        }
      } catch {
        if (!ignore) {
          setSessions(null);
          setListFailed(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  // ---- open a session (event-handler bodies may set state synchronously) --
  const openSession = async (id: string) => {
    if (chatLoading || waiting) return;
    setNotice(null);
    setSendError(false);
    setChatLoading(true);
    setActiveId(id);
    setMobileView('chat');
    try {
      const res = await consultationApi.detail(id);
      setMessages(res.data?.messages ?? []);
      setActiveTitle(res.data?.title ?? null);
    } catch {
      setMessages([]);
      setSendError(true); // banner copy doubles as "couldn't load" here
    } finally {
      setChatLoading(false);
    }
  };

  // Ref indirection lets the mount-time restore effect call the latest
  // openSession without re-running (and re-fetching) on every render.
  const openSessionRef = useRef<((id: string) => void) | null>(null);
  useEffect(() => {
    openSessionRef.current = openSession;
  });

  // Restore the last-open session on mount. MUST run before the persist
  // effect below, which clears an unread key on its first pass.
  useEffect(() => {
    try {
      const id = window.sessionStorage.getItem(ACTIVE_KEY);
      if (id) openSessionRef.current?.(id);
    } catch {
      // storage unavailable — open the welcome state
    }
  }, []);

  // Persist the open session (same-tab navigation and refresh resume it).
  useEffect(() => {
    try {
      if (activeId) window.sessionStorage.setItem(ACTIVE_KEY, activeId);
      else window.sessionStorage.removeItem(ACTIVE_KEY);
    } catch {
      // storage unavailable — nothing to persist
    }
  }, [activeId]);

  // ---- send ---------------------------------------------------------------
  const send = async () => {
    const text = draft.trim();
    if (!text || waiting) return;
    setNotice(null);
    setSendError(false);
    setDraft('');
    setWaiting(true);

    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sessionId: activeId ?? 'new',
        sender: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      if (!activeId) {
        // First message creates the session; the reply is already in here.
        const res = await consultationApi.create(text);
        const session = res.data;
        if (!session) throw new Error('empty response');
        setMessages(session.messages ?? []);
        setActiveId(session.id);
        setActiveTitle(session.title ?? null);
        const msgs = session.messages ?? [];
        const summary: ConsultationSessionSummary = {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          totalMessages: msgs.length,
          lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : null,
        };
        setSessions((prev) => [summary, ...(prev ?? []).filter((s) => s.id !== summary.id)]);
      } else {
        const res = await consultationApi.sendMessage(activeId, text);
        const pair = res.data;
        if (!pair?.userMessage || !pair?.assistantMessage) throw new Error('empty response');
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          pair.userMessage,
          pair.assistantMessage,
        ]);
        setSessions((prev) => {
          if (!prev) return prev;
          const existing = prev.find((s) => s.id === activeId);
          const updated: ConsultationSessionSummary = {
            id: activeId,
            title: existing?.title ?? activeTitle ?? '',
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalMessages: (existing?.totalMessages ?? 0) + 2,
            lastMessage: pair.assistantMessage,
          };
          return [updated, ...prev.filter((s) => s.id !== activeId)];
        });
      }
    } catch {
      // Roll back the optimistic bubble and hand the text back to the user.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError(true);
      setDraft((cur) => (cur ? `${text}\n${cur}` : text).slice(0, MAX_LEN));
    } finally {
      setWaiting(false);
    }
  };

  const startNew = () => {
    if (waiting) return;
    setActiveId(null);
    setActiveTitle(null);
    setMessages([]);
    setChatLoading(false);
    setSendError(false);
    setNotice(null);
    setMobileView('chat');
    inputRef.current?.focus();
  };

  const confirmDelete = async () => {
    const id = pendingDelete;
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await consultationApi.remove(id);
      setSessions((prev) => (prev ?? []).filter((s) => s.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setActiveTitle(null);
        setMessages([]);
        setSendError(false);
      }
      setPendingDelete(null);
      setNotice(null);
    } catch {
      setNotice(t.sidebar.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  // ---- effects that only touch the DOM ------------------------------------
  // Keep the newest bubble/dots in view whenever the thread changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting, chatLoading, activeId, mobileView]);

  // Auto-grow the composer with its content (also runs after send/failure
  // rewrites the draft from state, where the onChange path never fires).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const active = activeId !== null;
  const showWelcome = !active && !chatLoading && messages.length === 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f8f8f7] p-3 md:p-5">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl overflow-hidden rounded-[28px] bg-[#f1f1f0] shadow-[0_10px_40px_rgba(29,29,27,0.08)] ring-1 ring-[#e7e5df]">
        {/* ---- history sidebar (desktop: always visible) ---- */}
        <aside
          className={`${
            mobileView === 'list' ? 'flex' : 'hidden'
          } w-full min-h-0 shrink-0 flex-col border-r border-[#e4e2dc] md:flex md:w-80`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#e4e2dc] px-4 py-3.5">
            <h2 className="text-sm font-bold text-[#1d1d1b]">{t.sidebar.history}</h2>
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-1 rounded-full bg-[#8a6335] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#79582f]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.header.newChat}
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {sessions === null ? (
              listFailed ? (
                <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
                  <p className="text-xs text-[#8f8d85]">{t.errors.listFailed}</p>
                  <button
                    type="button"
                    onClick={() => setReloadToken((n) => n + 1)}
                    className="rounded-full border border-[#d9d4c8] bg-white px-4 py-1.5 text-xs font-semibold text-[#79582f] transition hover:bg-[#faf8f4]"
                  >
                    {t.errors.retry}
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5" aria-label={t.sidebar.loading}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-2xl bg-[#e7e5df]" />
                  ))}
                </div>
              )
            ) : sessions.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[#a3a199]">{t.sidebar.empty}</p>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeId;
                if (pendingDelete === s.id) {
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-[#e0dcd2]"
                    >
                      <span className="text-xs font-semibold text-[#b4453c]">{t.sidebar.confirm}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void confirmDelete()}
                          disabled={deleting}
                          className="rounded-full bg-[#b4453c] px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50"
                        >
                          {t.sidebar.yes}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          disabled={deleting}
                          className="rounded-full border border-[#ddd8cc] px-3 py-1 text-xs font-semibold text-[#7a7871] transition hover:bg-[#f6f4ef] disabled:opacity-50"
                        >
                          {t.sidebar.cancel}
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-1 rounded-2xl px-1.5 py-1 transition ${
                      isActive ? 'bg-white ring-1 ring-[#e0dcd2]' : 'hover:bg-white/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void openSession(s.id)}
                      className="min-w-0 flex-1 px-1.5 py-1 text-left"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#1d1d1b]">{s.title}</span>
                        <span className="shrink-0 text-[10px] text-[#a3a199]">
                          {mounted ? formatWhen(s.updatedAt, lang) : ''}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#8f8d85]">
                        {s.lastMessage?.content ?? ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(s.id)}
                      aria-label={t.sidebar.deleteAria}
                      title={t.sidebar.delete}
                      className="mt-1.5 shrink-0 rounded-full p-1.5 text-[#b5b3ab] transition hover:bg-[#f6e9e7] hover:text-[#b4453c]"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                );
              })
            )}

            {notice && (
              <p className="px-2 pt-1 text-xs text-[#b4453c]" role="alert">
                {notice}
              </p>
            )}
          </div>
        </aside>

        {/* ---- chat pane ---- */}
        <section
          className={`${
            mobileView === 'chat' ? 'flex' : 'hidden'
          } min-h-0 min-w-0 flex-1 flex-col md:flex`}
        >
          <header className="flex items-center gap-2 border-b border-[#e4e2dc] px-4 py-3 md:px-5">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              aria-label={t.header.back}
              title={t.header.back}
              className="-ml-1 rounded-full p-1.5 text-[#7a7871] transition hover:bg-[#e7e5df] md:hidden"
            >
              <BackIcon />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold text-[#1d1d1b]">
                {activeTitle ?? t.header.title}
              </h1>
              {!active && <p className="truncate text-[11px] text-[#a3a199]">{t.header.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={startNew}
              className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-[#d9d4c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#79582f] transition hover:bg-[#faf8f4] md:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.header.newChat}
            </button>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {chatLoading ? (
              <p className="py-10 text-center text-sm text-[#a3a199]">{t.chat.loadingChat}</p>
            ) : showWelcome ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#efe9df]">
                  <SparkleIcon className="h-7 w-7 text-[#8a6335]" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold text-[#1d1d1b]">{t.welcome.title}</h2>
                  <p className="mx-auto max-w-md text-sm text-[#7a7871]">{t.welcome.desc}</p>
                </div>
                <div className="w-full max-w-md">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#a3a199]">
                    {t.welcome.examplesLabel}
                  </p>
                  <div className="flex flex-col gap-2">
                    {[t.examples.distant, t.examples.annoyed, t.examples.fighting].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => {
                          setDraft(text);
                          inputRef.current?.focus();
                        }}
                        className="rounded-2xl border border-[#e2dfd7] bg-white px-4 py-2.5 text-left text-sm text-[#474742] transition hover:border-[#cdbb97] hover:bg-[#faf8f4]"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const mine = m.sender === 'USER';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed md:max-w-[70%] ${
                          mine
                            ? 'rounded-[20px] rounded-br-md bg-[#8a6335] text-white'
                            : 'rounded-[20px] rounded-bl-md border border-[#e7e4dc] bg-white text-[#1d1d1b]'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {waiting && (
                  <div className="flex items-end gap-1.5 pb-1 pl-1" role="status" aria-label={t.chat.typing}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-[#b5b3ab]"
                        style={{ animationDuration: '900ms', animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {sendError && (
            <p
              role="alert"
              className="border-t border-[#f0dcd8] bg-[#fbeeea] px-5 py-2 text-xs text-[#b4453c]"
            >
              {t.chat.sendFailed}
            </p>
          )}

          <div className="border-t border-[#e4e2dc] px-3 py-3 md:px-5">
            <div className="flex items-end gap-2 rounded-[24px] border border-[#e0ddd5] bg-white px-4 py-2 transition focus-within:border-[#cdbb97] focus-within:ring-2 focus-within:ring-[#8a6335]/25">
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={MAX_LEN}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.chat.placeholder}
                aria-label={t.chat.placeholder}
                className="max-h-32 min-h-8 flex-1 resize-none bg-transparent text-sm leading-6 text-[#1d1d1b] outline-none placeholder:text-[#a3a199]"
              />
              {draft.length >= SHOW_COUNTER_AT && (
                <span className="shrink-0 pb-1 text-[10px] tabular-nums text-[#a3a199]">
                  {draft.length}
                  {t.chat.charOf}
                </span>
              )}
              <button
                type="button"
                onClick={() => void send()}
                disabled={!draft.trim() || waiting}
                aria-label={t.chat.sendAria}
                title={t.chat.send}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8a6335] text-white transition hover:bg-[#79582f] disabled:opacity-40"
              >
                {waiting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
            <div className="mt-1.5 px-2 text-[10px] text-[#c0beb6]">
              {lang === 'id'
                ? 'Enter untuk mengirim · Shift + Enter baris baru'
                : 'Enter to send · Shift + Enter for a new line'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
